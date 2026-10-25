# Mobile app

`apps/mobile` is an Expo SDK 58 / React Native app (Expo Router, TanStack Query, Supabase Auth) that talks to the **existing NestJS API**. It has no backend of its own.
How to run it: [RUN_PROJECT.md](./RUN_PROJECT.md).

```text
apps/mobile/
├── app/                  # Expo Router routes: (tabs) home/cars/saved/account, cars/[slug], branches/[slug],
│                         #   enquiry|test-drive|reservation/[vehicleId], sign-in, branches (map), compare, support, dev/* (showcase)
├── src/
│   ├── components/       # ui (Text, Button, Chip, Input, states), layout (Screen), vehicles (card, gallery, specs)
│   ├── features/         # catalogue, favourites, authentication, enquiries, reservations, test-drives (api hooks + components)
│   ├── hooks/ providers/ theme/ utils/
│   └── services/         # api.ts (typed client), auth.ts (Supabase + Keychain/Keystore), env.ts, secure-storage.ts
├── assets/  app.json  app.config.ts  eas.json  .env.example  package.json  tsconfig.json
```

## What it reuses

| Package | Use |
|---|---|
| `@car-dealer/contracts` | Request/response types; the same Zod schemas validate the enquiry form as the API does |
| `@car-dealer/api-client` | `createApiClient({ baseUrl, getToken })`, the one API client |
| `@car-dealer/utils` | Money formatting |

`packages/database` (Prisma) is **not** used by the app: it is Node-only. Enum values the app needs are in `contracts`. `ui-web` is DOM/Tailwind, so the app has its own native components.

## Design decisions

- **Identifiers:** routes named `[vehicleId]` carry the API's *listing id*; the vehicle page is addressed by `slug`; branches by lower-cased `code` (or id).
- **Auth:** Supabase tokens live in the iOS Keychain / Android Keystore via a chunked `expo-secure-store` adapter (sessions exceed the per-value size limit).
  The API verifies the token itself and decides roles/branches from its database, exactly as for the web apps.
- **API address:** `EXPO_PUBLIC_API_URL`, else (development only) derived from Metro's host. See `src/utils/api-url.ts` (unit-tested).
- **Reservations** send a per-screen idempotency key, so a double tap or flaky network can't create two holds; the backend's concurrency rules are untouched.
- **Test-drive booking** offers real bookable slots (next 14 days, at least an hour ahead) instead of a free-form date picker.
- **Errors are shown, never faked:** if the API is unreachable the screens show an error state with retry.

## UI layer (PanelUI)

[PanelUI](https://panelui.dev) components are **copied into the app** by `panelui-cli` and are ours to edit. Run the CLI from `apps/mobile`, never the repo root.

- **Where:** `components/panel/` (components, `blocks/` demo screens), `lib/`, `hooks/`, `theme.css` (semantic tokens, brand-coloured `primary`/`ring`), `global.css`, `metro.config.js`, `panelui.json` + `panelui-lock.json`. Update with `npx panelui-cli@latest update` / `add <name>`.
- **Existing components stay yours.** `src/components/ui/*` keeps its API (`Button title=…`) but renders PanelUI underneath, so every screen follows light/dark/system theming. PanelUI imports resolve via `@/components/panel/*`, kept separate on purpose: `@/*` maps to `src/*` first, then the app root (`tsconfig.json`).
- **Types:** `tsconfig.json` enables the `react-native-legacy-deep-imports` condition. PanelUI is written against React Native's classic types; RN 0.88's new strict types reject its ref/event types (about 200 errors). Remove the condition when PanelUI targets the strict API.
- **Lint:** vendored `components/panel`, `hooks`, `lib` are excluded in `eslint.config.mjs` (React Compiler rules flag Reanimated shared values).
- **Provider:** one `PanelUIProvider` in `src/providers/app-providers.tsx` (gesture root, themed background, portal host for Dialog/BottomSheet/Select).
- **Theme:** `ThemeSelector` (Account) switches light/dark/system. Use `useColors()` from `@/theme` for values `className` can't reach.
- **Showcase:** `/dev/showcase` (development builds only; link on the Account tab) renders every installed component by category; `/dev/block/[name]` opens the Boarding Pass, Wallet and Activity demo blocks.

### Maps

Native **MapLibre** (`@maplibre/maplibre-react-native`, config plugin in `app.json`) draws `Map`, so maps need a **development build**, not Expo Go (where the map shows an in-place explanation). Branch coordinates are not in the API yet, so each branch address is geocoded on the device (`features/locations/api/coordinates.ts`; no permission needed, unplaceable branches are listed, not drawn). The *locate* control asks for location permission only when pressed.

The default basemap is CARTO's free tiles, which are **non-commercial only**. Set `EXPO_PUBLIC_MAP_TILES_URL`, `EXPO_PUBLIC_MAP_GLYPHS_URL` (and optionally `EXPO_PUBLIC_MAP_FONT`, `EXPO_PUBLIC_MAP_ATTRIBUTION`) to a licensed OpenMapTiles-schema provider before release.

### Run on a simulator or device

```bash
# Full feature set (maps, camera, native modules): a development build.
pnpm --filter @car-dealer/mobile run:ios       # build + install on the iOS simulator (macOS), starts Metro
pnpm --filter @car-dealer/mobile run:android   # build + install on an Android emulator/device
pnpm dev:mobile:dev-client                     # Metro only, for an already-installed dev client
pnpm --filter @car-dealer/mobile eas:dev:ios   # remote iOS development build (EAS)

# Expo Go (not verified since PanelUI was added) cannot load native MapLibre; the map shows an explanation instead.
pnpm dev:mobile:ios      # / pnpm dev:mobile:android
```

Non-clean `expo prebuild` is safe here (`ios/` and `android/` are generated and gitignored); avoid `--clean` unless you mean to regenerate.

## Not done yet

Push notifications (the outbox has no delivery handlers), vehicle photo upload from the app, and automated on-device UI tests.
Needs backend support first: ratings/reviews, in-app support chat (Support currently sends branch enquiries), profile photo upload, branch coordinates, free-text vehicle search. The dealer portal is the Next.js app in `apps/dealer-portal`; PanelUI is React Native only and does not apply there.
