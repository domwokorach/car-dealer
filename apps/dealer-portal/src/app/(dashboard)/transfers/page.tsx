import type { Metadata } from 'next';
import { PageHeader } from '@car-dealer/ui-web';
import { TransfersTable } from '@/features/sales';

export const metadata: Metadata = { title: 'Transfers' };

export default async function Page() {
  return (
    <>
      <PageHeader title="Transfers" description="Vehicles moving between branches." />
      <TransfersTable />
    </>
  );
}
