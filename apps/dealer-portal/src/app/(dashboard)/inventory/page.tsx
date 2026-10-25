import type { Metadata } from 'next';
import { PageHeader } from '@car-dealer/ui-web';
import { InventoryTable } from '@/features/inventory';

export const metadata: Metadata = { title: 'Inventory' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function InventoryPage({ searchParams }: Props) {
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const page = Math.max(1, Number.parseInt(one(params.page) ?? '1', 10) || 1);
  return (
    <>
      <PageHeader title="Inventory" description="Physical vehicles at the branches you can access." />
      <InventoryTable status={one(params.status)} page={page} />
    </>
  );
}
