import type { Metadata } from 'next';
import { PageHeader } from '@car-dealer/ui-web';
import { EnquiriesTable } from '@/features/crm';

export const metadata: Metadata = { title: 'Enquiries' };

export default async function Page() {
  return (
    <>
      <PageHeader title="Enquiries" description="Customer enquiries routed to your branches." />
      <EnquiriesTable />
    </>
  );
}
