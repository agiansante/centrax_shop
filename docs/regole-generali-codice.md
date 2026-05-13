# Regole generali di sviluppo

Questo documento definisce lo stile obbligatorio per backend, frontend, infrastruttura e documentazione del progetto.

## Obiettivo

Il codice deve essere leggibile anche da sviluppatori abituati a PHP classico o Laravel/Symfony. La priorita e chiarezza operativa: chi apre un file deve capire cosa fa, da dove viene chiamato e quali dati riceve/restituisce.

## Visione Centrax

Il progetto deve seguire la visione descritta in `docs/visione-centrax.md`.

Centrax e pensato come un sistema multi cervello:

- un componente ricerca, scopre e acquisisce informazioni;
- un componente elabora, immagazzina e gestisce conoscenza;
- un componente applica, attua o produce risultati operativi;
- un modulo centrale smista le richieste, media tra componenti e pesa le scelte.

Ogni nuova parte del sistema deve avere responsabilita chiara, input e output espliciti, diagnostica mirata e confini comprensibili. I componenti devono poter lavorare in modo indipendente, ma collaborare attraverso contratti chiari e informazioni tracciabili.

## Commenti obbligatori

- Ogni funzione pubblica, metodo di classe, service method, controller action, hook o helper deve avere un commento in italiano.
- Il commento deve spiegare:
  - cosa fa la funzione;
  - da quali file o moduli viene usata;
  - quali input principali riceve;
  - cosa restituisce o quale effetto produce.
- I commenti devono essere pratici, non decorativi.
- Evitare commenti inutili tipo “assegna valore alla variabile”.

Esempio consigliato:

```ts
/**
 * Crea una nuova campagna di ricerca per l'utente autenticato.
 *
 * Usata da:
 * - apps/backend/src/modules/campaigns/campaigns.controller.ts
 *
 * Riceve l'id utente e i dati della campagna dal frontend.
 * Restituisce il record SearchCampaign creato nel database.
 */
async createCampaignForUser(userId: string, data: CreateCampaignDto) {
  ...
}
```

## Stile TypeScript / Node.js

- Preferire funzioni nominate invece di funzioni inline anonime.
- Evitare callback complesse dentro `map`, `filter`, `reduce`, `then`, `catch` quando la logica supera una riga semplice.
- Se una funzione inline inizia ad avere condizioni, trasformarla in funzione privata con nome esplicativo.
- Preferire nomi descrittivi:
  - `createCampaignForUser` invece di `create`;
  - `runCampaignAnalysisJob` invece di `run`;
  - `extractShopifyEvidenceFromText` invece di `extract`.
- Evitare abbreviazioni non ovvie.
- Evitare “magia” JavaScript quando una struttura piu esplicita e piu leggibile.

## Struttura dei file

- I nomi dei file devono spiegare il contenuto.
- Evitare file generici quando il contenuto cresce:
  - evitare `dto.ts` se contiene molti DTO diversi;
  - preferire `create-campaign.dto.ts`, `login-request.dto.ts`, `register-request.dto.ts`;
  - evitare `utils.ts`;
  - preferire `url-normalization.utils.ts` o `shopify-evidence-rules.ts`.
- Ogni modulo deve avere responsabilita chiara:
  - controller: riceve HTTP e passa al service;
  - service: contiene logica applicativa;
  - repository o Prisma service: accesso dati;
  - worker: esecuzione asincrona;
  - DTO: validazione input/output.

## Backend

- Controller e service devono avere metodi con nomi parlanti.
- Ogni endpoint deve essere facile da collegare al relativo metodo service.
- Le regole di analisi devono essere separate dalla chiamata AI.
- La logica di scraping/crawling deve restare separata dalla logica di classificazione.
- Gli errori devono essere espliciti e in italiano quando arrivano all'utente finale.

## Healthcheck e diagnostica di sviluppo

Il progetto deve distinguere tra healthcheck di servizio e diagnostica tecnica.

### Healthcheck standard

- `GET /health` deve restare leggero e veloce.
- Deve verificare solo che il backend sia vivo e possa rispondere.
- Deve essere utilizzabile da Docker, reverse proxy e monitor di produzione.
- Non deve eseguire analisi pesanti, scraping, chiamate AI o test lunghi.

