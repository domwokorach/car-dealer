import 'server-only';
import { ApiError } from '@car-dealer/api-client';
import { getApi } from '@/lib/api';

/** Returns null for a missing vehicle (→ 404); rethrows real failures so error.tsx can handle them. */
export async function getVehicle(slug: string) {
  try {
    return await getApi().vehicles.get(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
