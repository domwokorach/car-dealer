'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { authConfigured } from '@/lib/env';
import { safeRedirectPath } from '@/lib/safe-redirect';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface AuthFormState {
  message?: string;
  tone?: 'error' | 'info';
}

const Credentials = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  next: z.string().optional(),
});

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!authConfigured()) return { message: 'Sign-in is not configured on this environment.', tone: 'error' };
  const parsed = Credentials.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next') ?? undefined,
  });
  if (!parsed.success) return { message: parsed.error.issues[0]?.message, tone: 'error' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) return { message: 'Incorrect email or password.', tone: 'error' };
  redirect(safeRedirectPath(parsed.data.next));
}

export async function signOutAction(): Promise<void> {
  if (authConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect('/sign-in');
}
