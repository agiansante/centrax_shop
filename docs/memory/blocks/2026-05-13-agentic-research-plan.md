# 2026-05-13 - Piano ricerca agentica Centrax

```json
{
  "id": "2026-05-13-agentic-research-plan",
  "data": "2026-05-13",
  "tipo": "decisione",
  "tag": ["agentic", "research", "centrax", "tool", "provider", "frontend", "configurazione"],
  "titolo": "Architettura agentica per il cervello ricerca",
  "sintesi": "La ricerca evolvera in un agente che riceve query, prompt, depth, maxResults e outputSchema, sceglie tool configurati e restituisce risultati JSON tracciabili.",
  "file_coinvolti": [
    "docs/piano-ricerca-agentica-centrax.md",
    "docs/analisi-ricerca-centrax.md",
    "docs/search-profile.example.json",
    "docs/milestone.md",
    "docs/ripresa-lavoro.md"
  ],
  "dettaglio": "Il piano prevede tool registry, provider ricerca e AI configurabili, popup terminale con log agente, merge risultati da piu fonti, validazione outputSchema e predisposizione SaaS futura per limiti provider normale/premium.",
  "stato": "prima implementazione in test"
}
```

## Aggiornamento implementazione

Il 2026-05-13 e stata implementata la prima versione del cervello ricerca:

- campagna con `searchPrompt` e `outputSchema`;
- `AgentRunLog` e terminale agente frontend;
- tool registry con ricerca configurata, crawler HTML e classificatore regole;
- descrittori provider futuri;
- agente MVP con planning deterministico, merge/deduplica, qualificazione e output JSON finale;
- pagina `Configurazione` per provider ricerca/AI senza segreti.

Resta da verificare con provider reale configurato e da evolvere il planning AI multi-provider.

## Regola generalista

Il cervello ricerca non deve essere specializzato in dropshipping/Shopify.

La specializzazione deve arrivare da:

- `query`;
- `searchPrompt`;
- `outputSchema`;
- eventuali regole/tool configurabili.

Il core agente deve poter catalogare qualunque informazione web, per esempio fornitori, indirizzi, prodotti, contatti, prezzi, documenti o aziende. I risultati devono indicare `sourceType` e `qualificationReason` per distinguere fonte diretta, marketplace/directory, articolo informativo, forum/social, media o fonte non operativa.

## Ripresa 2026-05-14

Test generalista:

```text
venditori macchine luxury usate Lombardia
```

Il flusso discovery/crawl/AI funziona, ma il filtro e il ragionamento non sono ancora abbastanza buoni:

- passano risultati Shopify non pertinenti;
- campi come indirizzo e telefono possono essere riempiti con testo rumoroso;
- serve pre-filtro piu rigoroso su title/snippet/URL prima del crawl;
- serve distinguere campi mancanti da campi realmente estratti.

Prossima sessione: migliorare query planning, pre-filtro discovery, scoring fonte e qualita estrazione.
