import type { Request } from 'express';
import type { SessionUser } from '@car-dealer/contracts';

export interface AuthedRequest extends Request {
  user?: SessionUser;
  requestId?: string;
}
