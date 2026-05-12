# 2026-05-13 - Avanzamento campagne in dashboard

```json
{
  "id": "2026-05-13-campaign-progress-ui",
  "data": "2026-05-13",
  "tipo": "feature",
  "tag": ["campaign", "progress", "frontend", "backend", "prisma"],
  "titolo": "Avanzamento campagne in dashboard",
  "sintesi": "Abbiamo aggiunto dati di avanzamento campagna nel backend e una UI piu chiara con riepilogo numerico e popup sulla query.",
  "file_coinvolti": [
    "apps/backend/prisma/schema.prisma",
    "apps/backend/src/modules/analysis/analysis.service.ts",
    "apps/backend/src/modules/workers/campaign.worker.ts",
    "apps/frontend/src/ui/DashboardPage.tsx",
    "apps/frontend/src/api.ts"
  ],
  "dettaglio": "La campagna ora salva maxResults, progressStep, progressMessage, discoveredCount, analyzedCount, failedCount, startedAt e completedAt. Il frontend mostra riepiloghi e popup. Le notifiche email sono state lasciate come prossima integrazione perche serve scegliere SMTP/provider.",
  "stato": "in_corso"
}
```
