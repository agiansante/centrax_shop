import { Injectable } from '@nestjs/common';
import { DiscoveryResult } from './discovery.service';
import { ResearchExecutionPlan } from './research-intent-builder.service';

export interface DiscoveryPreFilterResult {
  shouldCrawl: boolean;
  score: number;
  reason: string;
  matchedSignals: string[];
  negativeSignals: string[];
  blockedDomainMatched?: string;
}

@Injectable()
export class DiscoveryPreFilterService {
  /**
   * Valuta un risultato discovery prima del crawling.
   *
   * Usata da:
   * - apps/backend/src/modules/analysis/research-agent.service.ts
   *
   * Riceve titolo, snippet, URL e piano approvato.
   * Restituisce decisione, punteggio e segnali trovati.
   */
  evaluateResult(
    result: DiscoveryResult & { normalizedUrl: string; domain: string },
    plan: Pick<ResearchExecutionPlan, 'requiredSignals' | 'negativeSignals' | 'blockedDomains'>
  ): DiscoveryPreFilterResult {
    const discoveryText = this.normalizeSearchText(`${result.title ?? ''} ${result.snippet ?? ''} ${result.normalizedUrl} ${result.domain}`);
    const blockedDomainMatched = plan.blockedDomains.find((domain) => this.domainMatches(result.domain, domain));
    if (blockedDomainMatched) {
      return {
        shouldCrawl: false,
        score: 0,
        reason: `Dominio escluso dal piano: ${blockedDomainMatched}.`,
        matchedSignals: [],
        negativeSignals: [],
        blockedDomainMatched
      };
    }

    const requiredSignals = this.normalizeSignals(plan.requiredSignals);
    const effectiveNegativeSignals = this.removeNegativeSignalsRequestedAsPositive(plan.negativeSignals, requiredSignals);
    const negativeSignals = effectiveNegativeSignals.filter((signal) => this.textMatchesNegativeSignal(discoveryText, signal));
    const matchedSignals = requiredSignals.filter((signal) => this.textMatchesSignal(discoveryText, signal));
    const requiredScore = requiredSignals.length === 0 ? 0.6 : matchedSignals.length / requiredSignals.length;
    const negativePenalty = Math.min(0.5, negativeSignals.length * 0.18);
    const score = Math.max(0, Math.min(1, requiredScore - negativePenalty));
    const strongCommerceSignals = this.findStrongCommerceSignals(discoveryText);
    const hasStrongCommerceSignal = strongCommerceSignals.length > 0;

    if (negativeSignals.length > 0 && matchedSignals.length < 2) {
      return {
        shouldCrawl: false,
        score,
        reason: `Segnali negativi presenti e coerenza bassa: ${negativeSignals.join(', ')}.`,
        matchedSignals,
        negativeSignals
      };
    }

    if (hasStrongCommerceSignal && negativeSignals.length === 0) {
      return {
        shouldCrawl: true,
        score: Math.max(score, 0.35),
        reason: `Crawl consentito: trovati segnali forti nel risultato (${strongCommerceSignals.join(', ')}).`,
        matchedSignals: Array.from(new Set([...matchedSignals, ...strongCommerceSignals])),
        negativeSignals
      };
    }

    if (requiredSignals.length >= 3 && matchedSignals.length < 2) {
      return {
        shouldCrawl: false,
        score,
        reason: `Coerenza bassa prima del crawl: trovati ${matchedSignals.length} segnali richiesti su ${requiredSignals.length}.`,
        matchedSignals,
        negativeSignals
      };
    }

    return {
      shouldCrawl: score >= 0.35,
      score,
      reason: `Coerenza pre-crawl ${score.toFixed(2)} con ${matchedSignals.length} segnali richiesti trovati.`,
      matchedSignals,
      negativeSignals
    };
  }

  /**
   * Controlla se un dominio coincide con un dominio bloccato.
   *
   * Usata da:
   * - evaluateResult nello stesso service.
   */
  private domainMatches(domain: string, blockedDomain: string) {
    const cleanDomain = domain.toLowerCase();
    const cleanBlocked = blockedDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    return cleanDomain === cleanBlocked || cleanDomain.endsWith(`.${cleanBlocked}`);
  }

  /**
   * Normalizza segnali testuali per confronto semplice.
   *
   * Usata da:
   * - evaluateResult nello stesso service.
   */
  private normalizeSignals(signals: string[]) {
    return signals
      .map((signal) =>
        this.normalizeSearchText(signal)
      )
      .filter((signal) => signal.length >= 3);
  }

