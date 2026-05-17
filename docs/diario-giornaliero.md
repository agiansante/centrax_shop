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

### Dettaglio healthcheck e diagnostica sviluppo

Area: documentazione, backend, debug.

Abbiamo chiarito che la specializzazione dell'healthcheck non e ancora implementata nel codice: oggi esiste solo `GET /health`.

Decisione: dettagliare nella milestone `M-003` tutti gli endpoint da creare, distinguendo healthcheck di servizio e diagnostica sviluppo. Gli endpoint diagnostici servono a testare pezzi piccoli mentre si scrive codice, senza dover attraversare ogni volta frontend, login, campagna e job completo.

File coinvolti:

- `docs/milestone.md`;
- `docs/diario-giornaliero.md`.

Prossimo passo: implementare prima l'MVP di `M-003`: database, Redis, ready, config, normalizzazione URL e regole analisi.

### Visione Centrax

Area: documentazione, architettura, decisione.

Abbiamo iniziato a scrivere la visione di base Centrax: un sistema multi cervello in cui un componente ricerca e acquisisce, uno elabora e gestisce conoscenza, uno applica o attua, e un modulo centrale smista le richieste, media tra componenti e pesa le scelte.

Decisione: creare `docs/visione-centrax.md` e collegarlo alle regole generali, cosi la direzione guida questo progetto e gli altri progetti futuri dello stesso ecosistema.

File coinvolti:

- `docs/visione-centrax.md`;
- `docs/regole-generali-codice.md`;
- `docs/ripresa-lavoro.md`;
- `docs/memory/index.md`;
- `docs/memory/blocks/2026-05-13-visione-centrax.md`;
- `docs/diario-giornaliero.md`.

Prossimo passo: espandere nel tempo il formato dei messaggi, il criterio con cui Centrax pesa le scelte e i confini tra modulo centrale e cervelli specialistici.

### Pipeline CI/CD produzione

Area: infrastruttura, deploy, pianificazione.

Abbiamo deciso di ricordare che l'infrastruttura dovra prevedere pipeline CI/CD per build, test e deploy controllato.

Decisione: aggiungere una milestone dedicata, ma non lavorarci adesso. In locale non e necessaria; andra ripresa quando prepareremo un ambiente di produzione o staging stabile.

File coinvolti:

- `docs/milestone.md`;
- `docs/ripresa-lavoro.md`;
- `docs/diario-giornaliero.md`.

Prossimo passo: quando si avvicina il deploy produzione, progettare pipeline con build backend/frontend, test, gestione segreti, immagini Docker e deploy tramite infrastruttura esistente.

### URL corrente e tempo campagna

Area: backend, frontend, database.

Abbiamo deciso di mostrare nella barra principale delle campagne quale URL e in analisi e da quanto tempo e partita l'elaborazione.

Modifiche:

- aggiunto `currentAnalyzedUrl` alla campagna;
- aggiornato il worker di analisi per salvare la URL corrente;
- aggiornata la dashboard per mostrare URL corrente, tempo trascorso, stati in italiano e conteggio errori sito;
- reso il popup di avanzamento collegato ai dati aggiornati dal polling.
- migliorata la gestione degli errori per singolo sito, marcando il sito come `FAILED` e mantenendo un messaggio di avanzamento utile.

File coinvolti:

- `apps/backend/prisma/schema.prisma`;
- `apps/backend/prisma/migrations/20260513010000_campaign_current_url/migration.sql`;
- `apps/backend/src/modules/analysis/analysis.service.ts`;
- `apps/backend/src/modules/workers/campaign.worker.ts`;
- `apps/backend/src/modules/campaigns/campaigns.service.ts`;
- `apps/frontend/src/ui/DashboardPage.tsx`;
- `apps/frontend/src/api.ts`;
- `apps/frontend/src/vite-env.d.ts`;
- `apps/frontend/src/styles.css`;
- `docs/api.md`;
- `docs/milestone.md`.

Verifica:

- build backend Docker completata con `prisma:generate` e `nest build`;
- build frontend Docker completata con `tsc -b` e `vite build`;
- test backend passati: 2 file, 4 test;
- test frontend passati: 1 file, 1 test;
- stack locale avviato con Docker Compose;
- migrazione `20260513010000_campaign_current_url` applicata;
- campagna reale mock completata via API con 2 siti scoperti, 2 analizzati, 0 errori.

