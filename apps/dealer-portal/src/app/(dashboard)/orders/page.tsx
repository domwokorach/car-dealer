import type { Metadata } from 'next';
import { PageHeader } from '@car-dealer/ui-web';
import { OrdersTable } from '@/features/sales';

export const metadata: Metadata = { title: 'Orders' };

export default async function Page() {
  return (
    <>
      <PageHeader title="Orders" description="Orders and their agreed price snapshots." />
      <OrdersTable />
    </>
  );
}
