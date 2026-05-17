import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AiService } from './ai.service';
import { ResearchToolRegistryService } from './research-tool-registry.service';

export interface ResearchExecutionPlan {
  status: 'fallback' | 'ai_planned';
  userRequest: string;
  goal: string;
  entityType: string;
  searchPrompt: string;
  optimizedQueries: string[];
  requiredSignals: string[];
  negativeSignals: string[];
  blockedDomains: string[];
  allowedSourceTypes: string[];
  outputSchema: Record<string, unknown>;
  tools: string[];
  strategy: string;
  warnings: string[];
  aiGenerated: boolean;
}

export interface ResearchIntentBuildInput {
  userRequest: string;
  depth: number;
  maxResults: number;
  currentPlan?: Record<string, unknown>;
  revisionRequest?: string;
}

@Injectable()
export class ResearchIntentBuilderService {
  constructor(
    private readonly ai: AiService,
    private readonly toolRegistry: ResearchToolRegistryService
  ) {}

  /**
   * Trasforma la richiesta naturale dell'utente in piano operativo approvabile.
   *
   * Usata da:
   * - apps/backend/src/modules/campaigns/campaigns.service.ts
   *
   * Riceve richiesta utente, limiti e possibile revisione.
   * Restituisce un piano con query, segnali, schema output, tool e strategia.
   */
  async buildPlan(input: ResearchIntentBuildInput): Promise<ResearchExecutionPlan> {
    const tools = this.toolRegistry.listToolDescriptors();
    const providerStatus = this.toolRegistry.getSearchProviderStatus();
    const aiResult = await this.ai.createResearchExecutionPlan({
      userRequest: input.userRequest,
      depth: input.depth,
      maxResults: input.maxResults,
      currentPlan: input.currentPlan,
      revisionRequest: input.revisionRequest,
      tools,
      providerStatus
    });

    if (aiResult.plan) {
      return this.normalizePlan(input, aiResult.plan, true);
    }

    return this.createFallbackPlan(input, aiResult.error);
  }

  /**
   * Converte un piano in JSON salvabile da Prisma.
   *
   * Usata da:
   * - apps/backend/src/modules/campaigns/campaigns.service.ts
   */
  toJson(plan: ResearchExecutionPlan): Prisma.InputJsonValue {
    return plan as unknown as Prisma.InputJsonValue;
  }

  /**
   * Normalizza il piano AI applicando default e limiti di sicurezza.
   *
   * Usata da:
   * - buildPlan nello stesso service.
   */
  private normalizePlan(input: ResearchIntentBuildInput, rawPlan: Partial<ResearchExecutionPlan>, aiGenerated: boolean): ResearchExecutionPlan {
    const fallback = this.createFallbackPlan(input);
    const normalizedTools = this.normalizeToolNames(rawPlan.tools, fallback.tools);
    const outputSchema = this.normalizeOutputSchema(rawPlan.outputSchema, fallback.outputSchema);
    const requiredSignals = this.createRequiredSignals(input.userRequest, rawPlan.requiredSignals).slice(0, 20);
    return {
      userRequest: input.userRequest,
      status: aiGenerated ? 'ai_planned' : 'fallback',
      goal: this.cleanText(rawPlan.goal) || fallback.goal,
      entityType: this.cleanText(rawPlan.entityType) || fallback.entityType,
      searchPrompt: this.cleanText(rawPlan.searchPrompt) || fallback.searchPrompt,
      optimizedQueries: this.cleanStringArray(rawPlan.optimizedQueries).slice(0, 6).concat(fallback.optimizedQueries).slice(0, 6),
      requiredSignals,
      negativeSignals: this.removeNegativeSignalsRequestedAsPositive(this.cleanStringArray(rawPlan.negativeSignals), requiredSignals).slice(0, 20),
      blockedDomains: this.cleanStringArray(rawPlan.blockedDomains).map((domain) => domain.toLowerCase()).slice(0, 20),
      allowedSourceTypes: this.cleanStringArray(rawPlan.allowedSourceTypes).length > 0 ? this.cleanStringArray(rawPlan.allowedSourceTypes) : fallback.allowedSourceTypes,
      outputSchema,
      tools: normalizedTools,
      strategy: this.cleanText(rawPlan.strategy) || fallback.strategy,
      warnings: this.cleanStringArray(rawPlan.warnings),
      aiGenerated
    };
  }

