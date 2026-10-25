import { SetMetadata } from '@nestjs/common';
import type { Role } from '@car-dealer/contracts';

export const ROLES_KEY = 'roles';
/** `STAFF` = head office, super admin, or anyone with an active branch membership. */
export type RequiredRole = Role | 'STAFF';
export const Roles = (...roles: RequiredRole[]) => SetMetadata(ROLES_KEY, roles);
