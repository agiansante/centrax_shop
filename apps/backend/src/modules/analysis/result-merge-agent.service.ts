import { Injectable } from '@nestjs/common';
import { DiscoveryResult } from './discovery.service';
import { extractComparableDomain, normalizeUrlForStorage } from './url-normalization.utils';

export interface MergedDiscoveryResult extends DiscoveryResult {
  normalizedUrl: string;
  domain: string;
}

@Injectable()
export class ResultMergeAgentService {
  /**
   * Unisce risultati provenienti da una o piu query e deduplica per dominio.
   *
   * Usata da:
   * - apps/backend/src/modules/analysis/research-agent.service.ts
   *
   * Riceve risultati grezzi dai tool ricerca.
   * Restituisce solo il primo risultato valido per dominio normalizzato.
   */
  mergeAndDeduplicateResults(results: DiscoveryResult[]): MergedDiscoveryResult[] {
    const byDomain = new Map<string, MergedDiscoveryResult>();

    for (const result of results) {
      const normalized = this.normalizeDiscoveryResult(result);
      if (normalized && !byDomain.has(normalized.domain)) {
        byDomain.set(normalized.domain, normalized);
      }
    }

    return Array.from(byDomain.values());
  }

  /**
   * Normalizza URL e dominio di un risultato discovery.
   *
   * Usata da:
   * - mergeAndDeduplicateResults nello stesso service.
   */
  private normalizeDiscoveryResult(result: DiscoveryResult): MergedDiscoveryResult | null {
    try {
      const normalizedUrl = normalizeUrlForStorage(result.url);
      const domain = extractComparableDomain(normalizedUrl);
      return { ...result, normalizedUrl, domain };
    } catch {
      return null;
    }
  }
}
