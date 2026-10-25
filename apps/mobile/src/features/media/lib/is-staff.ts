import type { SessionUser } from '@car-dealer/contracts';

/** UI gate only: the API enforces real access on every request. */
export function isStaffUser(user: Pick<SessionUser, 'role' | 'branchAccess'> | undefined): boolean {
  if (!user) return false;
  if (user.role === 'HEAD_OFFICE_ADMIN' || user.role === 'SUPER_ADMIN') return true;
  return user.branchAccess !== 'all' && user.branchAccess.length > 0;
}
