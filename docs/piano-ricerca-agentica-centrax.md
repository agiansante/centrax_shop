# Piano ricerca agentica Centrax

Questo documento descrive il piano di lavoro per trasformare la ricerca attuale in un modulo agentico.

L'obiettivo e costruire un cervello ricerca generalista capace di ricevere una richiesta, scegliere tool configurati, cercare fonti, scansionare siti, qualificare risultati e restituire output JSON secondo lo schema richiesto dall'utente.

Il modulo non deve essere specializzato in dropshipping o Shopify. Questo progetto usa il dropshipping come primo caso pratico, ma l'agente deve poter catalogare qualunque dato richiesto: fornitori, indirizzi, prodotti, aziende, documenti, contatti, prezzi, annunci o altre entita definite da `searchPrompt` e `outputSchema`.

## Stato implementazione

Aggiornamento 2026-05-13:

- implementata prima versione MVP di contratti dati, log agente, tool registry, agente ricerca, merge, qualificazione, pagina configurazione e popup terminale;
- il planning e ancora deterministico, non ancora guidato da LLM;
- l'estrazione AI ora e generalista e usa `searchPrompt` + `outputSchema`, non regole fisse dropshipping;
- il JSON finale include anche `sourceType`, `qualificationReason` e campi arbitrari estratti secondo schema;
- Tavily e SerpAPI sono usabili tramite `DiscoveryService` quando configurati, mentre gli altri provider sono descritti come predisposti;
- la milestone `M-017` e in `in_test` finche non viene verificata una campagna con provider reale configurato.

Aggiornamento 2026-05-14:

- la UI creazione campagna mostra solo richiesta libera, `depth` e `maxResults`;
- il backend espone `POST /campaigns/preview-plan` per trasformare la richiesta libera in piano tecnico prima della creazione;
- il popup riepiloga obiettivo, segnali importanti, segnali negativi, domini esclusi, strategia, tool e formato output;
- l'utente puo chiedere una revisione testuale del piano oppure confermare con **Crea campagna**;
- il piano approvato viene salvato in `approvedResearchPlan` e alimenta query, output schema e pre-filtro discovery;
- aggiunto `DiscoveryPreFilterService` per scartare fonti prima del crawl usando segnali e domini del piano;
- Tavily e SerpAPI non aggiungono piu suffissi Shopify/dropshipping hardcoded.

## Regola generalista

Ogni risultato deve essere valutato in base all'obiettivo della campagna, non in base a categorie fisse del progetto.

Esempi validi:

- cercare servizi print on demand compatibili Shopify;
- trovare indirizzi di aziende che vendono macchine rosse;
- catalogare studi dentistici in una provincia;
- trovare documentazione tecnica di un software;
- raccogliere prezzi, contatti o prodotti da siti diversi.

Il tipo fonte deve aiutare la catalogazione:

- `direct_source`: sito diretto dell'entita cercata;
- `directory_marketplace`: marketplace, app store, directory;
- `article_reference`: articolo o guida informativa;
- `forum_social`: forum, social, community;
- `media_page`: video o contenuto media;
- `non_operational`: fonte non utile per agire/catalogare;
- `unknown`: non classificata.

Per default l'agente qualifica `direct_source` e, quando coerente, `directory_marketplace`. Forum/social/media sono fonti informative e non devono essere qualificate come entita operative salvo richiesta esplicita.

## Punto aperto: qualita ricerca e filtro

Aggiornamento 2026-05-14:

Il test generalista `venditori macchine luxury usate Lombardia` ha confermato che la pipeline funziona, ma il ragionamento di ricerca va migliorato:

- il planner deve generare query piu aderenti a entita, luogo, attributi e vincoli negativi;
- prima del crawl bisogna leggere titolo, snippet e URL e stimare pertinenza con punteggio esplicito;
- risultati non pertinenti, per esempio Shopify in una ricerca auto usate, devono essere scartati prima del crawl;
- l'estrazione deve lasciare campi mancanti a `null` e aggiungerli a `unresolvedFields`;
- non bisogna riempire `address`, `phone`, `city` o evidenze con testo di menu o catalogo generico.

