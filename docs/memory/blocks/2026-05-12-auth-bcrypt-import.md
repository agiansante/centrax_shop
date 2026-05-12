# 2026-05-12 - Errore bcrypt.hash undefined

```json
{
  "id": "2026-05-12-auth-bcrypt-import",
  "data": "2026-05-12",
  "tipo": "debug",
  "tag": ["backend", "auth", "bcrypt", "register"],
  "titolo": "Errore bcrypt.hash undefined",
  "sintesi": "La registrazione utente falliva perche l'import di bcryptjs non esponeva hash come previsto.",
  "file_coinvolti": ["apps/backend/src/modules/auth/auth.service.ts"],
  "dettaglio": "Usare import esplicito: import { compare, hash } from 'bcryptjs'; poi usare hash per registrazione e compare per login.",
  "stato": "risolto"
}
```
