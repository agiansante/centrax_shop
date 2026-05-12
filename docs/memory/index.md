# Indice memoria progetto

Questo indice serve per trovare rapidamente i blocchi memoria senza leggerli tutti.

## Blocchi

| ID | Data | Tipo | Tag | Titolo | File |
| --- | --- | --- | --- | --- | --- |
| `2026-05-12-bootstrap-progetto` | 2026-05-12 | feature | `bootstrap`, `monorepo`, `docker`, `nestjs`, `react` | Creazione progetto iniziale | `apps/backend`, `apps/frontend`, `infra`, `docs` |
| `2026-05-12-docker-npm-heartbeat` | 2026-05-12 | debug | `docker`, `npm`, `build` | Heartbeat durante npm install | `apps/backend/Dockerfile`, `apps/frontend/Dockerfile` |
| `2026-05-12-auth-bcrypt-import` | 2026-05-12 | debug | `backend`, `auth`, `bcrypt`, `register` | Errore bcrypt.hash undefined | `apps/backend/src/modules/auth/auth.service.ts` |
| `2026-05-13-project-memory-system` | 2026-05-13 | decisione | `memoria`, `documentazione`, `token`, `regole` | Memoria a blocchi indicizzata | `docs/memory`, `docs/regole-generali-codice.md` |
| `2026-05-13-campaign-progress-ui` | 2026-05-13 | feature | `campaign`, `progress`, `frontend`, `backend`, `prisma` | Avanzamento campagne in dashboard | `apps/backend/prisma/schema.prisma`, `apps/frontend/src/ui/DashboardPage.tsx` |
| `2026-05-13-milestone-method` | 2026-05-13 | decisione | `milestone`, `planning`, `token`, `riuso` | Metodo milestone riutilizzabile | `docs/milestone.md`, `docs/templates/chat-progetto-regole-base.md` |
| `2026-05-13-product-roadmap` | 2026-05-13 | decisione | `roadmap`, `product`, `catalogo`, `dashboard`, `trend`, `shopify`, `agentic` | Roadmap prodotto futura | `docs/milestone.md`, `docs/diario-giornaliero.md` |

## Come cercare

- Se stai lavorando su autenticazione: cerca tag `auth`, `bcrypt`, `register`.
- Se stai lavorando su Docker/build: cerca tag `docker`, `npm`, `build`.
- Se stai lavorando su documentazione o continuita progetto: cerca tag `memoria`, `documentazione`, `token`, `regole`.
- Se stai lavorando su avanzamento campagne: cerca tag `campaign`, `progress`, `frontend`, `backend`.
- Se stai pianificando nuove attivita: cerca tag `milestone`, `planning`, `token`.
- Se stai lavorando su roadmap prodotto: cerca tag `roadmap`, `product`, `catalogo`, `dashboard`, `trend`, `shopify`, `agentic`.
