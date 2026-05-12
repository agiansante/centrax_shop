# Architettura

L'app usa un monorepo con API NestJS, frontend React e job asincroni BullMQ.

## Flusso dati

1. L'utente crea una campagna dal frontend.
2. Il backend salva la campagna in PostgreSQL.
3. L'utente avvia la campagna e il backend inserisce un job in Redis/BullMQ.
4. Il worker esegue discovery tramite provider configurato.
5. Ogni dominio viene deduplicato, crawled e analizzato con regole locali.
6. OpenAI produce un profilo strutturato del servizio.
7. Il frontend mostra risultati, evidenze, costi, documentazione e confidence score.

## Componenti

- PostgreSQL: persistenza applicativa.
- Redis: coda job.
- Backend: API, auth, scraping, analisi.
- Frontend: dashboard operativa.
- Caddy: reverse proxy e TLS in produzione.
