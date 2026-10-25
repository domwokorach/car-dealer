import 'server-only';
import { z } from 'zod';

/** `VAR=` in a .env file means "unset", not "empty string". */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === '' ? undefined : v), schema.optional());

const schema = z.object({
  API_BASE_URL: z.string().url(),
  // Malformed values (e.g. an unedited placeholder) are treated as "auth not configured", not a crash.
  SUPABASE_URL: z.preprocess((v) => {
    if (typeof v !== 'string' || v === '') return undefined;
    return URL.canParse(v) ? v : undefined;
  }, z.string().url().optional()),
  SUPABASE_ANON_KEY: optional(z.string().min(1)),
});

let cached: z.infer<typeof schema> | undefined;

/** Validated lazily on first use so `next build` works without runtime secrets. */
export function serverEnv() {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid dealer-portal environment:\n${lines.join('\n')}`);
  }
  cached = parsed.data;
  return cached;
}

export function authConfigured(): boolean {
  const env = serverEnv();
  return Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
}
