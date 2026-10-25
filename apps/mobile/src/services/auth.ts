import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { env } from './env';
import { secureStorage } from './secure-storage';

let client: SupabaseClient | null | undefined;

/** Supabase client with tokens kept in the iOS Keychain / Android Keystore. Null when not configured. */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  client =
    env.supabaseUrl && env.supabaseKey
      ? createClient(env.supabaseUrl, env.supabaseKey, {
          auth: {
            storage: secureStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false, // no browser redirects in a native app
          },
        })
      : null;

  if (client) {
    // Refresh tokens only while the app is foregrounded (Supabase's React Native guidance).
    const auth = client.auth;
    AppState.addEventListener('change', (state) => {
      if (state === 'active') void auth.startAutoRefresh();
      else void auth.stopAutoRefresh();
    });
  }
  return client;
}

export async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export type AuthResult = { ok: true; message?: string } | { ok: false; message: string };

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: 'Sign-in is not configured in this build.' };
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  // One generic message: never reveal whether an account exists.
  return error ? { ok: false, message: 'Incorrect email or password.' } : { ok: true };
}

export async function signUpWithPassword(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: 'Sign-up is not configured in this build.' };
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error && error.status !== 422) return { ok: false, message: 'We couldn’t create your account. Please try again.' };
  // With email confirmation on, there is no session yet; the response is the same whether or not the address existed.
  return data.session ? { ok: true } : { ok: true, message: 'If this email can be registered, you’ll receive a message to confirm your account.' };
}

export async function signOut(): Promise<void> {
  await getSupabase()?.auth.signOut();
}
