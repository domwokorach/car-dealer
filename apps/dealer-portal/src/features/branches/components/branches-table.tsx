import { Badge, EmptyState } from '@car-dealer/ui-web';
import { DataTable } from '@/components/tables/data-table';
import { getApi, safely } from '@/lib/api';

export async function BranchesTable() {
  const rows = await safely(() => getApi().branches.list());
  if (!rows) return <EmptyState title="Branches are temporarily unavailable" />;
  return (
    <DataTable
      caption="Branches"
      empty="No branches"
      rows={rows}
      rowKey={(b) => b.id}
      columns={[
        { header: 'Code', cell: (b) => <span className="font-mono text-xs">{b.code}</span> },
        { header: 'Name', cell: (b) => b.name },
        { header: 'City', cell: (b) => b.city },
        { header: 'Postcode', cell: (b) => b.postcode },
        { header: 'Status', cell: (b) => <Badge tone={b.isActive ? 'success' : 'neutral'}>{b.isActive ? 'Active' : 'Inactive'}</Badge> },
      ]}
    />
  );
}
