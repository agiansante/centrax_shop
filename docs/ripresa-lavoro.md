# Ripresa lavoro

Questo file serve per riprendere il progetto in una nuova conversazione o per spiegare rapidamente lo stato a un'altra persona.

## Stato attuale

Il progetto e un monorepo full stack per cercare e analizzare servizi di dropshipping compatibili con Shopify.

Componenti creati:

- backend NestJS in `apps/backend`;
- frontend React/Vite in `apps/frontend`;
- database PostgreSQL via Docker;
- Redis/BullMQ per job asincroni;
- infrastruttura locale Docker Compose;
- infrastruttura produzione AWS con Terraform e Ansible;
- documentazione in `docs`.

## Come avviare localmente

Da `C:\Prj codex\test1_scraping_db`:

```bash
npm run dev
```

URL locali:

- frontend: `http://localhost:5173`;
- backend health: `http://localhost:3000/health`;
- swagger: `http://localhost:3000/docs`.

## Credenziali iniziali

Non esiste un utente predefinito.

Al primo accesso bisogna cliccare **Registrati** e creare un utente.

Esempio:

```text
Email: admin@example.com
Password: change-me-please
```

## Decisioni tecniche gia prese

- Backend: Node.js, TypeScript, NestJS.
- Frontend: React, Vite, TanStack Query.
- Database: PostgreSQL.
- Coda job: Redis + BullMQ.
- ORM: Prisma.
- AI: OpenAI tramite `OPENAI_API_KEY`, con fallback mock/euristico.
- Discovery: provider configurabile, default `mock`.
- Produzione: AWS EC2 + Docker Compose + Caddy.

## Regole importanti da rispettare

Leggere prima:

- `docs/regole-generali-codice.md`;
- `docs/visione-centrax.md`;
- `docs/api.md`;
- `docs/diario-giornaliero.md`.
- `docs/memory/index.md`.
- `docs/milestone.md`.

Regole chiave:

- seguire la visione Centrax: sistema multi cervello con modulo centrale che smista richieste, media e pesa le scelte;
- commenti in italiano sulle funzioni importanti;
- nomi file esplicativi;
- stile leggibile per sviluppatori che arrivano da PHP;
- evitare callback inline complesse;
- aggiornare documentazione e diario quando si cambia qualcosa di importante.

## Problemi incontrati e lezioni apprese

### Node locale troppo vecchio

Sul sistema era presente Node 16, ma il progetto richiede Node 20.

Soluzione:

- usare Docker per build e runtime;
- non affidarsi al Node installato nel sistema.

### Docker build sembrava bloccata

Durante `npm install` Docker non mostrava output.

Soluzione:

- aggiunto heartbeat nei Dockerfile ogni 10 secondi.

### Import `bcryptjs`

Il backend dava errore:

```text
Cannot read properties of undefined (reading 'hash')
```

Soluzione:

```ts
import { compare, hash } from 'bcryptjs';
```

## Prossime attivita consigliate

1. Verificare registrazione/login dopo riavvio backend.
2. Implementare healthcheck approfonditi:
   - `GET /health/database`;
   - `GET /health/redis`;
   - `GET /health/ready`.
3. Implementare diagnostica sviluppo:
   - hashing password;
   - regole analisi;
   - normalizzazione URL;
   - configurazione provider senza segreti.
4. Continuare refactor commenti italiani e nomi file esplicativi.
5. Aggiungere test backend e frontend per i flussi principali.
6. Usare `docs/memory/index.md` per recuperare dettagli storici senza leggere tutto il diario.
7. Completare notifiche email a fine campagna scegliendo provider SMTP o servizio email.
8. Se una campagna vecchia resta `RUNNING` dopo stop container, aggiungere azione admin/reset o gestione resume job.

## Milestone

Per capire cosa e in corso leggere `docs/milestone.md`.

Milestone piu importanti al momento:

- `M-002`: osservabilita campagne in test, da verificare manualmente in dashboard prima della chiusura;
- `M-003`: healthcheck approfonditi e diagnostica sviluppo;
- `M-004`: notifiche email fine campagna.
- `M-006`: catalogo globale siti/fornitori con stati, prodotti e vendibilita Shopify;
- `M-009`: deduplica servizi tra piu query;
- `M-010`: dashboard statistiche e filtri avanzati, inclusi parametri testuali liberi;
- `M-013`: scansione completa sito e manuale connettore Shopify/API.
- `M-015`: export documentazione PDF e presentazioni.
- `M-016`: pipeline CI/CD per deploy produzione, da riprendere solo quando si prepara produzione o staging.
- `M-017`: cervello ricerca configurabile e ricerca fino a max risultati qualificati.
- `M-018`: Centrax Search Test1, quality gate 70% sui risultati utili validati.
- Piano dettagliato ricerca agentica: `docs/piano-ricerca-agentica-centrax.md`.
- Piano fase test ricerca: `docs/fase-test-sperimentazione-centrax-search.md`.

