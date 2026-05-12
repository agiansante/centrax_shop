# Diario giornaliero

Questo diario va aggiornato ogni volta che facciamo una modifica importante, troviamo un problema interessante o prendiamo una decisione tecnica.

Scrivere in modo semplice, come se lo leggessimo tra qualche giorno per ricordarci cosa e successo.

## 2026-05-12

### Creazione progetto

Abbiamo creato la prima versione del progetto **Dropshipping Shopify Intelligence**.

L'obiettivo e costruire un'applicazione che cerca servizi di dropshipping compatibili con Shopify, li analizza e li mostra in una dashboard.

Sono stati creati:

- backend NestJS;
- frontend React;
- database PostgreSQL;
- Redis per code asincrone;
- Docker Compose locale;
- infrastruttura AWS con Terraform;
- provisioning con Ansible;
- documentazione iniziale.

### Prima build Docker

La prima build sembrava bloccata durante `npm install`.

Abbiamo capito che Docker non mostrava output durante il comando, quindi abbiamo aggiunto un heartbeat nei Dockerfile che stampa un messaggio ogni 10 secondi.

### Regole di leggibilita

Abbiamo deciso che il codice deve essere leggibile anche da chi viene da PHP.

Regole importanti:

- commenti in italiano;
- funzioni con nomi chiari;
- evitare callback inline complesse;
- nomi file esplicativi;
- documentare da dove viene usata ogni funzione importante.

### Errori risolti

Durante la compilazione backend sono comparsi errori `TS1005` nei test. La causa era una chiusura sbagliata dei `describe`.

Poi la registrazione utente ha mostrato un errore su `bcryptjs`:

```text
Cannot read properties of undefined (reading 'hash')
```

Abbiamo corretto usando import esplicito:

```ts
import { compare, hash } from 'bcryptjs';
```

## 2026-05-13

### Documentazione operativa

Abbiamo iniziato a rendere la documentazione piu completa.

Sono stati aggiunti o ampliati:

- `docs/api.md`;
- `docs/ripresa-lavoro.md`;
- `docs/diario-giornaliero.md`.

Lo scopo e poter riprendere il lavoro facilmente in un'altra conversazione o da un altro sviluppatore.

### Idea diagnostica sviluppo

Abbiamo deciso di aggiungere endpoint diagnostici solo per sviluppo.

L'idea e poter testare piccoli pezzi del backend senza passare sempre dal flusso completo dell'app.

Esempi:

- test hashing password;
- test normalizzazione URL;
- test regole analisi testo;
- test configurazione provider.

### Prossimo punto

Il prossimo passo e verificare registrazione/login dopo riavvio del backend e poi implementare gli endpoint di healthcheck approfondito e diagnostica sviluppo.

### Memoria progetto a blocchi

Area: documentazione, memoria, token.

Abbiamo deciso di creare una memoria lunga del progetto divisa in blocchi piccoli, taggati e indicizzati.

File coinvolti:

- `docs/memory/README.md`;
- `docs/memory/index.md`;
- `docs/memory/blocks/`;
- `docs/templates/chat-progetto-regole-base.md`;
- `docs/regole-generali-codice.md`.

Prossimo passo: usare l'indice memoria a inizio sessione e aprire solo i blocchi rilevanti.

### Milestone operative

Area: pianificazione, documentazione.

Abbiamo creato `docs/milestone.md` per tracciare cosa stiamo facendo e cosa faremo.

Ogni milestone contiene stato, priorita, date, impatto token stimato, blocchi memoria utili, aree coinvolte e prossimo passo.

Prossimo passo: aggiornare le milestone ogni volta che una feature importante viene iniziata o conclusa.

### Metodo milestone riutilizzabile

Area: regole, pianificazione, riuso.

Abbiamo aggiunto il metodo milestone anche al template base `docs/templates/chat-progetto-regole-base.md`.

