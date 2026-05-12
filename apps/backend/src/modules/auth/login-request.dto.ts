import { RegisterRequestDto } from './register-request.dto';

/**
 * Rappresenta i dati inviati dal frontend quando un utente effettua il login.
 *
 * Usata da:
 * - apps/backend/src/modules/auth/auth.controller.ts
 * - apps/backend/src/modules/auth/auth.service.ts
 *
 * Riusa le stesse regole di validazione della registrazione:
 * email valida e password con lunghezza minima.
 */
export class LoginRequestDto extends RegisterRequestDto {}
