import type { Metadata } from 'next';
import { PageHeader } from '@car-dealer/ui-web';
import { StaffTable } from '@/features/staff';

export const metadata: Metadata = { title: 'Staff' };

export default async function Page() {
  return (
    <>
      <PageHeader title="Staff" description="Branch memberships and roles." />
      <StaffTable />
    </>
  );
}
