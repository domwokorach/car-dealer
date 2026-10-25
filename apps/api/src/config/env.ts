import { z } from 'zod';

const csv = z
  .string()
  .default('')
  .transform((v) =>
    v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

/**
 * An unset, blank, or unedited-placeholder value (e.g. "https://<project-ref>.supabase.co") counts as "not configured".
 * Whether that is acceptable is decided below: fine for local development, rejected in production.
 */
const unset = (v: unknown) => typeof v !== 'string' || v.trim() === '' || v.includes('<');
const optionalUrl = z.preprocess((v) => (unset(v) || !URL.canParse(v as string) ? undefined : v), z.string().url().optional());
const optionalSecret = z.preprocess((v) => (unset(v) ? undefined : v), z.string().min(1).optional());

export const EnvSchema = z
  .object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().default(4000),
  /** 0.0.0.0 = reachable from other devices on the network (phones, emulators). Use 127.0.0.1 to restrict to this machine. */
  API_HOST: z.string().min(1).default('0.0.0.0'),
  API_CORS_ORIGINS: csv,
  API_RATE_LIMIT_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  API_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  /** Per-minute cap for abuse-prone writes (enquiries, test drives, reservations). */
  API_STRICT_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  DATABASE_URL: z.string().min(1),
  SUPABASE_URL: optionalUrl,
  SUPABASE_JWKS_URL: optionalUrl,
  SUPABASE_JWT_ISSUER: optionalUrl,
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default('vehicle-images'),
  RESERVATION_HOLD_MINUTES: z.coerce.number().int().min(1).max(10_080).default(60),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    for (const key of ['SUPABASE_URL', 'SUPABASE_JWKS_URL', 'SUPABASE_JWT_ISSUER', 'SUPABASE_SERVICE_ROLE_KEY'] as const) {
      if (!env[key]) ctx.addIssue({ code: 'custom', path: [key], message: 'required in production' });
    }
  });
export type Env = z.infer<typeof EnvSchema>;

/** True when sign-in can work. When false (development only) every token is rejected: there is no auth bypass. */
export const authConfigured = (env: Env): boolean => Boolean(env.SUPABASE_JWKS_URL && env.SUPABASE_JWT_ISSUER);
export const storageConfigured = (env: Env): boolean => Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

/** Fails fast at boot with a readable list of every missing/invalid variable. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = EnvSchema.safeParse(source);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
  }
  return result.data;
}