  /**
   * Crea un piano locale quando il provider AI non e disponibile.
   *
   * Usata da:
   * - buildPlan e normalizePlan nello stesso service.
   */
  private createFallbackPlan(input: ResearchIntentBuildInput, diagnosticError?: string | null): ResearchExecutionPlan {
    const baseQuery = input.userRequest.trim();
    const requiredSignals = this.createRequiredSignals(baseQuery, []);
    const negativeSignals = this.removeNegativeSignalsRequestedAsPositive(['shopify', 'dropshipping', 'forum', 'video'], requiredSignals);
    return {
      userRequest: input.userRequest,
      status: 'fallback',
      goal: baseQuery,
      entityType: 'entita_da_catalogare',
      searchPrompt: `Cerca fonti operative coerenti con questa richiesta: ${baseQuery}`,
      optimizedQueries: [
        baseQuery,
        `${baseQuery} sito ufficiale contatti`,
        `${baseQuery} elenco aziende indirizzo`,
        `${baseQuery} telefono email`
      ],
      requiredSignals,
      negativeSignals,
      blockedDomains: ['apps.shopify.com', 'community.shopify.com', 'youtube.com', 'youtu.be', 'facebook.com', 'reddit.com'],
      allowedSourceTypes: ['direct_source', 'directory_marketplace'],
      outputSchema: {
        name: 'string',
        url: 'string',
        summary: 'string|null',
        city: 'string|null',
        address: 'string|null',
        phone: 'string|null',
        sourceType: 'string',
        confidenceScore: 'number'
      },
      tools: ['configured_search', 'crawler_html', 'rules_classifier'],
      strategy: 'Piano deterministico: ricerca query mirate, scarta fonti fuori tema prima del crawl, poi estrae solo dati verificabili.',
      warnings: [diagnosticError ?? 'Provider AI non configurato o piano AI non disponibile: strategia generata con fallback locale.'],
      aiGenerated: false
    };
  }

  /**
   * Ripulisce testo generico proveniente da AI o fallback.
   *
   * Usata da:
   * - normalizePlan nello stesso service.
   */
  private cleanText(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
  }

