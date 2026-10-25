import { Badge, EmptyState } from '@car-dealer/ui-web';
import { DataTable } from '@/components/tables/data-table';
import { getApi, safely } from '@/lib/api';
import { loadBranchNames } from '@/lib/branch-names';
import { humanise } from '@/lib/format';

export async function StaffTable() {
  const [rows, branchName] = await Promise.all([safely(() => getApi().staff.list()), loadBranchNames()]);
  if (!rows) return <EmptyState title="Staff are temporarily unavailable" />;
  return (
    <DataTable
      caption="Branch staff"
      empty="No staff assigned yet"
      rows={rows}
      rowKey={(s) => s.id}
      columns={[
        { header: 'Name', cell: (s) => s.fullName ?? '—' },
        { header: 'Email', cell: (s) => s.email ?? '—' },
        { header: 'Branch', cell: (s) => branchName(s.branchId) },
        { header: 'Role', cell: (s) => humanise(s.role) },
        { header: 'Status', cell: (s) => <Badge tone={s.isActive ? 'success' : 'neutral'}>{s.isActive ? 'Active' : 'Inactive'}</Badge> },
      ]}
    />
  );
}
