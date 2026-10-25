import type { Metadata } from 'next';
import { PageHeader } from '@car-dealer/ui-web';
import { TestDrivesTable } from '@/features/crm';

export const metadata: Metadata = { title: 'Test drives' };

export default async function Page() {
  return (
    <>
      <PageHeader title="Test drives" description="Upcoming and past test-drive appointments." />
      <TestDrivesTable />
    </>
  );
}
