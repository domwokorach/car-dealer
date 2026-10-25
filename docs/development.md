# Development

## Prerequisites

- Node.js 22+ (`.nvmrc`), pnpm 9 (`corepack enable` picks the version from `packageManager`)
- PostgreSQL 14+ running locally (or `docker compose -f infrastructure/docker/docker-compose.yml up -d`)
- A Supabase project (Auth + Storage) for sign-in and image uploads

## First run

```bash
pnpm install
cp .env.example .env            # then fill in values (see README → Environment variables)
createdb car_dealer_dev && createdb car_dealer_test
pnpm db:generate
pnpm db:deploy                  # apply migrations (use `pnpm db:migrate` when changing the schema)
pnpm db:seed                    # optional: demo branches/models/vehicles
pnpm dev                        # api :4000, showroom :3000, dealer-portal :3001
```

Without Supabase configured the API will not boot (it validates its environment). The web apps do boot without it: browsing works, sign-in
says it isn't configured.

## Everyday commands

| Command | What it does |
|---|---|
| `pnpm dev` | All apps in watch mode (shared packages rebuild on change). |
| `pnpm lint` · `pnpm typecheck` · `pnpm build` | Turbo-cached across the workspace. |
| `pnpm test` | Vitest (packages, web) and Jest (API unit **and** integration). Integration tests need `TEST_DATABASE_URL`. |
| `pnpm db:test:prepare` | Apply migrations to `TEST_DATABASE_URL` (do this once, and after each new migration). |
| `pnpm check:cycles` | Fails on any import cycle. |
| `pnpm build && pnpm test:e2e` | Playwright against production builds (needs a seeded DB; `pnpm exec playwright install chromium` once). |
| `pnpm --filter @car-dealer/api test:unit` | Fast API tests with no database. |

## Testing layout

- `packages/*`: Vitest, beside the code.
- `apps/api/src/**/*.spec.ts`: Jest unit tests (no database).
- `apps/api/test/*.int-spec.ts`: Jest integration tests through the real HTTP stack and a real Postgres. Only the token verifier and storage gateway are
  substituted. **They `TRUNCATE` tables: `TEST_DATABASE_URL` must be a throwaway database.**
- `apps/*/src/**/*.test.ts`: Vitest for web utilities and feature logic.
- `tests/e2e`: Playwright.

## Conventions

- Folders kebab-case; React components PascalCase; hooks `useThing`; functions camelCase; constants `UPPER_SNAKE_CASE`; types PascalCase.
- No business logic in components. Rules belong in API services; the web only parses input, calls the API and renders.
- Never return Prisma rows from controllers. Add a mapper to a contract type.
- Every branch-scoped read/write goes through `modules/auth/access-policy.ts`. Add a test to `access.int-spec.ts` when adding an endpoint.
- Mutating staff actions write an `audit_events` row **in the same transaction**.
- New environment variables: add to `.env.example`, the Zod schema in the owning app, and README.

## Troubleshooting

- *`Invalid environment configuration` on API start*: the message lists every missing/invalid variable.
- *Showroom says "temporarily unavailable"*: the API is down or `API_BASE_URL` is wrong; the cause is logged on the Next.js server (`[api] …`).
- *Next.js build can't find `@car-dealer/*`*: shared packages must be built first. Use `pnpm build` or `pnpm dev` (Turbo orders this).
- *Prisma type errors after schema change*: `pnpm db:generate`.
