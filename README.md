# Dropshipping Shopify Intelligence

Applicazione full stack per cercare servizi di dropshipping compatibili con Shopify, analizzarli e consultarli da dashboard.

## Avvio rapido

1. Avvia Docker Desktop.
2. Avvia lo stack locale:

```powershell
npm run dev
```

La configurazione locale usa `.env.local.example` come default. Per chiavi reali di ricerca o OpenAI, copia `.env.local.example` in `.env` e aggiorna i valori.

Servizi locali:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Struttura

- `apps/backend`: API NestJS, Prisma, worker BullMQ.
- `apps/frontend`: UI React/Vite.
- `infra/local`: Docker Compose locale.
- `infra/aws`: Terraform per VM AWS.
- `infra/ansible`: provisioning e deploy produzione.
- `docs`: documentazione tecnica e operativa.

## Regole di sviluppo

Le istruzioni iniziali per Codex sono in [AGENTS.md](AGENTS.md).

Le regole generali di stile, commenti e leggibilita sono in [docs/regole-generali-codice.md](docs/regole-generali-codice.md).

## Riprendere in una nuova chat

Quando apri una nuova chat sul progetto, usa questa frase:

```text
Leggi AGENTS.md e riprendi il progetto seguendo quelle istruzioni.
```

## Documentazione utile

- [API backend](docs/api.md)
- [Architettura](docs/architecture.md)
- [Modello dati](docs/data-model.md)
- [Sviluppo locale](docs/local-development.md)
- [Deploy produzione](docs/deployment.md)
- [Runbook](docs/runbook.md)
- [Ripresa lavoro](docs/ripresa-lavoro.md)
- [Diario giornaliero](docs/diario-giornaliero.md)
- [Milestone progetto](docs/milestone.md)