Questo rende il metodo copiabile in altri progetti senza doverlo reinventare.

File coinvolti:

- `docs/templates/chat-progetto-regole-base.md`;
- `docs/regole-generali-codice.md`;
- `docs/memory/index.md`;
- `docs/memory/blocks/2026-05-13-milestone-method.md`;
- `docs/ripresa-lavoro.md`.

Prossimo passo: quando nasce un nuovo progetto, copiare il template e creare subito `docs/milestone.md`.

### Roadmap prodotto futura

Area: pianificazione, prodotto, collaborazione.

Abbiamo fatto una sessione molto produttiva e siamo stati d'accordo nel trasformare molte idee in milestone future invece di implementarle tutte subito.

Le idee principali emerse:

- catalogo globale con tutti i siti/fornitori individuati, stato ricerca approfondita, stato integrazione e accesso ai prodotti vendibili su Shopify;
- dashboard piu accessibili, ordinate e completamente in italiano;
- schede riepilogo servizio piu utili per decidere se approfondire;
- deduplica dei servizi trovati tra query diverse;
- dashboard statistiche;
- filtri avanzati per tipologia prodotto e ricerca specifica, con parametri testuali avanzati liberi per casi come personalizzazione/stampa, API personalizzazione immagine e integrazione Shopify;
- ricerca agentica su web, social, trend e mercati predittivi per suggerire nuove query;
- analisi manuale di un sito dropshipping senza partire da una query;
- scansione completa di un sito con download prodotti e generazione manuale operativo per connettore Shopify/API;
- possibilita futura di creare un nuovo progetto Codex per sviluppare il connettore.

Nota sulle nostre interazioni:

- siamo stati allineati sull'idea di costruire memoria e pianificazione incrementale;
- abbiamo preferito documentare e spezzare il lavoro in milestone invece di fare feature troppo grandi tutte insieme;
- la direzione condivisa e rendere il progetto sempre piu leggibile, riprendibile e guidato da documentazione sintetica.

File coinvolti:

- `docs/milestone.md`;
- `docs/ripresa-lavoro.md`;
- `docs/diario-giornaliero.md`;
- `docs/memory/index.md`;
- `docs/memory/blocks/2026-05-13-product-roadmap.md`.

Prossimo passo: in una nuova chat ripartire da `M-002` se serve verificare l'avanzamento campagne, oppure scegliere una nuova milestone tra `M-006`, `M-009`, `M-010` e `M-013`.

### Export documentazione futura

Area: documentazione, milestone.

Abbiamo aggiunto una milestone per produrre in futuro documentazione esportabile in PDF, DOCX o presentazioni.

La decisione e mantenere per ora la sorgente in Markdown perche e piu facile da versionare, ma prevedere script di export quando la documentazione sara piu stabile.

File coinvolti:

- `docs/milestone.md`;
- `docs/ripresa-lavoro.md`;
- `docs/diario-giornaliero.md`.

### Avanzamento campagne in UI

Area: backend, frontend, database.

Abbiamo deciso di rendere piu chiaro cosa sta facendo una campagna mentre gira.

Modifiche:

- aggiunto limite `maxResults` alla campagna;
- aggiunti campi progressivi nel database: fase, messaggio, siti trovati, analizzati e falliti;
- aggiunto riepilogo numerico nella dashboard frontend;
- aggiunto popup sulla query per vedere stato e messaggio operativo;
- confermato che il backend continua a lavorare anche se si chiude il frontend, perche il job gira lato backend/Redis.

File coinvolti:

- `apps/backend/prisma/schema.prisma`;
- `apps/backend/src/modules/analysis/analysis.service.ts`;
- `apps/backend/src/modules/workers/campaign.worker.ts`;
- `apps/frontend/src/ui/DashboardPage.tsx`;
- `apps/frontend/src/api.ts`.

Prossimo passo: implementare notifiche email con provider SMTP o servizio email dedicato.
