# 2026-05-12 - Heartbeat durante npm install

```json
{
  "id": "2026-05-12-docker-npm-heartbeat",
  "data": "2026-05-12",
  "tipo": "debug",
  "tag": ["docker", "npm", "build"],
  "titolo": "Heartbeat durante npm install",
  "sintesi": "Durante la build Docker, npm install sembrava bloccato perche Docker non mostrava output. E stato aggiunto un heartbeat ogni 10 secondi.",
  "file_coinvolti": ["apps/backend/Dockerfile", "apps/frontend/Dockerfile"],
  "dettaglio": "I Dockerfile eseguono npm install in background e stampano un messaggio periodico finche il processo e attivo. Questo aiuta a capire che la build sta ancora avanzando.",
  "stato": "risolto"
}
```
