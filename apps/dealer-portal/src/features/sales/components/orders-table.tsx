import { formatPence } from '@car-dealer/utils';
import { EmptyState } from '@car-dealer/ui-web';
import { StatusBadge } from '@/components/common-status';
import { DataTable } from '@/components/tables/data-table';
import { getApi, safely } from '@/lib/api';
import { loadBranchNames } from '@/lib/branch-names';
import { formatDateTime } from '@/lib/format';

export async function OrdersTable() {
  const [rows, branchName] = await Promise.all([safely(() => getApi().orders.list()), loadBranchNames()]);
  if (!rows) return <EmptyState title="Orders are temporarily unavailable" />;
  return (
    <DataTable
      caption="Orders"
      empty="No orders yet"
      rows={rows}
      rowKey={(o) => o.id}
      columns={[
        { header: 'Created', cell: (o) => formatDateTime(o.createdAt) },
        { header: 'Branch', cell: (o) => branchName(o.branchId) },
        { header: 'Agreed price', cell: (o) => formatPence(o.agreedPricePence) },
        { header: 'Status', cell: (o) => <StatusBadge status={o.status} /> },
      ]}
    />
  );
}
