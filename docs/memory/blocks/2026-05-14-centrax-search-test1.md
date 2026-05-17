# 2026-05-14 - Centrax Search Test1

```json
{
  "id": "2026-05-14-centrax-search-test1",
  "data": "2026-05-14",
  "tipo": "test-plan",
  "tag": ["centrax", "search", "test", "agentic", "quality-gate", "provider", "validation"],
  "titolo": "Centrax Search Test1 - Cervello di ricerca",
  "sintesi": "Definita la fase di test del cervello ricerca: il blocco supera la fase solo se almeno il 70% dei risultati valutati manualmente e utile.",
  "file_coinvolti": [
    "docs/fase-test-sperimentazione-centrax-search.md",
    "docs/milestone.md",
    "docs/diario-giornaliero.md",
    "apps/frontend/src/ui/DashboardPage.tsx",
    "apps/backend/src/modules/analysis",
    "apps/backend/src/modules/campaigns"
  ],
  "stato": "pianificato"
}
```

## Obiettivo

Verificare se il cervello ricerca Centrax produce risultati realmente utili, non solo tecnicamente validi.

Il test passa solo se:

```text
risultati_utili_validati / risultati_valutati >= 70%
```

## Periodo esecuzione

```json
{
  "inizio": "2026-05-14",
  "fine": null,
  "stato": "in_esecuzione",
  "risultato_finale": "primo test fallito: 0 fonti qualificate su 16 domini unici",
  "percentuale_utile_finale": 0
}
```

## Scenari test iniziali

Gli scenari devono essere lanciati dalla UI con richiesta libera, `depth` e `maxResults`.

### Scenario 1 - Auto luxury usate Lombardia

```json
{
  "id": "S1",
  "userRequest": "Trova venditori di macchine luxury usate in Lombardia con contatti verificabili.",
  "depth": 2,
  "maxResults": 10,
  "obiettivo": "Trovare concessionari, rivenditori o marketplace realmente pertinenti al mercato auto usate luxury in Lombardia.",
  "criteri_utilita": [
    "fonte coerente con auto usate o luxury/prestige",
    "rilevanza geografica Lombardia o province lombarde",
    "contatti o pagina aziendale verificabile",
    "no Shopify, app store, social/media generici o forum non richiesti"
  ]
}
```

### Scenario 2 - Print on demand Shopify Europa

```json
{
  "id": "S2",
  "userRequest": "Trova fornitori print on demand in Europa che si integrano con Shopify e hanno documentazione tecnica.",
  "depth": 2,
  "maxResults": 10,
  "obiettivo": "Trovare servizi operativi print on demand con integrazione Shopify reale.",
  "criteri_utilita": [
    "servizio diretto o marketplace operativo",
    "evidenza integrazione Shopify",
    "documentazione, pricing o catalogo prodotti",
    "no forum/social salvo fonte richiesta esplicitamente"
  ]
}
```

### Scenario 3 - Fornitori locali prodotti personalizzati

```json
{
  "id": "S3",
  "userRequest": "Trova aziende italiane che producono gadget personalizzati per ecommerce con contatti commerciali.",
  "depth": 2,
  "maxResults": 10,
  "obiettivo": "Trovare aziende contattabili e coerenti con produzione o fornitura B2B.",
  "criteri_utilita": [
    "azienda o catalogo B2B reale",
    "contatti commerciali verificabili",
    "servizi di personalizzazione espliciti",
    "no articoli generici senza fonte operativa"
  ]
}
```

### Scenario 4 - Documentazione tecnica API

```json
{
  "id": "S4",
  "userRequest": "Trova documentazione API per servizi di generazione immagini utilizzabili da un'app ecommerce.",
  "depth": 1,
  "maxResults": 8,
  "obiettivo": "Trovare fonti tecniche ufficiali o documentazione utile all'integrazione.",
  "criteri_utilita": [
    "documentazione ufficiale o tecnica",
    "API disponibili",
    "informazioni di autenticazione o pricing",
    "no pagine marketing senza documentazione"
  ]
}
```

### Scenario 5 - Caso difficile e rumoroso

```json
{
  "id": "S5",
  "userRequest": "Trova aziende che vendono ricambi rari per moto vintage in Emilia-Romagna con telefono.",
  "depth": 2,
  "maxResults": 10,
  "obiettivo": "Misurare robustezza del planner su richiesta locale, specifica e con campo contatto.",
  "criteri_utilita": [
    "azienda o negozio reale",
    "ricambi moto vintage o compatibili",
    "rilevanza Emilia-Romagna",
    "telefono presente oppure campo telefono null e marcato irrisolto"
  ]
}
```

