import type { Metadata } from 'next';
import { PageHeader } from '@car-dealer/ui-web';
import { ReservationsTable } from '@/features/sales';

export const metadata: Metadata = { title: 'Reservations' };

export default async function Page() {
  return (
    <>
      <PageHeader title="Reservations" description="Vehicles currently held for customers." />
      <ReservationsTable />
    </>
  );
}
