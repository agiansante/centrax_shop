import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { z } from 'zod';
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

@Injectable()
export class AiService {
  private readonly client?: OpenAI;

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('OPENAI_API_KEY');
    this.client = apiKey ? new OpenAI({ apiKey }) : undefined;
  }

  async analyze(domain: string, title: string | undefined, evidence: ExtractedEvidence[]): Promise<AiServiceProfile> {
    if (!this.client) {
      return this.fallbackProfile(domain, title, evidence);
    }

    const model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
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
  }

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
}