## Formato risultato test da produrre

Ogni esecuzione deve salvare o copiare un JSON con:

```json
{
  "testName": "Centrax Search Test1 - Cervello di ricerca",
  "scenarioId": "S1",
  "startedAt": "YYYY-MM-DDTHH:mm:ss",
  "completedAt": "YYYY-MM-DDTHH:mm:ss",
  "campaignId": "campaign-id",
  "userRequest": "Richiesta utente",
  "depth": 2,
  "maxResults": 10,
  "approvedResearchPlan": {},
  "agentFinalOutput": {},
  "agentLogs": [],
  "userValidation": [],
  "usefulCount": 0,
  "evaluatedCount": 0,
  "usefulRate": 0,
  "passed": false,
  "analysis": "Analisi sintetica del perche il test passa o fallisce.",
  "tasks": []
}
```

## Task tecnici iniziali

1. Aggiungere al popup finale campagna una vista valutazione risultati.
2. Mostrare risultati in tabella leggibile, dettaglio e JSON.
3. Permettere marcatura manuale `utile` / `non utile` per ogni risultato.
4. Permettere nota manuale opzionale per ogni risultato.
5. Calcolare `usefulRate` e stato superamento soglia 70%.
6. Produrre JSON test copiabile con piano, output, log e validazione utente.
7. Studiare parametri avanzati Tavily e SerpAPI per ridurre rumore.
8. Documentare provider aggiuntivi e contratto per connettori futuri.
9. Usare i risultati falliti per generare task su planner, pre-filtro, ranking, crawler ed estrazione.
10. Prima dei test, correggere/debuggare il planner AI che oggi cade in fallback locale pur avendo variabili OpenAI configurate.

## Checklist completa da implementare

### UI e valutazione manuale

- Popup finale con risultati in tabella.
- Dettaglio risultato con dati estratti, URL, tipo fonte, confidenza, motivazione e campi irrisolti.
- Vista JSON finale agente.
- Vista log agente.
- Vista piano approvato.
- Marcatura per ogni risultato: `utile` o `non utile`.
- Nota opzionale per ogni risultato.
- Calcolo automatico soglia 70%.
- Esito visibile: test superato o non superato.

### Output test per iterazione Codex

- JSON copiabile/esportabile.
- Inclusione richiesta utente, parametri, piano, output, log e validazione.
- Inclusione analisi sintetica e task correttivi.
- Formato stabile da poter incollare in chat per chiedere modifiche e nuovo test.

### Scenari test

- Codex deve produrre ogni volta la lista scenari da eseguire.
- Ogni scenario deve includere richiesta utente, `depth`, `maxResults`, obiettivo, criteri utilita e note attese.
- Le esecuzioni devono essere registrate con data inizio, data fine, risultato e percentuale utile.

### Algoritmo agentico

- Migliorare planning.
- Fatto: distinguere errori AI configurazione/provider/schema invece di fallback silenzioso.
- Fatto: normalizzare output planner AI, `warnings`, alias provider e strumenti interni.
- Fatto: generazione piano ricerca considerata risolta dopo ritest utente.
- Migliorare conoscenza dei tool.
- Migliorare scelta dei parametri per tool.
- Migliorare pre-filtro.
- Migliorare ranking.
- Migliorare estrazione e campi null.
- Migliorare decisione fonte utile/non utile.

### Connettori

- Studiare ottimizzazioni Tavily.
- Studiare ottimizzazioni SerpAPI.
- Studiare provider alternativi gia previsti.
- Documentare come collegare nuovi servizi dati.
- Preparare contratto adapter per nuove fonti.
- Fare in modo che il planner conosca parametri, limiti e output di ogni tool.

## Come usare questo blocco

Quando si esegue un test:

- aggiornare `inizio`, `fine`, `stato`, `risultato_finale` e `percentuale_utile_finale`;
- aggiungere sotto una sezione `Esecuzione YYYY-MM-DD` con scenario, output, validazione e task;
- se il blocco diventa troppo lungo, creare un nuovo blocco per l'esecuzione e linkarlo dall'indice memoria.

## Esecuzione 2026-05-14 - Dropshipping Shopify

Richiesta:

```text
Trova siti web che offrono servizi di drop shipping con integrazione forte con Shopify.
```

Revisione richiesta nel popup:

```text
aggiungi anche valutazione recensione e score
```

Esito agente:

