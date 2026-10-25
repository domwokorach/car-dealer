import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState, PageHeader } from '@car-dealer/ui-web';
import { getApi, safely } from '@/lib/api';

export const metadata: Metadata = { title: 'Models' };
export const dynamic = 'force-dynamic';

export default async function ModelsPage() {
  const models = await safely(() => getApi().models.list());
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Range" title="Models" />
      {models === null ? (
        <EmptyState title="Models are temporarily unavailable" />
      ) : models.length === 0 ? (
        <EmptyState title="No models yet" />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((m) => (
            <li key={m.id} className="border border-silver/60 p-6">
              <p className="text-xs uppercase tracking-widest text-slate">{m.bodyType}</p>
              <h2 className="mt-1 text-2xl font-light">{m.name}</h2>
              {m.description ? <p className="mt-2 text-sm text-slate">{m.description}</p> : null}
              <div className="mt-4 flex gap-4 text-sm">
                <Link className="underline underline-offset-4" href={`/new?model=${m.slug}`}>New</Link>
                <Link className="underline underline-offset-4" href={`/used?model=${m.slug}`}>Pre-owned</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