### Healthcheck approfonditi

Quando serve verificare dipendenze reali, creare endpoint separati:

- `GET /health/database`: verifica connessione PostgreSQL.
- `GET /health/redis`: verifica connessione Redis.
- `GET /health/ready`: verifica che backend, database e Redis siano pronti.

Questi endpoint devono essere veloci e non devono modificare dati.

### Diagnostica per sviluppo

Per aiutare debug e sviluppo a piccoli pezzi, e consentire a Codex di verificare una modifica senza dover attraversare tutta l'app, aggiungere endpoint diagnostici separati e protetti.

Esempi:

- `POST /diagnostics/auth/hash-password`: verifica hashing password.
- `POST /diagnostics/auth/login-flow`: verifica il flusso auth con input controllato.
- `POST /diagnostics/analysis/rules`: esegue solo le regole locali su un testo.
- `POST /diagnostics/analysis/url-normalization`: testa normalizzazione URL e deduplica domini.
- `GET /diagnostics/config`: mostra quali provider sono configurati, senza stampare segreti.

Regole obbligatorie per gli endpoint diagnostici:

- Devono essere disponibili solo con `NODE_ENV !== production`.
- In produzione devono rispondere `404` o non essere registrati.
- Non devono esporre password, token, chiavi API o segreti.
- Devono avere nomi esplicativi e documentazione nel file `docs/api.md`.
- Devono essere piccoli: ogni endpoint diagnostico testa una sola area del sistema.
- Devono essere usati per capire se una modifica ha rotto una funzione specifica.

### Regola pratica per nuove feature

Quando si aggiunge una nuova area critica, creare almeno uno di questi strumenti:

- unit test mirato;
- endpoint diagnostico solo sviluppo;
- healthcheck approfondito se coinvolge una dipendenza esterna.

La scelta consigliata e:

- unit test per logica pura;
- diagnostica sviluppo per integrazione manuale rapida;
- healthcheck approfondito per dipendenze infrastrutturali.

## Frontend

- Componenti React con nomi esplicativi.
- Evitare componenti troppo grandi: se una pagina supera una complessita leggibile, estrarre componenti nominati.
- Evitare handler inline complessi nei JSX.
- I testi visibili all'utente devono essere in italiano.
- Le funzioni di chiamata API devono avere nome coerente con l'azione utente.

## Infrastruttura

- File Terraform, Ansible e Docker devono contenere commenti solo dove aiutano a capire una scelta operativa.
- Le variabili devono avere descrizioni chiare.
- Ogni ambiente deve avere un file example aggiornato:
  - `.env.local.example`;
  - `.env.production.example`.

## Regola per nuove modifiche

Ogni nuova feature deve aggiornare:

- codice;
- test o scenario di verifica;
- documentazione se cambia comportamento, configurazione o flusso utente.
- diario giornaliero se la modifica e importante o se abbiamo imparato qualcosa di utile.

Quando si modifica codice esistente, applicare queste regole almeno alle funzioni toccate.

## Continuita del progetto

Queste regole devono permettere di riprendere il progetto anche in una nuova conversazione senza dover rispiegare tutto.

All'inizio di una nuova sessione di lavoro bisogna leggere, in questo ordine:

- `docs/regole-generali-codice.md`;
- `docs/visione-centrax.md`;
- `docs/ripresa-lavoro.md`;
- `docs/memory/index.md`;
- `docs/milestone.md`;
- `docs/api.md`;
- `docs/diario-giornaliero.md`;
- eventuali file specifici della parte da modificare.

Quando si fanno modifiche, aggiornare solo i documenti realmente impattati. Scrivere in modo sintetico, evitando duplicazioni.

Per memoria storica dettagliata non caricare tutto il diario o tutta la documentazione. Usare invece:

- `docs/memory/index.md` per cercare per tag;
- `docs/memory/blocks/` per aprire solo i blocchi necessari;
- `docs/visione-centrax.md` per mantenere allineata la direzione architetturale;
- `docs/ripresa-lavoro.md` come riassunto breve operativo.
- `docs/milestone.md` per capire cosa e in corso e cosa fare dopo.

