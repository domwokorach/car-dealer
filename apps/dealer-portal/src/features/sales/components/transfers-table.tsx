import { EmptyState } from '@car-dealer/ui-web';
import { StatusBadge } from '@/components/common-status';
import { DataTable } from '@/components/tables/data-table';
import { getApi, safely } from '@/lib/api';
import { loadBranchNames } from '@/lib/branch-names';
import { formatDateTime } from '@/lib/format';

export async function TransfersTable() {
  const [rows, branchName] = await Promise.all([safely(() => getApi().transfers.list()), loadBranchNames()]);
  if (!rows) return <EmptyState title="Transfers are temporarily unavailable" />;
  return (
    <DataTable
      caption="Inventory transfers"
      empty="No transfers"
      rows={rows}
      rowKey={(t) => t.id}
      columns={[
        { header: 'Requested', cell: (t) => formatDateTime(t.createdAt) },
        { header: 'From', cell: (t) => branchName(t.fromBranchId) },
        { header: 'To', cell: (t) => branchName(t.toBranchId) },
        { header: 'Reason', cell: (t) => t.reason ?? '—' },
        { header: 'Status', cell: (t) => <StatusBadge status={t.status} /> },
      ]}
    />
  );
}
