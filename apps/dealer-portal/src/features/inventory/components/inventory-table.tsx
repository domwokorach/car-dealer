import Link from 'next/link';
import { STOCK_STATUSES, type StockStatus } from '@car-dealer/contracts';
import { Pagination } from '@/components/tables/pagination';
import { DataTable } from '@/components/tables/data-table';
import { StatusBadge } from '@/components/common-status';
import { getApi, safely } from '@/lib/api';
import { loadBranchNames } from '@/lib/branch-names';
import { formatPence, formatMileage } from '@car-dealer/utils';
import { EmptyState } from '@car-dealer/ui-web';
import { humanise } from '@/lib/format';

export async function InventoryTable({ status, page }: { status?: string; page: number }) {
  const filter = STOCK_STATUSES.find((s): s is StockStatus => s === status);
  const [result, branchName] = await Promise.all([
    safely(() => getApi().inventory.list({ status: filter, page, pageSize: 25 })),
    loadBranchNames(),
  ]);
  if (!result) return <EmptyState title="Inventory is temporarily unavailable" />;

  return (
    <div className="space-y-4">
      <nav aria-label="Filter by status" className="flex flex-wrap gap-2 text-sm">
        <Link className={`px-3 py-1.5 ${!filter ? 'bg-ink text-paper' : 'border border-silver'}`} href="/inventory">All</Link>
        {STOCK_STATUSES.map((s) => (
          <Link key={s} className={`px-3 py-1.5 ${filter === s ? 'bg-ink text-paper' : 'border border-silver'}`} href={`/inventory?status=${s}`}>
            {humanise(s)}
          </Link>
        ))}
      </nav>
      <DataTable
        caption="Stock vehicles"
        empty="No vehicles match this filter"
        rows={result.items}
        rowKey={(v) => v.id}
        columns={[
          { header: 'Vehicle', cell: (v) => `${v.modelName} ${v.variantName}` },
          { header: 'VIN', cell: (v) => <span className="font-mono text-xs">{v.vin ?? '—'}</span> },
          { header: 'Branch', cell: (v) => branchName(v.branchId) },
          { header: 'Condition', cell: (v) => humanise(v.condition) },
          { header: 'Mileage', cell: (v) => (v.mileage === null ? '—' : formatMileage(v.mileage)) },
          { header: 'Status', cell: (v) => <StatusBadge status={v.status} /> },
          { header: 'Price', align: 'right', cell: (v) => formatPence(v.askingPricePence) },
        ]}
      />
      <Pagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        hrefFor={(p) => `/inventory?${new URLSearchParams({ ...(filter ? { status: filter } : {}), page: String(p) })}`}
      />
    </div>
  );
}
