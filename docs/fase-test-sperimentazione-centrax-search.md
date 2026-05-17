# Fase test e sperimentazione Centrax Search

Questo documento governa la fase di test del cervello ricerca Centrax.

La fase nasce per evitare di considerare pronta una ricerca solo perche il flusso tecnico funziona. Il criterio principale diventa la qualita utile dei risultati prodotti.

## Test attivo

Nome:

```text
Centrax Search Test1 - Cervello di ricerca
```

Blocco memoria dettagliato:

- `docs/memory/blocks/2026-05-14-centrax-search-test1.md`

## Regola di superamento

Il blocco di sviluppo supera la fase di test solo se i risultati utili raggiungono almeno il 70%.

Formula iniziale:

```text
percentuale_utile = risultati_utili_validati / risultati_valutati
```

Il test passa se:

```text
percentuale_utile >= 70%
```

## Cosa conta come risultato utile

Un risultato e utile se chi valuta conferma che:

- e coerente con la richiesta utente;
- rappresenta una fonte utilizzabile o una fonte informativa richiesta esplicitamente;
- contiene dati verificabili, non testo rumoroso;
- ha campi importanti risolti o segnala chiaramente quelli mancanti;
- non e passato per errore a causa di parole generiche, bias storico o dominio non pertinente.

## Ciclo operativo

1. Preparare una lista di scenari test con richiesta utente, `depth`, `maxResults` e obiettivo di valutazione.
2. Creare la campagna tramite la nuova UI richiesta libera.
3. Confermare o correggere il piano nel popup.
4. Eseguire la campagna.
5. A fine ricerca presentare i risultati in forma valutabile.
6. Il valutatore marca ogni risultato come `utile` o `non utile`.
7. Salvare log agente, JSON finale, piano approvato e validazione utente.
8. Calcolare la percentuale utile.
9. Se il test non arriva al 70%, analizzare i motivi e generare task tecnici.
10. Implementare modifiche e ripetere il ciclo.

## Modifica frontend richiesta per accelerare i test

Il popup finale della campagna deve diventare uno strumento di valutazione.

Deve mostrare i dati in formati accessibili:

- tabella sintetica;
- dettaglio per risultato;
- JSON finale;
- log agente;
- piano approvato;
- motivi di qualificazione/rifiuto;
- campi irrisolti.

Per ogni risultato deve esserci una scelta manuale:

- `utile`;
- `non utile`;
- nota opzionale del valutatore.

Il sistema deve produrre un JSON copiabile/esportabile con:

```json
{
  "testName": "Centrax Search Test1 - Cervello di ricerca",
  "campaignId": "campaign-id",
  "userRequest": "Richiesta utente",
  "depth": 2,
  "maxResults": 10,
  "approvedResearchPlan": {},
  "agentFinalOutput": {},
  "agentLogs": [],
  "userValidation": [
    {
      "url": "https://example.com",
      "useful": true,
      "note": "Fonte coerente e contatti presenti."
    }
  ],
  "usefulCount": 7,
  "evaluatedCount": 10,
  "usefulRate": 0.7,
  "passed": true
}
```

Questo JSON serve a Codex per capire cosa modificare prima del test successivo.

## Aree da migliorare durante il ciclo

Durante la sperimentazione si interviene su:

- algoritmo agentico interno;
- costruzione piano da richiesta utente;
- conoscenza dei tool disponibili;
- pre-filtro discovery;
- ranking fonti;
- crawler e profondita;
- estrazione campi;
- `unresolvedFields`;
- connettori Tavily e SerpAPI;
- studio e integrazione di altri provider;
- architettura per aggiungere facilmente nuove fonti dati.

## Checklist implementazione richiesta

Queste sono le modifiche da implementare per rendere operativa la fase `Centrax Search Test1`.

### Valutazione risultati nel popup finale

- Modificare il popup finale campagna.
- Mostrare i dati trovati in formato tabella leggibile.
- Mostrare dettaglio espandibile per ogni risultato.
- Mostrare JSON finale prodotto dall'agente.
- Mostrare log agente.
- Mostrare piano approvato usato per la ricerca.
- Mostrare campi risolti e `unresolvedFields`.
- Mostrare motivo di qualificazione o rifiuto.
- Aggiungere per ogni risultato scelta `utile` / `non utile`.
- Aggiungere nota opzionale del valutatore.
- Calcolare `usefulCount`, `evaluatedCount`, `usefulRate`.
- Mostrare esito soglia 70%: superata o non superata.

### JSON test per Codex

- Generare JSON copiabile o esportabile.
- Includere richiesta utente.
- Includere `depth` e `maxResults`.
- Includere piano approvato.
- Includere risultato JSON finale.
- Includere log agente.
- Includere validazione utente.
- Includere percentuale utile.
- Includere esito test.
- Includere note del valutatore.

### Scenari e ciclo test

- Preparare per ogni test una lista di scenari completa.
- Per ogni scenario indicare richiesta utente, `depth`, `maxResults`, obiettivo e criteri utilita.
- Eseguire gli scenari dalla UI.
- Raccogliere JSON test prodotto.
- Analizzare risultati utili e non utili.
- Generare task correttivi.
- Implementare modifiche.
- Ripetere finche la soglia 70% viene raggiunta.

### Miglioramento cervello ricerca

- Raffinare algoritmo agentico interno.
- Migliorare interpretazione richiesta utente.
- Migliorare generazione piano e query.
- Migliorare segnali positivi e negativi.
- Migliorare domini esclusi.
- Migliorare ranking pre-crawl.
- Migliorare crawler e strategia `depth`.
- Migliorare estrazione campi.
- Rendere `unresolvedFields` piu affidabile.
- Ridurre testo rumoroso nei campi finali.

### Connettori e fonti dati

- Studiare meglio Tavily.
- Studiare meglio SerpAPI.
- Verificare parametri avanzati disponibili per ottimizzazione.
- Documentare punti forti e limiti di ogni provider.
- Studiare Brave Search API.
- Studiare Google Custom Search JSON API.
- Studiare Exa.
- Studiare You.com Search API.
- Definire contratto semplice per aggiungere nuovi connettori.
- Separare adapter provider da logica agentica.
- Permettere al planner di sapere quali tool sono disponibili e quali parametri accettano.
- Predisporre collegamento futuro a qualunque fonte dati utile, non solo motori web.

## Provider e connettori da studiare

Provider gia presenti o predisposti:

- Tavily;
- SerpAPI;
- Brave Search API;
- Google Custom Search JSON API;
- Exa;
- You.com Search API.

Per ogni provider bisogna documentare:

- parametri accettati;
- filtri per lingua, paese, dominio, freshness e tipo fonte;
- punti forti;
- limiti;
- costi o quote;
- formato risposta;
- come usarlo nel piano agente;
- come normalizzarlo nel contratto interno.

## Stato

Stato iniziale:

- fase pianificata;
- soglia approvata: 70%;
- mancano ancora UI di validazione risultati e salvataggio/esportazione JSON test;
- primo blocco test dettagliato creato in memoria.