Il template riutilizzabile per altri progetti e in:

- `docs/templates/chat-progetto-regole-base.md`.

## Memoria a blocchi

La memoria lunga del progetto deve essere divisa in blocchi piccoli e taggati.

Cartelle:

- `docs/memory/index.md`: indice breve con tag e file coinvolti;
- `docs/memory/blocks/`: archivio dei blocchi dettagliati.

Regole:

- non leggere tutti i blocchi a inizio chat;
- leggere solo indice e blocchi rilevanti;
- creare un blocco quando una decisione o un bug saranno utili in futuro;
- aggiornare sempre l'indice quando si crea un blocco;
- tenere ogni blocco breve e autonomo.

## Formato sintetico per aggiornamenti diario

Il diario deve essere leggibile da una persona, ma strutturato sempre nello stesso modo.

Formato consigliato:

```json
{
  "data": "YYYY-MM-DD",
  "area": "backend | frontend | infra | docs | debug | decisione",
  "titolo": "Titolo breve",
  "cosa_e_successo": "Descrizione semplice in 1-3 frasi.",
  "decisione": "Decisione presa, se presente.",
  "file_coinvolti": ["path/file1", "path/file2"],
  "prossimo_passo": "Azione successiva consigliata."
}
```

Nel file `docs/diario-giornaliero.md` si puo usare Markdown normale, ma ogni voce deve contenere almeno:

- data;
- area;
- cosa e successo;
- file o componenti coinvolti;
- prossimo passo, se esiste.

## Formato sintetico per ripresa lavoro

Il file `docs/ripresa-lavoro.md` deve restare breve e operativo.

Deve contenere sempre:

```json
{
  "stato": "Descrizione breve dello stato progetto.",
  "come_avviare": "Comando principale per partire.",
  "url_locali": ["frontend", "backend", "swagger"],
  "problemi_noti": ["problema 1", "problema 2"],
  "prossime_attivita": ["azione 1", "azione 2"],
  "regole_da_rispettare": ["regola 1", "regola 2"]
}
```

Non deve diventare un secondo README completo. Deve servire per orientarsi in fretta.

## Valutazione impatto token

Quando viene richiesta una modifica grande, prima o durante il lavoro bisogna stimare l'impatto sul contesto e sui token.

La stima deve essere sintetica e pratica, non matematica perfetta.

Usare questa classificazione:

```json
{
  "impatto_token": "basso | medio | alto",
  "motivo": "Perche la modifica richiede poco o molto contesto.",
  "rischio_contesto": "basso | medio | alto",
  "strategia": "Come ridurre token: leggere solo file mirati, aggiornare docs sintetiche, evitare output lunghi."
}
```

Linee guida:

- impatto basso: modifica piccola su 1-2 file, poca lettura necessaria;
- impatto medio: modifica su piu moduli collegati, richiede leggere documentazione e alcuni file;
- impatto alto: feature ampia, refactor grande, infrastruttura, schema dati, o modifiche backend/frontend insieme.

Per modifiche ad alto impatto:

- leggere prima `docs/ripresa-lavoro.md`;
- aggiornare il diario a fine lavoro;
- preferire modifiche a blocchi piccoli e verificabili;
- evitare di incollare grandi porzioni di codice nella risposta finale;
- segnalare se conviene spezzare il lavoro in piu passaggi.

## Milestone operative

Il file `docs/milestone.md` deve tenere traccia delle attivita grandi o ricorrenti.

Aggiornarlo quando:

- si pianifica una nuova feature importante;
- si inizia una milestone;
- una milestone viene completata, bloccata o annullata;
- cambia priorita o prossimo passo;
- cambia la stima di impatto token.

Ogni milestone deve contenere almeno:

- stato;
- priorita;
- date principali;
- impatto token;
- rischio contesto;
- blocchi memoria utili;
- aree coinvolte;
- prossimo passo.

La milestone non sostituisce il diario:

- il diario racconta cosa e successo;
- la milestone dice cosa stiamo facendo e cosa faremo.
