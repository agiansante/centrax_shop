import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtUser } from './jwt.strategy';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

export function currentUser(context: ExecutionContext): JwtUser {
  return context.switchToHttp().getRequest<{ user: JwtUser }>().user;
}
