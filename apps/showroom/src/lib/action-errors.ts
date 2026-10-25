import { ApiError } from '@car-dealer/api-client';

/**
 * 4xx messages come from our own API and are written for end users. Anything else (network, 5xx, parsing)
 * is collapsed to a generic message so internals never reach the browser.
 */
export function actionErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Please sign in to continue.';
    if (error.status === 429) return 'Too many attempts. Please wait a minute and try again.';
    if (error.status >= 400 && error.status < 500) return error.message;
  }
  return 'Something went wrong. Please try again.';
}
