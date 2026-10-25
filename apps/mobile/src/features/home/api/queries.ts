import { useQuery } from '@tanstack/react-query';
import { getApi } from '@/services/api';
import { MAX_FEATURED } from '../lib/hero';

/**
 * Featured vehicles = the newest published, visible listings that have a photo (the API applies the usual
 * publication and branch rules). There is no separate "featured" flag in the data model, so nothing is invented here.
 * One extra listing is requested so a photo that fails to load can be skipped without leaving a gap.
 */
export function useFeaturedVehicles() {
  return useQuery({
    queryKey: ['vehicles', 'featured', MAX_FEATURED],
    queryFn: () => getApi().vehicles.list({ hasImage: true, sort: 'newest', pageSize: MAX_FEATURED + 1 }),
    staleTime: 5 * 60_000,
  });
}
