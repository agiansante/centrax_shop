import { Injectable, Logger } from '@nestjs/common';
import { EvidenceType, Prisma, SiteStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AgentRunLogService } from './agent-run-log.service';
import { AiService } from './ai.service';
import { CrawledPage } from './crawler.service';
import { DiscoveryResult } from './discovery.service';
import { OutputSchemaValidationService } from './output-schema-validation.service';
import { ResultMergeAgentService } from './result-merge-agent.service';
import { DiscoveryPreFilterService } from './discovery-pre-filter.service';
import { ResearchExecutionPlan } from './research-intent-builder.service';
import { ResearchPlanningService } from './research-planning.service';
import { ResearchToolRegistryService } from './research-tool-registry.service';
import { ExtractedEvidence } from './rules.service';

interface AnalyzedResearchResult {
  url: string;
  name?: unknown;
  sourceType: string;
  confidenceScore: number;
  qualificationReason: string;
  qualified: boolean;
  unresolvedFields: string[];
  fields: Record<string, unknown>;
}

@Injectable()
export class ResearchAgentService {
  private readonly logger = new Logger(ResearchAgentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly toolRegistry: ResearchToolRegistryService,
    private readonly planning: ResearchPlanningService,
    private readonly preFilter: DiscoveryPreFilterService,
    private readonly mergeAgent: ResultMergeAgentService,
    private readonly outputSchemaValidation: OutputSchemaValidationService,
    private readonly logs: AgentRunLogService,
    private readonly ai: AiService
  ) {}

  /**
   * Esegue la campagna usando il cervello ricerca agentico.
   *
   * Usata da:
   * - apps/backend/src/modules/analysis/analysis.service.ts
   *
   * Riceve id campagna dal worker.
   * Coordina planning, tool registry, crawling, classificazione, merge e output finale.
   */
  async runCampaign(campaignId: string) {
    const campaign = await this.prisma.searchCampaign.findUniqueOrThrow({ where: { id: campaignId } });
    const outputSchema = this.readOutputSchema(campaign.outputSchema);
    const approvedPlan = this.readApprovedResearchPlan(campaign.approvedResearchPlan, campaign.query, campaign.searchPrompt, outputSchema);
    const providerStatus = this.toolRegistry.getSearchProviderStatus();
    const plan = approvedPlan ?? this.planning.createPlan({
      query: campaign.query,
      searchPrompt: campaign.searchPrompt,
      country: campaign.country,
      maxResults: campaign.maxResults
    });

    await this.log(campaignId, 'start', 'Agente ricerca avviato.', { providerStatus });
    await this.updateCampaignPlanningState(campaignId, plan, providerStatus);
    await this.log(campaignId, 'planning', `Piano creato: ${plan.optimizedQueries.length} query ottimizzate.`, plan as unknown as Prisma.InputJsonValue);

    const rawResults = await this.collectRawResults(campaignId, plan.optimizedQueries, campaign.country ?? undefined, campaign.maxResults);
    const uniqueResults = this.mergeAgent.mergeAndDeduplicateResults(rawResults);

    await this.prisma.searchCampaign.update({
      where: { id: campaignId },
      data: {
        rawResultCount: rawResults.length,
        uniqueResultCount: uniqueResults.length,
        discoveredCount: uniqueResults.length,
        progressStep: 'analysis',
        progressMessage: `Trovati ${rawResults.length} risultati grezzi e ${uniqueResults.length} domini unici. Analisi in corso.`
      }
    });
    await this.log(campaignId, 'merge', `${rawResults.length} risultati grezzi, ${uniqueResults.length} domini unici.`, {
      rawResultCount: rawResults.length,
      uniqueResultCount: uniqueResults.length
    });

    const objective = approvedPlan?.searchPrompt ?? this.createResearchObjective(campaign.query, campaign.searchPrompt);
    const analyzedResults = await this.analyzeMergedResults(
      campaignId,
      uniqueResults,
      campaign.depth,
      campaign.maxResults,
      outputSchema,
      objective,
      this.createPreFilterPlan(approvedPlan, objective)
    );
    const qualifiedResults = analyzedResults.filter((result) => result.qualified);
    const stopReason = this.calculateStopReason(qualifiedResults.length, campaign.maxResults, uniqueResults.length, providerStatus.isMockMode);
    const finalOutput = {
      results: qualifiedResults.map((result) => ({
        ...result.fields,
        url: result.url,
        sourceType: result.sourceType,
        qualified: result.qualified,
        confidenceScore: result.confidenceScore,
        qualificationReason: result.qualificationReason,
        unresolvedFields: result.unresolvedFields
      })),
      stopReason,
      requestedResults: campaign.maxResults,
      qualifiedResults: qualifiedResults.length
    };

    await this.prisma.searchCampaign.update({
      where: { id: campaignId },
      data: {
        qualifiedCount: qualifiedResults.length,
        rejectedCount: analyzedResults.length - qualifiedResults.length,
        agentStopReason: stopReason,
        agentFinalOutput: finalOutput as unknown as Prisma.InputJsonValue,
        progressMessage: `Ricerca terminata: ${qualifiedResults.length}/${campaign.maxResults} fonti qualificate. ${stopReason}`
      }
    });
    await this.log(campaignId, 'completed', 'Output finale generato.', finalOutput as unknown as Prisma.InputJsonValue);
  }

