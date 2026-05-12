# Runbook

## Health check

- Frontend: aprire il dominio configurato.
- Backend: `GET /health`.
- Swagger: `/docs`.

## Problemi comuni

- Campagne bloccate in `QUEUED`: controllare Redis e container backend.
- Nessun risultato reale: verificare `SEARCH_PROVIDER` e relativa chiave API.
- Analisi troppo generica: verificare `OPENAI_API_KEY` e `OPENAI_MODEL`.
- TLS non attivo: controllare record DNS verso IP EC2 e log Caddy.

## Backup

Il database e i dati Redis sono in volumi Docker. Per produzione stabile aggiungere snapshot EBS pianificati o migrare PostgreSQL a RDS.
