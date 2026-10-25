# End-to-end tests

Playwright drives the real API + showroom + dealer portal from production builds.

```bash
pnpm build
pnpm db:migrate && pnpm db:seed
pnpm exec playwright install chromium   # first time only
pnpm test:e2e
```

Supabase is intentionally not configured, so signed-in flows are covered by the API integration tests
(`apps/api/test`) rather than here.
