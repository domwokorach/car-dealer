import type { Metadata } from 'next';
import { Container, PageHeader } from '@car-dealer/ui-web';
import { AuthForm } from '@/components/forms/auth-form';
import { safeRedirectPath } from '@/lib/safe-redirect';
import type { SearchParams } from '@/types/search-params';
import { signInAction, signUpAction } from './actions';

export const metadata: Metadata = { title: 'Sign in' };

export default async function SignInPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = (await searchParams).next;
  const next = safeRedirectPath(Array.isArray(raw) ? raw[0] : raw);
  return (
    <Container className="grid gap-12 py-16 md:grid-cols-2">
      <section aria-labelledby="signin" className="space-y-6">
        <PageHeader eyebrow="Welcome back" title="Sign in" />
        <h2 id="signin" className="sr-only">Sign in</h2>
        <AuthForm action={signInAction} next={next} submitLabel="Sign in" />
      </section>
      <section aria-labelledby="signup" className="space-y-6 md:border-l md:border-silver/60 md:pl-12">
        <PageHeader eyebrow="New here" title="Create an account" description="Save cars, book test drives and reserve online." />
        <h2 id="signup" className="sr-only">Create an account</h2>
        <AuthForm action={signUpAction} submitLabel="Create account" variant="secondary" />
      </section>
    </Container>
  );
}
