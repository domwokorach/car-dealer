import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isStaff } from '../../modules/auth/access-policy';
import { ROLES_KEY, RequiredRole } from '../decorators/roles.decorator';
import type { AuthedRequest } from '../request';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RequiredRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const user = context.switchToHttp().getRequest<AuthedRequest>().user;
    if (!user) throw new ForbiddenException();

    const allowed = required.some((r) => (r === 'STAFF' ? isStaff(user) : r === user.role));
    if (!allowed) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
