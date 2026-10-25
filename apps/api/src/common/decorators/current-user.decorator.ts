import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { SessionUser } from '@car-dealer/contracts';
import type { AuthedRequest } from '../request';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): SessionUser => {
  return ctx.switchToHttp().getRequest<AuthedRequest>().user as SessionUser;
});
