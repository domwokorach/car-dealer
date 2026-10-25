# Deployment

Three independently deployable apps share one PostgreSQL database and one Supabase project.

| App | Target | Notes |
|---|---|---|
| `apps/showroom` | Vercel | Root directory `apps/showroom` |
| `apps/dealer-portal` | Vercel | Root directory `apps/dealer-portal`; deploy to a separate (ideally staff-only) domain |
| `apps/api` | Any Node.js 22+ host (Render, Railway, Fly.io, a VM, ECS…) | Long-lived process: runs the reservation sweeper and outbox dispatcher |

> The API is not a good fit for serverless functions as written: its background sweeper/dispatcher use timers.

## 1. Database

1. Provision PostgreSQL (Supabase Postgres is fine). Use the **pooled** URL for `DATABASE_URL` and the **direct** URL for `DIRECT_URL`.
2. From CI or a release step: `pnpm install --frozen-lockfile && pnpm db:deploy` (`prisma migrate deploy`). Never run `migrate dev` or the seed against production.
3. Create the first super admin once (see [permissions.md](./permissions.md#bootstrapping-the-first-administrator)).

## 2. Supabase

- **Auth:** enable email/password. Set Site URL to the showroom URL and add the portal URL to redirect allow-list. Decide whether email confirmation is required.
- **Storage:** create the `vehicle-images` bucket as described in [api.md](./api.md#image-uploads).
- Collect: project URL, anon key, service-role key, JWKS URL (`<url>/auth/v1/.well-known/jwks.json`), issuer (`<url>/auth/v1`).

## 3. API (Node host)

Build once, run the compiled output:

```bash
pnpm install --frozen-lockfile
pnpm turbo run build --filter=@car-dealer/api...   # generates the Prisma client, builds shared packages, then the API
node apps/api/dist/main.js
```

Required environment: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_JWKS_URL`, `SUPABASE_JWT_ISSUER`, `SUPABASE_SERVICE_ROLE_KEY`,
`API_CORS_ORIGINS` (exact web origins), `NODE_ENV=production`. Optional: `API_PORT`, `SUPABASE_STORAGE_BUCKET`, rate-limit and
`RESERVATION_HOLD_MINUTES`. The process exits at boot with a list of problems if anything is wrong.

Health check: `GET /health`. Run behind exactly **one** reverse proxy/load balancer (see *trust proxy* in [api.md](./api.md#rate-limits)); terminate TLS there.
Multiple instances are supported (sweeper and outbox use `SKIP LOCKED`).

## 4. Web apps (Vercel)

For each app create a Vercel project from this repository:

- **Root Directory:** `apps/showroom` (or `apps/dealer-portal`); enable "Include source files outside of the Root Directory".
- **Install Command:** `pnpm install --frozen-lockfile`
- **Build Command:** `cd ../.. && pnpm turbo run build --filter=@car-dealer/showroom...` (use `@car-dealer/dealer-portal` for the portal)
- **Environment variables (server-side only; none are `NEXT_PUBLIC_`):** `API_BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.

Add the deployed web origins to the API's `API_CORS_ORIGINS` (browsers don't call the API directly today, but mobile web or future
client-side fetches will).

## 5. After deploying

- `GET <api>/health` returns 200.
- Sign in to the portal as the super admin; create branches, models, variants; assign staff; add stock and publish listings.
- Place a test reservation as a customer, then confirm it appears in the portal and in the audit log.

## Release checklist

- [ ] CI green (lint, typecheck, cycles, unit + integration tests, build, e2e)
- [ ] Migrations reviewed; applied with `pnpm db:deploy` **before** the new API version starts
- [ ] No secrets in the repo; `.env` files are git-ignored
- [ ] `API_CORS_ORIGINS` lists only production origins
- [ ] Storage bucket restrictions (size, MIME) are set

## Not included yet

No Dockerfile or IaC is provided, and no email/SMS provider is connected to the outbox. See [infrastructure/monitoring](../infrastructure/monitoring/README.md) for alerting suggestions.
