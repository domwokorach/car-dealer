import { formatPence } from '@car-dealer/utils';
import { StatusBadge } from '@/components/common-status';
import { DataTable } from '@/components/tables/data-table';
import { getApi, safely } from '@/lib/api';
import { loadBranchNames } from '@/lib/branch-names';
import { formatDateTime } from '@/lib/format';
import { EmptyState } from '@car-dealer/ui-web';

export async function ReservationsTable() {
  const [rows, branchName] = await Promise.all([safely(() => getApi().reservations.list()), loadBranchNames()]);
  if (!rows) return <EmptyState title="Reservations are temporarily unavailable" />;
  return (
    <DataTable
      caption="Active reservations"
      empty="No active reservations"
      rows={rows}
      rowKey={(r) => r.id}
      columns={[
        { header: 'Branch', cell: (r) => branchName(r.branchId) },
        { header: 'Held price', cell: (r) => formatPence(r.pricePence) },
        { header: 'Expires', cell: (r) => formatDateTime(r.expiresAt) },
        { header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}
