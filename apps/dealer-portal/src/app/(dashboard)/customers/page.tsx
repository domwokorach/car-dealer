import type { Metadata } from 'next';
import { EmptyState, PageHeader } from '@car-dealer/ui-web';

export const metadata: Metadata = { title: 'Customers' };

export default function CustomersPage() {
  return (
    <>
      <PageHeader title="Customers" description="Customer records and history." />
      <EmptyState title="Not available yet">
        The API does not expose customer records yet. Enquiries, test drives and orders already show each customer’s activity.
      </EmptyState>
    </>
  );
}
