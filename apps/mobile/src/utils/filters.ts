import type { FuelType, ListVehiclesQuery, VehicleCondition } from '@car-dealer/contracts';

export interface CatalogueFilters {
  condition?: VehicleCondition;
  modelSlug?: string;
  fuelType?: FuelType;
  /** Maximum price in whole pounds (UI unit). */
  maxPricePounds?: number;
  sort: 'newest' | 'price_asc' | 'price_desc';
  branchId?: string;
}

export const PRICE_CAPS = [30_000, 50_000, 75_000, 100_000] as const;

/** UI filters → API query. The UI works in pounds; the API in pence. */
export function toQuery(filters: CatalogueFilters, page: number, pageSize = 12): Partial<ListVehiclesQuery> {
  return {
    condition: filters.condition,
    modelSlug: filters.modelSlug,
    fuelType: filters.fuelType,
    branchId: filters.branchId,
    maxPricePence: filters.maxPricePounds === undefined ? undefined : filters.maxPricePounds * 100,
    sort: filters.sort,
    page,
    pageSize,
  };
}

export function activeFilterCount(f: CatalogueFilters): number {
  return [f.condition, f.modelSlug, f.fuelType, f.maxPricePounds, f.branchId].filter((v) => v !== undefined).length;
}
