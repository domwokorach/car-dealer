import type { Metadata } from 'next';
import { PageHeader } from '@car-dealer/ui-web';
import { DashboardOverview } from '@/features/dashboard';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function Page() {
  return (
    <>
      <PageHeader title="Dashboard" description="Live picture of the stock and sales pipeline you have access to." />
      <DashboardOverview />
    </>
  );
}
