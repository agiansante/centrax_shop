import { ConflictException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginRequestDto } from './login-request.dto';
import { RegisterRequestDto } from './register-request.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  /**
   * Crea un nuovo utente nel database e restituisce il token di accesso.
   *
   * Usata da:
   * - apps/backend/src/modules/auth/auth.controller.ts
   *
   * Riceve email e password validate dal DTO.
   * Salva la password come hash bcrypt.
   */
  async register(dto: RegisterRequestDto) {
    try {
      this.logger.log(`Register request received for email: ${dto.email}`);

      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) {
        throw new ConflictException('Email already registered');
      }

      this.logger.log(`Creating password hash for email: ${dto.email}`);
      const passwordHash = await hash(dto.password, 12);

      this.logger.log(`Creating user record for email: ${dto.email}`);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash
        }
      });

      this.logger.log(`User created successfully for email: ${dto.email}`);
      return this.session(user.id, user.email, user.role);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown registration error';
      this.logger.error(`Registration failed: ${message}`, error instanceof Error ? error.stack : undefined);

      if (process.env.NODE_ENV !== 'production') {
        throw new InternalServerErrorException(message);
      }

      throw new InternalServerErrorException('Registration failed');
    }
  }

  /**
   * Verifica le credenziali dell'utente e restituisce il token di accesso.
   *
   * Usata da:
   * - apps/backend/src/modules/auth/auth.controller.ts
   *
   * Riceve email e password validate dal DTO.
   */
  async login(dto: LoginRequestDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.session(user.id, user.email, user.role);
  }

  /**
   * Recupera i dati pubblici dell'utente autenticato.
   *
   * Usata da:
   * - apps/backend/src/modules/auth/auth.controller.ts
   *
   * Riceve l'id utente estratto dal JWT.
   */
  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, role: true, createdAt: true }
    });
    return user;
  }

  /**
   * Costruisce la risposta di sessione condivisa da login e registrazione.
   *
   * Usata da:
   * - register nello stesso service.
   * - login nello stesso service.
   *
   * Riceve dati utente gia validi e restituisce token JWT piu profilo base.
   */
  private session(id: string, email: string, role: string) {
    return {
      accessToken: this.jwt.sign({ sub: id, email, role }),
      user: { id, email, role }
    };
  }
}
