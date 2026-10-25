import { EmptyState } from '@car-dealer/ui-web';
import { DataTable } from '@/components/tables/data-table';
import { Pagination } from '@/components/tables/pagination';
import { getApi, safely } from '@/lib/api';
import { formatDateTime } from '@/lib/format';

export async function AuditTable({ page }: { page: number }) {
  const result = await safely(() => getApi().audit.list({ page, pageSize: 50 }));
  if (!result) return <EmptyState title="The audit log is temporarily unavailable" />;
  return (
    <div className="space-y-4">
      <DataTable
        caption="Audit events, newest first"
        empty="No audit events yet"
        rows={result.items}
        rowKey={(e) => e.id}
        columns={[
          { header: 'When', cell: (e) => formatDateTime(e.createdAt) },
          { header: 'Action', cell: (e) => <span className="font-mono text-xs">{e.action}</span> },
          { header: 'Entity', cell: (e) => `${e.entityType} ${e.entityId.slice(0, 8)}` },
          { header: 'Actor', cell: (e) => <span className="font-mono text-xs">{e.actorId?.slice(0, 8) ?? 'system'}</span> },
        ]}
      />
      <Pagination page={result.page} pageSize={result.pageSize} total={result.total} hrefFor={(p) => `/admin/audit?page=${p}`} />
    </div>
  );
}