Correzione stato milestone:

- `M-002` non va considerata completata appena finita l'implementazione;
- deve restare in `in_test` finche non viene fatto test manuale/accettazione sulla dashboard;
- solo dopo la verifica manuale puo passare a `done`.

Prossimo passo: testare manualmente `M-002` nel browser aperto prima di chiuderla.

### Limite ricerca mock e profilo configurabile

Area: backend, ricerca, decisione.

Durante il test manuale di `M-002` abbiamo capito che il sistema non sta cercando fino a `maxResults`: in locale usa `SEARCH_PROVIDER=mock`, che contiene solo tre risultati hardcoded. Quindi una campagna con max risultati 10 termina comunque a 3/3.

Decisione:

- mantenere `M-002` in test;
- aprire `M-017` per trasformare la ricerca in un cervello configurabile;
- creare `docs/analisi-ricerca-centrax.md` e `docs/search-profile.example.json` come base per il profilo ricerca.

File coinvolti:

- `apps/backend/src/modules/analysis/discovery.service.ts`;
- `apps/backend/src/modules/analysis/crawler.service.ts`;
- `apps/backend/src/modules/analysis/rules.service.ts`;
- `apps/backend/src/modules/analysis/ai.service.ts`;
- `docs/analisi-ricerca-centrax.md`;
- `docs/search-profile.example.json`;
- `docs/milestone.md`;
- `docs/ripresa-lavoro.md`.

Prossimo passo: implementare `M-017` con profili ricerca JSON, ricerca multi-query e salvataggio dei soli risultati qualificati.

### Regola sui dati mock

Area: regole, backend, decisione.

Abbiamo chiarito che i dati mock non devono essere usati come comportamento operativo nascosto. Se una feature promette ricerca reale, deve usare un provider reale configurato oppure mostrare chiaramente che sta lavorando in modalita demo/mock.

Decisione:

- aggiunta regola in `docs/regole-generali-codice.md`;
- `M-002` resta in test finche dashboard/API non rendono visibile provider, modalita mock e mancato raggiungimento di `maxResults`;
- la ricerca configurabile completa resta tracciata in `M-017`, ma i segnali di trasparenza devono rientrare in `M-002`.

File coinvolti:

- `docs/regole-generali-codice.md`;
- `docs/milestone.md`;
- `docs/analisi-ricerca-centrax.md`;
- `docs/diario-giornaliero.md`.

Prossimo passo: implementare in `M-002` i segnali di trasparenza su provider, modalita mock e conteggi reali.

### Piano ricerca agentica

Area: backend, frontend, architettura, decisione.

Abbiamo deciso che il cervello ricerca deve diventare agentico: un agente riceve query, prompt, profondita, max risultati e schema JSON desiderato, poi decide quali tool usare tra provider ricerca, crawler, classificatori e merge.

Decisione:

- creare `docs/piano-ricerca-agentica-centrax.md`;
- trattare provider di ricerca e AI come tool/connettori registrati con descrizione, input e output;
- aggiungere in futuro una sezione configurazione frontend per connettere provider ricerca e provider AI;
- aprire popup terminale all'avvio ricerca per mostrare log agente e riepilogo JSON finale;
- tenere tutto agganciato a `M-017`, lasciando `M-002` per trasparenza e osservabilita.

File coinvolti:

- `docs/piano-ricerca-agentica-centrax.md`;
- `docs/memory/index.md`;
- `docs/memory/blocks/2026-05-13-agentic-research-plan.md`;
- `docs/milestone.md`;
- `docs/ripresa-lavoro.md`;
- `docs/analisi-ricerca-centrax.md`;
- `docs/diario-giornaliero.md`.

Prossimo passo: quando si implementa `M-017`, partire da contratti dati, tool registry, log agente e popup terminale.

### Prima implementazione ricerca agentica

Area: backend, frontend, database, ricerca, agent.

Abbiamo implementato la prima versione del cervello ricerca Centrax partendo da `docs/piano-ricerca-agentica-centrax.md`.

Modifiche principali:

