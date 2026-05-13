# Milestone progetto

Questo file tiene traccia di cosa stiamo facendo, cosa faremo dopo e quanto contesto serve indicativamente per ogni attivita.

Serve a evitare di perdere il filo tra una conversazione e l'altra.

## Come aggiornare

Ogni milestone deve avere:

- id;
- titolo;
- stato;
- priorita;
- data creazione;
- data inizio, se iniziata;
- data fine, se completata;
- stima impatto token;
- riferimenti ai blocchi memoria utili;
- file o aree coinvolte;
- prossimo passo.

Stati possibili:

- `planned`: pianificata, non iniziata;
- `in_progress`: iniziata;
- `blocked`: bloccata;
- `done`: completata;
- `cancelled`: annullata.

Formato consigliato:

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
  "stima_token": "Descrizione qualitativa, non numero esatto obbligatorio.",
  "rischio_contesto": "basso | medio | alto",
  "blocchi_memoria_utili": ["id-blocco"],
  "aree_coinvolte": ["backend", "frontend", "docs"],
  "prossimo_passo": "Azione successiva concreta."
}
```

## Milestone attive e pianificate

### M-001 - Avvio progetto full stack

```json
{
  "id": "M-001",
  "titolo": "Avvio progetto full stack",
  "stato": "done",
  "priorita": "alta",
  "data_creazione": "2026-05-12",
  "data_inizio": "2026-05-12",
  "data_fine": "2026-05-12",
  "impatto_token": "alto",
  "stima_token": "Ha richiesto molto contesto perche include backend, frontend, database, Docker, infra e documentazione.",
  "rischio_contesto": "medio",
  "blocchi_memoria_utili": ["2026-05-12-bootstrap-progetto"],
  "aree_coinvolte": ["backend", "frontend", "infra", "docs"],
  "prossimo_passo": "Continuare con stabilizzazione flussi principali."
}
```

### M-002 - Migliorare osservabilita campagne

```json
{
  "id": "M-002",
  "titolo": "Migliorare osservabilita campagne",
  "stato": "in_progress",
  "priorita": "alta",
  "data_creazione": "2026-05-13",
  "data_inizio": "2026-05-13",
  "data_fine": null,
  "impatto_token": "medio-alto",
  "stima_token": "Richiede leggere backend worker, Prisma, API frontend e dashboard. Conviene procedere in blocchi piccoli.",
  "rischio_contesto": "medio",
  "blocchi_memoria_utili": ["2026-05-13-campaign-progress-ui"],
  "aree_coinvolte": ["backend", "frontend", "database", "docs"],
  "prossimo_passo": "Riavviare stack, applicare migrazione e verificare popup avanzamento campagna."
}
```

### M-003 - Healthcheck approfonditi e diagnostica sviluppo

```json
{
  "id": "M-003",
  "titolo": "Healthcheck approfonditi e diagnostica sviluppo",
  "stato": "planned",
  "priorita": "alta",
  "data_creazione": "2026-05-13",
  "data_inizio": null,
  "data_fine": null,
  "impatto_token": "medio",
  "stima_token": "Serve contesto su health module, Prisma, Redis, regole analisi e auth. Non dovrebbe richiedere grandi modifiche UI.",
  "rischio_contesto": "medio",
  "blocchi_memoria_utili": ["2026-05-13-project-memory-system", "2026-05-12-auth-bcrypt-import"],
  "aree_coinvolte": ["backend", "docs", "tests"],
  "prossimo_passo": "Implementare prima gli endpoint MVP: /health/database, /health/redis, /health/ready, /diagnostics/config, /diagnostics/analysis/url-normalization e /diagnostics/analysis/rules."
}
```

Dettaglio operativo endpoint da creare:

| Endpoint | Tipo | Scopo | Uso durante sviluppo |
| --- | --- | --- | --- |
| `GET /health` | healthcheck base | Confermare che il backend NestJS risponde. | Primo controllo rapido dopo avvio server o container. |
| `GET /health/database` | healthcheck dipendenza | Verificare connessione PostgreSQL con query minima. | Testare Prisma, schema, migrazioni, `DATABASE_URL` e container database. |
| `GET /health/redis` | healthcheck dipendenza | Verificare connessione Redis con controllo leggero. | Testare Redis prima di lavorare su code e job campagne. |
| `GET /health/queue` | healthcheck dipendenza | Verificare che BullMQ riesca a leggere lo stato della coda campagne. | Capire se i job possono partire o se la coda e bloccata. |
| `GET /health/ready` | healthcheck aggregato | Verificare backend, database, Redis e coda in un solo controllo. | Usarlo prima di test manuali completi dell'app. |
| `GET /health/config` | healthcheck configurazione | Controllare configurazione minima senza esporre segreti. | Capire se mancano variabili essenziali per backend, database, Redis, JWT, OpenAI o discovery. |
| `GET /health/openai` | healthcheck configurazione | Indicare se OpenAI e configurato, senza chiamate costose di default. | Capire se l'analisi AI usera provider reale o fallback mock/euristico. |
| `GET /health/discovery` | healthcheck configurazione | Indicare quale provider discovery e attivo. | Capire se le campagne stanno usando mock o ricerca reale. |
| `GET /diagnostics/config` | diagnostica sviluppo | Mostrare configurazione attiva senza segreti. | Debug rapido di ambiente e provider mentre si sviluppa. |
| `POST /diagnostics/auth/hash-password` | diagnostica sviluppo | Testare hashing e confronto password. | Verificare auth senza creare utenti reali. |
| `POST /diagnostics/auth/login-flow` | diagnostica sviluppo | Testare il flusso login con input controllato. | Verificare auth, JWT, guard e DTO login. |
| `POST /diagnostics/analysis/rules` | diagnostica sviluppo | Eseguire solo le regole locali su testo o HTML fornito. | Migliorare classificazione Shopify/dropshipping senza lanciare campagne complete. |
| `POST /diagnostics/analysis/url-normalization` | diagnostica sviluppo | Testare normalizzazione URL, dominio e deduplica base. | Preparare deduplica, catalogo globale e pulizia URL. |
| `POST /diagnostics/analysis/crawl-url` | diagnostica sviluppo | Testare il crawler su un singolo URL. | Capire se un sito e scaricabile e quale testo viene estratto. |
| `POST /diagnostics/analysis/analyze-url` | diagnostica sviluppo | Eseguire crawler, regole e AI/mock su un singolo URL. | Mini test completo prima di creare o rilanciare campagne. |
| `GET /diagnostics/campaigns/queue` | diagnostica sviluppo | Mostrare stato sintetico della coda campagne. | Vedere job in attesa, attivi o falliti. |
| `POST /diagnostics/campaigns/reset-stuck` | diagnostica sviluppo | Resettare campagne bloccate in sviluppo. | Recuperare campagne rimaste `QUEUED` o `RUNNING` dopo stop container o crash worker. |

Regola importante: tutti gli endpoint `/diagnostics/...` devono essere disponibili solo con `NODE_ENV !== production` e non devono mai esporre segreti, token o password.

### M-004 - Notifiche email fine campagna

```json
{
  "id": "M-004",
  "titolo": "Notifiche email fine campagna",
  "stato": "planned",
  "priorita": "media",
  "data_creazione": "2026-05-13",
  "data_inizio": null,
  "data_fine": null,
  "impatto_token": "medio-alto",
  "stima_token": "Serve decidere provider SMTP/email, aggiungere configurazione env, service backend, chiamata dal worker e documentazione.",
  "rischio_contesto": "medio",
  "blocchi_memoria_utili": ["2026-05-13-campaign-progress-ui"],
  "aree_coinvolte": ["backend", "infra", "docs"],
  "prossimo_passo": "Scegliere provider email: SMTP generico, Gmail app password, Resend, SendGrid o AWS SES."
}
```

### M-005 - Refactor leggibilita e commenti italiani

```json
{
  "id": "M-005",
  "titolo": "Refactor leggibilita e commenti italiani",
  "stato": "in_progress",
  "priorita": "media",
  "data_creazione": "2026-05-12",
  "data_inizio": "2026-05-12",
  "data_fine": null,
  "impatto_token": "medio",
  "stima_token": "Richiede passate mirate sui file toccati, evitando refactor globale in una sola volta.",
  "rischio_contesto": "basso",
  "blocchi_memoria_utili": ["2026-05-13-project-memory-system"],
  "aree_coinvolte": ["backend", "frontend", "docs"],
  "prossimo_passo": "Applicare le regole ai file modificati nelle prossime feature."
}
```

### M-006 - Catalogo globale siti e fornitori individuati

```json
{
  "id": "M-006",
  "titolo": "Catalogo globale siti e fornitori individuati",
  "stato": "planned",
  "priorita": "alta",
  "data_creazione": "2026-05-13",
  "data_inizio": null,
  "data_fine": null,
  "impatto_token": "medio-alto",
  "stima_token": "Serve leggere modello dati, API campagne/servizi, routing frontend e progettare stati operativi di approfondimento, integrazione e prodotti.",
  "rischio_contesto": "medio",
  "blocchi_memoria_utili": ["2026-05-13-campaign-progress-ui", "2026-05-13-product-roadmap"],
  "aree_coinvolte": ["backend", "frontend", "database", "docs"],
  "prossimo_passo": "Creare una pagina catalogo con tutti i siti individuati, stato ricerca approfondita, stato sviluppo integrazione, accesso ai prodotti trovati e indicazione di vendibilita su Shopify."
}
```

### M-007 - Migliorare dashboard, accessibilita e impaginazione

```json
{
  "id": "M-007",
  "titolo": "Migliorare dashboard, accessibilita e impaginazione",
  "stato": "planned",
  "priorita": "alta",
  "data_creazione": "2026-05-13",
  "data_inizio": null,
  "data_fine": null,
  "impatto_token": "medio",
  "stima_token": "Richiede soprattutto frontend, CSS e revisione testi. Contesto backend limitato.",
  "rischio_contesto": "basso",
  "blocchi_memoria_utili": ["2026-05-13-product-roadmap"],
  "aree_coinvolte": ["frontend", "docs"],
  "prossimo_passo": "Rivedere layout, responsive, focus states, testi italiani e gerarchia visiva delle dashboard."
}
```

### M-008 - Schede riepilogo servizio e dettaglio tutto in italiano

```json
{
  "id": "M-008",
  "titolo": "Schede riepilogo servizio e dettaglio tutto in italiano",
  "stato": "planned",
  "priorita": "alta",
  "data_creazione": "2026-05-13",
  "data_inizio": null,
  "data_fine": null,
  "impatto_token": "medio-alto",
  "stima_token": "Serve lavorare su frontend, API dati servizio e forse schema campi riepilogo. Utile spezzare in card risultati e pagina dettaglio.",
  "rischio_contesto": "medio",
  "blocchi_memoria_utili": ["2026-05-13-product-roadmap"],
  "aree_coinvolte": ["frontend", "backend", "docs"],
  "prossimo_passo": "Definire quali indicatori devono far capire velocemente se approfondire un servizio."
}
```

### M-009 - Deduplica servizi tra piu query

```json
{
  "id": "M-009",
  "titolo": "Deduplica servizi tra piu query",
  "stato": "planned",
  "priorita": "alta",
  "data_creazione": "2026-05-13",
  "data_inizio": null,
  "data_fine": null,
  "impatto_token": "alto",
  "stima_token": "Richiede analisi modello dati e possibile refactor: oggi i siti sono deduplicati per campagna, non globalmente. Serve decidere entita globale servizio/dominio.",
  "rischio_contesto": "alto",
  "blocchi_memoria_utili": ["2026-05-13-product-roadmap", "2026-05-12-bootstrap-progetto"],
  "aree_coinvolte": ["database", "backend", "frontend", "migration"],
  "prossimo_passo": "Progettare modello con dominio/servizio globale e relazione molti-a-molti con campagne."
}
```

### M-010 - Dashboard statistiche e filtri avanzati query

```json
{
  "id": "M-010",
  "titolo": "Dashboard statistiche e filtri avanzati query",
  "stato": "planned",
  "priorita": "alta",
  "data_creazione": "2026-05-13",
  "data_inizio": null,
  "data_fine": null,
  "impatto_token": "alto",
  "stima_token": "Richiede definire nuovi campi campagna, UI filtri, API, e possibile arricchimento prompt/analisi. I parametri avanzati devono supportare testo libero per esigenze specifiche.",
  "rischio_contesto": "medio",
  "blocchi_memoria_utili": ["2026-05-13-product-roadmap"],
  "aree_coinvolte": ["frontend", "backend", "database", "analysis"],
  "prossimo_passo": "Aggiungere filtri base come tipologia prodotto e stringa di ricerca, piu parametri avanzati testuali liberi per casi specifici come personalizzazione, stampa, API immagine o integrazione Shopify."
}
```

### M-011 - Ricerca trend e suggerimento query agentico

```json
{
  "id": "M-011",
  "titolo": "Ricerca trend e suggerimento query agentico",
  "stato": "planned",
  "priorita": "media",
  "data_creazione": "2026-05-13",
  "data_inizio": null,
  "data_fine": null,
  "impatto_token": "alto",
  "stima_token": "Feature ampia: web/social/trend source, job asincroni, salvataggio suggerimenti, UI e documentazione. Da spezzare in MVP.",
  "rischio_contesto": "alto",
  "blocchi_memoria_utili": ["2026-05-13-product-roadmap"],
  "aree_coinvolte": ["backend", "worker", "frontend", "ai", "docs"],
  "prossimo_passo": "Definire MVP: Google Trends o provider alternativo, social/web search, e generazione suggerimenti query basati sui risultati."
}
```

### M-012 - Analisi manuale sito dropshipping

```json
{
  "id": "M-012",
  "titolo": "Analisi manuale sito dropshipping",
  "stato": "planned",
  "priorita": "alta",
  "data_creazione": "2026-05-13",
  "data_inizio": null,
  "data_fine": null,
  "impatto_token": "medio",
  "stima_token": "Riusa crawler e analysis service esistenti. Serve endpoint e UI per inviare URL manuale.",
  "rischio_contesto": "medio",
  "blocchi_memoria_utili": ["2026-05-13-campaign-progress-ui", "2026-05-13-product-roadmap"],
  "aree_coinvolte": ["backend", "frontend", "analysis"],
  "prossimo_passo": "Creare form 'Analizza sito manualmente' e backend che crea sito/profilo senza query."
}
```

### M-013 - Scansione completa sito e manuale connettore Shopify/API

```json
{
  "id": "M-013",
  "titolo": "Scansione completa sito e manuale connettore Shopify/API",
  "stato": "planned",
  "priorita": "alta",
  "data_creazione": "2026-05-13",
  "data_inizio": null,
  "data_fine": null,
  "impatto_token": "alto",
  "stima_token": "Feature complessa: crawler profondo, estrazione prodotti, documentazione tecnica, analisi integrazione Shopify/API e generazione manuale operativo.",
  "rischio_contesto": "alto",
  "blocchi_memoria_utili": ["2026-05-13-product-roadmap"],
  "aree_coinvolte": ["backend", "crawler", "ai", "frontend", "docs", "codex"],
  "prossimo_passo": "Progettare prima il flusso: bottone importante nel dettaglio sito, job dedicato, output prodotti, documentazione e proposta progetto connettore."
}
```

### M-014 - Creazione progetto Codex per connettore Shopify

```json
{
  "id": "M-014",
  "titolo": "Creazione progetto Codex per connettore Shopify",
  "stato": "planned",
  "priorita": "media",
  "data_creazione": "2026-05-13",
  "data_inizio": null,
  "data_fine": null,
  "impatto_token": "alto",
  "stima_token": "Dipende da M-013. Serve definire formato output e possibilita di generare scaffold progetto da interfaccia.",
  "rischio_contesto": "alto",
  "blocchi_memoria_utili": ["2026-05-13-product-roadmap"],
  "aree_coinvolte": ["frontend", "backend", "docs", "codex-workflow"],
  "prossimo_passo": "Dopo il manuale operativo, definire un formato progetto esportabile o una procedura guidata per aprire lavoro in Codex."
}
```

### M-015 - Export documentazione PDF e presentazioni

```json
{
  "id": "M-015",
  "titolo": "Export documentazione PDF e presentazioni",
  "stato": "planned",
  "priorita": "media",
  "data_creazione": "2026-05-13",
  "data_inizio": null,
  "data_fine": null,
  "impatto_token": "medio",
  "stima_token": "Serve leggere documentazione esistente e scegliere tool di conversione. Impatto contenuto se si parte da Markdown gia strutturato.",
  "rischio_contesto": "basso",
  "blocchi_memoria_utili": ["2026-05-13-product-roadmap", "2026-05-13-milestone-method"],
  "aree_coinvolte": ["docs", "tooling", "export"],
  "prossimo_passo": "Scegliere formato target: PDF da Markdown, DOCX, slide HTML o PowerPoint; poi aggiungere script di generazione."
}
```

### M-016 - Pipeline CI/CD per deploy produzione

```json
{
  "id": "M-016",
  "titolo": "Pipeline CI/CD per deploy produzione",
  "stato": "planned",
  "priorita": "media",
  "data_creazione": "2026-05-13",
  "data_inizio": null,
  "data_fine": null,
  "impatto_token": "medio-alto",
  "stima_token": "Richiede leggere infrastruttura Docker, Terraform, Ansible, gestione segreti, strategia branch e flusso deploy. Non serve per sviluppo locale immediato.",
  "rischio_contesto": "medio",
  "blocchi_memoria_utili": ["2026-05-12-bootstrap-progetto"],
  "aree_coinvolte": ["infra", "backend", "frontend", "docs", "ci-cd"],
  "prossimo_passo": "Rimandare finche non si prepara il primo deploy produzione; poi progettare pipeline con build, test, push immagini, gestione segreti e deploy controllato."
}
```

Nota: questa milestone non e necessaria per lavorare in locale. Va ripresa quando il progetto sara pronto per un ambiente di produzione o staging stabile.
