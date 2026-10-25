import { EmptyState } from '@car-dealer/ui-web';
import { StatusBadge } from '@/components/common-status';
import { DataTable } from '@/components/tables/data-table';
import { getApi, safely } from '@/lib/api';
import { loadBranchNames } from '@/lib/branch-names';
import { formatDateTime } from '@/lib/format';

export async function TestDrivesTable() {
  const [rows, branchName] = await Promise.all([safely(() => getApi().testDrives.list()), loadBranchNames()]);
  if (!rows) return <EmptyState title="Test drives are temporarily unavailable" />;
  return (
    <DataTable
      caption="Test drive appointments"
      empty="No test drives booked"
      rows={rows}
      rowKey={(t) => t.id}
      columns={[
        { header: 'When', cell: (t) => formatDateTime(t.scheduledAt) },
        { header: 'Branch', cell: (t) => branchName(t.branchId) },
        { header: 'Status', cell: (t) => <StatusBadge status={t.status} /> },
      ]}
    />
  );
}