- aggiunti `searchPrompt` e `outputSchema` alla campagna;
- aggiunti conteggi agente: risultati grezzi, domini unici, fonti qualificate, fonti rifiutate e motivo stop;
- creata tabella `AgentRunLog` per il terminale agente;
- creati `ResearchAgentService`, `ResearchPlanningService`, `ResearchToolRegistryService`, `ResultMergeAgentService` e `OutputSchemaValidationService`;
- aggiunta interfaccia provider AI comune e mantenuto OpenAI/fallback dietro `AiService`;
- aggiunto endpoint `GET /campaigns/:id/agent-logs`;
- aggiunto endpoint `GET /research-configuration`;
- aggiunta pagina frontend `Configurazione`;
- esteso form campagna con prompt ricerca e schema output JSON;
- trasformato il popup campagna in terminale agente con riepilogo JSON finale.

Verifica:

- build backend Docker completata con Prisma generate e Nest build;
- build frontend Docker completata con TypeScript e Vite;
- test backend passati: 2 file, 4 test;
- test frontend passati: 1 file, 1 test;
- stack locale Docker avviato;
- migrazione `20260513020000_agentic_research` applicata;
- `GET /health` risponde correttamente;
- frontend raggiungibile su `http://localhost:5173`;
- verifica browser: dashboard, pagina Configurazione e popup terminale agente visibili.

Decisione:

- `M-017` passa a `in_test`, non ancora `done`;
- il planning AI multi-provider resta evoluzione successiva: per ora il planner e deterministico e i provider reali Tavily/SerpAPI passano dal discovery esistente;
- prima di chiudere la milestone serve test manuale con provider reale configurato.

File coinvolti:

- `apps/backend/prisma/schema.prisma`;
- `apps/backend/prisma/migrations/20260513020000_agentic_research/migration.sql`;
- `apps/backend/src/modules/analysis/*`;
- `apps/backend/src/modules/campaigns/*`;
- `apps/backend/src/modules/research-configuration/*`;
- `apps/frontend/src/api.ts`;
- `apps/frontend/src/ui/DashboardPage.tsx`;
- `apps/frontend/src/ui/ConfigurationPage.tsx`;
- `apps/frontend/src/ui/AppShell.tsx`;
- `apps/frontend/src/styles.css`;
- `docs/api.md`;
- `docs/milestone.md`;
- `docs/ripresa-lavoro.md`.

Prossimo passo: configurare un provider reale, lanciare una campagna e verificare nel popup terminale agentico query, tool, qualificate/rifiutate e motivo stop.

### Fallback OpenAI su quota esaurita

Area: backend, ricerca, debug.

Durante il primo test reale con Tavily, la discovery ha funzionato: 14 risultati grezzi e 11 domini unici. Tutte le analisi sito sono pero fallite per errore OpenAI `429 You exceeded your current quota`.

Decisione:

- Tavily e provider ricerca reale erano corretti;
- il problema era la quota/billing OpenAI;
- `AiService` ora intercetta errori OpenAI e usa il fallback euristico locale invece di far fallire ogni sito.

File coinvolti:

- `apps/backend/src/modules/analysis/ai.service.ts`.

Verifica:

- build backend Docker completata;
- test backend passati: 2 file, 4 test;
- backend locale ricreato e `/health` ok.

Prossimo passo: rilanciare una campagna reale. Se OpenAI resta senza quota, i risultati verranno analizzati con fallback euristico; per usare AI reale bisogna sistemare quota/billing OpenAI o cambiare chiave.

### Test reale ricerca agentica riuscito

Area: backend, frontend, ricerca, validazione.

Dopo aver caricato credito OpenAI, abbiamo rilanciato una campagna reale con Tavily e OpenAI.

Esito:

- query: `print on demand suppliers Shopify integration Europe`;
- discovery Tavily: 14 risultati grezzi;
- merge: 11 domini unici;
- classificazione OpenAI: 5 fonti qualificate;
- motivo stop: raggiunto il numero massimo di fonti qualificate richieste;
- popup terminale e JSON finale funzionano.

Osservazioni qualita:

- Printful, Printify, Merchize e Shopify App Store sono risultati coerenti;
- Reddit e utile come fonte informativa, ma non dovrebbe essere qualificato come fornitore diretto quando la campagna cerca supplier;
- alcuni snippet sono troppo rumorosi perche includono testo di menu/catalogo.

Decisione:

