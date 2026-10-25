import 'server-only';
import { redirect } from 'next/navigation';
import type { SessionUser } from '@car-dealer/contracts';
import { getApi } from './api';
import { isSignedIn } from './session';

/** Returns the server-resolved user, or null if signed out / the API rejects the token. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  if (!(await isSignedIn())) return null;
  try {
    return await getApi().me();
  } catch {
    return null;
  }
}

export async function requireUser(next: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return user;
}
