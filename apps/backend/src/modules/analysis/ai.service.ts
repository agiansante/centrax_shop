import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { z } from 'zod';
import { AiProviderAnalyzeInput, AiProviderConnector } from './ai-provider-connector.types';
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

@Injectable()
export class AiService implements AiProviderConnector {
  readonly name = 'openai';
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
              'Sei un agente generalista di ricerca e catalogazione. Estrai dati verificabili dal testo fornito secondo outputSchema. Non sei specializzato in dropshipping: valuta qualsiasi dominio richiesto. Classifica sourceType come direct_source, directory_marketplace, article_reference, forum_social, media_page, non_operational o unknown. Restituisci JSON con fields, sourceType, confidenceScore, qualificationReason, unresolvedFields.'
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

    for (const fieldName of Object.keys(schema)) {
      if (fieldName === 'url') {
        fields[fieldName] = input.url;
      } else if (fieldName === 'name') {
        fields[fieldName] = input.title ?? input.domain;
      } else if (fieldName.toLowerCase().includes('evidence')) {
        fields[fieldName] = input.evidence[0]?.snippet ?? plainText.slice(0, 500);
      } else {
        fields[fieldName] = plainText.slice(0, 500) || null;
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
      unresolvedFields
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