Prossimo blocco tecnico consigliato:

- test manuale del popup piano con provider reale;
- `ResearchQueryPlannerService`/intent builder ancora piu strutturato se il piano AI non e stabile;
- scoring pre-crawl piu fine con termini richiesti, termini vietati, dominio, luogo, tipo fonte;
- test automatico sul caso `macchine luxury usate Lombardia`.

## Obiettivo funzionale

La creazione campagna dovra ricevere:

```json
{
  "query": "Richiesta sintetica ottimizzata per ricerca web",
  "searchPrompt": "Prompt dettagliato che spiega cosa cercare e quali criteri usare",
  "depth": 2,
  "maxResults": 10,
  "outputSchema": {
    "name": "string",
    "url": "string",
    "shopifyEvidence": "string",
    "pricingSummary": "string",
    "confidenceScore": "number"
  }
}
```

Il risultato finale dovra rispettare `outputSchema`, o segnalare in modo esplicito quali campi non sono stati risolti.

## Architettura proposta

Componenti backend:

- `ResearchAgentService`: agente principale che riceve input campagna, sceglie tool e coordina il lavoro.
- `ResearchToolRegistryService`: registro dei tool disponibili, con descrizione, input e output.
- `ResearchPlanningService`: usa il provider AI configurato per trasformare `query` e `searchPrompt` in piano operativo.
- `SearchToolConnector`: interfaccia comune per tool di ricerca esterni.
- `CrawlerToolConnector`: tool interno per leggere pagine e link.
- `ClassificationToolConnector`: tool interno per valutare se una fonte e qualificata.
- `ResultMergeAgentService`: unisce risultati da piu provider, deduplica domini e pesa le fonti.
- `OutputSchemaValidationService`: valida l'output finale rispetto allo schema richiesto.
- `AgentRunLogService`: registra eventi leggibili del lavoro agente per mostrarli nel terminale frontend.

Componenti frontend:

- sezione `Configurazione`;
- pagina o pannello provider ricerca;
- pagina o pannello provider AI;
- form campagna con `query`, `searchPrompt`, `depth`, `maxResults`, `outputSchema`;
- popup avanzamento con terminale live;
- riepilogo JSON finale nel popup.

## Tool registry

Ogni tool deve essere descritto in modo usabile da una LLM:

```json
{
  "name": "tavily_search",
  "description": "Cerca pagine web rilevanti tramite Tavily.",
  "inputSchema": {
    "query": "string",
    "maxResults": "number",
    "country": "string",
    "language": "string"
  },
  "outputSchema": {
    "results": [
      {
        "url": "string",
        "title": "string",
        "snippet": "string",
        "sourceProvider": "string"
      }
    ]
  }
}
```

La pipeline interna deve usare sempre contratti standard. Ogni provider avra un adapter dedicato per convertire richiesta e risposta.

## Provider ricerca previsti

Provider iniziali da predisporre come tool:

- Tavily;
- Brave Search API;
- SerpAPI;
- Google Custom Search JSON API;
- Exa;
- You.com Search API.

Regola: un tool non configurato non deve essere usato. Deve comparire come disponibile ma non connesso.

## Provider AI previsti

Provider AI da predisporre in configurazione:

- OpenAI;
- Google Gemini;
- Anthropic Claude;
- Mistral;
- OpenRouter come possibile router multi-modello.

Parametri comuni:

- provider;
- modello;
- API key;
- temperature;
- max output tokens;
- ruoli abilitati: planning, classificazione, merge, sintesi.

Ogni provider AI avra un adapter dedicato, ma il resto del backend usera una interfaccia interna comune.

## Configurazione utente e SaaS futuro

Per ora non applichiamo limiti commerciali, ma il modello deve essere predisposto:

- utente normale: 1 provider ricerca attivo;
- utente premium: fino a 4 provider ricerca attivi;
- provider AI principale selezionabile dall'utente;
- piu avanti: policy per piano, limiti, quote e costi.

Le API key non devono essere salvate in chiaro. Per MVP si puo partire con configurazione server/env o campo predisposto per cifratura.

