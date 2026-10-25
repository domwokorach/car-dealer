import 'server-only';
import { createApiClient } from '@car-dealer/api-client';
import { serverEnv } from './env';
import { getAccessToken } from './session';

/** One typed API client per call site; the token is read per request, never cached across users. */
export function getApi() {
  return createApiClient({ baseUrl: serverEnv().API_BASE_URL, getToken: getAccessToken });
}

/** Runs an API call and returns null (instead of throwing) when the API is unreachable or errors. */
export async function safely<T>(run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch (error) {
    console.error('[api]', error instanceof Error ? error.message : error);
    return null;
  }
}
