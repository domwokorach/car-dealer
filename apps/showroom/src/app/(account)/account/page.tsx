import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Button, Container, EmptyState, PageHeader } from '@car-dealer/ui-web';
import { formatPence } from '@car-dealer/utils';
import { VehicleGrid } from '@/components/vehicles/vehicle-grid';
import { getSavedListings } from '@/features/favourites';
import { getApi, safely } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { humanise } from '@/lib/format';
import { signOutAction } from '../sign-in/actions';

export const metadata: Metadata = { title: 'My account' };
export const dynamic = 'force-dynamic';

const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export default async function AccountPage() {
  const user = await requireUser('/account');
  const [reservations, testDrives, saved] = await Promise.all([
    safely(() => getApi().reservations.mine()),
    safely(() => getApi().testDrives.mine()),
    getSavedListings(),
  ]);

  return (
    <Container className="space-y-12 py-12">
      <PageHeader
        eyebrow="Account"
        title={user.fullName ?? user.email ?? 'My account'}
        actions={
          <form action={signOutAction}>
            <Button type="submit" variant="secondary">Sign out</Button>
          </form>
        }
      />

      <section aria-labelledby="res" className="space-y-4">
        <h2 id="res" className="text-xl font-light tracking-wide">Reservations</h2>
        {!reservations || reservations.length === 0 ? (
          <EmptyState title="No reservations yet">
            <Link href="/new" className="underline underline-offset-4">Browse the showroom</Link>
          </EmptyState>
        ) : (
          <ul className="divide-y divide-silver/50 border border-silver/60">
            {reservations.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <span>{formatPence(r.pricePence)} held</span>
                <span className="text-slate">{r.status === 'ACTIVE' ? `until ${when(r.expiresAt)}` : when(r.createdAt)}</span>
                <Badge tone={r.status === 'ACTIVE' ? 'success' : 'neutral'}>{humanise(r.status)}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="td" className="space-y-4">
        <h2 id="td" className="text-xl font-light tracking-wide">Test drives</h2>
        {!testDrives || testDrives.length === 0 ? (
          <EmptyState title="No test drives booked" />
        ) : (
          <ul className="divide-y divide-silver/50 border border-silver/60">
            {testDrives.map((t) => (
              <li key={t.id} className="flex items-center justify-between p-4 text-sm">
                <span>{when(t.scheduledAt)}</span>
                <Badge>{humanise(t.status)}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="fav" className="space-y-4">
        <h2 id="fav" className="text-xl font-light tracking-wide">Saved cars</h2>
        {!saved || saved.length === 0 ? <EmptyState title="Nothing saved yet" /> : <VehicleGrid vehicles={saved} />}
      </section>
    </Container>
  );
}
