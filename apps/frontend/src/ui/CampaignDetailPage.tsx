import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, DiscoveredSite } from '../api';

/**
 * Mostra i risultati analizzati di una campagna.
 *
 * Usata da:
 * - apps/frontend/src/main.tsx
 *
 * Carica periodicamente i risultati e permette di filtrarli per evidenza Shopify o costi.
 */
export function CampaignDetailPage() {
  const { id } = useParams();
  const [filter, setFilter] = useState<'all' | 'shopify' | 'pricing'>('all');
  const results = useQuery({
    queryKey: ['campaign-results', id],
    queryFn: () => api.campaignResults(id!),
    enabled: Boolean(id),
    refetchInterval: 5000
  });

  const filtered = useMemo(filterResultsBySelectedMode, [filter, results.data]);

  /**
   * Filtra i risultati in base al pulsante selezionato nella testata.
   *
   * Usata da:
   * - useMemo dentro CampaignDetailPage.
   *
   * Legge i risultati della query React Query e restituisce la lista da renderizzare.
   */
  function filterResultsBySelectedMode(): DiscoveredSite[] {
    const data = results.data ?? [];
    if (filter === 'shopify') {
      return data.filter((site) => site.profile?.shopifyEvidence);
    }
    if (filter === 'pricing') {
      return data.filter((site) => site.profile?.pricingSummary);
    }
    return data;
  }

  /**
   * Mostra tutti i risultati della campagna.
   *
   * Usata da:
   * - pulsante filtro Tutti.
   */
  function showAllResults() {
    setFilter('all');
  }

  /**
   * Mostra solo i risultati con evidenza Shopify.
   *
   * Usata da:
   * - pulsante filtro Shopify.
   */
  function showShopifyResults() {
    setFilter('shopify');
  }

  /**
   * Mostra solo i risultati con evidenza di costi o pricing.
   *
   * Usata da:
   * - pulsante filtro Costi.
   */
  function showPricingResults() {
    setFilter('pricing');
  }

  return (
    <section className="page">
      <header className="pageHeader">
        <div>
          <Link to="/" className="mutedLink">Campagne</Link>
          <h1>Risultati campagna</h1>
        </div>
        <div className="segmented small">
          <button className={filter === 'all' ? 'selected' : ''} onClick={showAllResults}>Tutti</button>
          <button className={filter === 'shopify' ? 'selected' : ''} onClick={showShopifyResults}>Shopify</button>
          <button className={filter === 'pricing' ? 'selected' : ''} onClick={showPricingResults}>Costi</button>
        </div>
      </header>

      <div className="resultsGrid">
        {filtered.map((site) => (
          <article className="resultCard" key={site.id}>
            <div className="cardTop">
              <div>
                <h2>{site.profile?.name ?? site.title ?? site.domain}</h2>
                <p>{site.profile?.description ?? site.snippet}</p>
              </div>
              <span className={`status ${site.status.toLowerCase()}`}>{site.status}</span>
            </div>
            <div className="metaLine">
              <span>{site.domain}</span>
              <span>{Math.round((site.profile?.confidenceScore ?? 0) * 100)}%</span>
            </div>
            <div className="chips">
              {site.profile?.categories?.slice(0, 4).map((category) => <span key={category}>{category}</span>)}
            </div>
            <div className="cardActions">
              {site.profile ? <Link className="primaryButton" to={`/services/${site.profile.id}`}>Dettaglio</Link> : null}
              <a className="iconButton" title="Apri sito" href={site.url} target="_blank" rel="noreferrer">
                <ExternalLink size={16} />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