- `M-017` resta in test ma il flusso reale e validato;
- prossimo refinement: scoring piu severo su tipo fonte, esclusione domini/forum se non richiesti, pulizia del testo prima dell'output JSON.

File coinvolti:

- `docs/milestone.md`;
- `docs/diario-giornaliero.md`.

Prossimo passo: implementare filtri e scoring per distinguere servizio diretto, marketplace/app store, articolo informativo, forum/social e risultato non operativo.

### Regola agente ricerca generalista

Area: architettura, backend, decisione.

Abbiamo chiarito una regola fondamentale: il cervello ricerca non deve essere costruito su misura per dropshipping o Shopify. Il progetto dropshipping resta il primo caso pratico, ma l'agente deve essere un sistema generalista di ricerca, crawling web e catalogazione dati.

Decisione:

- l'obiettivo operativo arriva da `query` e `searchPrompt`;
- la forma dell'output arriva da `outputSchema`;
- il core agente non deve qualificare una fonte solo per `shopifyEvidence`;
- l'AI deve estrarre campi arbitrari e classificare il tipo fonte;
- forum/social/media sono fonti informative, non entita operative, salvo richiesta esplicita.

Modifiche:

- aggiunta estrazione catalogo generalista in `AiService`;
- il JSON finale usa campi arbitrari estratti secondo schema;
- aggiunti `sourceType`, `qualificationReason`, `confidenceScore` e `unresolvedFields`;
- `ResearchAgentService` qualifica in base a tipo fonte, confidenza e campi risolti.

Esempi futuri supportati:

- servizi print on demand compatibili Shopify;
- indirizzi di chi vende macchine rosse;
- catalogo fornitori locali;
- contatti aziendali;
- documenti tecnici o listini prezzi.

File coinvolti:

- `apps/backend/src/modules/analysis/ai.service.ts`;
- `apps/backend/src/modules/analysis/research-agent.service.ts`;
- `docs/piano-ricerca-agentica-centrax.md`;
- `docs/visione-centrax.md`;
- `docs/milestone.md`;
- `docs/diario-giornaliero.md`.

Prossimo passo: verificare sia una query dropshipping sia una query non dropshipping per confermare che outputSchema guidi davvero la catalogazione.

### Correzione bias query e pre-filtro discovery

Area: backend, frontend, ricerca, debug.

Durante un test non dropshipping con query `venditori macchine rosse usate Lombardia` sono emersi risultati Shopify/dropshipping. La causa era duplice:

- il planner deterministico aggiungeva ancora query `Shopify integration` e `dropshipping suppliers pricing`;
- lo schema default frontend/backend conteneva ancora campi `shopifyEvidence` e `pricingSummary`;
- l'agente apriva i siti prima di valutare title/snippet della discovery.

Decisione:

- rimosse query hardcoded Shopify/dropshipping dal planning;
- schema default reso generalista: `name`, `url`, `summary`, `sourceType`, `confidenceScore`;
- aggiunta pre-valutazione prima del crawl su titolo, snippet e URL;
- log `pre_filter` per spiegare perche una fonte viene scartata prima di aprirla.

File coinvolti:

- `apps/backend/src/modules/analysis/research-planning.service.ts`;
- `apps/backend/src/modules/analysis/research-agent.service.ts`;
- `apps/backend/src/modules/campaigns/campaigns.service.ts`;
- `apps/frontend/src/ui/DashboardPage.tsx`;
- `docs/diario-giornaliero.md`.

Prossimo passo: rilanciare il test non dropshipping e verificare che i risultati Shopify vengano scartati prima del crawling.

## 2026-05-14

### Punto di ripresa: affinare ricerca e ragionamento filtro

Area: backend, ricerca, agent, decisione.

Abbiamo testato una query non dropshipping:

```text
venditori macchine luxury usate Lombardia
```

Il flusso generale e migliorato rispetto al test precedente, ma il risultato mostra che il processo di ricerca e ragionamento va raffinato molto:

