import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Brain, Check, LoaderCircle, Play, X } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, AgentRunLog, Campaign, CampaignPlanPreview } from '../api';

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
  const [userRequest, setUserRequest] = useState('Trova venditori di macchine luxury usate in Lombardia con contatti verificabili.');
  const [formError, setFormError] = useState<string | null>(null);
  const [depth, setDepth] = useState(2);
  const [maxResults, setMaxResults] = useState(10);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [planPreview, setPlanPreview] = useState<CampaignPlanPreview | null>(null);
  const [revisionRequest, setRevisionRequest] = useState('');
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

  const previewPlan = useMutation({
    mutationFn: previewPlanFromPayload,
    onSuccess: (preview) => {
      setPlanPreview(preview);
      setRevisionRequest('');
    }
  });
  const createCampaign = useMutation({
    mutationFn: createCampaignFromApprovedPlan,
    onSuccess: () => {
      setPlanPreview(null);
      setRevisionRequest('');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    }
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
   * Richiede al backend il piano ricerca usando i valori correnti del form.
   *
   * Usata da:
   * - useMutation previewPlan dentro DashboardPage.
   */
  function previewPlanFromPayload(payload?: Parameters<typeof api.previewCampaignPlan>[0]) {
    return api.previewCampaignPlan(payload ?? {
      userRequest,
      depth,
      maxResults
    });
  }

  /**
   * Crea la campagna usando il piano approvato nel popup.
   *
   * Usata da:
   * - bottone Crea campagna nel popup piano.
   */
  function createCampaignFromApprovedPlan() {
    if (!planPreview) {
      throw new Error('Piano ricerca non disponibile.');
    }

    return api.createCampaign({
      userRequest,
      approvedResearchPlan: planPreview.plan,
      language: 'it',
      depth,
      maxResults
    });
  }

  /**
   * Intercetta il submit del form e prepara il piano da confermare.
   *
   * Usata da:
   * - form di creazione campagna.
   */
  function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!userRequest.trim()) {
      setFormError('Scrivi cosa vuoi cercare.');
      return;
    }
    previewPlan.mutate(undefined);
  }

  /**
   * Aggiorna la richiesta libera della campagna.
   *
   * Usata da:
   * - textarea richiesta nel form dashboard.
   */
  function updateUserRequestFromInput(event: ChangeEvent<HTMLTextAreaElement>) {
    setUserRequest(event.target.value);
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
   * Aggiorna la richiesta di revisione scritta nel popup piano.
   *
   * Usata da:
   * - textarea modifica piano.
   */
  function updateRevisionRequestFromInput(event: ChangeEvent<HTMLTextAreaElement>) {
    setRevisionRequest(event.target.value);
  }

  /**
   * Richiede al backend una revisione del piano corrente.
   *
   * Usata da:
   * - bottone Aggiorna piano nel popup.
   */
  function updateCurrentPlanFromRevision() {
    if (!planPreview || !revisionRequest.trim()) {
      return;
    }

    previewPlan.mutate({
      userRequest,
      currentPlan: planPreview.plan,
      revisionRequest,
      depth,
      maxResults
    });
  }

  /**
   * Chiude il popup di conferma piano senza creare campagna.
   *
   * Usata da:
   * - pulsante Annulla nel popup piano.
   */
  function closePlanPreviewPopup() {
    setPlanPreview(null);
    setRevisionRequest('');
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
   * Converte un valore sconosciuto dei metadata agente in testo leggibile.
   *
   * Usata da:
   * - formatPreFilterMetadata nello stesso componente.
   *
   * Riceve valori JSON liberi dal backend e restituisce una stringa compatta.
   */
  function formatAgentMetadataValue(value: unknown) {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'nessuno';
    }

    if (typeof value === 'number') {
      return value.toFixed(2);
    }

    if (typeof value === 'string' && value.trim()) {
      return value;
    }

    if (value === null || value === undefined) {
      return 'non disponibile';
    }

    return JSON.stringify(value);
  }

  /**
   * Prepara il dettaglio tecnico dei log pre_filter.
   *
   * Usata da:
   * - terminale agente dentro il popup avanzamento.
   *
   * Mostra motivo, segnali, score, titolo e snippet per capire gli scarti pre-crawl.
   */
  function formatPreFilterMetadata(entry: AgentRunLog) {
    if (entry.step !== 'pre_filter' || !entry.metadata) {
      return null;
    }

    const metadataRows = [
      ['reason', entry.metadata.reason],
      ['matchedSignals', entry.metadata.matchedSignals],
      ['negativeSignals', entry.metadata.negativeSignals],
      ['score', entry.metadata.score],
      ['title', entry.metadata.title],
      ['snippet', entry.metadata.snippet]
    ];

    return metadataRows
      .map(([label, value]) => `${label}: ${formatAgentMetadataValue(value)}`)
      .join('\n');
  }

  /**
   * Mostra liste brevi in forma leggibile nel popup piano.
   *
   * Usata da:
   * - popup conferma piano ricerca.
   */
  function formatListPreview(items: string[]) {
    if (items.length === 0) {
      return 'Non specificato';
    }

    return items.join(', ');
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
          <p>Descrivi cosa vuoi ottenere: l'agente prepara strategia, strumenti e formato output.</p>
        </div>
      </header>

      <form className="campaignForm" onSubmit={submit}>
        <div className="requestFormGrid">
          <label>
            Cosa vuoi cercare?
            <textarea value={userRequest} onChange={updateUserRequestFromInput} rows={5} />
          </label>
          <label className="compactField">
            Profondita
            <input type="number" min={1} max={5} value={depth} onChange={updateDepthFromInput} />
          </label>
          <label className="compactField">
            Max risultati
            <input type="number" min={1} max={50} value={maxResults} onChange={updateMaxResultsFromInput} />
          </label>
          <button className="primaryButton" disabled={previewPlan.isPending}>
            {previewPlan.isPending ? <LoaderCircle className="spinIcon" size={16} /> : <Brain size={16} />}
            {previewPlan.isPending ? 'Preparazione...' : 'Prepara ricerca'}
          </button>
        </div>
        {formError ? <p className="error">{formError}</p> : null}
        {previewPlan.isError ? <p className="error">{previewPlan.error.message}</p> : null}
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
          <span>Richiesta</span>
          <span>Stato</span>
          <span>URL in analisi</span>
          <span>Tempo</span>
          <span>Risultati</span>
          <span>Azioni</span>
        </div>
        {campaigns.data?.map((campaign) => (
          <div className="tableRow" key={campaign.id}>
            <button className="linkButton" onClick={() => openCampaignProgressPopup(campaign)}>
              {campaign.userRequest ?? campaign.query}
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
      {planPreview ? (
        <div className="modalBackdrop" role="dialog" aria-modal="true">
          <div className="modalPanel planPreviewPanel">
            <header className="modalHeader">
              <div>
                <h2>Conferma piano ricerca</h2>
                <p>{planPreview.summary.goal}</p>
              </div>
              <button className="iconButton" title="Annulla" onClick={closePlanPreviewPopup}>
                <X size={16} />
              </button>
            </header>
            <div className="planPreviewGrid">
              <section>
                <h3>Elementi individuati</h3>
                <dl className="definitionList">
                  <dt>Tipo entita</dt>
                  <dd>{planPreview.summary.entityType}</dd>
                  <dt>Segnali importanti</dt>
                  <dd>{formatListPreview(planPreview.summary.importantSignals)}</dd>
                  <dt>Segnali da evitare</dt>
                  <dd>{formatListPreview(planPreview.summary.negativeSignals)}</dd>
                  <dt>Domini esclusi</dt>
                  <dd>{formatListPreview(planPreview.summary.blockedDomains)}</dd>
                </dl>
              </section>
              <section>
                <h3>Strategia e strumenti</h3>
                <p>{planPreview.summary.strategy}</p>
                <dl className="definitionList">
                  <dt>Strumenti</dt>
                  <dd>{formatListPreview(planPreview.summary.tools)}</dd>
                  <dt>Modalita piano</dt>
                  <dd>{planPreview.summary.aiGenerated ? 'Generato da AI' : 'Fallback locale'}</dd>
                </dl>
              </section>
            </div>
            <section className="jsonSummary">
              <h3>Formato output previsto</h3>
              <pre>{formatJsonPreview(planPreview.summary.outputSchema)}</pre>
            </section>
            {planPreview.summary.warnings.length > 0 ? <p className="warningText">{formatListPreview(planPreview.summary.warnings)}</p> : null}
            <label>
              Modifica il piano
              <textarea
                value={revisionRequest}
                onChange={updateRevisionRequestFromInput}
                rows={4}
                placeholder="Esempio: escludi marketplace, cerca solo siti diretti con telefono visibile."
              />
            </label>
            <div className="modalActions">
              <button className="iconTextButton" type="button" disabled={previewPlan.isPending || !revisionRequest.trim()} onClick={updateCurrentPlanFromRevision}>
                <Brain size={16} />
                Aggiorna piano
              </button>
              <button className="primaryButton" type="button" disabled={createCampaign.isPending} onClick={() => createCampaign.mutate()}>
                <Check size={16} />
                Crea campagna
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {selectedCampaign ? (
        <div className="modalBackdrop" role="dialog" aria-modal="true">
          <div className="modalPanel">
            <header className="modalHeader">
              <div>
                <h2>{selectedCampaign.userRequest ?? selectedCampaign.query}</h2>
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
                    <p>
                      {entry.message}
                      {formatPreFilterMetadata(entry) ? <small>{formatPreFilterMetadata(entry)}</small> : null}
                    </p>
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
