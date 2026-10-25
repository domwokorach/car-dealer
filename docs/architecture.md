# Architecture

Car Dealer is a Turborepo + pnpm monorepo with three deployable apps and a set of shared packages.

```text
 Browser ──► apps/showroom ─┐                          ┌──► Supabase Auth (JWKS, sessions)
 Browser ──► apps/dealer-portal ─┼─► apps/api (NestJS) ─┼──► PostgreSQL (Prisma)
 Future iOS/Android (Expo) ─┘                          └──► Supabase Storage (signed uploads)
```

Browsers never talk to the database or to Supabase directly. The Next.js apps call the API **from the server**
(Server Components and Server Actions) and forward the user's access token. The API verifies that token itself.

## Directory responsibilities

| Path | Responsibility |
|---|---|
| `apps/showroom` | Public storefront: search, vehicle pages, enquiries, test drives, reservations, favourites, account. |
| `apps/dealer-portal` | Staff tool for branch teams and head office. Everything behind sign-in. `noindex`. |
| `apps/api` | The only writer of business data. REST. Owns authentication verification, authorisation, business rules, audit. |
| `packages/database` | The single Prisma schema, migrations, seed and generated client. No app defines its own models. |
| `packages/contracts` | Zod schemas + enums = the public API contract. Used by the API (validation), web (forms), api-client (response parsing) and the future mobile app. |
| `packages/api-client` | Typed `fetch` client. Parses every response with the contracts, so a drifting API fails loudly. |
| `packages/ui-web` | Presentational Tailwind components and design tokens. No data fetching, no business logic. |
| `packages/utils` | Pure functions (money, slugs, dates). |
| `packages/typescript-config`, `packages/eslint-config` | Shared strict presets. |
| `infrastructure/` | Local Postgres (docker), monitoring notes, deployment notes. |
| `tests/e2e` | Playwright against the real stack. |

Dependency direction (enforced by `pnpm check:cycles`, which fails on any import cycle):

```text
apps/* ─► api-client ─► contracts
apps/* ─► ui-web, utils
apps/api ─► database, contracts, utils
```

## API structure (`apps/api/src`)

- `modules/<name>/`: `controller` → `service` → `repository`, plus `dto/` and `*.module.ts`. Small modules without
  queries of their own (e.g. `users`, `health`) intentionally have no repository.
- Controllers only translate HTTP. **Services** hold business rules and transactions. **Repositories** hold Prisma
  queries and the mapping to public shapes. Prisma rows are never returned directly (explicit mappers such as
  `toVehicleSummary`), so internal columns can't leak.
- `common/`: global guards (`AuthGuard` → `RolesGuard`), `ZodValidationPipe`, the secure exception filter,
  request-id middleware, logging interceptor.
- `config/`: Zod-validated environment; the app refuses to boot with an invalid environment.
- Cross-cutting services are global modules: `DatabaseModule` (Prisma), `AuthModule` (token verifier + access
  resolution), `AuditModule`, `NotificationsModule` (transactional outbox).

### Request pipeline

1. `RequestIdMiddleware`: attach/propagate `x-request-id`.
2. `ThrottlerGuard`: global rate limit; stricter, env-configurable limit on abuse-prone writes.
3. `AuthGuard`: verify the bearer token against Supabase's JWKS, then load the **profile and memberships from the
   database**. `@Public()` / `@OptionalAuth()` relax this per route.
4. `RolesGuard`: coarse gate (`@Roles('STAFF')`, `@Roles('HEAD_OFFICE_ADMIN', ...)`).
5. `ZodValidationPipe`: parse body/query with the shared contract.
6. Service: fine-grained branch authorisation via `auth/access-policy.ts` inside the transaction that does the work.
7. `AllExceptionsFilter`: uniform, non-leaky error body.

## Web apps

Feature-based: `features/<name>/{components,api,schemas,utils,tests,hooks}` plus an `index.ts`. Route files are a few
lines and delegate to a feature.

- **Server vs client:** pages and data loading are Server Components. Client components exist only for interaction
  (reserve, enquire, book, favourite) and use TanStack Query mutations that call **Server Actions**. The access
  token never reaches browser JavaScript.
- **Form validation vs API calls:** validation is the shared Zod contract (`schemas/`); the call is a Server Action
  (`api/`) that re-validates. Client validation is a convenience, never a control.
- **Auth state vs domain state:** session handling is in `lib/session.ts` / `lib/supabase/*` / `proxy.ts`; domain data
  comes from `lib/api.ts`.
- **Failure behaviour:** if the API is unreachable, pages render an explicit "temporarily unavailable" state. They never
  substitute made-up data.

## Deviations from the original brief (deliberate)

| Brief | What was built | Why |
|---|---|---|
| Root `app/loading.tsx` in the showroom | `loading.tsx` on `new/`, `used/`, `models/` only | A root loading boundary makes Next stream the page shell with HTTP 200 before `notFound()` runs, so unknown vehicles became soft 404s. Covered by an e2e test. |
| `middleware.ts` | `proxy.ts` | Next.js 16 renamed middleware to proxy. |
| `staff/` and `variants/` as separate modules | Kept as specified | `staff` also owns global-role changes; `variants` is catalogue admin. |
| Customers page in the portal | Placeholder page | The API has no customer-record endpoint yet; it says so on screen. |

## Future mobile app

See [mobile.md](./mobile.md). Nothing in the API or contracts assumes a browser: auth is bearer-token, CORS is not
relied on, and all shapes are in `contracts`.
