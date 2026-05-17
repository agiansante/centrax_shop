# API backend

Base URL locale: `http://localhost:3000`.

Swagger locale: `http://localhost:3000/docs`.

Questa pagina descrive le API attualmente esposte dal backend NestJS. Quando aggiungiamo endpoint nuovi, questo file va aggiornato insieme al codice.

## Healthcheck disponibili ora

### `GET /health`

Controlla che il backend sia vivo e capace di rispondere a una richiesta HTTP.

Uso tipico:

- capire se NestJS e partito;
- controllare che il container backend sia raggiungibile;
- dare un endpoint semplice a Docker, reverse proxy o monitor.

Risposta esempio:

```json
{
  "status": "ok",
  "timestamp": "2026-05-12T22:37:51.462Z"
}
```

Questo endpoint non controlla ancora PostgreSQL, Redis, OpenAI o provider di ricerca. Deve restare leggero.

## Healthcheck da aggiungere

Questi endpoint sono stati decisi come regola di progetto, ma non sono ancora implementati nel codice.

- `GET /health/database`: verifichera la connessione PostgreSQL.
- `GET /health/redis`: verifichera la connessione Redis.
- `GET /health/ready`: verifichera backend, database e Redis insieme.

## Diagnostica sviluppo da aggiungere

Gli endpoint `/diagnostics/...` saranno disponibili solo in sviluppo, cioe con `NODE_ENV !== production`.

Non devono esporre segreti, token o password.

- `POST /diagnostics/auth/hash-password`: verifica solo hashing e compare password.
- `POST /diagnostics/analysis/rules`: esegue solo le regole locali su un testo.
- `POST /diagnostics/analysis/url-normalization`: testa normalizzazione URL e dominio.
- `GET /diagnostics/config`: mostra quali provider sono configurati, senza stampare segreti.

## Auth

### `POST /auth/register`

Crea un nuovo utente e restituisce un token JWT.

Payload:

```json
{
  "email": "admin@example.com",
  "password": "change-me-please"
}
```

Risposta:

```json
{
  "accessToken": "jwt...",
  "user": {
    "id": "user-id",
    "email": "admin@example.com",
    "role": "user"
  }
}
```

Note:

- la password deve avere almeno 8 caratteri;
- l'email viene salvata in minuscolo;
- se l'email esiste gia, deve restituire errore `409`.

### `POST /auth/login`

Autentica un utente gia registrato e restituisce un token JWT.

Payload:

```json
{
  "email": "admin@example.com",
  "password": "change-me-please"
}
```

Errori comuni:

- `401 Invalid credentials`: email non trovata o password errata.

### `GET /auth/me`

Restituisce i dati dell'utente autenticato.

Richiede header:

```http
Authorization: Bearer <token>
```

## Campagne

### `POST /campaigns/preview-plan`

Prepara il piano tecnico prima di creare la campagna.

Richiede token JWT.

Payload:

```json
{
  "userRequest": "Trova venditori di macchine luxury usate in Lombardia con contatti verificabili.",
  "depth": 2,
  "maxResults": 10,
  "currentPlan": null,
  "revisionRequest": null
}
```

Comportamento:

- usa il provider AI configurato per trasformare la richiesta libera in piano operativo;
- conosce i tool disponibili e i parametri accettati;
- restituisce query ottimizzate, segnali positivi/negativi, domini esclusi, formato output, strumenti e strategia;
- se l'AI non e configurata, restituisce un piano fallback esplicito con avviso.

Il frontend usa questa risposta per aprire il popup di conferma prima della creazione reale.

### `POST /campaigns`

Crea una nuova campagna di ricerca dopo approvazione del piano.

Richiede token JWT.

Payload:

```json
{
  "userRequest": "Trova venditori di macchine luxury usate in Lombardia con contatti verificabili.",
  "approvedResearchPlan": {
    "status": "ai_planned",
    "goal": "Trovare venditori di auto luxury usate in Lombardia",
    "optimizedQueries": ["venditori auto luxury usate Lombardia"],
    "outputSchema": {
      "name": "string",
      "url": "string",
      "phone": "string|null"
    },
    "tools": ["configured_search", "crawler_html", "rules_classifier"]
  },
  "language": "it",
  "depth": 2,
  "maxResults": 10
}
```

