import type { Branch } from '@car-dealer/contracts';
import { useQueries } from '@tanstack/react-query';
import * as Location from 'expo-location';
import type { LngLat } from '@/components/panel/maplibre';

export const branchAddress = (b: Pick<Branch, 'addressLine1' | 'city' | 'postcode'>) => `${b.addressLine1}, ${b.city} ${b.postcode}, United Kingdom`;

/**
 * The API does not (yet) return branch coordinates, so each branch address is geocoded on the device. This needs no
 * location permission and is cached for the session. A failed lookup resolves to `null`; callers must handle it.
 * When the API gains latitude/longitude, replace this hook and nothing else changes.
 */
export function useBranchCoordinates(branches: Branch[] | undefined) {
  const results = useQueries({
    queries: (branches ?? []).map((b) => ({
      queryKey: ['branch-coordinates', b.id, branchAddress(b)],
      staleTime: Infinity,
      gcTime: Infinity,
      retry: false,
      queryFn: async (): Promise<LngLat | null> => {
        try {
          const [hit] = await Location.geocodeAsync(branchAddress(b));
          return hit ? [hit.longitude, hit.latitude] : null;
        } catch {
          return null;
        }
      },
    })),
  });
  const byId = new Map<string, LngLat | null>();
  (branches ?? []).forEach((b, i) => byId.set(b.id, results[i]?.data ?? null));
  return { byId, pending: results.some((r) => r.isPending) };
}
