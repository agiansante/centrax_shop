import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, Plus } from 'lucide-react';
import { ChangeEvent, FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, Campaign } from '../api';

/**
 * Mostra la dashboard delle campagne di ricerca dell'utente.
 *
 * Usata da:
 * - apps/frontend/src/main.tsx
 *
 * Permette di creare una campagna, avviarla e aprirne i risultati.
 */
export function DashboardPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('dropshipping suppliers Shopify integration');
  const [country, setCountry] = useState('');
  const [depth, setDepth] = useState(2);
  const [maxResults, setMaxResults] = useState(10);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const campaigns = useQuery({
    queryKey: ['campaigns'],
    queryFn: api.campaigns,
    refetchInterval: 3000
  });

  const createCampaign = useMutation({
    mutationFn: createCampaignFromCurrentForm,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] })
  });
  const runCampaign = useMutation({
    mutationFn: (id: string) => api.runCampaign(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] })
  });

  /**
   * Crea il payload della campagna usando i valori correnti del form.
   *
   * Usata da:
   * - useMutation createCampaign dentro DashboardPage.
   */
  function createCampaignFromCurrentForm() {
    return api.createCampaign({ query, country: country || undefined, language: 'it', depth, maxResults });
  }

  /**
   * Intercetta il submit del form e crea una nuova campagna.
   *
   * Usata da:
   * - form di creazione campagna.
   */
  function submit(event: FormEvent) {
    event.preventDefault();
    createCampaign.mutate();
  }

  /**
   * Aggiorna la query principale della campagna.
   *
   * Usata da:
   * - input query nel form dashboard.
   */
  function updateQueryFromInput(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  /**
   * Aggiorna il paese opzionale della campagna.
   *
   * Usata da:
   * - input paese nel form dashboard.
   */
  function updateCountryFromInput(event: ChangeEvent<HTMLInputElement>) {
    setCountry(event.target.value);
  }

  /**
   * Aggiorna la profondita di crawling convertendo il valore numerico.
   *
   * Usata da:
   * - input profondita nel form dashboard.
   */
  function updateDepthFromInput(event: ChangeEvent<HTMLInputElement>) {
    setDepth(Number(event.target.value));
  }

  /**
   * Aggiorna il numero massimo di risultati richiesti al backend.
   *
   * Usata da:
   * - input max risultati nel form dashboard.
   */
  function updateMaxResultsFromInput(event: ChangeEvent<HTMLInputElement>) {
    setMaxResults(Number(event.target.value));
  }

  /**
   * Avvia una campagna cliccata nella tabella.
   *
   * Usata da:
   * - pulsanti play nelle righe campagna.
   *
   * Riceve l'id campagna dalla riga renderizzata.
   */
  function runSelectedCampaign(campaignId: string) {
    runCampaign.mutate(campaignId);
  }

  /**
   * Apre il popup di dettaglio avanzamento per una campagna.
   *
   * Usata da:
   * - pulsante/query nella tabella campagne.
   */
  function openCampaignProgressPopup(campaign: Campaign) {
    setSelectedCampaign(campaign);
  }

  /**
   * Chiude il popup di dettaglio avanzamento.
   *
   * Usata da:
   * - pulsante Chiudi nel popup.
   */
  function closeCampaignProgressPopup() {
    setSelectedCampaign(null);
  }

  /**
   * Calcola i numeri riepilogativi mostrati sopra la tabella.
   *
   * Usata da:
   * - dashboard nella sezione summaryStrip.
   */
  function calculateSummary() {
    const data = campaigns.data ?? [];
    const active = data.filter((campaign) => campaign.status === 'QUEUED' || campaign.status === 'RUNNING').length;
    const completed = data.filter((campaign) => campaign.status === 'COMPLETED').length;
    const discovered = data.reduce((total, campaign) => total + (campaign.discoveredCount ?? 0), 0);
    const analyzed = data.reduce((total, campaign) => total + (campaign.analyzedCount ?? 0), 0);

    return { active, completed, discovered, analyzed };
  }

  const summary = calculateSummary();

  return (
    <section className="page">
      <header className="pageHeader">
        <div>
          <h1>Campagne di ricerca</h1>
          <p>Scopri, analizza e confronta servizi dropshipping compatibili con Shopify.</p>
        </div>
      </header>

      <form className="toolbar" onSubmit={submit}>
        <input value={query} onChange={updateQueryFromInput} placeholder="Query di ricerca" />
        <input value={country} onChange={updateCountryFromInput} placeholder="Paese opzionale" />
        <label className="compactField">
          Profondita
          <input type="number" min={1} max={5} value={depth} onChange={updateDepthFromInput} />
        </label>
        <label className="compactField">
          Max risultati
          <input type="number" min={1} max={50} value={maxResults} onChange={updateMaxResultsFromInput} />
        </label>
        <button className="primaryButton" disabled={createCampaign.isPending}>
          <Plus size={16} />
          Crea
        </button>
      </form>

      <div className="summaryStrip">
        <div><strong>{summary.active}</strong><span>attive</span></div>
        <div><strong>{summary.completed}</strong><span>completate</span></div>
        <div><strong>{summary.discovered}</strong><span>siti trovati</span></div>
        <div><strong>{summary.analyzed}</strong><span>analizzati</span></div>
      </div>

      <div className="table">
        <div className="tableHead">
          <span>Query</span>
          <span>Stato</span>
          <span>Risultati</span>
          <span>Azioni</span>
        </div>
        {campaigns.data?.map((campaign) => (
          <div className="tableRow" key={campaign.id}>
            <button className="linkButton" onClick={() => openCampaignProgressPopup(campaign)}>
              {campaign.query}
            </button>
            <span className={`status ${campaign.status.toLowerCase()}`}>{campaign.status}</span>
            <span>{campaign.analyzedCount ?? 0}/{campaign.discoveredCount ?? campaign.maxResults}</span>
            <button className="iconButton" title="Avvia campagna" onClick={() => runSelectedCampaign(campaign.id)}>
              <Play size={16} />
            </button>
          </div>
        ))}
        {campaigns.data?.length === 0 ? <div className="emptyState">Nessuna campagna ancora creata.</div> : null}
      </div>
      {selectedCampaign ? (
        <div className="modalBackdrop" role="dialog" aria-modal="true">
          <div className="modalPanel">
            <header className="modalHeader">
              <div>
                <h2>{selectedCampaign.query}</h2>
                <p>{selectedCampaign.progressMessage ?? 'Nessun dettaglio operativo disponibile.'}</p>
              </div>
              <button className="iconButton" onClick={closeCampaignProgressPopup}>×</button>
            </header>
            <dl className="definitionList">
              <dt>Stato</dt>
              <dd>{selectedCampaign.status}</dd>
              <dt>Fase</dt>
              <dd>{selectedCampaign.progressStep ?? 'non disponibile'}</dd>
              <dt>Risultati richiesti</dt>
              <dd>{selectedCampaign.maxResults}</dd>
              <dt>Siti trovati</dt>
              <dd>{selectedCampaign.discoveredCount}</dd>
              <dt>Siti analizzati</dt>
              <dd>{selectedCampaign.analyzedCount}</dd>
              <dt>Errori sito</dt>
              <dd>{selectedCampaign.failedCount}</dd>
            </dl>
            <Link className="primaryButton" to={`/campaigns/${selectedCampaign.id}`}>
              Apri risultati
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
