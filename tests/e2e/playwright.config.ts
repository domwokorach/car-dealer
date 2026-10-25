import { defineConfig, devices } from '@playwright/test';

/**
 * Boots the REAL stack from production builds (run `pnpm build` first) against a database that has been
 * migrated and seeded (`pnpm db:migrate && pnpm db:seed`). Supabase is deliberately not configured, so
 * these tests cover the public journey and the auth gates, not signed-in flows.
 */
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required to run e2e tests (see .env.example).');

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm --filter @car-dealer/api start',
      url: 'http://localhost:4000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        NODE_ENV: 'production',
        API_PORT: '4000',
        DATABASE_URL: databaseUrl,
        // Placeholders: nothing in these tests reaches Supabase.
        SUPABASE_URL: 'https://e2e-placeholder.supabase.co',
        SUPABASE_JWKS_URL: 'https://e2e-placeholder.supabase.co/auth/v1/.well-known/jwks.json',
        SUPABASE_JWT_ISSUER: 'https://e2e-placeholder.supabase.co/auth/v1',
        SUPABASE_SERVICE_ROLE_KEY: 'e2e-placeholder',
        API_CORS_ORIGINS: 'http://localhost:3000,http://localhost:3001',
      },
    },
    {
      command: 'pnpm --filter @car-dealer/showroom start',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { API_BASE_URL: 'http://localhost:4000', SUPABASE_URL: '', SUPABASE_ANON_KEY: '' },
    },
    {
      command: 'pnpm --filter @car-dealer/dealer-portal start',
      url: 'http://localhost:3001/sign-in',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { API_BASE_URL: 'http://localhost:4000', SUPABASE_URL: '', SUPABASE_ANON_KEY: '' },
    },
  ],
});