Campi:

- `userRequest`: richiesta naturale scritta dall'utente;
- `approvedResearchPlan`: piano generato da `/campaigns/preview-plan` e approvato dal popup;
- `language`: lingua opzionale, default `it`;
- `depth`: profondita crawl da 1 a 5.
- `maxResults`: numero massimo di risultati da richiedere al discovery, da 1 a 50.

Nota: i vecchi campi interni `query`, `searchPrompt` e `outputSchema` restano salvati sulla campagna per compatibilita con il worker, ma non sono piu compilati manualmente dall'utente.

### `GET /campaigns`

Lista le campagne dell'utente autenticato.

Richiede token JWT.

Ogni campagna include anche campi di avanzamento:

- `maxResults`: limite massimo richiesto;
- `progressStep`: fase corrente, per esempio `draft`, `queued`, `discovery`, `analysis`, `completed`, `failed`;
- `progressMessage`: messaggio leggibile su cosa sta facendo il sistema;
- `currentAnalyzedUrl`: URL attualmente in analisi, valorizzata durante crawling/analisi e svuotata a fine campagna;
- `discoveredCount`: siti trovati;
- `rawResultCount`: risultati grezzi restituiti dai tool ricerca;
- `uniqueResultCount`: domini unici dopo merge/deduplica;
- `analyzedCount`: siti analizzati;
- `qualifiedCount`: fonti qualificate per l'output finale;
- `rejectedCount`: fonti analizzate ma rifiutate;
- `failedCount`: siti falliti durante analisi;
- `agentPlanStatus`: stato del piano agente;
- `agentStopReason`: motivo leggibile per cui la ricerca si e fermata;
- `agentProviderSummary`: provider ricerca usato e stato configurazione senza segreti;
- `agentToolSummary`: tool pianificati e disponibili;
- `agentFinalOutput`: riepilogo JSON finale della ricerca agentica;
- `startedAt`: quando il worker ha iniziato;
- `completedAt`: quando la campagna e finita.

### `GET /campaigns/:id`

Restituisce una campagna specifica con i siti scoperti.

Richiede token JWT.

### `POST /campaigns/:id/run`

Mette in coda l'analisi della campagna.

Comportamento:

1. verifica che la campagna appartenga all'utente;
2. cambia stato in `QUEUED`;
3. inserisce un job BullMQ su Redis;
4. il worker backend esegue discovery, crawling, regole e AI.

Nota: il job gira nel backend. Se il browser o il frontend vengono chiusi, il processo continua finche backend, Redis e database restano attivi.

### `GET /campaigns/:id/results`

Restituisce i siti scoperti e i profili servizio analizzati.

Richiede token JWT.

### `GET /campaigns/:id/agent-logs`

Restituisce il terminale agente della campagna.

Richiede token JWT.

Ogni voce include:

- `level`: `info`, `warning` o `error`;
- `step`: fase agente, per esempio `planning`, `discovery`, `crawl`, `classification`;
- `message`: testo leggibile;
- `metadata`: dati tecnici opzionali senza segreti;
- `createdAt`: data evento.

## Configurazione ricerca

### `GET /research-configuration`

Restituisce provider ricerca, provider AI, tool registry e limiti predisposti senza esporre API key o segreti.

Richiede token JWT.

Serve alla pagina frontend **Configurazione** per mostrare se il sistema usa modalita demo/mock o provider reali.

## Servizi

### `GET /services/:id`

Restituisce il dettaglio completo di un profilo servizio.

Richiede token JWT.

Include:

- dati del profilo;
- sito sorgente;
- evidenze;
- run di analisi.

### `POST /services/:id/reanalyze`

Riesegue l'analisi di un servizio gia scoperto.

Richiede token JWT.

Uso:

- aggiornare un risultato dopo una modifica alle regole;
- rianalizzare un sito con una versione diversa del prompt AI;
- debug manuale durante sviluppo.