  /**
   * Rimuove dai negativi i segnali che il piano ha chiesto come positivi.
   *
   * Usata da:
   * - evaluateResult nello stesso service.
   *
   * Evita casi come Shopify o drop shipping trattati come penalita quando sono criteri richiesti.
   */
  private removeNegativeSignalsRequestedAsPositive(negativeSignals: string[], requiredSignals: string[]) {
    return this.normalizeSignals(negativeSignals).filter((negativeSignal) => {
      return !this.signalIsRequestedAsPositive(negativeSignal, requiredSignals);
    });
  }

  /**
   * Verifica conflitti tra un segnale negativo e i segnali positivi richiesti.
   *
   * Usata da:
   * - removeNegativeSignalsRequestedAsPositive nello stesso service.
   */
  private signalIsRequestedAsPositive(negativeSignal: string, requiredSignals: string[]) {
    const compactNegative = negativeSignal.replace(/\s+/g, '');
    const compactRequired = requiredSignals.join('').replace(/\s+/g, '');

    return requiredSignals.some((requiredSignal) => requiredSignal === negativeSignal) || compactRequired.includes(compactNegative);
  }

  /**
   * Riconosce segnali forti per richieste Shopify/dropshipping.
   *
   * Usata da:
   * - evaluateResult nello stesso service.
   *
   * Permette il crawl quando una fonte sembra chiaramente pertinente anche se non contiene ancora due segnali richiesti.
   */
  private findStrongCommerceSignals(discoveryText: string) {
    const strongSignals: string[] = [];
    const compactText = discoveryText.replace(/\s+/g, '');

    if (discoveryText.includes('shopify')) {
      strongSignals.push('shopify');
    }
    if (/drop\s*ship+p?ing/.test(discoveryText) || compactText.includes('dropshipping') || compactText.includes('dropshiping')) {
      strongSignals.push('dropshipping');
    }
    if (discoveryText.includes('supplier') || discoveryText.includes('suppliers') || discoveryText.includes('provider') || discoveryText.includes('providers')) {
      strongSignals.push('supplier/provider');
    }
    if (discoveryText.includes('integration') || discoveryText.includes('integrations') || discoveryText.includes('integrated') || discoveryText.includes('integrazione')) {
      strongSignals.push('integration');
    }
    if (discoveryText.includes('fulfillment') || discoveryText.includes('fulfilment') || discoveryText.includes('fulfil')) {
      strongSignals.push('fulfillment');
    }

    return strongSignals;
  }

  /**
   * Controlla se un testo discovery contiene un segnale, includendo varianti comuni.
   *
   * Usata da:
   * - evaluateResult nello stesso service.
   */
  private textMatchesSignal(discoveryText: string, signal: string) {
    const compactText = discoveryText.replace(/\s+/g, '');
    const compactSignal = signal.replace(/\s+/g, '');

    if (discoveryText.includes(signal) || compactText.includes(compactSignal)) {
      return true;
    }

    if (signal.includes('shopify')) {
      return discoveryText.includes('shopify');
    }

    if (signal.includes('drop') || signal.includes('ship') || signal.includes('dropship')) {
      return /drop\s*ship+p?ing/.test(discoveryText) || compactText.includes('dropshipping') || compactText.includes('dropshiping');
    }

    if (signal.includes('integr') || signal.includes('integraz')) {
      return discoveryText.includes('integration') || discoveryText.includes('integrations') || discoveryText.includes('integrated') || discoveryText.includes('integrazione');
    }

    return false;
  }

  /**
   * Controlla segnali negativi senza espansioni semantiche rischiose.
   *
   * Usata da:
   * - evaluateResult nello stesso service.
   *
   * Evita che `non-dropshipping` venga interpretato come match positivo di `dropshipping`.
   */
  private textMatchesNegativeSignal(discoveryText: string, signal: string) {
    const compactText = discoveryText.replace(/\s+/g, '');
    const compactSignal = signal.replace(/\s+/g, '');

    return discoveryText.includes(signal) || compactText.includes(compactSignal);
  }

  /**
   * Normalizza testo e segnali per confronti semplici e robusti.
   *
   * Usata da:
   * - evaluateResult;
   * - normalizeSignals.
   */
  private normalizeSearchText(text: string) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s./:-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
