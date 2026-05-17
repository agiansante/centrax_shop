import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { z } from 'zod';
import { AiProviderAnalyzeInput, AiProviderConnector } from './ai-provider-connector.types';
import type { ResearchExecutionPlan } from './research-intent-builder.service';
import type { ResearchToolDescriptor } from './research-tool.types';
import { ExtractedEvidence } from './rules.service';

const ServiceProfileSchema = z.object({
  name: z.string(),
  description: z.string(),
  categories: z.array(z.string()).default([]),
  supportedCountries: z.array(z.string()).default([]),
  shopifyEvidence: z.string().nullable().default(null),
  pricingSummary: z.string().nullable().default(null),
  docsUrl: z.string().nullable().default(null),
  confidenceScore: z.number().min(0).max(1).default(0.4),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([])
});

export type AiServiceProfile = z.infer<typeof ServiceProfileSchema>;

const CatalogExtractionSchema = z.object({
  fields: z.record(z.unknown()).default({}),
  sourceType: z
    .enum(['direct_source', 'directory_marketplace', 'article_reference', 'forum_social', 'media_page', 'non_operational', 'unknown'])
    .default('unknown'),
  confidenceScore: z.number().min(0).max(1).default(0.4),
  qualificationReason: z.string().default('Valutazione non disponibile.'),
  unresolvedFields: z.array(z.string()).default([])
});

export type CatalogExtractionResult = z.infer<typeof CatalogExtractionSchema>;

export interface CatalogExtractionInput {
  objective: string;
  outputSchema: Record<string, unknown> | null;
  url: string;
  domain: string;
  title?: string;
  text: string;
  evidence: ExtractedEvidence[];
}

export interface ResearchExecutionPlanInput {
  userRequest: string;
  depth: number;
  maxResults: number;
  currentPlan?: Record<string, unknown>;
  revisionRequest?: string;
  tools: ResearchToolDescriptor[];
  providerStatus: unknown;
}

export interface ResearchExecutionPlanAiResult {
  plan: Partial<ResearchExecutionPlan> | null;
  error: string | null;
  errorType: 'not_configured' | 'provider_error' | 'invalid_json' | 'invalid_schema' | 'unknown' | null;
}

const FlexibleStringArraySchema = z.preprocess((value) => {
  if (typeof value === 'string') {
    return [value];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      if (!item || Array.isArray(item) || typeof item !== 'object') {
        return null;
      }

      const record = item as Record<string, unknown>;
      return record.name ?? record.query ?? record.value ?? record.text ?? record.warning ?? record.message ?? null;
    })
    .filter((item): item is string => typeof item === 'string');
}, z.array(z.string()).default([]));

const ResearchExecutionPlanSchema = z.object({
  goal: z.string(),
  entityType: z.string().default('entita_da_catalogare'),
  searchPrompt: z.string(),
  optimizedQueries: FlexibleStringArraySchema,
  requiredSignals: FlexibleStringArraySchema,
  negativeSignals: FlexibleStringArraySchema,
  blockedDomains: FlexibleStringArraySchema,
  allowedSourceTypes: FlexibleStringArraySchema,
  outputSchema: z.record(z.unknown()).default({}),
  tools: FlexibleStringArraySchema,
  strategy: z.string(),
  warnings: FlexibleStringArraySchema
});

class ResearchPlanJsonParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResearchPlanJsonParseError';
  }
}

