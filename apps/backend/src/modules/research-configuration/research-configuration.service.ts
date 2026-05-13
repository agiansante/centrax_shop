import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResearchToolRegistryService } from '../analysis/research-tool-registry.service';

@Injectable()
export class ResearchConfigurationService {
  constructor(
    private readonly config: ConfigService,
    private readonly toolRegistry: ResearchToolRegistryService
  ) {}

  /**
   * Restituisce configurazione ricerca e AI senza esporre segreti.
   *
   * Usata da:
   * - apps/backend/src/modules/research-configuration/research-configuration.controller.ts
   *
   * Legge variabili ambiente e tool registry.
   */
  getConfigurationSummary() {
    return {
      search: this.toolRegistry.getSearchProviderStatus(),
      ai: {
        selectedProvider: this.config.get<string>('AI_PROVIDER') ?? 'openai',
        selectedModel: this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini',
        configuredProviders: {
          openai: Boolean(this.config.get<string>('OPENAI_API_KEY')),
          gemini: Boolean(this.config.get<string>('GEMINI_API_KEY')),
          anthropic: Boolean(this.config.get<string>('ANTHROPIC_API_KEY')),
          mistral: Boolean(this.config.get<string>('MISTRAL_API_KEY')),
          openRouter: Boolean(this.config.get<string>('OPENROUTER_API_KEY'))
        },
        fallbackMode: !this.config.get<string>('OPENAI_API_KEY')
      },
      tools: this.toolRegistry.listToolDescriptors(),
      limits: {
        normalUserSearchProviders: 1,
        premiumUserSearchProviders: 4
      }
    };
  }
}
