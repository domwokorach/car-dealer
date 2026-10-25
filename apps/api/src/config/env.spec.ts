import { authConfigured, loadEnv, storageConfigured } from './env';

const valid = {
  DATABASE_URL: 'postgresql://localhost/x',
  SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_JWKS_URL: 'https://x.supabase.co/auth/v1/.well-known/jwks.json',
  SUPABASE_JWT_ISSUER: 'https://x.supabase.co/auth/v1',
  SUPABASE_SERVICE_ROLE_KEY: 'k',
};

describe('loadEnv', () => {
  it('applies defaults and parses CSV origins', () => {
    const env = loadEnv({ ...valid, API_CORS_ORIGINS: 'http://a.test, http://b.test' });
    expect(env.API_PORT).toBe(4000);
    expect(env.API_HOST).toBe('0.0.0.0');
    expect(env.API_CORS_ORIGINS).toEqual(['http://a.test', 'http://b.test']);
  });

  it('reports an invalid DATABASE_URL', () => {
    expect(() => loadEnv({ ...valid, DATABASE_URL: '' })).toThrow(/DATABASE_URL/);
  });

  it('treats missing, blank and placeholder Supabase values as unconfigured in development', () => {
    const env = loadEnv({
      DATABASE_URL: 'postgresql://localhost/x',
      SUPABASE_URL: 'https://<project-ref>.supabase.co',
      SUPABASE_JWKS_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '<service role key>',
    });
    expect(authConfigured(env)).toBe(false);
    expect(storageConfigured(env)).toBe(false);
    expect(authConfigured(loadEnv(valid))).toBe(true);
  });

  it('requires every Supabase value in production, listing each missing one', () => {
    expect(() => loadEnv({ DATABASE_URL: 'postgresql://localhost/x', NODE_ENV: 'production' })).toThrow(
      /SUPABASE_URL[\s\S]*SUPABASE_JWKS_URL[\s\S]*SUPABASE_JWT_ISSUER[\s\S]*SUPABASE_SERVICE_ROLE_KEY/,
    );
    expect(() => loadEnv({ ...valid, NODE_ENV: 'production' })).not.toThrow();
  });
});
