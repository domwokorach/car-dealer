import { createApiClient, type ApiClient } from '@car-dealer/api-client';
import { getAccessToken } from './auth';
import { apiTarget } from './env';

/** Thrown (and shown by ErrorState) when no usable API address can be determined. */
export class ApiConfigError extends Error {}

let api: ApiClient | undefined;

/** The single typed client used by every screen. It is the existing NestJS API; the app has no backend of its own. */
export function getApi(): ApiClient {
  if (api) return api;
  if (!apiTarget.ok) throw new ApiConfigError(apiTarget.reason);
  api = createApiClient({ baseUrl: apiTarget.url, getToken: getAccessToken });
  return api;
}
