import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * Rappresenta i dati inviati dal frontend quando un utente crea un account.
 *
 * Usata da:
 * - apps/backend/src/modules/auth/auth.controller.ts
 * - apps/backend/src/modules/auth/auth.service.ts
 *
 * Riceve email e password in chiaro dalla richiesta HTTP.
 * La password viene validata qui e poi trasformata in hash dal service.
 */
export class RegisterRequestDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'change-me-please' })
  @IsString()
  @MinLength(8)
  password!: string;
}
