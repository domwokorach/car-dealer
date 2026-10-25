export interface ApiUrlInput {
  /** EXPO_PUBLIC_API_URL, if set. */
  configured?: string | undefined;
  /** Metro's host as seen by the app, e.g. "192.168.1.20:8081" (from expo-constants). */
  hostUri?: string | undefined;
  platform: 'ios' | 'android' | 'web' | string;
  isDev: boolean;
  port?: number;
}

export type ApiUrlResult = { ok: true; url: string; source: 'env' | 'metro-host' } | { ok: false; reason: string };

const LOOPBACK = new Set(['localhost', '127.0.0.1', '::1']);

/**
 * Decides which URL the app should use for the NestJS API.
 *
 * - An explicit EXPO_PUBLIC_API_URL always wins (trailing slash removed).
 * - In development, with no explicit URL, the API is assumed to run on the same machine as Metro, so we reuse
 *   Metro's host with the API port. This is what makes `expo start` on a LAN "just work" for Expo Go and simulators.
 * - Android emulators reach the host machine at 10.0.2.2, not localhost.
 * - A tunnel host (ngrok / exp.direct) cannot reach a local API, so we ask for an explicit URL instead of guessing.
 */
export function resolveApiUrl({ configured, hostUri, platform, isDev, port = 4000 }: ApiUrlInput): ApiUrlResult {
  const explicit = configured?.trim();
  if (explicit) return { ok: true, url: explicit.replace(/\/+$/, ''), source: 'env' };

  if (!isDev) return { ok: false, reason: 'EXPO_PUBLIC_API_URL is required in production builds (use https://).' };
  if (!hostUri) return { ok: false, reason: 'Could not detect the Metro host. Set EXPO_PUBLIC_API_URL.' };

  const host = hostUri.replace(/^[a-z]+:\/\//, '').split('/')[0]?.replace(/:\d+$/, '') ?? '';
  if (!host) return { ok: false, reason: 'Could not detect the Metro host. Set EXPO_PUBLIC_API_URL.' };
  if (/\.(exp\.direct|ngrok[\w.-]*\.(io|app|dev))$/i.test(host)) {
    return { ok: false, reason: 'Tunnel mode cannot reach a local API. Set EXPO_PUBLIC_API_URL to your computer’s LAN IP.' };
  }
  const resolved = LOOPBACK.has(host) && platform === 'android' ? '10.0.2.2' : host;
  return { ok: true, url: `http://${resolved}:${port}`, source: 'metro-host' };
}

/** True when the URL points at the phone itself, which can never be the dev machine. */
export function isLoopbackUrl(url: string): boolean {
  try {
    return LOOPBACK.has(new URL(url).hostname.replace(/^\[|\]$/g, ''));
  } catch {
    return false;
  }
}
