# Sviluppo locale

## Setup

```powershell
npm run dev
```

Per usare valori personali, copia `.env.local.example` in `.env` e aggiorna `infra/local/docker-compose.yml` o esporta le variabili nel tuo terminale.

Con `SEARCH_PROVIDER=mock` e senza `OPENAI_API_KEY`, il sistema usa dati demo e analisi euristica. Per usare provider reali:

- `SEARCH_PROVIDER=tavily` con `TAVILY_API_KEY`.
- `SEARCH_PROVIDER=serpapi` con `SERPAPI_API_KEY`.
- `OPENAI_API_KEY` per classificazione AI.

## Migrazioni

Nel container backend viene eseguito `prisma migrate deploy`. Durante sviluppo si puo creare una migrazione con:

```powershell
npm run prisma:migrate
```
