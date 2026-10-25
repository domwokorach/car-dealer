import type { VehicleCondition } from '@car-dealer/contracts';
import { EmptyState, PageHeader } from '@car-dealer/ui-web';
import { VehicleGrid } from '@/components/vehicles/vehicle-grid';
import { Pagination } from '@/components/common/pagination';
import type { SearchParams } from '@/types/search-params';
import { loadFilterOptions, searchVehicles } from '../api/search-vehicles';
import { parseSearchParams } from '../schemas/search-params';
import { pageHref } from '../utils/pagination';
import { VehicleFilters } from './vehicle-filters';

/** Server Component shared by /new and /used. Routes stay one line; this owns the composition. */
export async function VehicleSearchPage({
  condition,
  basePath,
  params,
}: {
  condition: VehicleCondition;
  basePath: string;
  params: SearchParams;
}) {
  const query = parseSearchParams(params, condition);
  const [result, options] = await Promise.all([searchVehicles(query), loadFilterOptions()]);
  const title = condition === 'NEW' ? 'New cars' : 'Pre-owned cars';

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Showroom" title={title} description={result ? `${result.total} vehicles available across our branches.` : undefined} />
      <VehicleFilters action={basePath} params={params} models={options.models} branches={options.branches} />
      {result === null ? (
        <EmptyState title="The showroom is temporarily unavailable">Please try again in a few minutes.</EmptyState>
      ) : result.items.length === 0 ? (
        <EmptyState title="No vehicles match your filters">Try widening your price range or removing a filter.</EmptyState>
      ) : (
        <>
          <VehicleGrid vehicles={result.items} />
          <Pagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            hrefFor={(p) => pageHref(basePath, params, p)}
          />
        </>
      )}
    </div>
  );
}
