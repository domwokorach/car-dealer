import type { Metadata } from 'next';
import { Container, EmptyState, PageHeader } from '@car-dealer/ui-web';
import { getApi, safely } from '@/lib/api';

export const metadata: Metadata = { title: 'Branches' };
export const dynamic = 'force-dynamic';

export default async function BranchesPage() {
  const branches = await safely(() => getApi().branches.list());
  return (
    <Container className="space-y-8 py-12">
      <PageHeader eyebrow="Visit us" title="Our branches" />
      {branches === null ? (
        <EmptyState title="Branches are temporarily unavailable" />
      ) : branches.length === 0 ? (
        <EmptyState title="No branches yet" />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((b) => (
            <li key={b.id} className="border border-silver/60 p-6">
              <h2 className="text-xl font-light">{b.name}</h2>
              <address className="mt-2 text-sm not-italic text-slate">
                {b.addressLine1}
                <br />
                {b.city}, {b.postcode}
              </address>
              {b.phone ? (
                <p className="mt-3 text-sm">
                  <a className="underline underline-offset-4" href={`tel:${b.phone.replace(/\s+/g, '')}`}>{b.phone}</a>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
