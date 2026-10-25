import { EmptyState } from '@car-dealer/ui-web';
import { StatusBadge } from '@/components/common-status';
import { DataTable } from '@/components/tables/data-table';
import { getApi, safely } from '@/lib/api';
import { loadBranchNames } from '@/lib/branch-names';
import { formatDateTime } from '@/lib/format';

export async function EnquiriesTable() {
  const [rows, branchName] = await Promise.all([safely(() => getApi().enquiries.list()), loadBranchNames()]);
  if (!rows) return <EmptyState title="Enquiries are temporarily unavailable" />;
  return (
    <DataTable
      caption="Customer enquiries"
      empty="No enquiries"
      rows={rows}
      rowKey={(e) => e.id}
      columns={[
        { header: 'Received', cell: (e) => formatDateTime(e.createdAt) },
        { header: 'Name', cell: (e) => e.name },
        { header: 'Contact', cell: (e) => <a className="underline underline-offset-4" href={`mailto:${e.email}`}>{e.email}</a> },
        { header: 'Branch', cell: (e) => branchName(e.branchId) },
        { header: 'Message', cell: (e) => <span className="line-clamp-2 max-w-xs">{e.message}</span> },
        { header: 'Status', cell: (e) => <StatusBadge status={e.status} /> },
      ]}
    />
  );
}
