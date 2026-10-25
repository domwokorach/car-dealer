import type { Metadata } from 'next';
import { PageHeader } from '@car-dealer/ui-web';
import { AuthForm } from '@/components/forms/auth-form';
import { safeRedirectPath } from '@/lib/safe-redirect';
import { signInAction } from './actions';

export const metadata: Metadata = { title: 'Staff sign in' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const raw = Array.isArray(params.next) ? params.next[0] : params.next;
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-4">
      <PageHeader eyebrow="Car Dealer" title="Staff sign in" description="Branch and head-office access only." />
      {params.denied ? (
        <p role="alert" className="border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
          Your account does not have staff access. Ask head office to assign you to a branch.
        </p>
      ) : null}
      <AuthForm action={signInAction} next={safeRedirectPath(raw)} submitLabel="Sign in" />
    </div>
  );
}
