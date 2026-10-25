import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessService } from '../../modules/auth/access.service';
import { TokenVerifier } from '../../modules/auth/token-verifier';
import { IS_OPTIONAL_AUTH, IS_PUBLIC } from '../decorators/public.decorator';
import type { AuthedRequest } from '../request';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: TokenVerifier,
    private readonly access: AccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets);
    const isOptional = this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_AUTH, targets);

    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : undefined;

    if (isPublic && !isOptional) return true;
    if (!token) {
      if (isOptional) return true;
      throw new UnauthorizedException('Authentication required');
    }

    // An invalid token is always a 401, even on optional routes: clients must not silently fall back to anonymous.
    req.user = await this.access.resolveSession(await this.verifier.verify(token));
    return true;
  }
}
