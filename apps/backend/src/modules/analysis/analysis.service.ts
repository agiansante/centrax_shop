import { Injectable, Logger } from '@nestjs/common';
import { EvidenceType, SiteStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';
import { CrawlerService } from './crawler.service';
import { DiscoveryService } from './discovery.service';
import { ResearchAgentService } from './research-agent.service';
import { RulesService } from './rules.service';
import { extractComparableDomain, normalizeUrlForStorage } from './url-normalization.utils';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly discovery: DiscoveryService,
    private readonly crawler: CrawlerService,
    private readonly rules: RulesService,
    private readonly ai: AiService,
    private readonly researchAgent: ResearchAgentService
  ) {}

  /**
   * Esegue discovery, deduplica e analisi di tutti i siti di una campagna.
   *
   * Usata da:
   * - apps/backend/src/modules/workers/campaign.worker.ts
   *
   * Riceve l'id campagna dal job BullMQ.
   */
  async runCampaign(campaignId: string) {
    return this.researchAgent.runCampaign(campaignId);
  }

  /**
   * Esegue la vecchia pipeline lineare di discovery e analisi.
   *
   * Usata da:
   * - mantenuta come riferimento tecnico durante la migrazione agentica.
   *
   * Riceve l'id campagna dal job BullMQ.
   */
  async runLegacyCampaign(campaignId: string) {
    const campaign = await this.prisma.searchCampaign.findUniqueOrThrow({ where: { id: campaignId } });
    await this.prisma.searchCampaign.update({
      where: { id: campaignId },
      data: {
        progressStep: 'discovery',
        progressMessage: 'Ricerca siti in corso tramite provider configurato.'
      }
    });

    const results = await this.discovery.search(campaign.query, campaign.country ?? undefined, campaign.maxResults);

    await this.prisma.searchCampaign.update({
      where: { id: campaignId },
      data: {
        discoveredCount: results.length,
        progressStep: 'analysis',
        progressMessage: `Trovati ${results.length} siti. Analisi e crawling in corso.`
      }
    });

    let analyzedCount = 0;
    let failedCount = 0;

    for (const result of results) {
      let siteId: string | null = null;
      let domain = result.url;

      try {
        const url = normalizeUrlForStorage(result.url);
        domain = extractComparableDomain(url);
        const site = await this.prisma.discoveredSite.upsert({
          where: { campaignId_domain: { campaignId, domain } },
          update: { url, title: result.title, snippet: result.snippet, source: result.source },
          create: { campaignId, url, domain, title: result.title, snippet: result.snippet, source: result.source }
        });
        siteId = site.id;

        await this.prisma.searchCampaign.update({
          where: { id: campaignId },
          data: {
            currentAnalyzedUrl: url,
            progressMessage: `Analisi sito ${domain} in corso.`
          }
        });

        await this.analyzeSite(site.id, campaign.depth);
        analyzedCount += 1;

        await this.prisma.searchCampaign.update({
          where: { id: campaignId },
          data: {
            analyzedCount: { increment: 1 },
            progressMessage: `Analisi completata per ${domain}. Avanzamento: ${analyzedCount + failedCount}/${results.length}.`
          }
        });
      } catch (error) {
        failedCount += 1;
        this.logger.warn(`Analisi sito fallita per ${domain}: ${error instanceof Error ? error.message : String(error)}`);
        if (siteId) {
          await this.prisma.discoveredSite.update({
            where: { id: siteId },
            data: { status: SiteStatus.FAILED }
          });
        }

        await this.prisma.searchCampaign.update({
          where: { id: campaignId },
          data: {
            failedCount: { increment: 1 },
            progressMessage: `Analisi fallita per ${domain}. Avanzamento: ${analyzedCount + failedCount}/${results.length}.`
          }
        });
      }
    }
  }

  /**
   * Esegue crawling, regole locali e analisi AI per un singolo sito.
   *
   * Usata da:
   * - runCampaign nello stesso service.
   * - apps/backend/src/modules/services/services.service.ts
   *
   * Riceve id sito e profondita massima di crawling.
   */
  async analyzeSite(siteId: string, depth = 2) {
    const site = await this.prisma.discoveredSite.findUniqueOrThrow({ where: { id: siteId } });
    const pages = await this.crawler.crawl(site.url, depth);
    const evidence = pages.flatMap((page) => this.rules.extract(page.text, page.url));
    const aiProfile = await this.ai.analyze(site.domain, pages[0]?.title ?? site.title ?? undefined, evidence);

    const profile = await this.prisma.serviceProfile.upsert({
      where: { siteId },
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
        siteId,
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

    await this.prisma.evidenceItem.deleteMany({ where: { profileId: profile.id } });
    if (evidence.length > 0) {
      await this.prisma.evidenceItem.createMany({
        data: evidence.map((item) => ({
          profileId: profile.id,
          type: item.type as EvidenceType,
          url: item.url,
          snippet: item.snippet
        }))
      });
    }
    await this.prisma.analysisRun.create({
      data: { profileId: profile.id, model: this.ai.modelName(), promptVersion: 'v1', status: 'completed' }
    });
    await this.prisma.discoveredSite.update({ where: { id: siteId }, data: { status: SiteStatus.ANALYZED } });
    return profile;
  }
}
