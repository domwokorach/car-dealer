import 'server-only';
import { authConfigured } from './env';
import { createSupabaseServerClient } from './supabase/server';

/**
 * The access token is forwarded to the API, which verifies it independently against Supabase's JWKS.
 * Nothing here is trusted for authorisation: roles and branch access come from the API's database.
 */
export async function getAccessToken(): Promise<string | null> {
  if (!authConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function isSignedIn(): Promise<boolean> {
  return (await getAccessToken()) !== null;
}
