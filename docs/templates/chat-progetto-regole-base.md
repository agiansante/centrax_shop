# Template regole base chat-progetto

Questo file e pensato per essere copiato in altri progetti.

Scopo:

- mantenere memoria utile del progetto;
- evitare di caricare troppo contesto;
- rendere facile riprendere il lavoro in una nuova conversazione;
- tenere documentazione e decisioni aggiornate in modo sintetico.

## File consigliati

Creare questi file nel nuovo progetto:

```text
docs/regole-generali-codice.md
docs/ripresa-lavoro.md
docs/diario-giornaliero.md
docs/milestone.md
docs/memory/README.md
docs/memory/index.md
docs/memory/blocks/
```

## Regola di avvio sessione

All'inizio di una nuova sessione leggere:

1. `docs/regole-generali-codice.md`
2. `docs/ripresa-lavoro.md`
3. `docs/memory/index.md`
4. `docs/milestone.md`

Non leggere tutti i blocchi memoria.

Aprire solo i blocchi collegati a tag, file o area di lavoro corrente.

## Regola milestone

Il file `docs/milestone.md` serve a sapere cosa e in corso, cosa e pianificato e quanto contesto servira.

Crearlo in ogni nuovo progetto con milestone piccole e operative.

Ogni milestone deve contenere:

```json
{
  "id": "M-001",
  "titolo": "Titolo breve",
  "stato": "planned | in_progress | blocked | done | cancelled",
  "priorita": "alta | media | bassa",
  "data_creazione": "YYYY-MM-DD",
  "data_inizio": null,
  "data_fine": null,
  "impatto_token": "basso | medio | alto",
  "stima_token": "Descrizione qualitativa.",
  "rischio_contesto": "basso | medio | alto",
  "blocchi_memoria_utili": ["id-blocco"],
  "aree_coinvolte": ["backend", "frontend", "docs"],
  "prossimo_passo": "Azione concreta."
}
```

Aggiornare `docs/milestone.md` quando:

- si pianifica una nuova feature importante;
- si inizia o finisce una milestone;
- una milestone si blocca;
- cambia la priorita;
- cambia la stima token o il rischio contesto.

La milestone non sostituisce diario e memoria:

- il diario racconta cosa e successo;
- la memoria conserva decisioni e debug utili;
- la milestone dice cosa fare ora e dopo.

## Regola memoria lunga

Ogni fatto importante va salvato come blocco piccolo in:

```text
docs/memory/blocks/YYYY-MM-DD-area-titolo-breve.md
```

Ogni blocco deve essere aggiunto a:

```text
docs/memory/index.md
```

## Formato blocco memoria

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

## Regola diario

Il diario serve a raccontare cosa e successo giorno per giorno.

Aggiornarlo solo per cose importanti:

- decisioni;
- bug interessanti;
- feature completate;
- problemi di ambiente;
- cambi di architettura;
- regole nuove.

## Regola impatto token

Per modifiche grandi stimare:

```json
{
  "impatto_token": "basso | medio | alto",
  "motivo": "Perche serve poco o molto contesto.",
  "rischio_contesto": "basso | medio | alto",
  "strategia": "Come ridurre token e letture inutili."
}
```

## Regola documentazione

Aggiornare solo la documentazione realmente impattata.

La documentazione deve essere:

- sintetica;
- leggibile;
- non duplicata;
- utile a riprendere il lavoro.

## Regola aggiornamento coordinato

Quando si fa una modifica importante, aggiornare solo i file necessari:

- API cambiata: aggiornare `docs/api.md`;
- decisione o debug utile: aggiornare `docs/memory/index.md` e creare blocco;
- lavoro pianificato o in corso: aggiornare `docs/milestone.md`;
- evento importante del giorno: aggiornare `docs/diario-giornaliero.md`;
- stato generale cambiato: aggiornare `docs/ripresa-lavoro.md`.
