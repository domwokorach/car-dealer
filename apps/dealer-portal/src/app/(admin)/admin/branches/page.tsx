import type { Metadata } from 'next';
import { PageHeader } from '@car-dealer/ui-web';
import { BranchesTable } from '@/features/branches';

export const metadata: Metadata = { title: 'Branches' };

export default async function Page() {
  return (
    <>
      <PageHeader title="Branches" description="Every branch in the network." />
      <BranchesTable />
    </>
  );
}
