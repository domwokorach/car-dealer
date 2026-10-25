# Car Dealer

A premium online showroom and dealership-management platform for one automotive brand with many physical branches.
Customers browse real branch stock, enquire, book test drives and reserve vehicles online. Branch staff run their
branch from a dashboard, and head office controls branches, staff, inventory and sales.

| App | Path | Port | Purpose |
|---|---|---|---|
| Showroom | `apps/showroom` | 3000 | Customer website (Next.js, App Router) |
| Dealer portal | `apps/dealer-portal` | 3001 | Staff / head-office dashboard (Next.js) |
| API | `apps/api` | 4000 | NestJS REST API: auth verification, business rules, audit |
| Mobile | `apps/mobile` | 8081 (Metro) | Expo / React Native app for iOS and Android (Expo Go or development build) |

Shared packages: `database` (Prisma), `contracts` (Zod API contracts), `api-client`, `ui-web`, `utils`, `typescript-config`, `eslint-config`.

**Stack:** Turborepo · pnpm workspaces · TypeScript (strict) · Next.js 16 · NestJS 11 · PostgreSQL · Prisma 6 · Supabase Auth + Storage ·
Tailwind CSS 4 · Zod · TanStack Query · Vitest · Jest · Playwright.

**Run everything (including the phone app): [docs/RUN_PROJECT.md](docs/RUN_PROJECT.md).**

Docs: [architecture](docs/architecture.md) · [database](docs/database.md) · [API](docs/api.md) · [permissions](docs/permissions.md) ·
[development](docs/development.md) · [deployment](docs/deployment.md) · [mobile plan](docs/mobile.md)

## Quick start

