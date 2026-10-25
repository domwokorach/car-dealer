import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Refreshes the Supabase session and sends signed-out visitors to /sign-in (everything here is staff-only). */

/** A placeholder like https://<project-ref>.supabase.co must not take the whole site down. */
function usableUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  const path = request.nextUrl.pathname;
  if (!usableUrl(url) || !key) return path === '/sign-in' ? NextResponse.next() : redirectToSignIn(request);

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(items) {
        for (const { name, value } of items) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of items) response.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  if (!data.user && path !== '/sign-in') return redirectToSignIn(request);
  return response;
}

function redirectToSignIn(request: NextRequest) {
  const target = request.nextUrl.clone();
  target.pathname = '/sign-in';
  target.search = request.nextUrl.pathname === '/' ? '' : `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
  return NextResponse.redirect(target);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
