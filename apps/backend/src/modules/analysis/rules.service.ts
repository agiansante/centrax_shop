import { Injectable } from '@nestjs/common';
import { EvidenceType } from '@prisma/client';

export interface ExtractedEvidence {
  type: EvidenceType;
  url: string;
  snippet: string;
}

const RULES: Array<{ type: EvidenceType; patterns: RegExp[] }> = [
  { type: EvidenceType.SHOPIFY, patterns: [/shopify app/i, /shopify integration/i, /connect(ed)? to shopify/i, /shopify store/i] },
  { type: EvidenceType.PRICING, patterns: [/pricing/i, /price/i, /\$\d+/, /free trial/i, /monthly/i] },
  { type: EvidenceType.DOCUMENTATION, patterns: [/docs?/i, /documentation/i, /api reference/i, /developer/i] },
  { type: EvidenceType.DROPSHIPPING, patterns: [/dropship/i, /supplier/i, /product sourcing/i] },
  { type: EvidenceType.FULFILLMENT, patterns: [/fulfillment/i, /warehouse/i, /shipping/i, /inventory/i] }
];

@Injectable()
export class RulesService {
  extract(text: string, url: string): ExtractedEvidence[] {
    const sentences = text
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .filter(Boolean);

    const evidence: ExtractedEvidence[] = [];
    for (const rule of RULES) {
      const match = sentences.find((sentence) => rule.patterns.some((pattern) => pattern.test(sentence)));
      if (match) {
        evidence.push({ type: rule.type, url, snippet: match.slice(0, 500) });
      }
    }

    if (evidence.length === 0 && text.trim()) {
      evidence.push({ type: EvidenceType.GENERAL, url, snippet: text.replace(/\s+/g, ' ').slice(0, 500) });
    }

    return evidence;
  }
}