@Injectable()
export class AiService implements AiProviderConnector {
  readonly name = 'openai';
  private readonly logger = new Logger(AiService.name);
  private readonly client?: OpenAI;

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('OPENAI_API_KEY');
    this.client = apiKey ? new OpenAI({ apiKey }) : undefined;
  }

  /**
   * Analizza un dominio usando OpenAI se configurato, altrimenti fallback euristico esplicito.
   *
   * Usata da:
   * - apps/backend/src/modules/analysis/research-agent.service.ts
   * - apps/backend/src/modules/analysis/analysis.service.ts
   *
   * Riceve dominio, titolo ed evidenze estratte.
   * Restituisce un profilo servizio normalizzato.
   */
  async analyze(domain: string, title: string | undefined, evidence: ExtractedEvidence[]): Promise<AiServiceProfile> {
    if (!this.client) {
      return this.fallbackProfile(domain, title, evidence);
    }

    const model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
    try {
      const completion = await this.client.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You analyze dropshipping services. Return strict JSON with name, description, categories, supportedCountries, shopifyEvidence, pricingSummary, docsUrl, confidenceScore, pros, cons.'
          },
          {
            role: 'user',
            content: JSON.stringify({ domain, title, evidence })
          }
        ]
      });

      const content = completion.choices[0]?.message.content ?? '{}';
      return ServiceProfileSchema.parse(JSON.parse(content));
    } catch {
      return this.fallbackProfile(domain, title, evidence);
    }
  }

  /**
   * Analizza tramite interfaccia provider comune per il futuro multi-provider.
   *
   * Usata da:
   * - futuri adapter AI e servizi agentici.
   */
  analyzeProviderInput(input: AiProviderAnalyzeInput) {
    return this.analyze(input.domain, input.title, input.evidence);
  }

  /**
   * Estrae dati catalogabili in modo generalista secondo lo schema richiesto.
   *
   * Usata da:
   * - apps/backend/src/modules/analysis/research-agent.service.ts
   *
   * Riceve obiettivo ricerca, schema output, testo crawled ed evidenze locali.
   * Restituisce campi arbitrari, tipo fonte, punteggio e campi non risolti.
   */
  async extractCatalogData(input: CatalogExtractionInput): Promise<CatalogExtractionResult> {
    if (!this.client) {
      return this.fallbackCatalogExtraction(input);
    }

    try {
      const model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
      const completion = await this.client.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Sei un agente generalista di ricerca e catalogazione. Estrai solo dati verificabili dal testo fornito secondo outputSchema. Non inventare telefono, indirizzo, citta, email o prezzi: se non sono presenti, imposta il campo a null e aggiungilo a unresolvedFields. Non sei specializzato in dropshipping: valuta qualsiasi dominio richiesto. Classifica sourceType come direct_source, directory_marketplace, article_reference, forum_social, media_page, non_operational o unknown. Restituisci JSON con fields, sourceType, confidenceScore, qualificationReason, unresolvedFields.'
          },
          {
            role: 'user',
            content: JSON.stringify({
              objective: input.objective,
              outputSchema: input.outputSchema,
              url: input.url,
              domain: input.domain,
              title: input.title,
              text: input.text.slice(0, 16000),
              evidence: input.evidence
            })
          }
        ]
      });

      const content = completion.choices[0]?.message.content ?? '{}';
      return this.normalizeCatalogExtraction(input, CatalogExtractionSchema.parse(JSON.parse(content)));
    } catch {
      return this.fallbackCatalogExtraction(input);
    }
  }

  /**
   * Crea un piano ricerca ottimizzato dalla richiesta naturale dell'utente.
   *
   * Usata da:
   * - apps/backend/src/modules/analysis/research-intent-builder.service.ts
   *
   * Riceve tool disponibili, provider configurati e limiti campagna.
   * Restituisce un piano tecnico o un errore diagnostico non sensibile.
   */
  async createResearchExecutionPlan(input: ResearchExecutionPlanInput): Promise<ResearchExecutionPlanAiResult> {
    if (!this.client) {
      return {
        plan: null,
        error: 'Provider AI non configurato: OPENAI_API_KEY assente nel backend.',
        errorType: 'not_configured'
      };
    }

    const model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
    try {
      const completion = await this.client.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Sei il planner del cervello ricerca Centrax. Trasforma la richiesta libera in un piano tecnico ottimizzato per i tool disponibili. Restituisci solo JSON con goal, entityType, searchPrompt, optimizedQueries, requiredSignals, negativeSignals, blockedDomains, allowedSourceTypes, outputSchema, tools, strategy, warnings. optimizedQueries deve essere array di stringhe query. tools deve contenere solo nomi tool eseguibili disponibili: configured_search, crawler_html, rules_classifier. Non inserire tavily_search, serpapi_search o altri provider diretti in tools: sono provider dietro configured_search. Nella strategy puoi citare il provider selezionato solo come provider usato da configured_search, senza promettere provider non selezionati. outputSchema deve descrivere i campi finali utili per valutare i risultati, non lo schema tecnico del provider ricerca. Scegli campi output verificabili come name, url, summary, city, address, phone, sourceType, confidenceScore quando coerenti. Inserisci domini e segnali negativi quando aiutano a evitare risultati fuori tema.'
          },
          {
            role: 'user',
            content: JSON.stringify({
              userRequest: input.userRequest,
              depth: input.depth,
              maxResults: input.maxResults,
              currentPlan: input.currentPlan,
              revisionRequest: input.revisionRequest,
              availableTools: input.tools,
              providerStatus: input.providerStatus
            })
          }
        ]
      });

      const content = completion.choices[0]?.message.content ?? '{}';
      const parsedContent = this.parseResearchPlanJson(content);
      const plan = ResearchExecutionPlanSchema.parse(parsedContent);
      return { plan, error: null, errorType: null };
    } catch (error) {
      const diagnostic = this.createResearchPlanDiagnosticError(error, model);
      this.logger.warn(`Planner AI non disponibile: ${diagnostic.error}`);
      return diagnostic;
    }
  }

  /**
   * Converte la risposta testuale del planner in JSON e isola errori di parsing.
   *
   * Usata da:
   * - createResearchExecutionPlan nello stesso service.
   */
  private parseResearchPlanJson(content: string) {
    try {
      return JSON.parse(content) as unknown;
    } catch (error) {
      throw new ResearchPlanJsonParseError(error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Crea un errore diagnostico del planner senza esporre segreti.
   *
   * Usata da:
   * - createResearchExecutionPlan nello stesso service.
   */
  private createResearchPlanDiagnosticError(error: unknown, model: string): ResearchExecutionPlanAiResult {
    if (error instanceof ResearchPlanJsonParseError) {
      return {
        plan: null,
        error: `AI configurata ma risposta JSON non valida. Modello: ${model}. Dettaglio: ${error.message}`,
        errorType: 'invalid_json'
      };
    }

    if (error instanceof z.ZodError) {
      return {
        plan: null,
        error: `AI configurata ma piano non conforme allo schema richiesto. Modello: ${model}. Dettaglio: ${error.issues
          .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
          .slice(0, 3)
          .join('; ')}`,
        errorType: 'invalid_schema'
      };
    }

    if (error instanceof OpenAI.APIError) {
      return {
        plan: null,
        error: `Errore provider OpenAI durante planning. Modello: ${model}. Status: ${error.status ?? 'n/d'}. Codice: ${error.code ?? 'n/d'}. Tipo: ${error.type ?? 'n/d'}.`,
        errorType: 'provider_error'
      };
    }

    if (error instanceof Error) {
      return {
        plan: null,
        error: `Errore planner AI non classificato. Modello: ${model}. Messaggio: ${error.message}`,
        errorType: 'unknown'
      };
    }

    return {
      plan: null,
      error: `Errore planner AI non classificato. Modello: ${model}.`,
      errorType: 'unknown'
    };
  }

  /**
   * Indica se il provider OpenAI e configurato.
   *
   * Usata da:
   * - servizi di configurazione e diagnostica.
   */
  get configured() {
    return Boolean(this.client);
  }

  /**
   * Restituisce il nome modello AI o fallback corrente.
   *
   * Usata da:
   * - apps/backend/src/modules/analysis/analysis.service.ts
   * - apps/backend/src/modules/analysis/research-agent.service.ts
   */
  modelName() {
    return this.config.get<string>('OPENAI_MODEL') ?? 'mock-analysis';
  }

  private fallbackProfile(domain: string, title: string | undefined, evidence: ExtractedEvidence[]): AiServiceProfile {
    const text = evidence.map((item) => item.snippet).join(' ');
    return {
      name: title || domain,
      description: text.slice(0, 500) || `Service profile for ${domain}.`,
      categories: evidence.map((item) => item.type.toLowerCase()),
      supportedCountries: [],
      shopifyEvidence: evidence.find((item) => item.type === 'SHOPIFY')?.snippet ?? null,
      pricingSummary: evidence.find((item) => item.type === 'PRICING')?.snippet ?? null,
      docsUrl: evidence.find((item) => item.type === 'DOCUMENTATION')?.url ?? null,
      confidenceScore: evidence.some((item) => item.type === 'SHOPIFY') ? 0.72 : 0.42,
      pros: evidence.some((item) => item.type === 'SHOPIFY') ? ['Shopify compatibility detected'] : [],
      cons: evidence.some((item) => item.type === 'PRICING') ? [] : ['Pricing evidence not found']
    };
  }

  /**
   * Crea una estrazione catalogo locale quando AI non e disponibile.
   *
   * Usata da:
   * - extractCatalogData nello stesso service.
   */
  private fallbackCatalogExtraction(input: CatalogExtractionInput): CatalogExtractionResult {
    const fields: Record<string, unknown> = {};
    const schema = input.outputSchema ?? {};
    const plainText = input.text.replace(/\s+/g, ' ').trim();
    const intentionallyUnresolvedFields: string[] = [];

    for (const fieldName of Object.keys(schema)) {
      if (fieldName === 'url') {
        fields[fieldName] = input.url;
      } else if (fieldName === 'name') {
        fields[fieldName] = input.title ?? input.domain;
      } else if (this.isSensitiveContactField(fieldName)) {
        fields[fieldName] = null;
        intentionallyUnresolvedFields.push(fieldName);
      } else if (fieldName.toLowerCase().includes('evidence')) {
        fields[fieldName] = input.evidence[0]?.snippet ?? null;
        if (!fields[fieldName]) {
          intentionallyUnresolvedFields.push(fieldName);
        }
      } else {
        fields[fieldName] = fieldName.toLowerCase().includes('summary') ? plainText.slice(0, 500) || null : null;
        if (!fields[fieldName]) {
          intentionallyUnresolvedFields.push(fieldName);
        }
      }
    }

    if (Object.keys(fields).length === 0) {
      fields.name = input.title ?? input.domain;
      fields.url = input.url;
      fields.summary = plainText.slice(0, 500);
    }

    const unresolvedFields = Object.entries(fields)
      .filter(([, value]) => value === null || value === undefined || value === '')
      .map(([fieldName]) => fieldName);

    return {
      fields,
      sourceType: this.detectSourceType(input.url),
      confidenceScore: plainText ? 0.55 : 0.2,
      qualificationReason: plainText ? 'Fallback locale: testo disponibile e campi compilati parzialmente.' : 'Fallback locale: testo non disponibile.',
      unresolvedFields: Array.from(new Set([...intentionallyUnresolvedFields, ...unresolvedFields]))
    };
  }

  /**
   * Completa campi minimi e pulisce l'estrazione restituita dall'AI.
   *
   * Usata da:
   * - extractCatalogData nello stesso service.
   */
  private normalizeCatalogExtraction(input: CatalogExtractionInput, extraction: CatalogExtractionResult): CatalogExtractionResult {
    const fields = { ...extraction.fields };
    if (!fields.url) {
      fields.url = input.url;
    }
    if (!fields.name) {
      fields.name = input.title ?? input.domain;
    }

    const expectedFields = Object.keys(input.outputSchema ?? {});
    const unresolvedFields = expectedFields.filter((fieldName) => fields[fieldName] === undefined || fields[fieldName] === null || fields[fieldName] === '');

    return {
      ...extraction,
      fields,
      sourceType: extraction.sourceType === 'unknown' ? this.detectSourceType(input.url) : extraction.sourceType,
      unresolvedFields: Array.from(new Set([...extraction.unresolvedFields, ...unresolvedFields]))
    };
  }

  /**
   * Riconosce campi che non devono essere riempiti con testo generico nel fallback.
   *
   * Usata da:
   * - fallbackCatalogExtraction nello stesso service.
   */
  private isSensitiveContactField(fieldName: string) {
    const lowerName = fieldName.toLowerCase();
    return ['phone', 'telefono', 'address', 'indirizzo', 'city', 'citta', 'email', 'price', 'prezzo'].some((token) => lowerName.includes(token));
  }

  /**
   * Classifica la sorgente con euristiche semplici e generaliste.
   *
   * Usata da:
   * - fallbackCatalogExtraction e normalizeCatalogExtraction.
   */
  private detectSourceType(url: string): CatalogExtractionResult['sourceType'] {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('reddit.com') || lowerUrl.includes('forum') || lowerUrl.includes('quora.com')) {
      return 'forum_social';
    }
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerUrl.includes('tiktok.com')) {
      return 'media_page';
    }
    if (lowerUrl.includes('apps.shopify.com') || lowerUrl.includes('marketplace') || lowerUrl.includes('directory')) {
      return 'directory_marketplace';
    }
    if (lowerUrl.includes('/blog') || lowerUrl.includes('/news') || lowerUrl.includes('/guide')) {
      return 'article_reference';
    }

    return 'direct_source';
  }
}
