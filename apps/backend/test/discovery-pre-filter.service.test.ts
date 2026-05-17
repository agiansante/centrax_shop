import { describe, expect, it } from 'vitest';
import { DiscoveryPreFilterService } from '../src/modules/analysis/discovery-pre-filter.service';

describe('DiscoveryPreFilterService', () => {
  it('non penalizza Shopify e dropshipping quando sono segnali richiesti', () => {
    const service = new DiscoveryPreFilterService();

    const result = service.evaluateResult(
      {
        title: 'Dropshipping supplier with Shopify integration',
        snippet: 'Service with products, pricing and direct Shopify integration.',
        url: 'https://example.com/shopify-dropshipping',
        normalizedUrl: 'https://example.com/shopify-dropshipping',
        domain: 'example.com',
        source: 'test'
      },
      {
        requiredSignals: ['drop', 'shipping', 'shopify', 'integration'],
        negativeSignals: ['shopify', 'dropshipping'],
        blockedDomains: []
      }
    );

    expect(result.shouldCrawl).toBe(true);
    expect(result.negativeSignals).toEqual([]);
    expect(result.matchedSignals).toContain('shopify');
  });

  it('permette il crawl con un segnale Shopify forte anche se il piano richiede molti segnali', () => {
    const service = new DiscoveryPreFilterService();

    const result = service.evaluateResult(
      {
        title: 'Zendrop - Shopify dropshipping app',
        snippet: 'Automated supplier service for Shopify stores.',
        url: 'https://zendrop.com',
        normalizedUrl: 'https://zendrop.com',
        domain: 'zendrop.com',
        source: 'test'
      },
      {
        requiredSignals: ['url', 'nome', 'descrizione', 'prezzi', 'score', 'shopify', 'recensioni'],
        negativeSignals: ['forum', 'video'],
        blockedDomains: []
      }
    );

    expect(result.shouldCrawl).toBe(true);
    expect(result.reason).toContain('segnali forti');
  });

  it('permette il crawl quando il piano contiene solo campi output ma il risultato e chiaramente pertinente', () => {
    const service = new DiscoveryPreFilterService();

    const result = service.evaluateResult(
      {
        title: 'Best Dropshipping Platforms With Shopify Integration In 2026 - AutoDS',
        snippet: 'Explore the 7 best dropshipping platforms with Shopify integration in 2026.',
        url: 'https://autods.com/blog/shopify-dropshipping-platforms',
        normalizedUrl: 'https://autods.com/blog/shopify-dropshipping-platforms',
        domain: 'autods.com',
        source: 'test'
      },
      {
        requiredSignals: ['url', 'nome', 'descrizione', 'prezzi'],
        negativeSignals: [],
        blockedDomains: []
      }
    );

    expect(result.shouldCrawl).toBe(true);
    expect(result.matchedSignals).toContain('shopify');
    expect(result.matchedSignals).toContain('dropshipping');
  });

  it('non interpreta non-dropshipping come segnale negativo su risultati dropshipping pertinenti', () => {
    const service = new DiscoveryPreFilterService();

    const result = service.evaluateResult(
      {
        title: 'Shopify Dropshipping Integration - Prodigi',
        snippet: 'Automated order fulfilment across a full product range with Shopify integration.',
        url: 'https://prodigi.com/shopify-dropshipping',
        normalizedUrl: 'https://prodigi.com/shopify-dropshipping',
        domain: 'prodigi.com',
        source: 'test'
      },
      {
        requiredSignals: ['shopify', 'dropshipping', 'integration'],
        negativeSignals: ['non-dropshipping'],
        blockedDomains: []
      }
    );

    expect(result.shouldCrawl).toBe(true);
    expect(result.negativeSignals).toEqual([]);
  });
});
