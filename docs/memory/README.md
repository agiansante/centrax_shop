# Memoria progetto

Questa cartella contiene la memoria lunga del progetto in blocchi piccoli e indicizzati.

L'obiettivo e ricordare molte cose senza caricare troppi token a inizio conversazione.

## Come funziona

1. A inizio lavoro si legge solo `docs/ripresa-lavoro.md` e `docs/memory/index.md`.
2. Se serve dettaglio, si apre solo il blocco memoria collegato ai tag o ai file interessati.
3. Quando succede qualcosa di importante, si aggiunge un blocco in `docs/memory/blocks/`.
4. Ogni blocco deve essere aggiunto anche a `docs/memory/index.md`.

## Quando creare un blocco

Creare un blocco quando:

- risolviamo un errore interessante;
- prendiamo una decisione architetturale;
- cambiamo una regola di progetto;
- aggiungiamo una feature importante;
- troviamo un vincolo tecnico da ricordare;
- facciamo un refactor che spiega una direzione futura.

Non creare blocchi per modifiche piccole e ovvie.

## Formato blocco

Ogni blocco deve essere breve e avere questa struttura:

```json
{
  "id": "YYYY-MM-DD-area-titolo-breve",
  "data": "YYYY-MM-DD",
  "tipo": "decisione | debug | feature | refactor | infrastruttura | documentazione",
  "tag": ["tag1", "tag2"],
  "titolo": "Titolo breve",
  "sintesi": "Riassunto in 1-3 frasi.",
  "file_coinvolti": ["path/file1"],
  "dettaglio": "Dettaglio utile ma sintetico.",
  "stato": "aperto | in_corso | risolto | superato"
}
```

## Regola sui token

Non leggere tutti i blocchi a inizio chat.

Leggere solo:

- indice;
- blocchi con tag rilevanti;
- blocchi citati da `ripresa-lavoro.md`;
- blocchi collegati ai file che si stanno modificando.
