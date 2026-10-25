import type { Metadata } from 'next';
import { PageHeader } from '@car-dealer/ui-web';
import { AuditTable } from '@/features/staff';

export const metadata: Metadata = { title: 'Audit log' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AuditPage({ searchParams }: Props) {
  const raw = (await searchParams).page;
  const page = Math.max(1, Number.parseInt((Array.isArray(raw) ? raw[0] : raw) ?? '1', 10) || 1);
  return (
    <>
      <PageHeader title="Audit log" description="Append-only record of staff and system actions." />
      <AuditTable page={page} />
    </>
  );
}