- il planner produce query piu generaliste, ma ancora troppo poco controllate rispetto all'obiettivo reale;
- il pre-filtro scarta alcune fonti inutili, ma lascia passare ancora risultati Shopify non coerenti;
- Tavily puo restituire risultati semanticamente vicini a parole come `luxury`, ma lontani dal dominio auto;
- la classificazione AI puo qualificare marketplace o directory generiche anche quando non contengono evidenza specifica richiesta;
- il fallback/estrazione puo riempire campi come `address`, `phone`, `city` con testo rumoroso quando il dato non e davvero presente;
- `unresolvedFields` non e ancora abbastanza affidabile per distinguere campo mancante da campo riempito male.

Risultati osservati:

- fonti utili/parzialmente utili: `subito.it`, `autoscout24.it`, `autoproff.it`;
- fonti da scartare meglio: `apps.shopify.com`, `community.shopify.com`, `shopify.com`, `facebook.com`, `youtube.com`;
- caso importante: `apps.shopify.com/luxury-distribution` e stato qualificato per errore perche conteneva `luxury`, ma non era rilevante per auto usate in Lombardia.

Decisione:

- domani si riparte da qui;
- priorita alta: migliorare il processo di ricerca, pre-valutazione e scoring;
- l'agente deve ragionare prima di aprire un sito leggendo titolo, snippet, URL e tipo fonte;
- l'output deve lasciare `null` o campo irrisolto quando un dato non e presente, non riempirlo con testo di menu;
- il planner deve generare query coerenti con dominio, luogo, entita e attributi richiesti, senza portarsi dietro bias storici.

Prossime attivita operative:

- creare `DiscoveryPreFilterService` separato;
- aggiungere scoring pre-crawl con segnali positivi/negativi;
- generare query con AI o regole piu strutturate da `searchPrompt` e `outputSchema`;
- aggiungere lista termini vietati/indesiderati derivata dal prompt, per esempio `non Shopify`;
- distinguere meglio `directory_marketplace` utile da marketplace non pertinente;
- rendere l'estrazione campi piu severa: se non trova telefono/indirizzo/citta, deve lasciare `null` e inserirli in `unresolvedFields`;
- aggiungere log piu espliciti: motivo pre-filtro, termini trovati, termini mancanti, tipo fonte stimato;
- creare test automatici sul caso `macchine luxury usate Lombardia`.

File coinvolti:

- `apps/backend/src/modules/analysis/research-planning.service.ts`;
- `apps/backend/src/modules/analysis/research-agent.service.ts`;
- `apps/backend/src/modules/analysis/ai.service.ts`;
- `apps/frontend/src/ui/DashboardPage.tsx`;
- `docs/milestone.md`;
- `docs/ripresa-lavoro.md`;
- `docs/piano-ricerca-agentica-centrax.md`;
- `docs/diario-giornaliero.md`.

Prossimo passo: domani riprendere da `M-017` con focus su ranking/pre-filtro e qualita estrazione generalista.

### Flusso richiesta libera e preview piano campagna

Area: backend, frontend, ricerca, agent, database, docs.

Il form creazione campagna e stato semplificato: l'utente vede solo una textarea per descrivere cosa vuole cercare, piu `depth` e `maxResults`. Il backend prepara un piano con `POST /campaigns/preview-plan`; il frontend mostra un popup con obiettivo, segnali, domini esclusi, strategia, tool e formato output. Dal popup l'utente puo chiedere una revisione testuale oppure confermare la creazione.

Decisione:

- `query`, `searchPrompt` e `outputSchema` restano campi interni per compatibilita worker;
- il nuovo piano approvato viene salvato in `approvedResearchPlan`;
- il pre-filtro usa segnali e domini esclusi generati dal piano;
- se l'AI non e configurata, il sistema genera fallback esplicito e non finge ottimizzazione AI.

File coinvolti:

- `apps/backend/prisma/schema.prisma`;
- `apps/backend/src/modules/campaigns/*`;
- `apps/backend/src/modules/analysis/research-intent-builder.service.ts`;
- `apps/backend/src/modules/analysis/discovery-pre-filter.service.ts`;
- `apps/backend/src/modules/analysis/ai.service.ts`;
- `apps/backend/src/modules/analysis/research-agent.service.ts`;
- `apps/frontend/src/api.ts`;
- `apps/frontend/src/ui/DashboardPage.tsx`;
- `docs/api.md`;
- `docs/milestone.md`;
- `docs/ripresa-lavoro.md`;
- `docs/piano-ricerca-agentica-centrax.md`.