```json
{
  "rawResultCount": 24,
  "uniqueResultCount": 16,
  "qualifiedResults": 0,
  "requestedResults": 10,
  "stopReason": "Ricerca terminata per esaurimento fonti disponibili: 0 qualificate su 16 domini unici."
}
```

Problema principale:

- il pre-filtro ha scartato tutte le fonti prima del crawl;
- il terminale agente non mostra la motivazione dettagliata dello scarto, quindi la valutazione umana non puo capire se il rifiuto e corretto;
- il filtro sembra troppo severo per una richiesta in cui Shopify e dropshipping sono segnali positivi.

Task immediati:

1. Fatto: mostrare nel terminale UI i metadata dei log `pre_filter`: `reason`, `matchedSignals`, `negativeSignals`, `score`, `title`, `snippet`.
2. Fatto: rivedere `DiscoveryPreFilterService` per non bloccare Shopify/dropshipping quando sono segnali richiesti dal piano.
3. Distinguere fonte operativa finale da fonte informativa/marketplace utile.
4. Rieseguire lo scenario dopo la modifica e calcolare il primo useful rate.

## Correzione 2026-05-14 - Diagnostica e pre-filtro meno aggressivo

Modifiche:

- aggiunti metadata completi nei log `pre_filter`;
- il popup terminale agente mostra motivo, segnali positivi trovati, segnali negativi, score, titolo e snippet;
- il pre-filtro rimuove dai negativi i segnali gia richiesti come positivi;
- il planner normalizza gli stessi conflitti anche nel fallback;
- aggiunto test unitario su Shopify/dropshipping positivi.

Ritest intermedio dopo diagnostica:

```json
{
  "campaignId": "cmp5yvzl90001nw3vxnt3rt6q",
  "rawResultCount": 22,
  "uniqueResultCount": 15,
  "qualifiedCount": 8,
  "rejectedCount": 7,
  "preFilterScarti": 3,
  "stopReason": "Ricerca terminata per esaurimento fonti disponibili: 8 qualificate su 15 domini unici."
}
```

Ritest dopo regola anti-conflitto:

```json
{
  "campaignId": "cmp5z3rpr006xnw3vhtuhy289",
  "rawResultCount": 25,
  "uniqueResultCount": 19,
  "qualifiedCount": 10,
  "rejectedCount": 4,
  "preFilterScarti": 0,
  "stopReason": "Raggiunto il numero massimo di fonti qualificate richieste."
}
```

Prossimo passo:

- valutare manualmente le 10 fonti qualificate;
- implementare marcatura `utile/non utile`, note e calcolo soglia 70% nel popup finale.

## Aggiornamento 2026-05-14 - Ritest utente con codice non aggiornato

Osservazione:

- l'utente ha rilanciato la prova e ha ottenuto ancora 0 qualificate su 18 domini;
- nel terminale incollato i log `pre_filter` non mostravano metadata dettagliati;
- questo indica codice frontend/backend non ancora ricaricato o campagna eseguita prima del riavvio.

Azioni:

- riavviati container `backend` e `frontend`;
- aggiunto spinner su `Prepara ricerca`;
- aggiunta regola di sicurezza: un segnale forte Shopify/dropshipping/integration consente il crawl se non ci sono negativi reali;
- aggiunto test per fonte Shopify forte con piano rumoroso.

Nota operativa:

- dopo modifiche a backend/frontend in Docker Compose conviene fare restart dei servizi e hard refresh browser;
- i vecchi log agente non vengono arricchiti retroattivamente se il backend precedente non aveva salvato i metadata.

## Correzione 2026-05-14 - `non-dropshipping` scartava tutto

Bug individuato:

- il planner ha prodotto `negativeSignals` come `non-dropshipping`;
- il pre-filtro usava matcher fuzzy anche sui negativi;
- `non-dropshipping` finiva per combaciare con `dropshipping`, quindi tutte le fonti pertinenti venivano scartate.

Correzione:

- matcher con alias solo sui segnali positivi;
- matcher esplicito sui segnali negativi;
- segnali canonici aggiunti da richiesta utente anche con refusi;
- rimozione dei campi output dai `requiredSignals`;
- runner automatico `scripts/run-centrax-search-test1.mjs`.

Esito automatico:

```json
{
  "campaignId": "cmp60bu2r0001nw3upburfxq3",
  "rawResultCount": 28,
  "uniqueResultCount": 21,
  "analyzedCount": 13,
  "qualifiedCount": 10,
  "usefulRate": 0.8,
  "passed70": true
}
```

Nota:

- la soglia 70% e stata superata dal runner euristico;
- resta da implementare validazione manuale nel popup per confermare ufficialmente il gate.