  /**
   * Ripulisce array di stringhe provenienti da AI o fallback.
   *
   * Usata da:
   * - normalizePlan nello stesso service.
   */
  private cleanStringArray(value: unknown) {
    if (!Array.isArray(value)) {
      return [];
    }

    return Array.from(new Set(value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)));
  }

  /**
   * Ripulisce oggetti JSON semplici provenienti da AI o fallback.
   *
   * Usata da:
   * - normalizePlan nello stesso service.
   */
  private cleanObject(value: unknown) {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      return null;
    }

    return value as Record<string, unknown>;
  }

  /**
   * Accetta solo tool realmente registrati nel piano operativo.
   *
   * Usata da:
   * - normalizePlan nello stesso service.
   */
  private normalizeToolNames(value: unknown, fallbackTools: string[]) {
    const allowedTools = new Set(['configured_search', 'crawler_html', 'rules_classifier']);
    const providerAliases = new Set(['tavily_search', 'serpapi_search', 'brave_search', 'google_cse_search', 'exa_search', 'you_search']);
    const requestedToolNames = this.cleanStringArray(value);
    const toolNames = requestedToolNames
      .map((toolName) => (providerAliases.has(toolName) ? 'configured_search' : toolName))
      .filter((toolName) => allowedTools.has(toolName));
    const normalizedTools = Array.from(new Set(['configured_search', ...toolNames, 'crawler_html', 'rules_classifier']));

    return normalizedTools.length > 0 ? normalizedTools : fallbackTools;
  }

  /**
   * Evita che l'AI usi come output finale lo schema tecnico del provider ricerca.
   *
   * Usata da:
   * - normalizePlan nello stesso service.
   */
  private normalizeOutputSchema(value: unknown, fallbackSchema: Record<string, unknown>) {
    const outputSchema = this.cleanObject(value);
    if (!outputSchema) {
      return fallbackSchema;
    }

    if (this.looksLikeSearchProviderSchema(outputSchema)) {
      return fallbackSchema;
    }

    return outputSchema;
  }

  /**
   * Riconosce lo schema grezzo dei risultati ricerca, non adatto all'output finale.
   *
   * Usata da:
   * - normalizeOutputSchema nello stesso service.
   */
  private looksLikeSearchProviderSchema(outputSchema: Record<string, unknown>) {
    if (!('results' in outputSchema)) {
      return false;
    }

    const keys = Object.keys(outputSchema);
    return keys.length === 1 || keys.every((key) => ['results', 'url', 'title', 'snippet', 'sourceProvider'].includes(key));
  }

  /**
   * Estrae parole rilevanti dalla richiesta libera per il fallback locale.
   *
   * Usata da:
   * - createFallbackPlan nello stesso service.
   */
  private extractRelevantTerms(text: string) {
    const stopWords = new Set([
      'trova',
      'trovare',
      'cerca',
      'voglio',
      'serve',
      'servono',
      'dammi',
      'riepilogo',
      'url',
      'nome',
      'descrizione',
      'presente',
      'prezzi',
      'prezzo',
      'tipologie',
      'valutazione',
      'recensioni',
      'recensione',
      'score',
      'con',
      'per',
      'che',
      'della',
      'delle',
      'degli',
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
    ).slice(0, 12);
  }

  /**
   * Crea segnali di ricerca reali evitando campi output travestiti da segnali.
   *
   * Usata da:
   * - normalizePlan;
   * - createFallbackPlan.
   *
   * Riceve richiesta utente e segnali AI, restituisce parole utili per title/snippet/URL.
   */
  private createRequiredSignals(userRequest: string, rawSignals: unknown) {
    const aiSignals = this.cleanStringArray(rawSignals).filter((signal) => !this.isOutputFieldSignal(signal));
    const requestSignals = this.extractRelevantTerms(userRequest).filter((signal) => !this.isOutputFieldSignal(signal));
    const canonicalSignals = this.extractCanonicalCommerceSignals(userRequest);

    return Array.from(new Set([...canonicalSignals, ...aiSignals, ...requestSignals]));
  }

  /**
   * Riconosce parole che descrivono il formato output, non la fonte da cercare.
   *
   * Usata da:
   * - createRequiredSignals nello stesso service.
   */
  private isOutputFieldSignal(signal: string) {
    const normalizedSignal = this.normalizeSignalText(signal).replace(/\s+/g, '');
    const outputFieldSignals = new Set([
      'url',
      'nome',
      'name',
      'descrizione',
      'description',
      'riepilogo',
      'summary',
      'prezzi',
      'prezzo',
      'pricing',
      'price',
      'score',
      'valutazione',
      'recensioni',
      'recensione',
      'review',
      'reviews',
      'presente',
      'tipologie',
      'tipologia'
    ]);

    return outputFieldSignals.has(normalizedSignal);
  }

  /**
   * Aggiunge segnali canonici per casi ecommerce anche con refusi nella richiesta.
   *
   * Usata da:
   * - createRequiredSignals nello stesso service.
   */
  private extractCanonicalCommerceSignals(userRequest: string) {
    const normalizedRequest = this.normalizeSignalText(userRequest);
    const compactRequest = normalizedRequest.replace(/\s+/g, '');
    const signals: string[] = [];

    if (normalizedRequest.includes('shopify')) {
      signals.push('shopify');
    }
    if (/drop\s*ship+p?ing/.test(normalizedRequest) || compactRequest.includes('dropshipping') || compactRequest.includes('dropshiping')) {
      signals.push('dropshipping', 'drop shipping');
    }
    if (normalizedRequest.includes('integraz') || normalizedRequest.includes('integrat')) {
      signals.push('integration', 'integrazione');
    }
    if (normalizedRequest.includes('servizi') || normalizedRequest.includes('services')) {
      signals.push('services');
    }

    return signals;
  }

  /**
   * Rimuove dai negativi i segnali che la richiesta utente ha reso positivi.
   *
   * Usata da:
   * - normalizePlan;
   * - createFallbackPlan.
   *
   * Serve a non penalizzare Shopify o dropshipping quando fanno parte dell'obiettivo approvato.
   */
  private removeNegativeSignalsRequestedAsPositive(negativeSignals: string[], requiredSignals: string[]) {
    return negativeSignals.filter((negativeSignal) => {
      const normalizedNegative = this.normalizeSignalText(negativeSignal);
      const compactNegative = normalizedNegative.replace(/\s+/g, '');
      const compactRequired = requiredSignals.map((signal) => this.normalizeSignalText(signal)).join('').replace(/\s+/g, '');

      return !requiredSignals.some((signal) => this.normalizeSignalText(signal) === normalizedNegative) && !compactRequired.includes(compactNegative);
    });
  }

  /**
   * Normalizza un segnale testuale per confronti semplici.
   *
   * Usata da:
   * - removeNegativeSignalsRequestedAsPositive nello stesso service.
   */
  private normalizeSignalText(signal: string) {
    return signal
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}