**Prerequisites:** Node.js 22+, pnpm 9 (`corepack enable`), PostgreSQL 14+ running locally, and a [Supabase](https://supabase.com) project.

```bash
pnpm install

cp .env.example .env            # then edit it: see "Environment variables" below
createdb car_dealer_dev
createdb car_dealer_test        # throwaway DB for integration tests

pnpm db:generate                # generate the Prisma client
pnpm db:deploy                  # apply migrations
pnpm db:seed                    # optional demo data (3 branches, 2 models, 3 vehicles)

pnpm dev                        # API :4000, showroom :3000, portal :3001, Expo Metro :8081
```

Open <http://localhost:3000>. If your local Postgres needs credentials, put them in `DATABASE_URL`, `DIRECT_URL` and `TEST_DATABASE_URL`.
No Postgres installed? `docker compose -f infrastructure/docker/docker-compose.yml up -d` provides one (with both databases) on `localhost:5432`
(user/password `postgres`).

The API validates its environment at boot and **refuses to start** with a list of what's missing. The web apps start without Supabase (you can browse;
sign-in reports that it isn't configured).

### Create your first administrator

1. Sign in once at the showroom or portal so your profile exists.
2. Promote yourself in the database (there is intentionally no API for the first admin):
   ```sql
   UPDATE profiles SET role = 'SUPER_ADMIN' WHERE email = 'you@example.com';
   ```
3. Sign in to the portal at <http://localhost:3001>, then create branches, models, variants and staff via the API (see [docs/api.md](docs/api.md)).
   The portal currently provides read-only dashboards, tables and an audit log; **management actions are API-only for now** (see *Known limitations*).

## Environment variables

Copy `.env.example` to `.env` at the repo root. `pnpm dev` and the database scripts load it; in production set real environment variables on each host
(real variables always win over the file). Nothing is `NEXT_PUBLIC_`: browsers never receive Supabase keys.

| Variable | Used by | Description |
|---|---|---|
| `DATABASE_URL` | api, database | Pooled PostgreSQL connection |
| `DIRECT_URL` | prisma migrate | Direct (non-pooled) connection; same as `DATABASE_URL` locally |
| `TEST_DATABASE_URL` | api integration tests | **Throwaway** database: tests `TRUNCATE` tables |
| `SUPABASE_URL` | api, web | Project URL |
| `SUPABASE_ANON_KEY` | web | Public anon key; used server-side for sessions |
| `SUPABASE_SERVICE_ROLE_KEY` | api only | Storage signed uploads. **Secret.** |
| `SUPABASE_STORAGE_BUCKET` | api | Defaults to `vehicle-images` |
| `SUPABASE_JWKS_URL`, `SUPABASE_JWT_ISSUER` | api | Used to verify access tokens independently |
| `API_PORT` | api | Default 4000 |
| `API_CORS_ORIGINS` | api | Comma-separated allowed web origins |
| `API_RATE_LIMIT_TTL_SECONDS`, `API_RATE_LIMIT_MAX` | api | Global per-IP limit (default 120 / 60 s) |
| `API_STRICT_RATE_LIMIT_MAX` | api | Per-minute cap on enquiries / test drives / reservations (default 10) |
| `RESERVATION_HOLD_MINUTES` | api | How long a reservation holds a car (default 60) |
| `API_BASE_URL` | web | Server-side URL of the API |

### Supabase setup (once)

- Auth → enable email/password; set the Site URL to `http://localhost:3000` (and add `http://localhost:3001` to redirect URLs).
- Storage → create a bucket named `vehicle-images`: public read, 8 MB limit, MIME types `image/jpeg, image/png, image/webp`, **no** client write policies.
- Settings → API: copy the URL, anon key and service-role key; the JWKS URL is `<url>/auth/v1/.well-known/jwks.json` and the issuer is `<url>/auth/v1`.

## Running things

| Task | Command |
|---|---|
| All apps (watch mode) | `pnpm dev` |
| One app | `pnpm --filter @car-dealer/api dev` · `@car-dealer/showroom` · `@car-dealer/dealer-portal` |
| Production build | `pnpm build` |
| Lint / typecheck / import cycles | `pnpm lint` · `pnpm typecheck` · `pnpm check:cycles` |
| Unit + integration tests | `pnpm db:test:prepare` (once) then `pnpm test` |
| End-to-end tests | `pnpm build && pnpm exec playwright install chromium && pnpm test:e2e` |
| Format | `pnpm format` |

### Database & migrations

```bash
pnpm db:migrate     # after editing packages/database/prisma/schema.prisma: create + apply a migration (dev)
pnpm db:deploy      # apply pending migrations (CI / production)
pnpm db:seed        # demo data; refuses to run when NODE_ENV=production
pnpm db:test:prepare  # apply migrations to TEST_DATABASE_URL
```

Two migrations ship: the generated schema, and `integrity_guards` (hand-written SQL: partial unique indexes, check constraints, price-snapshot and
audit-log triggers). Details in [docs/database.md](docs/database.md).

## Verification status

Run on this codebase before hand-off (all passing): `pnpm lint`, `pnpm typecheck`, `pnpm check:cycles`, `pnpm test`
(unit + 42 API integration tests against real PostgreSQL, including 20 simultaneous buyers racing for one car), `pnpm build`, and 16 Playwright
end-to-end tests against the real API + both web apps.

## Deployment

Showroom and portal → Vercel (one project each, server-side env only). API → any Node.js 22+ host (it runs background timers, so not serverless).
Migrations via `pnpm db:deploy`. Full steps and a release checklist: [docs/deployment.md](docs/deployment.md).

## Known limitations

These are real gaps, not hidden ones:

- **Portal is read-mostly.** It shows dashboards, inventory, enquiries, test drives, reservations, orders, transfers, branches, staff and the audit log, but
  create/edit/transition actions (add stock, publish listing, confirm order, complete transfer, assign staff…) exist **only as API endpoints** so far. The
  Customers page is a placeholder because the API has no customer-record endpoint.
- **Signed-in flows are tested at the API level, not in a browser.** E2E runs without Supabase. Sign-in, reserve, enquire, book and favourite UI flows have not
  been exercised against a live Supabase project in this build.
- **No email/SMS yet.** Business events go into the transactional outbox; with no provider registered they are only logged.
- **No Dockerfile / IaC** for the API; see deployment docs.
- **Mobile app** is built and runs in the iOS Simulator against the real API; Android is verified by bundle compilation only, and signed-in actions need a Supabase project ([docs/mobile.md](docs/mobile.md)).
- Vehicle images have no UI uploader yet (API supports the signed-upload flow); vehicle pages show a "photos coming soon" placeholder until images exist.
# car-dealer