Verifica:

- build backend Docker passata;
- build frontend Docker passata;
- stack locale Docker Compose avviato, migrazione Prisma applicata e `GET /health` ok;
- verifica browser del form e popup piano riuscita con fallback locale;
- build locale non usabile per Node 16, come gia noto nel progetto.

Prossimo passo: applicare la migrazione Prisma in ambiente locale e testare manualmente una campagna con richiesta `venditori macchine luxury usate Lombardia`.

### Piano Centrax Search Test1 quality gate 70%

Area: test, ricerca, agent, decisione, docs.

Definita la fase ufficiale di test e sperimentazione del cervello ricerca. Il blocco di sviluppo passa verso produzione solo se almeno il 70% dei risultati valutati manualmente e utile. La valutazione deve essere fatta sul risultato prodotto dall'agente, con validazione utente `utile` / `non utile`, note opzionali, log, piano approvato e JSON finale.

Decisione:

- creato documento principale `docs/fase-test-sperimentazione-centrax-search.md`;
- creato blocco memoria `2026-05-14-centrax-search-test1`;
- aggiunta milestone `M-018`;
- la prossima modifica tecnica sara trasformare il popup finale campagna in strumento di valutazione ed export JSON test.

File coinvolti:

- `docs/fase-test-sperimentazione-centrax-search.md`;
- `docs/memory/blocks/2026-05-14-centrax-search-test1.md`;
- `docs/memory/index.md`;
- `docs/milestone.md`;
- `docs/ripresa-lavoro.md`;
- `docs/diario-giornaliero.md`.

Prossimo passo: implementare UI e formato JSON per validazione risultati nel popup finale campagna.

### Debug planner AI in fallback locale

Area: debug, backend, AI, ricerca.

Durante la verifica del popup piano compare il messaggio:

```text
Provider AI non configurato o piano AI non disponibile: strategia generata con fallback locale.
```

Controlli fatti:

- `.env.local` contiene `OPENAI_API_KEY` configurata;
- `.env.local` contiene `OPENAI_MODEL=gpt-4o-mini`;
- il container backend legge `OPENAI_MODEL=gpt-4o-mini`;
- backend, frontend e database sono avviati con Docker Compose;
- la migrazione `20260514000000_research_plan_preview` e stata applicata.

Ipotesi piu probabile:

- `AiService.createResearchExecutionPlan` chiama OpenAI, ma la richiesta fallisce o la risposta non passa lo schema Zod;
- oggi il metodo cattura l'errore e ritorna `null`, quindi il frontend vede lo stesso messaggio del caso AI non configurata.

Prossimo passo:

- aggiungere diagnostica non sensibile nel planner AI;
- distinguere chiaramente tra `AI non configurata`, `errore provider AI`, `JSON non valido` e `schema piano non valido`;
- mostrare nel popup un avviso piu preciso senza esporre segreti.

Aggiornamento debug:

- aggiunta diagnostica nel planner AI;
- build backend Docker passata;
- riavviato backend Docker Compose;
- il popup ora mostra l'errore reale:

```text
AI configurata ma piano non conforme allo schema richiesto. Modello: gpt-4o-mini.
Dettaglio: optimizedQueries.0: Expected string, received object; optimizedQueries.1: Expected string, received object; tools.0: Expected string, received object
```

Causa individuata:

- OpenAI risponde, quindi la configurazione AI funziona;
- il piano generato contiene oggetti in `optimizedQueries` e `tools`, mentre lo schema backend accetta solo array di stringhe.

Prossimo passo:

- rendere il prompt piu vincolante sugli array di stringhe;
- oppure normalizzare in backend oggetti tipo `{ "query": "..." }` e `{ "name": "..." }` in stringhe prima della validazione Zod.

Aggiornamento correzione:

- reso flessibile lo schema del piano AI in `AiService`;
- `warnings` puo arrivare come stringa e viene normalizzato in array;
- array come `optimizedQueries`, `tools`, `requiredSignals`, `negativeSignals`, `blockedDomains` e `allowedSourceTypes` accettano anche oggetti semplici e ne estraggono `query`, `name`, `value`, `text`, `warning` o `message`;
- build backend Docker passata;
- backend Docker Compose riavviato.

Aggiornamento normalizzazione piano:

