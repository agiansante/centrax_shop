import { Injectable } from '@nestjs/common';

export interface ResearchPlan {
  status: 'fallback' | 'ai_planned';
  optimizedQueries: string[];
  tools: string[];
  explanation: string;
}

export interface ResearchPlanningInput {
  query: string;
  searchPrompt?: string | null;
  country?: string | null;
  maxResults: number;
}

@Injectable()
export class ResearchPlanningService {
  /**
   * Crea un piano operativo iniziale per la ricerca agentica.
   *
   * Usata da:
   * - apps/backend/src/modules/analysis/research-agent.service.ts
   *
   * Riceve query, prompt esteso e contesto paese.
   * Restituisce query ottimizzate e tool da usare nel primo MVP.
   */
  createPlan(input: ResearchPlanningInput): ResearchPlan {
    const optimizedQueries = this.createOptimizedQueries(input);

    return {
      status: 'fallback',
      optimizedQueries,
      tools: ['configured_search', 'crawler_html', 'rules_classifier'],
      explanation: 'Piano fallback deterministico: usa provider ricerca configurato, crawler HTML e regole locali.'
    };
  }

  /**
   * Genera query derivate semplici partendo da richiesta e prompt.
   *
   * Usata da:
   * - createPlan nello stesso service.
   */
  private createOptimizedQueries(input: ResearchPlanningInput): string[] {
    const baseQuery = input.query.trim();
    const promptHint = input.searchPrompt?.trim();
    const countryHint = input.country ? ` ${input.country}` : '';
    const queries = [`${baseQuery}${countryHint}`];

    if (promptHint) {
      queries.push(`${baseQuery} ${promptHint}`.slice(0, 240));
    }

    queries.push(`${baseQuery} sito ufficiale contatti${countryHint}`);
    queries.push(`${baseQuery} elenco aziende indirizzo${countryHint}`);

    return Array.from(new Set(queries)).slice(0, 4);
  }
}
