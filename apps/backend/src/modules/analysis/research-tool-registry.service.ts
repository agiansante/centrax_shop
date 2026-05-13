import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CrawledPage, CrawlerService } from './crawler.service';
import { DiscoveryResult, DiscoveryService } from './discovery.service';
import { ExtractedEvidence, RulesService } from './rules.service';
import { ResearchTool, ResearchToolDescriptor } from './research-tool.types';

interface SearchToolInput {
  query: string;
  country?: string;
  maxResults: number;
}

interface CrawlerToolInput {
  url: string;
  depth: number;
}

interface ClassifierToolInput {
  pages: CrawledPage[];
}

@Injectable()
export class ResearchToolRegistryService {
  constructor(
    private readonly config: ConfigService,
    private readonly discovery: DiscoveryService,
    private readonly crawler: CrawlerService,
    private readonly rules: RulesService
  ) {}

  /**
   * Restituisce tutti i tool disponibili o predisposti per l'agente ricerca.
   *
   * Usata da:
   * - apps/backend/src/modules/analysis/research-agent.service.ts
   * - apps/backend/src/modules/research-configuration/research-configuration.service.ts
   *
   * Legge la configurazione ambiente e restituisce descrittori usabili da UI e LLM.
   */
  listToolDescriptors(): ResearchToolDescriptor[] {
    return [
      this.createSearchTool().descriptor,
      this.createCrawlerTool().descriptor,
      this.createClassifierTool().descriptor,
      ...this.createPlannedProviderDescriptors()
    ];
  }

  /**
   * Recupera un tool eseguibile per nome.
   *
   * Usata da:
   * - apps/backend/src/modules/analysis/research-agent.service.ts
   *
   * Riceve il nome logico del tool e restituisce il connettore interno se disponibile.
   */
  getExecutableTool(name: string): ResearchTool | null {
    const tools = [this.createSearchTool(), this.createCrawlerTool(), this.createClassifierTool()];
    return tools.find((tool) => tool.descriptor.name === name) ?? null;
  }

  /**
   * Indica il provider ricerca effettivamente selezionato dalla configurazione.
   *
   * Usata da:
   * - apps/backend/src/modules/analysis/research-agent.service.ts
   * - apps/backend/src/modules/research-configuration/research-configuration.service.ts
   *
   * Restituisce provider e stato configurazione senza esporre segreti.
   */
  getSearchProviderStatus() {
    const selectedProvider = this.config.get<string>('SEARCH_PROVIDER') ?? 'mock';
    return {
      selectedProvider,
      isMockMode: selectedProvider === 'mock',
      configuredProviders: {
        tavily: Boolean(this.config.get<string>('TAVILY_API_KEY')),
        serpapi: Boolean(this.config.get<string>('SERPAPI_API_KEY')),
        brave: Boolean(this.config.get<string>('BRAVE_SEARCH_API_KEY')),
        googleCse: Boolean(this.config.get<string>('GOOGLE_CSE_API_KEY')),
        exa: Boolean(this.config.get<string>('EXA_API_KEY')),
        you: Boolean(this.config.get<string>('YOU_API_KEY'))
      }
    };
  }

  /**
   * Crea il tool di ricerca collegato al DiscoveryService esistente.
   *
   * Usata da:
   * - listToolDescriptors e getExecutableTool nello stesso service.
   */
  private createSearchTool(): ResearchTool<SearchToolInput, DiscoveryResult[]> {
    const providerStatus = this.getSearchProviderStatus();
    return {
      descriptor: {
        name: 'configured_search',
        description: 'Cerca pagine web usando il provider ricerca configurato. Se il provider e mock, il risultato e demo dichiarato.',
        configured: true,
        inputSchema: { query: 'string', country: 'string?', maxResults: 'number' },
        outputSchema: { results: [{ url: 'string', title: 'string?', snippet: 'string?', source: 'string' }] }
      },
      execute: async (input) => {
        const data = await this.discovery.search(input.query, input.country, input.maxResults);
        return { toolName: 'configured_search', ok: true, data, error: providerStatus.isMockMode ? 'Provider mock dichiarato' : undefined };
      }
    };
  }

  /**
   * Crea il tool crawler HTML interno.
   *
   * Usata da:
   * - listToolDescriptors e getExecutableTool nello stesso service.
   */
  private createCrawlerTool(): ResearchTool<CrawlerToolInput, CrawledPage[]> {
    return {
      descriptor: {
        name: 'crawler_html',
        description: 'Scarica HTML, testo e link candidati partendo da una URL.',
        configured: true,
        inputSchema: { url: 'string', depth: 'number' },
        outputSchema: { pages: [{ url: 'string', title: 'string?', text: 'string', links: ['string'] }] }
      },
      execute: async (input) => {
        const data = await this.crawler.crawl(input.url, input.depth);
        return { toolName: 'crawler_html', ok: data.length > 0, data, error: data.length === 0 ? 'Nessuna pagina HTML leggibile' : undefined };
      }
    };
  }

  /**
   * Crea il tool classificatore basato sulle regole locali.
   *
   * Usata da:
   * - listToolDescriptors e getExecutableTool nello stesso service.
   */
  private createClassifierTool(): ResearchTool<ClassifierToolInput, ExtractedEvidence[]> {
    return {
      descriptor: {
        name: 'rules_classifier',
        description: 'Estrae evidenze Shopify, pricing, documentazione e dropshipping dal testo crawled.',
        configured: true,
        inputSchema: { pages: [{ url: 'string', text: 'string' }] },
        outputSchema: { evidence: [{ type: 'string', url: 'string', snippet: 'string' }] }
      },
      execute: async (input) => {
        const data = input.pages.flatMap((page) => this.rules.extract(page.text, page.url));
        return { toolName: 'rules_classifier', ok: true, data };
      }
    };
  }

  /**
   * Descrive provider futuri non ancora eseguiti direttamente dal registry.
   *
   * Usata da:
   * - listToolDescriptors nello stesso service.
   *
   * Restituisce tool visibili come predisposti ma non connessi se manca la chiave.
   */
  private createPlannedProviderDescriptors(): ResearchToolDescriptor[] {
    const providerStatus = this.getSearchProviderStatus();
    return [
      this.createProviderDescriptor('tavily_search', 'Cerca pagine web rilevanti tramite Tavily.', providerStatus.configuredProviders.tavily),
      this.createProviderDescriptor('brave_search', 'Cerca pagine web tramite Brave Search API.', providerStatus.configuredProviders.brave),
      this.createProviderDescriptor('serpapi_search', 'Cerca risultati Google tramite SerpAPI.', providerStatus.configuredProviders.serpapi),
      this.createProviderDescriptor('google_cse_search', 'Cerca tramite Google Custom Search JSON API.', providerStatus.configuredProviders.googleCse),
      this.createProviderDescriptor('exa_search', 'Cerca contenuti web tramite Exa.', providerStatus.configuredProviders.exa),
      this.createProviderDescriptor('you_search', 'Cerca contenuti web tramite You.com Search API.', providerStatus.configuredProviders.you)
    ];
  }

  /**
   * Costruisce il descrittore standard per un provider ricerca.
   *
   * Usata da:
   * - createPlannedProviderDescriptors nello stesso service.
   */
  private createProviderDescriptor(name: string, description: string, configured: boolean): ResearchToolDescriptor {
    return {
      name,
      description,
      configured,
      inputSchema: { query: 'string', maxResults: 'number', country: 'string?', language: 'string?' },
      outputSchema: { results: [{ url: 'string', title: 'string?', snippet: 'string?', sourceProvider: 'string' }] }
    };
  }
}