Stato ricerca agentica:

- prima versione implementata e in test;
- la creazione campagna ora parte da una richiesta libera utente piu `depth` e `maxResults`;
- backend prepara un piano con `POST /campaigns/preview-plan`, poi il frontend mostra popup di conferma/modifica;
- campagna salva internamente `searchPrompt`, `outputSchema`, piano approvato, conteggi agente e output JSON finale;
- backend espone log agente con `GET /campaigns/:id/agent-logs`;
- frontend ha pagina `Configurazione` e popup terminale agente;
- build backend/frontend e test automatici passano in Docker;
- provider reale Tavily + OpenAI verificato;
- resta da verificare manualmente il nuovo popup piano con provider reale prima di chiudere `M-017`.

Punto esatto da cui riprendere domani:

- query test: `venditori macchine luxury usate Lombardia`;
- verificare che il popup piano individui correttamente entita, luogo, segnali positivi/negativi, domini esclusi e output;
- migrazione Prisma `20260514000000_research_plan_preview` gia applicata nello stack locale Docker Compose;
- debug aperto: il popup mostra `Provider AI non configurato o piano AI non disponibile: strategia generata con fallback locale`;
- risolto: il planner AI ora distingue errori, normalizza `warnings`, array/oggetti e tool provider;
- risolto: alias provider come Tavily/SerpAPI vengono mappati a `configured_search`;
- risolto: il popup piano mostra strumenti coerenti e la generazione ricerca funziona bene;
- risolto primo debug dropshipping/Shopify: il terminale agente mostra metadata dettagliati degli scarti `pre_filter`;
- risolto primo alleggerimento pre-filtro: Shopify/dropshipping non vengono piu penalizzati se sono segnali positivi richiesti dal piano;
- ritest dropshipping/Shopify dopo correzione: 25 risultati grezzi, 19 domini unici, 10 fonti qualificate, 4 rifiutate, 0 errori, stop per massimo risultati raggiunto;
- aggiunto spinner su `Prepara ricerca` e seconda protezione pre-filtro per segnali forti Shopify/dropshipping/integration;
- backend e frontend sono stati riavviati dopo il ritest utente che mostrava ancora log vecchi senza metadata;
- risolto bug `non-dropshipping`: i segnali negativi non usano piu fuzzy match e non scartano risultati dropshipping pertinenti;
- aggiunto runner automatico `scripts/run-centrax-search-test1.mjs`;
- ultimo ciclo automatico: 28 grezzi, 21 domini unici, 13 analizzati, 10 qualificati, useful rate euristico 80%, gate 70% superato;
- prossimo lavoro: valutare manualmente le 10 fonti qualificate e implementare validazione `utile/non utile`, note, export JSON test e quality gate 70%.
- fase test successiva: implementare validazione manuale utile/non utile nel popup finale e produrre JSON test per raggiungere soglia 70%.

Regola stato milestone:

- quando una milestone sembra finita, passarla prima a `in_test`;
- chiuderla come `done` solo dopo test manuale/accettazione completato.

## Prompt consigliato per una nuova conversazione

```text
Sto lavorando al progetto Dropshipping Shopify Intelligence in C:\Prj codex\test1_scraping_db.
Prima di fare modifiche leggi docs/regole-generali-codice.md, docs/visione-centrax.md, docs/ripresa-lavoro.md, docs/memory/index.md e docs/milestone.md.
Apri solo i blocchi memoria rilevanti. Per il cervello ricerca agentico leggi anche docs/piano-ricerca-agentica-centrax.md e i blocchi memoria 2026-05-13-agentic-research-plan e 2026-05-14-centrax-search-test1. Continua da M-018: la diagnostica `pre_filter` e la regola anti-conflitto Shopify/dropshipping sono state implementate e il ritest ha prodotto 10 fonti qualificate su 19 domini unici. Prossimo passo: validazione manuale utile/non utile, note, export JSON test e quality gate 70%.
```
