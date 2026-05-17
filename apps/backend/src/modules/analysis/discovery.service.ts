import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { keepFirstItemForEachDomain } from './url-normalization.utils';

export interface DiscoveryResult {
  url: string;
  title?: string;
  snippet?: string;
  source: string;
}

@Injectable()
export class DiscoveryService {
  constructor(private readonly config: ConfigService) {}

  /**
   * Cerca pagine web usando il provider configurato.
   *
   * Usata da:
   * - apps/backend/src/modules/analysis/analysis.service.ts
   *
   * Riceve query e paese opzionale dalla campagna.
   * Restituisce risultati deduplicati per dominio quando il provider lo supporta.
   */
  async search(query: string, country?: string, maxResults = 10): Promise<DiscoveryResult[]> {
    const provider = this.config.get<string>('SEARCH_PROVIDER') ?? 'mock';
    if (provider === 'tavily' && this.config.get<string>('TAVILY_API_KEY')) {
      return this.searchTavily(query, country, maxResults);
    }
    if (provider === 'serpapi' && this.config.get<string>('SERPAPI_API_KEY')) {
      return this.searchSerpApi(query, country, maxResults);
    }
    return this.mockResults(query).slice(0, maxResults);
  }

  /**
   * Interroga Tavily quando SEARCH_PROVIDER=tavily e la chiave API e presente.
   *
   * Usata da:
   * - search nello stesso service.
   *
   * Riceve query e paese opzionale, poi normalizza la risposta nel formato interno.
   */
  private async searchTavily(query: string, country: string | undefined, maxResults: number): Promise<DiscoveryResult[]> {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        api_key: this.config.get<string>('TAVILY_API_KEY'),
        query: this.addCountryToQuery(query, country),
        max_results: maxResults
      })
    });
    const data = (await response.json()) as { results?: Array<{ url: string; title?: string; content?: string }> };
    const discoveryResults = this.convertTavilyResponseToDiscoveryResults(data.results ?? []);

    return keepFirstItemForEachDomain(discoveryResults);
  }

  /**
   * Interroga SerpAPI quando SEARCH_PROVIDER=serpapi e la chiave API e presente.
   *
   * Usata da:
   * - search nello stesso service.
   *
   * Riceve query e paese opzionale, poi normalizza la risposta nel formato interno.
   */
  private async searchSerpApi(query: string, country: string | undefined, maxResults: number): Promise<DiscoveryResult[]> {
    const params = new URLSearchParams({
      api_key: this.config.get<string>('SERPAPI_API_KEY') ?? '',
      engine: 'google',
      q: this.addCountryToQuery(query, country),
      num: String(maxResults)
    });
    const response = await fetch(`https://serpapi.com/search.json?${params}`);
    const data = (await response.json()) as { organic_results?: Array<{ link: string; title?: string; snippet?: string }> };
    const discoveryResults = this.convertSerpApiResponseToDiscoveryResults(data.organic_results ?? []);

    return keepFirstItemForEachDomain(discoveryResults);
  }

  /**
   * Restituisce risultati demo quando non ci sono chiavi API configurate.
   *
   * Usata da:
   * - search nello stesso service.
   *
   * Permette di provare l'app in locale senza costi o account esterni.
   */
  private mockResults(query: string): DiscoveryResult[] {
    return [
      {
        url: 'https://www.dsers.com/',
        title: 'DSers AliExpress Dropshipping',
        snippet: `Mock result for ${query}: Shopify dropshipping app, suppliers, order fulfillment and pricing pages.`,
        source: 'mock'
      },
      {
        url: 'https://www.spocket.co/',
        title: 'Spocket Dropshipping Suppliers',
        snippet: 'Mock result: Shopify integration, US/EU suppliers, branded invoicing and pricing plans.',
        source: 'mock'
      },
      {
        url: 'https://www.printful.com/',
        title: 'Printful Print-on-demand Dropshipping',
        snippet: 'Mock result: Shopify integration, fulfillment, documentation and product catalog.',
        source: 'mock'
      }
    ];
  }

  /**
   * Aggiunge il paese alla query senza introdurre bias di dominio.
   *
   * Usata da:
   * - searchTavily e searchSerpApi nello stesso service.
   */
  private addCountryToQuery(query: string, country?: string) {
    return `${query} ${country ?? ''}`.trim();
  }

  /**
   * Converte i risultati Tavily nel formato interno DiscoveryResult.
   *
   * Usata da:
   * - searchTavily nello stesso service.
   *
   * Riceve la lista grezza Tavily e restituisce oggetti usabili dalla pipeline.
   */
  private convertTavilyResponseToDiscoveryResults(
    results: Array<{ url: string; title?: string; content?: string }>
  ): DiscoveryResult[] {
    const discoveryResults: DiscoveryResult[] = [];

    for (const item of results) {
      discoveryResults.push({
        url: item.url,
        title: item.title,
        snippet: item.content,
        source: 'tavily'
      });
    }

    return discoveryResults;
  }

  /**
   * Converte i risultati SerpAPI nel formato interno DiscoveryResult.
   *
   * Usata da:
   * - searchSerpApi nello stesso service.
   *
   * Riceve la lista organica SerpAPI e restituisce oggetti usabili dalla pipeline.
   */
  private convertSerpApiResponseToDiscoveryResults(
    results: Array<{ link: string; title?: string; snippet?: string }>
  ): DiscoveryResult[] {
    const discoveryResults: DiscoveryResult[] = [];

    for (const item of results) {
      discoveryResults.push({
        url: item.link,
        title: item.title,
        snippet: item.snippet,
        source: 'serpapi'
      });
    }

    return discoveryResults;
  }
}
