import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { serverEnv } from '../env';

/** Server-only Supabase client bound to the request's cookies. Browsers never talk to Supabase directly. */
export async function createSupabaseServerClient() {
  const env = serverEnv();
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) throw new Error('Authentication is not configured');
  const store = await cookies();
  return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(items) {
        try {
          for (const { name, value, options } of items) store.set(name, value, options);
        } catch {
          // Called from a Server Component: cookie writes are only allowed in actions/route handlers.
          // The proxy refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}
