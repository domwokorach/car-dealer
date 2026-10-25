import { FUEL_TYPES, type ListVehiclesQuery, type VehicleCondition } from '@car-dealer/contracts';
import type { SearchParams } from '@/types/search-params';

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const toInt = (v: string | undefined) => {
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

const SORTS = ['newest', 'price_asc', 'price_desc'] as const;

/** Parse untrusted URL params into an API query. Unknown or malformed values are dropped, never forwarded. */
export function parseSearchParams(params: SearchParams, condition: VehicleCondition): Partial<ListVehiclesQuery> {
  const fuel = first(params.fuel);
  const sort = first(params.sort);
  const pounds = (key: string) => {
    const n = toInt(first(params[key]));
    return n === undefined ? undefined : n * 100; // UI works in pounds; the API in pence.
  };
  return {
    condition,
    page: Math.max(1, toInt(first(params.page)) ?? 1),
    pageSize: 12,
    modelSlug: first(params.model)?.slice(0, 100) || undefined,
    branchId: /^[0-9a-f-]{36}$/i.test(first(params.branch) ?? '') ? first(params.branch) : undefined,
    fuelType: FUEL_TYPES.find((f) => f === fuel),
    minPricePence: pounds('min'),
    maxPricePence: pounds('max'),
    sort: SORTS.find((s) => s === sort) ?? 'newest',
  };
}
