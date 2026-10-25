'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { Button, buttonStyles } from '@car-dealer/ui-web';
import { formatPence } from '@car-dealer/utils';
import { useIdempotencyKey } from '@/hooks/use-idempotency-key';
import { reserveVehicleAction } from '../api/actions';

export function ReserveButton({ listingId, available, signedIn, returnTo }: { listingId: string; available: boolean; signedIn: boolean; returnTo: string }) {
  const idempotencyKey = useIdempotencyKey();
  const mutation = useMutation({ mutationFn: () => reserveVehicleAction({ listingId, idempotencyKey }) });

  if (!available) return <Button disabled>Currently unavailable</Button>;
  if (!signedIn) {
    return (
      <Link href={`/sign-in?next=${encodeURIComponent(returnTo)}`} className={buttonStyles({ size: 'lg' })}>
        Sign in to reserve
      </Link>
    );
  }

  const result = mutation.data;
  if (result?.ok) {
    return (
      <p role="status" className="border border-success/40 bg-success/5 p-4 text-sm text-ink">
        Reserved at {formatPence(result.data.pricePence)}. This price is held for you until{' '}
        {new Date(result.data.expiresAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}. Your branch will be in touch.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <Button size="lg" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? 'Reserving…' : 'Reserve this car'}
      </Button>
      {result && !result.ok ? (
        <p role="alert" className="text-sm text-danger">
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
