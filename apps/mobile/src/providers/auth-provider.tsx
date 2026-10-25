import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getSupabase } from '@/services/auth';
import { authConfigured } from '@/services/env';

interface AuthState {
  /** False until the stored session has been read; avoids flashing a signed-out UI. */
  ready: boolean;
  configured: boolean;
  session: Session | null;
  signedIn: boolean;
}

const AuthContext = createContext<AuthState>({ ready: false, configured: false, session: null, signedIn: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<{ ready: boolean; session: Session | null }>({ ready: !authConfigured, session: null });

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => active && setState({ ready: true, session: data.session }));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ ready: true, session });
      // Cached per-user data (saved cars, reservations) must not outlive the session.
      void queryClient.invalidateQueries({ queryKey: ['me'] });
      if (!session) queryClient.removeQueries({ queryKey: ['me'] });
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [queryClient]);

  const value = useMemo<AuthState>(
    () => ({ ...state, configured: authConfigured, signedIn: state.session !== null }),
    [state],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