- migliorato il prompt planner per chiarire che `tools` deve contenere solo nomi tool e `outputSchema` deve descrivere l'output finale, non la risposta del provider ricerca;
- filtrati i tool ammessi a `configured_search`, `crawler_html`, `rules_classifier`;
- se l'AI restituisce lo schema tecnico del provider ricerca come output finale, il backend usa lo schema finale fallback;
- verifica browser riuscita: popup `Generato da AI`, nessun errore schema, strumenti normalizzati e output finale coerente.

Aggiornamento strumenti provider:

- chiarito che `tavily_search` e gli altri provider non sono tool eseguibili diretti nel piano campagna;
- `configured_search` e il tool interno che usa il provider configurato, per esempio Tavily o SerpAPI;
- normalizzazione tool aggiornata: alias provider come `tavily_search`, `serpapi_search`, `brave_search`, `google_cse_search`, `exa_search`, `you_search` vengono mappati a `configured_search`;
- il piano garantisce sempre catena minima `configured_search`, `crawler_html`, `rules_classifier`;
- prompt planner aggiornato per non promettere provider non selezionati e per spiegare che i provider stanno dietro `configured_search`;
- build backend Docker passata e backend Docker Compose riavviato.

Esito:

- ritestata la generazione piano ricerca;
- la parte che interpreta la richiesta utente e aggiorna schema output/strategia ora funziona bene;
- il problema su `warnings`, tool provider e strumenti incoerenti e considerato risolto;
- si puo proseguire con la fase successiva: validazione risultati utile/non utile e quality gate 70%.

### Test dropshipping Shopify: pre-filtro troppo aggressivo

Area: test, ricerca, agent, pre-filtro, frontend.

Eseguito un test con richiesta orientata a servizi dropshipping con forte integrazione Shopify. La discovery ha funzionato, ma il pre-filtro ha scartato tutte le fonti prima del crawl.

Risultato osservato:

```json
{
  "rawResultCount": 24,
  "uniqueResultCount": 16,
  "qualifiedResults": 0,
  "requestedResults": 10,
  "stopReason": "Ricerca terminata per esaurimento fonti disponibili: 0 qualificate su 16 domini unici."
}
```

Domini scartati prima del crawl:

- `ifgecommerce.com`;
- `shopify.com`;
- `scaleorder.com`;
- `apps.shopify.com`;
- `hoplix.com`;
- `dsidesign.it`;
- `minea.com`;
- `help.shopify.com`;
- `reddit.com`;
- `inventorysource.com`;
- `prodigi.com`;
- `zendrop.com`;
- `youtube.com`;
- `firebearstudio.com`;
- `trendsi.com`;
- `facebook.com`.

Decisione:

- il pre-filtro deve mostrare nel terminale agente la motivazione dettagliata dello scarto;
- il pre-filtro va reso meno aggressivo quando Shopify/dropshipping sono segnali positivi della richiesta;
- fonti come `apps.shopify.com` o `shopify.com` possono essere informative/marketplace utili in una ricerca Shopify, anche se non sempre sono fonte operativa finale;
- prima di rifare il test bisogna rendere leggibili `reason`, `matchedSignals`, `negativeSignals` e punteggio pre-crawl nel popup terminale.

Prossimo passo:

- aggiornare `DashboardPage` per mostrare metadata dei log `pre_filter`;
- rivedere `DiscoveryPreFilterService` usando il piano approvato per non trattare Shopify come segnale negativo quando e richiesto.

Aggiornamento correzione:

- il terminale agente ora mostra nei log `pre_filter`: `reason`, `matchedSignals`, `negativeSignals`, `score`, `title` e `snippet`;
- il backend salva questi campi nei metadata del log quando una fonte viene scartata prima del crawl;
- `DiscoveryPreFilterService` ignora i segnali negativi che coincidono con segnali positivi richiesti dal piano, inclusi casi come `drop shipping` richiesto e `dropshipping` negativo;
- `ResearchIntentBuilderService` pulisce gli stessi conflitti gia in fase di piano, anche nel fallback locale;
- aggiunto test unitario per evitare regressioni su Shopify/dropshipping richiesti come segnali positivi.

Ritest scenario dropshipping/Shopify:

