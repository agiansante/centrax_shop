import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, Plus, X } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
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
  const [searchPrompt, setSearchPrompt] = useState('Trova servizi dropshipping con integrazione Shopify, pricing chiaro e documentazione tecnica.');
  const [outputSchemaText, setOutputSchemaText] = useState(
    JSON.stringify(
      {
        name: 'string',
        url: 'string',
        summary: 'string',
        sourceType: 'string',
        confidenceScore: 'number'
      },
      null,
      2
    )
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [country, setCountry] = useState('');
  const [depth, setDepth] = useState(2);
  const [maxResults, setMaxResults] = useState(10);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(Date.now());
  const campaigns = useQuery({
    queryKey: ['campaigns'],
    queryFn: api.campaigns,
    refetchInterval: 3000
  });
  const agentLogs = useQuery({
    queryKey: ['campaign-agent-logs', selectedCampaignId],
    queryFn: () => api.campaignAgentLogs(selectedCampaignId!),
    enabled: Boolean(selectedCampaignId),
    refetchInterval: selectedCampaignId ? 2000 : false
  });

  const createCampaign = useMutation({
    mutationFn: createCampaignFromCurrentForm,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] })
  });
  const runCampaign = useMutation({
    mutationFn: (id: string) => api.runCampaign(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] })
  });

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTimeMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  /**
   * Crea il payload della campagna usando i valori correnti del form.
   *
   * Usata da:
   * - useMutation createCampaign dentro DashboardPage.
   */
  function createCampaignFromCurrentForm() {
    const outputSchema = parseOutputSchemaFromText(outputSchemaText);
    return api.createCampaign({
      query,
      searchPrompt: searchPrompt || undefined,
      outputSchema: outputSchema ?? undefined,
      country: country || undefined,
      language: 'it',
      depth,
      maxResults
    });
  }

  /**
   * Intercetta il submit del form e crea una nuova campagna.
   *
   * Usata da:
   * - form di creazione campagna.
   */
  function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!parseOutputSchemaFromText(outputSchemaText)) {
      setFormError('Lo schema JSON non e valido.');
      return;
    }
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
   * Aggiorna il prompt esteso usato dal planner agente.
   *
   * Usata da:
   * - textarea prompt nel form dashboard.
   */
  function updateSearchPromptFromInput(event: ChangeEvent<HTMLTextAreaElement>) {
    setSearchPrompt(event.target.value);
  }

  /**
   * Aggiorna lo schema JSON richiesto per l'output finale.
   *
   * Usata da:
   * - textarea schema nel form dashboard.
   */
  function updateOutputSchemaFromInput(event: ChangeEvent<HTMLTextAreaElement>) {
    setOutputSchemaText(event.target.value);
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
    setSelectedCampaignId(campaign.id);
  }

  /**
   * Chiude il popup di dettaglio avanzamento.
   *
   * Usata da:
   * - pulsante Chiudi nel popup.
   */
  function closeCampaignProgressPopup() {
    setSelectedCampaignId(null);
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
    const failed = data.reduce((total, campaign) => total + (campaign.failedCount ?? 0), 0);

    return { active, completed, discovered, analyzed, failed };
  }

  /**
   * Converte lo stato tecnico della campagna in testo leggibile.
   *
   * Usata da:
   * - righe tabella campagne.
   * - popup avanzamento campagna.
   */
  function formatCampaignStatus(status: Campaign['status']) {
    const labels: Record<Campaign['status'], string> = {
      DRAFT: 'Bozza',
      QUEUED: 'In coda',
      RUNNING: 'In corso',
      COMPLETED: 'Completata',
      FAILED: 'Fallita'
    };

    return labels[status];
  }

  /**
   * Mostra la URL lunga in forma compatta nella barra campagne.
   *
   * Usata da:
   * - colonna URL in analisi.
   * - popup avanzamento campagna.
   */
  function formatCurrentAnalyzedUrl(campaign: Campaign) {
    if (!campaign.currentAnalyzedUrl) {
      return campaign.status === 'RUNNING' ? 'Preparazione sito...' : 'Nessuna URL in analisi';
    }

    return campaign.currentAnalyzedUrl;
  }

  /**
   * Calcola il tempo trascorso dall'avvio del worker.
   *
   * Usata da:
   * - colonna tempo nella tabella campagne.
   * - popup avanzamento campagna.
   */
  function formatElapsedTime(campaign: Campaign) {
    if (!campaign.startedAt) {
      return '-';
    }

    const endTime = campaign.completedAt ? new Date(campaign.completedAt).getTime() : currentTimeMs;
    const startTime = new Date(campaign.startedAt).getTime();
    const elapsedSeconds = Math.max(0, Math.floor((endTime - startTime) / 1000));
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }

  /**
   * Riassume risultati analizzati, falliti e scoperti.
   *
   * Usata da:
   * - colonna risultati nella tabella campagne.
   */
  function formatProgressCount(campaign: Campaign) {
    const analyzed = campaign.analyzedCount ?? 0;
    const failed = campaign.failedCount ?? 0;
    const discovered = campaign.discoveredCount ?? 0;
    const completed = analyzed + failed;
    const total = discovered > 0 ? discovered : campaign.maxResults;

    if (failed > 0) {
      return `${completed}/${total} (${failed} errori)`;
    }

    return `${completed}/${total}`;
  }

  /**
   * Converte il testo dello schema in oggetto JSON.
   *
   * Usata da:
   * - submit e createCampaignFromCurrentForm.
   */
  function parseOutputSchemaFromText(text: string) {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        return null;
      }

      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  /**
   * Mostra valori JSON compatti nel popup agente.
   *
   * Usata da:
   * - riepiloghi provider, tool e output finale.
   */
  function formatJsonPreview(value: unknown) {
    if (!value) {
      return 'Non disponibile';
    }

    return JSON.stringify(value, null, 2);
  }

  /**
   * Decide se una campagna puo essere avviata dalla riga.
   *
   * Usata da:
   * - pulsante play nelle righe campagna.
   */
  function isRunButtonDisabled(campaign: Campaign) {
    return campaign.status === 'QUEUED' || campaign.status === 'RUNNING' || runCampaign.isPending;
  }

  const summary = calculateSummary();
  const selectedCampaign = campaigns.data?.find((campaign) => campaign.id === selectedCampaignId) ?? null;

  return (
    <section className="page">
      <header className="pageHeader">
        <div>
          <h1>Campagne di ricerca</h1>
          <p>Scopri, analizza e confronta servizi dropshipping compatibili con Shopify.</p>
        </div>
      </header>

      <form className="campaignForm" onSubmit={submit}>
        <div className="toolbar">
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
        </div>
        <div className="agentFormGrid">
          <label>
            Prompt ricerca
            <textarea value={searchPrompt} onChange={updateSearchPromptFromInput} rows={5} />
          </label>
          <label>
            Schema output JSON
            <textarea value={outputSchemaText} onChange={updateOutputSchemaFromInput} rows={5} spellCheck={false} />
          </label>
        </div>
        {formError ? <p className="error">{formError}</p> : null}
      </form>

      <div className="summaryStrip">
        <div><strong>{summary.active}</strong><span>attive</span></div>
        <div><strong>{summary.completed}</strong><span>completate</span></div>
        <div><strong>{summary.discovered}</strong><span>siti trovati</span></div>
        <div><strong>{summary.analyzed}</strong><span>analizzati</span></div>
        <div><strong>{summary.failed}</strong><span>errori sito</span></div>
      </div>

      <div className="table">
        <div className="tableHead">
          <span>Query</span>
          <span>Stato</span>
          <span>URL in analisi</span>
          <span>Tempo</span>
          <span>Risultati</span>
          <span>Azioni</span>
        </div>
        {campaigns.data?.map((campaign) => (
          <div className="tableRow" key={campaign.id}>
            <button className="linkButton" onClick={() => openCampaignProgressPopup(campaign)}>
              {campaign.query}
            </button>
            <span className={`status ${campaign.status.toLowerCase()}`}>{formatCampaignStatus(campaign.status)}</span>
            <span className="truncateText" title={formatCurrentAnalyzedUrl(campaign)}>
              {formatCurrentAnalyzedUrl(campaign)}
            </span>
            <span>{formatElapsedTime(campaign)}</span>
            <span title={`${campaign.analyzedCount ?? 0} analizzati, ${campaign.failedCount ?? 0} errori`}>
              {formatProgressCount(campaign)}
            </span>
            <button
              className="iconButton"
              title="Avvia campagna"
              disabled={isRunButtonDisabled(campaign)}
              onClick={() => runSelectedCampaign(campaign.id)}
            >
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
              <button className="iconButton" title="Chiudi" onClick={closeCampaignProgressPopup}>
                <X size={16} />
              </button>
            </header>
            <dl className="definitionList">
              <dt>Stato</dt>
              <dd>{formatCampaignStatus(selectedCampaign.status)}</dd>
              <dt>Fase</dt>
              <dd>{selectedCampaign.progressStep ?? 'non disponibile'}</dd>
              <dt>URL in analisi</dt>
              <dd className="breakText">{formatCurrentAnalyzedUrl(selectedCampaign)}</dd>
              <dt>Tempo trascorso</dt>
              <dd>{formatElapsedTime(selectedCampaign)}</dd>
              <dt>Risultati richiesti</dt>
              <dd>{selectedCampaign.maxResults}</dd>
              <dt>Risultati grezzi</dt>
              <dd>{selectedCampaign.rawResultCount}</dd>
              <dt>Domini unici</dt>
              <dd>{selectedCampaign.uniqueResultCount}</dd>
              <dt>Siti trovati</dt>
              <dd>{selectedCampaign.discoveredCount}</dd>
              <dt>Siti analizzati</dt>
              <dd>{selectedCampaign.analyzedCount}</dd>
              <dt>Fonti qualificate</dt>
              <dd>{selectedCampaign.qualifiedCount}</dd>
              <dt>Fonti rifiutate</dt>
              <dd>{selectedCampaign.rejectedCount}</dd>
              <dt>Errori sito</dt>
              <dd>{selectedCampaign.failedCount}</dd>
              <dt>Motivo stop</dt>
              <dd>{selectedCampaign.agentStopReason ?? 'non disponibile'}</dd>
            </dl>
            <section className="terminalPanel">
              <h3>Terminale agente</h3>
              <div className="terminalLog">
                {agentLogs.data?.map((entry) => (
                  <div className={`terminalLine ${entry.level}`} key={entry.id}>
                    <span>{new Date(entry.createdAt).toLocaleTimeString('it-IT')}</span>
                    <strong>{entry.step}</strong>
                    <p>{entry.message}</p>
                  </div>
                ))}
                {agentLogs.data?.length === 0 ? <p>Nessun log agente disponibile.</p> : null}
              </div>
            </section>
            <section className="jsonSummary">
              <h3>Riepilogo JSON finale</h3>
              <pre>{formatJsonPreview(selectedCampaign.agentFinalOutput)}</pre>
            </section>
            <Link className="primaryButton" to={`/campaigns/${selectedCampaign.id}`}>
              Apri risultati
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
