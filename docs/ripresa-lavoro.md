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
- Piano dettagliato ricerca agentica: `docs/piano-ricerca-agentica-centrax.md`.

Stato ricerca agentica:

- prima versione implementata e in test;
- campagna supporta `searchPrompt`, `outputSchema`, conteggi agente e output JSON finale;
- backend espone log agente con `GET /campaigns/:id/agent-logs`;
- frontend ha pagina `Configurazione` e popup terminale agente;
- build backend/frontend e test automatici passano in Docker;
- provider reale Tavily + OpenAI verificato;
- resta da migliorare molto il ragionamento di ricerca prima di chiudere `M-017`.

Punto esatto da cui riprendere domani:

- query test: `venditori macchine luxury usate Lombardia`;
- problema: discovery e crawling funzionano, ma ranking e pre-filtro lasciano passare risultati non pertinenti come Shopify;
- problema: alcuni campi output vengono riempiti con testo rumoroso invece di restare `null`/irrisolti;
- prossimo lavoro: creare o raffinare un `DiscoveryPreFilterService`, migliorare query planning, scoring fonte e regole di estrazione campi.

Regola stato milestone:

- quando una milestone sembra finita, passarla prima a `in_test`;
- chiuderla come `done` solo dopo test manuale/accettazione completato.

## Prompt consigliato per una nuova conversazione

```text
Sto lavorando al progetto Dropshipping Shopify Intelligence in C:\Prj codex\test1_scraping_db.
Prima di fare modifiche leggi docs/regole-generali-codice.md, docs/visione-centrax.md, docs/ripresa-lavoro.md, docs/memory/index.md e docs/milestone.md.
Apri solo i blocchi memoria rilevanti. Per il cervello ricerca agentico leggi anche docs/piano-ricerca-agentica-centrax.md e il blocco memoria 2026-05-13-agentic-research-plan. Continua dalle milestone in corso e mantieni aggiornata solo la documentazione impattata.
```
