# Analisi modulo ricerca Centrax

## Diagnosi attuale

La ricerca locale restituisce sempre 3 risultati perche `SEARCH_PROVIDER=mock` e il provider mock contiene solo tre URL hardcoded:

- `dsers.com`;
- `spocket.co`;
- `printful.com`.

Il campo `maxResults` oggi limita il numero massimo di risultati restituiti dal provider, ma non forza il sistema a continuare a cercare finche non trova quel numero. Se il provider restituisce 3 risultati, la campagna finisce a `3/3` anche se l'utente ha chiesto 10.

Questa e la ragione per cui la dashboard vista nel browser mostra campagne completate con `3/3`: non e un bug del contatore, e il backend che riceve solo tre risultati dal provider mock.

## Flusso backend attuale

1. Il frontend crea una campagna con query, profondita e `maxResults`.
2. `CampaignsService.run` mette la campagna in coda BullMQ.
3. `CampaignWorker` passa la campagna a `AnalysisService.runCampaign`.
4. `DiscoveryService.search` sceglie il provider:
   - Tavily se `SEARCH_PROVIDER=tavily` e `TAVILY_API_KEY` esiste;
   - SerpAPI se `SEARCH_PROVIDER=serpapi` e `SERPAPI_API_KEY` esiste;
   - mock in tutti gli altri casi.
5. `AnalysisService` salva i siti scoperti e li passa al crawler.
6. `CrawlerService` scarica HTML con `fetch`, estrae testo/link con Cheerio e segue link interni selezionati.
7. `RulesService` cerca evidenze testuali con regex.
8. `AiService` usa OpenAI se configurato, altrimenti crea un profilo euristico.
9. Il risultato viene salvato in `service_profiles`, `evidence_items` e `analysis_runs`.

## Cosa non fa ancora

- Non continua a interrogare piu query o pagine finche non raggiunge `maxResults`.
- Non salva solo fonti qualificate: oggi salva e profila ogni risultato trovato dal provider.
- Non distingue ancora tra risultati trovati e risultati qualificati.
- Non espone chiaramente nella UI che si sta usando un provider mock.
- Non blocca o avvisa quando manca un provider reale.
- Non ha un profilo ricerca configurabile per obiettivi diversi.
- Non usa OCR/Tesseract.
- Non usa Playwright/Puppeteer, quindi non renderizza siti JavaScript pesanti.
- Non legge sitemap.
- Non ha uno stato `REJECTED` per siti analizzati ma non qualificati.
- Non separa ancora bene acquisizione, valutazione e memoria secondo la visione Centrax.

## Miglioria proposta

Introdurre un profilo ricerca JSON, come `docs/search-profile.example.json`, usato dal backend per:

- decidere cosa cercare;
- generare piu query;
- scegliere motore discovery;
- continuare la ricerca finche non trova abbastanza fonti qualificate;
- configurare profondita e metodo di scansione;
- mappare i campi da risolvere;
- distinguere siti qualificati, rifiutati e falliti;
- spiegare perche una fonte e stata salvata.

Questo trasformerebbe il modulo in un primo vero cervello ricerca Centrax: non una singola query rigida, ma una pipeline configurabile e tracciabile.

La direzione aggiornata e agentica: il backend non deve solo eseguire una pipeline fissa, ma avere un `ResearchAgentService` che riceve parametri, consulta un registro tool, decide quali tool usare e restituisce output conforme allo schema JSON richiesto. Il piano completo e in `docs/piano-ricerca-agentica-centrax.md`.

## Task da tenere su M-002

Questi task sono necessari per chiudere correttamente la milestone di osservabilita, perche riguardano cosa l'utente vede e capisce durante una campagna:

- esporre provider discovery usato dalla campagna;
- esporre modalita mock/demo quando presente;
- separare conteggi richiesti, trovati, analizzati, qualificati, rifiutati e falliti;
- mostrare un messaggio finale diverso se il provider esaurisce i risultati prima di `maxResults`;
- aggiungere diagnostica configurazione provider senza segreti;
- testare manualmente dashboard e popup con una campagna mock;
- testare con provider reale quando configurato.

## Task da spostare su M-017

Questi task sono piu grandi e riguardano il cervello ricerca vero e proprio:

- profili ricerca JSON;
- generazione e rotazione di query multiple;
- fetch di piu pagine risultati dal provider;
- ricerca fino a numero di risultati qualificati;
- classificazione `QUALIFIED`, `REJECTED`, `FAILED`;
- crawler configurabile per HTML, sitemap, browser rendering e OCR;
- scoring e spiegazione della decisione di salvataggio.
