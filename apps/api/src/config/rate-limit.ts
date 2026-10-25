import { loadEnv } from './env';

let cached: number | undefined;

/** Resolved lazily so @Throttle() can read the validated env at request time. */
export const strictLimit = (): number => (cached ??= loadEnv().API_STRICT_RATE_LIMIT_MAX);
