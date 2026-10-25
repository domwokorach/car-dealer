import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';

/** Sends signed-out users to sign-in, then back here. The API still enforces auth; this is only UX. */
export function useRequireAuth() {
  const auth = useAuth();
  const pathname = usePathname();
  useEffect(() => {
    if (auth.ready && !auth.signedIn) router.replace({ pathname: '/sign-in', params: { next: pathname } });
  }, [auth.ready, auth.signedIn, pathname]);
  return auth;
}
