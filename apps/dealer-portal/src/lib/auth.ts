import 'server-only';
import { redirect } from 'next/navigation';
import { ApiError } from '@car-dealer/api-client';
import type { SessionUser } from '@car-dealer/contracts';
import { getApi } from './api';
import { isSignedIn } from './session';

/** The user as resolved by the API from its database (never from the token's claims). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  if (!(await isSignedIn())) return null;
  try {
    return await getApi().me();
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null;
    throw error;
  }
}

export function isAdmin(user: SessionUser): boolean {
  return user.role === 'HEAD_OFFICE_ADMIN' || user.role === 'SUPER_ADMIN';
}

export function isStaff(user: SessionUser): boolean {
  return isAdmin(user) || (user.branchAccess !== 'all' && user.branchAccess.length > 0);
}

/** UI convenience only; the API enforces every permission independently. */
export async function requireStaff(next: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  if (!isStaff(user)) redirect('/sign-in?denied=1');
  return user;
}

export async function requireAdmin(next: string): Promise<SessionUser> {
  const user = await requireStaff(next);
  if (!isAdmin(user)) redirect('/dashboard');
  return user;
}
