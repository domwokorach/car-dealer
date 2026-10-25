import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getApi } from '@/services/api';
import { toQuery, type CatalogueFilters } from '@/utils/filters';

export function useVehicles(filters: CatalogueFilters) {
  return useInfiniteQuery({
    queryKey: ['vehicles', filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => getApi().vehicles.list(toQuery(filters, pageParam)),
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
  });
}

export function useLatestVehicles(count = 6) {
  return useQuery({
    queryKey: ['vehicles', 'latest', count],
    queryFn: () => getApi().vehicles.list({ pageSize: count, sort: 'newest' }),
  });
}

export function useVehicle(slug: string | undefined) {
  return useQuery({
    queryKey: ['vehicle', slug],
    queryFn: () => getApi().vehicles.get(slug as string),
    enabled: Boolean(slug),
  });
}

export function useBranches() {
  return useQuery({ queryKey: ['branches'], queryFn: () => getApi().branches.list(), staleTime: 5 * 60_000 });
}

export function useModels() {
  return useQuery({ queryKey: ['models'], queryFn: () => getApi().models.list(), staleTime: 5 * 60_000 });
}
