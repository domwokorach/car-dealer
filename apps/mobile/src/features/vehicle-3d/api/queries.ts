import { ApiError } from '@car-dealer/api-client';
import { useQuery } from '@tanstack/react-query';
import { getApi } from '@/services/api';

/** A 404 here is an answer ("this car has none"), not a failure: it resolves to null so it is never retried or shown as an error. */
async function orNull<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Signed URL of the car's 3D model. Only fetched once the 360° view is actually wanted. */
export function useVehicleModel(slug: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['vehicle-3d-model', slug],
    queryFn: () => orNull(getApi().vehicles.model(slug as string)),
    enabled: enabled && Boolean(slug),
    // Signed URLs last an hour; refetch well before they could expire under a user who keeps the screen open.
    staleTime: 20 * 60_000,
    gcTime: 30 * 60_000,
  });
}

/** Photographic turntable frames. Only asked for when there is no 3D model. */
export function useVehicleTurntable(slug: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['vehicle-turntable', slug],
    queryFn: () => orNull(getApi().vehicles.turntable(slug as string)),
    enabled: enabled && Boolean(slug),
    staleTime: 10 * 60_000,
  });
}