  /**
   * Legge outputSchema dal JSON Prisma in forma sicura.
   *
   * Usata da:
   * - runCampaign nello stesso service.
   */
  private readOutputSchema(value: Prisma.JsonValue | null): Record<string, unknown> | null {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      return null;
    }

    return value as Record<string, unknown>;
  }

  /**
   * Legge il piano approvato salvato sulla campagna.
   *
   * Usata da:
   * - runCampaign nello stesso service.
   */
  private readApprovedResearchPlan(
    value: Prisma.JsonValue | null,
    query: string,
    searchPrompt: string | null,
    outputSchema: Record<string, unknown> | null
  ): ResearchExecutionPlan | null {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      return null;
    }

    const plan = value as unknown as ResearchExecutionPlan;
    return {
      ...plan,
      goal: plan.goal ?? query,
      searchPrompt: plan.searchPrompt ?? this.createResearchObjective(query, searchPrompt),
      optimizedQueries: Array.isArray(plan.optimizedQueries) && plan.optimizedQueries.length > 0 ? plan.optimizedQueries : [query],
      requiredSignals: Array.isArray(plan.requiredSignals) ? plan.requiredSignals : [],
      negativeSignals: Array.isArray(plan.negativeSignals) ? plan.negativeSignals : [],
      blockedDomains: Array.isArray(plan.blockedDomains) ? plan.blockedDomains : [],
      allowedSourceTypes: Array.isArray(plan.allowedSourceTypes) ? plan.allowedSourceTypes : ['direct_source', 'directory_marketplace'],
      outputSchema: plan.outputSchema ?? outputSchema ?? {},
      tools: Array.isArray(plan.tools) ? plan.tools : ['configured_search', 'crawler_html', 'rules_classifier'],
      strategy: plan.strategy ?? 'Strategia non disponibile.',
      warnings: Array.isArray(plan.warnings) ? plan.warnings : [],
      aiGenerated: Boolean(plan.aiGenerated)
    };
  }

  /**
   * Costruisce l'obiettivo generalista da query e prompt esteso.
   *
   * Usata da:
   * - runCampaign nello stesso service.
   */
  private createResearchObjective(query: string, searchPrompt?: string | null) {
    if (searchPrompt?.trim()) {
      return `${query.trim()}\n\nCriteri utente:\n${searchPrompt.trim()}`;
    }

    return query.trim();
  }

  /**
   * Salva lo stato iniziale del piano e dei tool usati nella campagna.
   *
   * Usata da:
   * - runCampaign nello stesso service.
   */
  private updateCampaignPlanningState(campaignId: string, plan: { status: string; tools: string[] }, providerStatus: unknown) {
    return this.prisma.searchCampaign.update({
      where: { id: campaignId },
      data: {
        agentPlanStatus: plan.status,
        agentProviderSummary: providerStatus as Prisma.InputJsonValue,
        agentToolSummary: {
          plannedTools: plan.tools,
          availableTools: this.toolRegistry.listToolDescriptors()
        } as unknown as Prisma.InputJsonValue,
        progressStep: 'planning',
        progressMessage: 'Agente ricerca: piano operativo creato.'
      }
    });
  }

  /**
   * Esegue il tool ricerca sulle query ottimizzate.
   *
   * Usata da:
   * - runCampaign nello stesso service.
   */
  private async collectRawResults(campaignId: string, queries: string[], country: string | undefined, maxResults: number) {
    const searchTool = this.toolRegistry.getExecutableTool('configured_search');
    const rawResults: DiscoveryResult[] = [];

    if (!searchTool) {
      await this.log(campaignId, 'discovery', 'Tool ricerca non disponibile.', undefined, 'error');
      return rawResults;
    }

    for (const query of queries) {
      if (rawResults.length >= maxResults * 2) {
        break;
      }

      await this.log(campaignId, 'discovery', `Ricerca query: ${query}`);
      const result = await searchTool.execute({ query, country, maxResults });
      if (!result.ok || !Array.isArray(result.data)) {
        await this.log(campaignId, 'discovery', result.error ?? 'Ricerca senza risultati validi.', { query }, 'warning');
        continue;
      }

      rawResults.push(...(result.data as DiscoveryResult[]));
      await this.log(campaignId, 'discovery', `${(result.data as DiscoveryResult[]).length} risultati ricevuti.`, { query });
    }

    return rawResults;
  }

  /**
   * Analizza i domini unici finche raggiunge il massimo qualificato o esaurisce le fonti.
   *
   * Usata da:
   * - runCampaign nello stesso service.
   */
  private async analyzeMergedResults(
    campaignId: string,
    results: Array<DiscoveryResult & { normalizedUrl: string; domain: string }>,
    depth: number,
    maxResults: number,
    outputSchema: Record<string, unknown> | null,
    objective: string,
    preFilterPlan: Pick<ResearchExecutionPlan, 'requiredSignals' | 'negativeSignals' | 'blockedDomains'>
  ) {
    const analyzedResults: AnalyzedResearchResult[] = [];
    let failedCount = 0;

    for (const result of results) {
      if (analyzedResults.filter((item) => item.qualified).length >= maxResults) {
        break;
      }

      try {
        const preEvaluation = this.preFilter.evaluateResult(result, preFilterPlan);
        if (!preEvaluation.shouldCrawl) {
          await this.prisma.searchCampaign.update({
            where: { id: campaignId },
            data: {
              rejectedCount: { increment: 1 },
              progressMessage: `Fonte scartata prima del crawl: ${result.domain}. ${preEvaluation.reason}`
            }
          });
          await this.log(campaignId, 'pre_filter', `Fonte scartata prima del crawl: ${result.domain}.`, {
            reason: preEvaluation.reason,
            matchedSignals: preEvaluation.matchedSignals,
            negativeSignals: preEvaluation.negativeSignals,
            score: preEvaluation.score,
            title: result.title,
            snippet: result.snippet
          });
          analyzedResults.push({
            url: result.normalizedUrl,
            sourceType: 'unknown',
            confidenceScore: 0,
            qualificationReason: preEvaluation.reason,
            qualified: false,
            unresolvedFields: [],
            fields: {
              name: result.title ?? result.domain,
              url: result.normalizedUrl,
              summary: result.snippet ?? null
            }
          });
          continue;
        }

        const analyzed = await this.analyzeSingleResult(campaignId, result, depth, outputSchema, objective);
        analyzedResults.push(analyzed);
        await this.prisma.searchCampaign.update({
          where: { id: campaignId },
          data: {
            analyzedCount: { increment: 1 },
            qualifiedCount: analyzed.qualified ? { increment: 1 } : undefined,
            rejectedCount: analyzed.qualified ? undefined : { increment: 1 },
            progressMessage: `Analisi completata per ${result.domain}. Qualificate: ${analyzedResults.filter((item) => item.qualified).length}/${maxResults}.`
          }
        });
      } catch (error) {
        failedCount += 1;
        this.logger.warn(`Agente ricerca: analisi fallita per ${result.domain}: ${error instanceof Error ? error.message : String(error)}`);
        await this.prisma.searchCampaign.update({
          where: { id: campaignId },
          data: {
            failedCount: { increment: 1 },
            progressMessage: `Analisi fallita per ${result.domain}. Errori: ${failedCount}.`
          }
        });
        await this.log(campaignId, 'analysis', `Analisi fallita per ${result.domain}.`, { error: error instanceof Error ? error.message : String(error) }, 'warning');
      }
    }

    return analyzedResults;
  }

  /**
   * Analizza una singola fonte usando crawler, regole e AI provider configurato.
   *
   * Usata da:
   * - analyzeMergedResults nello stesso service.
   */
  private async analyzeSingleResult(
    campaignId: string,
    result: DiscoveryResult & { normalizedUrl: string; domain: string },
    depth: number,
    outputSchema: Record<string, unknown> | null,
    objective: string
  ): Promise<AnalyzedResearchResult> {
    await this.prisma.searchCampaign.update({
      where: { id: campaignId },
      data: {
        currentAnalyzedUrl: result.normalizedUrl,
        progressMessage: `Agente ricerca: crawling ${result.domain}.`
      }
    });
    await this.log(campaignId, 'crawl', `Crawling ${result.normalizedUrl}.`);

    const site = await this.prisma.discoveredSite.upsert({
      where: { campaignId_domain: { campaignId, domain: result.domain } },
      update: { url: result.normalizedUrl, title: result.title, snippet: result.snippet, source: result.source },
      create: {
        campaignId,
        url: result.normalizedUrl,
        domain: result.domain,
        title: result.title,
        snippet: result.snippet,
        source: result.source
      }
    });

    const pages = await this.runCrawlerTool(result.normalizedUrl, depth);
    const evidence = await this.runClassifierTool(pages);
    const aiProfile = await this.ai.analyze(result.domain, pages[0]?.title ?? result.title, evidence);
    const catalogExtraction = await this.ai.extractCatalogData({
      objective,
      outputSchema,
      url: result.normalizedUrl,
      domain: result.domain,
      title: pages[0]?.title ?? result.title,
      text: this.mergePageTextForCatalogExtraction(pages),
      evidence
    });
    const profile = await this.prisma.serviceProfile.upsert({
      where: { siteId: site.id },
      update: {
        name: aiProfile.name,
        description: aiProfile.description,
        categories: aiProfile.categories,
        supportedCountries: aiProfile.supportedCountries,
        shopifyEvidence: aiProfile.shopifyEvidence,
        pricingSummary: aiProfile.pricingSummary,
        docsUrl: aiProfile.docsUrl,
        confidenceScore: aiProfile.confidenceScore,
        pros: aiProfile.pros,
        cons: aiProfile.cons
      },
      create: {
        siteId: site.id,
        name: aiProfile.name,
        description: aiProfile.description,
        categories: aiProfile.categories,
        supportedCountries: aiProfile.supportedCountries,
        shopifyEvidence: aiProfile.shopifyEvidence,
        pricingSummary: aiProfile.pricingSummary,
        docsUrl: aiProfile.docsUrl,
        confidenceScore: aiProfile.confidenceScore,
        pros: aiProfile.pros,
        cons: aiProfile.cons
      }
    });

    await this.replaceEvidenceItems(profile.id, evidence);
    await this.prisma.analysisRun.create({
      data: { profileId: profile.id, model: this.ai.modelName(), promptVersion: 'agentic-v1', status: 'completed' }
    });
    await this.prisma.discoveredSite.update({ where: { id: site.id }, data: { status: SiteStatus.ANALYZED } });

    const output = { ...catalogExtraction.fields, url: result.normalizedUrl };
    const schemaValidation = this.outputSchemaValidation.validateOutput(output, outputSchema);
    const qualified = this.isQualifiedSource(
      catalogExtraction.confidenceScore,
      catalogExtraction.sourceType,
      schemaValidation.missingFields,
      outputSchema
    );
    const message = qualified ? `Fonte qualificata: ${result.domain}.` : `Fonte rifiutata: ${result.domain}.`;
    await this.log(campaignId, 'classification', message, {
      sourceType: catalogExtraction.sourceType,
      confidenceScore: catalogExtraction.confidenceScore,
      missingFields: schemaValidation.missingFields,
      qualificationReason: catalogExtraction.qualificationReason
    });

    return {
      url: result.normalizedUrl,
      name: catalogExtraction.fields.name,
      sourceType: catalogExtraction.sourceType,
      confidenceScore: catalogExtraction.confidenceScore,
      qualificationReason: catalogExtraction.qualificationReason,
      qualified,
      unresolvedFields: schemaValidation.missingFields,
      fields: catalogExtraction.fields
    };
  }

  /**
   * Esegue il tool crawler registrato.
   *
   * Usata da:
   * - analyzeSingleResult nello stesso service.
   */
  private async runCrawlerTool(url: string, depth: number): Promise<CrawledPage[]> {
    const crawlerTool = this.toolRegistry.getExecutableTool('crawler_html');
    if (!crawlerTool) {
      return [];
    }

    const result = await crawlerTool.execute({ url, depth });
    return Array.isArray(result.data) ? (result.data as CrawledPage[]) : [];
  }

  /**
   * Esegue il tool classificatore locale registrato.
   *
   * Usata da:
   * - analyzeSingleResult nello stesso service.
   */
  private async runClassifierTool(pages: CrawledPage[]): Promise<ExtractedEvidence[]> {
    const classifierTool = this.toolRegistry.getExecutableTool('rules_classifier');
    if (!classifierTool) {
      return [];
    }

    const result = await classifierTool.execute({ pages });
    return Array.isArray(result.data) ? (result.data as ExtractedEvidence[]) : [];
  }

  /**
   * Sostituisce le evidenze collegate al profilo analizzato.
   *
   * Usata da:
   * - analyzeSingleResult nello stesso service.
   */
  private async replaceEvidenceItems(profileId: string, evidence: ExtractedEvidence[]) {
    await this.prisma.evidenceItem.deleteMany({ where: { profileId } });
    if (evidence.length === 0) {
      return;
    }

    await this.prisma.evidenceItem.createMany({
      data: evidence.map((item) => ({
        profileId,
        type: item.type as EvidenceType,
        url: item.url,
        snippet: item.snippet
      }))
    });
  }

  /**
   * Decide se una fonte e qualificata per l'output finale.
   *
   * Usata da:
   * - analyzeSingleResult nello stesso service.
   */
  private isQualifiedSource(
    confidenceScore: number,
    sourceType: string,
    missingFields: string[],
    outputSchema: Record<string, unknown> | null
  ) {
    const excludedSourceTypes = ['forum_social', 'media_page', 'non_operational'];
    if (excludedSourceTypes.includes(sourceType)) {
      return false;
    }

    const requestedFieldCount = Object.keys(outputSchema ?? {}).length;
    const hasEnoughResolvedFields = requestedFieldCount === 0 || missingFields.length < requestedFieldCount;

    return confidenceScore >= 0.55 && hasEnoughResolvedFields;
  }

  /**
   * Crea il piano minimo da usare per il pre-filtro discovery.
   *
   * Usata da:
   * - runCampaign nello stesso service.
   */
  private createPreFilterPlan(approvedPlan: ResearchExecutionPlan | null, objective: string) {
    if (approvedPlan) {
      return {
        requiredSignals: approvedPlan.requiredSignals,
        negativeSignals: approvedPlan.negativeSignals,
        blockedDomains: approvedPlan.blockedDomains
      };
    }

    return {
      requiredSignals: this.extractRelevantTerms(objective),
      negativeSignals: ['shopify', 'dropshipping', 'printful', 'printify', 'spocket', 'syncee'],
      blockedDomains: ['apps.shopify.com', 'community.shopify.com', 'youtube.com', 'youtu.be', 'facebook.com']
    };
  }

  /**
   * Valuta titolo, snippet e URL prima di aprire il sito con il crawler.
   *
   * Usata da:
   * - analyzeMergedResults nello stesso service.
   *
   * Serve a evitare crawling su risultati chiaramente fuori tema.
   */
  private evaluateDiscoveryResultBeforeCrawl(
    result: DiscoveryResult & { normalizedUrl: string; domain: string },
    objective: string
  ) {
    const objectiveTerms = this.extractRelevantTerms(objective);
    const discoveryText = `${result.title ?? ''} ${result.snippet ?? ''} ${result.normalizedUrl}`.toLowerCase();
    const matchedTerms = objectiveTerms.filter((term) => discoveryText.includes(term));
    const blockedTerms = ['shopify', 'dropshipping', 'printful', 'printify', 'spocket', 'syncee'];
    const hasLegacyCommerceBias = blockedTerms.some((term) => discoveryText.includes(term)) && !objectiveTerms.includes('shopify');

    if (hasLegacyCommerceBias && matchedTerms.length < 2) {
      return {
        shouldCrawl: false,
        reason: 'Risultato probabilmente ereditato da bias commerce/Shopify e poco coerente con la richiesta.'
      };
    }

    if (objectiveTerms.length >= 2 && matchedTerms.length === 0) {
      return {
        shouldCrawl: false,
        reason: 'Titolo e descrizione non contengono termini rilevanti della richiesta.'
      };
    }

    if (objectiveTerms.length >= 4 && matchedTerms.length < 2) {
      return {
        shouldCrawl: false,
        reason: `Coerenza bassa prima del crawl: trovati ${matchedTerms.length} termini rilevanti.`
      };
    }

    return {
      shouldCrawl: true,
      reason: `Coerenza sufficiente prima del crawl: ${matchedTerms.length} termini rilevanti.`
    };
  }

  /**
   * Estrae termini semplici e generalisti dalla richiesta utente.
   *
   * Usata da:
   * - evaluateDiscoveryResultBeforeCrawl nello stesso service.
   */
  private extractRelevantTerms(text: string) {
    const stopWords = new Set([
      'trova',
      'trovare',
      'cerca',
      'voglio',
      'fonti',
      'operative',
      'dirette',
      'articoli',
      'forum',
      'siti',
      'sito',
      'ufficiale',
      'contatti',
      'elenco',
      'aziende',
      'string',
      'number',
      'con',
      'che',
      'chi',
      'per',
      'non',
      'una',
      'uno',
      'gli',
      'del',
      'della',
      'delle',
      'dei',
      'nel',
      'nella'
    ]);

    return Array.from(
      new Set(
        text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .split(/[^a-z0-9]+/)
          .filter((term) => term.length >= 4)
          .filter((term) => !stopWords.has(term))
      )
    ).slice(0, 20);
  }

  /**
   * Unisce testo pagine limitando rumore e dimensione per estrazione catalogo.
   *
   * Usata da:
   * - analyzeSingleResult nello stesso service.
   */
  private mergePageTextForCatalogExtraction(pages: CrawledPage[]) {
    return pages
      .map((page) => `${page.title ?? ''}\n${page.text}`)
      .join('\n\n---\n\n')
      .replace(/\s+/g, ' ')
      .slice(0, 20000);
  }

  /**
   * Calcola il motivo finale di stop della ricerca.
   *
   * Usata da:
   * - runCampaign nello stesso service.
   */
  private calculateStopReason(qualifiedCount: number, maxResults: number, uniqueCount: number, isMockMode: boolean) {
    if (qualifiedCount >= maxResults) {
      return 'Raggiunto il numero massimo di fonti qualificate richieste.';
    }

    if (isMockMode) {
      return 'Ricerca terminata in modalita demo/mock: il provider mock non contiene altri risultati.';
    }

    return `Ricerca terminata per esaurimento fonti disponibili: ${qualifiedCount} qualificate su ${uniqueCount} domini unici.`;
  }

  /**
   * Registra un evento agente con formato uniforme.
   *
   * Usata da:
   * - tutti i passaggi principali di ResearchAgentService.
   */
  private log(
    campaignId: string,
    step: string,
    message: string,
    metadata?: Prisma.InputJsonValue,
    level: 'info' | 'warning' | 'error' = 'info'
  ) {
    return this.logs.createLogEntry({ campaignId, step, message, metadata, level });
  }
}