## Popup terminale agente

Quando l'utente avvia una ricerca, il frontend deve aprire un popup con:

- terminale live con eventi agente;
- provider/tool usati;
- query ottimizzate generate;
- URL in scansione;
- conteggi: grezzi, unici, analizzati, qualificati, rifiutati, falliti;
- motivi di rifiuto o qualificazione;
- riepilogo JSON finale.

Esempi di log:

```text
[00:00] Agente ricerca avviato.
[00:01] Provider AI: OpenAI gpt-4o-mini.
[00:02] Tool disponibili: tavily_search, crawler_html, rules_classifier.
[00:03] Piano creato: 4 query ottimizzate.
[00:05] Tavily ricerca query 1/4.
[00:07] 8 risultati grezzi trovati, 6 domini unici.
[00:08] Crawling https://example.com.
[00:13] Fonte rifiutata: nessuna evidenza Shopify.
[00:15] Fonte qualificata: confidence 0.82.
[00:20] Output finale generato.
```

## Piano di lavoro

### Fase 1 - Contratti e dati

- Aggiungere `searchPrompt` e `outputSchema` alla campagna.
- Aggiungere campi di osservabilita agente: provider usati, tool usati, conteggi qualificati/rifiutati, stato piano.
- Creare modelli per configurazioni provider ricerca e AI, anche se inizialmente usano env/server config.
- Creare tabella o struttura per log run agente.

### Fase 2 - Tool registry

- Definire interfaccia `ResearchTool`.
- Implementare `ResearchToolRegistryService`.
- Registrare tool iniziali: mock dichiarato, crawler HTML, rules classifier.
- Predisporre tool descriptors per Tavily, Brave, SerpAPI, Google CSE, Exa, You.com.
- Ogni funzione pubblica deve avere commento italiano secondo regole progetto.

### Fase 3 - Provider AI configurabile

- Creare interfaccia `AiProviderConnector`.
- Spostare OpenAI dietro adapter.
- Predisporre adapter Gemini, Claude, Mistral/OpenRouter.
- Usare il provider AI scelto per planning, classificazione e merge.
- Se nessun provider AI e configurato, mostrare fallback esplicito.

### Fase 4 - Research agent MVP

- Implementare `ResearchAgentService`.
- Implementare `ResearchPlanningService`.
- Convertire `query + searchPrompt + outputSchema` in piano operativo.
- Chiamare i tool tramite registry.
- Continuare la ricerca finche non raggiunge `maxResults` qualificati o limiti di sicurezza.

### Fase 5 - Merge e qualificazione

- Implementare `ResultMergeAgentService`.
- Deduplicare per dominio normalizzato.
- Separare risultati grezzi, unici, analizzati, qualificati, rifiutati e falliti.
- Salvare motivi e punteggi.
- Validare output finale contro `outputSchema`.

### Fase 6 - Frontend configurazione

- Aggiungere navigazione `Configurazione`.
- Mostrare provider ricerca disponibili, connessi e non configurati.
- Mostrare provider AI disponibili e modello selezionato.
- Predisporre limiti normale/premium senza applicarli ancora.

### Fase 7 - Popup terminale

- Aprire popup all'avvio campagna.
- Mostrare log agente live o tramite polling.
- Mostrare riepilogo finale JSON.
- Permettere di aprire risultati dettagliati dalla stessa finestra.

### Fase 8 - Verifica

- Test unitari su registry, normalizzazione provider e output schema.
- Test backend con provider mock dichiarato.
- Test manuale su dashboard: popup, log, conteggi, risultato finale.
- Test con almeno un provider reale quando configurato.
- `M-017` passa a `in_test`, non a `done`.

## Priorita consigliata

1. Contratti dati e log agente.
2. Tool registry con mock esplicito.
3. Popup terminale collegato ai log.
4. Provider AI adapter.
5. Primo provider ricerca reale.
6. Merge e output schema.
7. Configurazione frontend completa.

Questa sequenza permette di vedere subito cosa fa l'agente, evitando di costruire automazione invisibile.
