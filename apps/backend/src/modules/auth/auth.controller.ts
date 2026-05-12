import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './auth.guard';
import { JwtUser } from './jwt.strategy';
import { LoginRequestDto } from './login-request.dto';
import { RegisterRequestDto } from './register-request.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  /**
   * Registra un nuovo utente e restituisce una sessione JWT.
   *
   * Usata da:
   * - apps/frontend/src/ui/LoginPage.tsx
   *
   * Riceve email e password dal body HTTP.
   */
  register(@Body() dto: RegisterRequestDto) {
    return this.auth.register(dto);
  }

  /**
   * Autentica un utente esistente e restituisce una sessione JWT.
   *
   * Usata da:
   * - apps/frontend/src/ui/LoginPage.tsx
   *
   * Riceve email e password dal body HTTP.
   */
  @Post('login')
  login(@Body() dto: LoginRequestDto) {
    return this.auth.login(dto);
  }

  /**
   * Restituisce i dati dell'utente autenticato tramite token Bearer.
   *
   * Usata da:
   * - eventuali schermate frontend che devono mostrare il profilo utente.
   *
   * Riceve l'utente decodificato dal JwtAuthGuard.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  me(@Req() request: Request & { user: JwtUser }) {
    return this.auth.me(request.user.userId);
  }
}
