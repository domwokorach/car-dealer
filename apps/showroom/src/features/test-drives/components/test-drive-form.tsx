'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Button, Field, Input, buttonStyles } from '@car-dealer/ui-web';
import { bookTestDriveAction } from '../api/actions';
import { localInputToIso } from '../utils/to-iso';

export function TestDriveForm({ listingId, signedIn, returnTo }: { listingId: string; signedIn: boolean; returnTo: string }) {
  const [error, setError] = useState<string>();
  const mutation = useMutation({ mutationFn: bookTestDriveAction });

  if (!signedIn) {
    return (
      <Link href={`/sign-in?next=${encodeURIComponent(returnTo)}`} className={buttonStyles({ variant: 'secondary' })}>
        Sign in to book a test drive
      </Link>
    );
  }

  const result = mutation.data;
  if (result?.ok) {
    return (
      <p role="status" className="border border-success/40 bg-success/5 p-4 text-sm">
        Test drive requested for {new Date(result.data.scheduledAt).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}. The branch will confirm by email.
      </p>
    );
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const iso = localInputToIso(String(new FormData(event.currentTarget).get('when') ?? ''));
    if (!iso) return setError('Choose a date and time.');
    setError(undefined);
    mutation.mutate({ listingId, scheduledAt: iso, notes: null });
  }

  const shown = error ?? (result && !result.ok ? (result.fieldErrors?.scheduledAt ?? result.message) : undefined);
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" aria-label="Book a test drive">
      <Field label="Preferred date and time" htmlFor="td-when" error={shown}>
        <Input id="td-when" name="when" type="datetime-local" required />
      </Field>
      <Button type="submit" variant="secondary" disabled={mutation.isPending}>
        {mutation.isPending ? 'Booking…' : 'Request test drive'}
      </Button>
    </form>
  );
}