```json
{
  "prima_diagnostica": {
    "rawResultCount": 22,
    "uniqueResultCount": 15,
    "qualifiedCount": 8,
    "rejectedCount": 7,
    "preFilterScarti": 3
  },
  "dopo_regola_anti_conflitto": {
    "rawResultCount": 25,
    "uniqueResultCount": 19,
    "qualifiedCount": 10,
    "rejectedCount": 4,
    "preFilterScarti": 0,
    "stopReason": "Raggiunto il numero massimo di fonti qualificate richieste."
  }
}
```

Verifica:

- `docker compose -f infra/local/docker-compose.yml run --rm backend npm run test` passato;
- `docker compose -f infra/local/docker-compose.yml run --rm backend npm run build` passato;
- `docker compose -f infra/local/docker-compose.yml run --rm frontend npm run build` passato;
- build locale non usabile per Node 16, come gia noto.

Prossimo passo: valutare manualmente le 10 fonti qualificate e implementare la UI `utile/non utile` con calcolo quality gate 70%.

### Ritest utente ancora tutto scartato e spinner preparazione

Area: frontend, backend, pre-filtro, test.

L'utente ha rilanciato lo scenario dropshipping/Shopify e ha visto ancora 0 fonti qualificate su 18 domini unici. Dal terminale incollato mancavano ancora i dettagli `reason`, `matchedSignals`, `negativeSignals`, `score`, `title` e `snippet`, quindi la prova stava usando codice backend/frontend precedente o una pagina non ricaricata.

Decisione:

- riavviati `backend` e `frontend` con Docker Compose;
- aggiunto spinner sul pulsante `Prepara ricerca` durante `previewPlan.isPending`;
- reso il pre-filtro ancora piu tollerante: se trova un segnale forte richiesto come `shopify`, `dropshipping`, `drop`, `shipping`, `integration` o `integrazione` e non trova segnali negativi reali, consente il crawl anche se il piano richiede molti altri campi;
- aggiunto test unitario per il caso in cui il piano contenga molti campi output come segnali richiesti ma la fonte abbia un forte segnale Shopify.

Verifica:

- `docker compose -f infra/local/docker-compose.yml run --rm backend npm run test` passato;
- `docker compose -f infra/local/docker-compose.yml run --rm backend npm run build` passato;
- `docker compose -f infra/local/docker-compose.yml run --rm frontend npm run build` passato;
- `docker compose -f infra/local/docker-compose.yml restart backend frontend` eseguito.

Prossimo passo: refresh completo browser e nuova campagna; i log di una campagna gia eseguita con codice vecchio non possono recuperare metadata non salvati.

### Correzione pre-filtro su segnali negativi fuzzy

Area: backend, test, ricerca.

Dopo il ritest utente i log dettagliati hanno mostrato il problema reale: risultati chiaramente pertinenti come AutoDS, Prodigi, Zendrop e Inventory Source venivano scartati anche con molti segnali positivi trovati. La causa era `non-dropshipping` nei segnali negativi del piano: il matcher fuzzy lo interpretava come match di `dropshipping` e penalizzava tutte le fonti pertinenti.

Decisione:

- i segnali positivi possono usare alias e varianti (`drop shipping`, `dropshipping`, `shiping`, `integration`, `integrazione`);
- i segnali negativi invece devono usare match esplicito, senza espansione semantica;
- aggiunto runner `scripts/run-centrax-search-test1.mjs` per creare campagna, eseguirla, recuperare piano/log/output/risultati e calcolare una stima del gate 70%.

Esito ciclo automatico:

```json
{
  "campaignId": "cmp60bu2r0001nw3upburfxq3",
  "rawResultCount": 28,
  "uniqueResultCount": 21,
  "analyzedCount": 13,
  "qualifiedCount": 10,
  "rejectedCount": 3,
  "failedCount": 0,
  "usefulCount": 8,
  "evaluatedCount": 10,
  "usefulRate": 0.8,
  "passed70": true,
  "stopReason": "Raggiunto il numero massimo di fonti qualificate richieste."
}
```

Verifica:

- test backend Docker passati: 8 test;
- build backend Docker passata;
- runner automatico eseguito con provider reale Tavily/OpenAI.

Prossimo passo: migliorare il gate umano nel frontend, perche il runner usa una stima euristica e non sostituisce ancora la validazione manuale.
