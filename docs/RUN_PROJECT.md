# Running Car Dealer locally

Five things run in development:

| Service | Command | URL / address |
|---|---|---|
| Backend API (NestJS) | `pnpm dev:api` | <http://localhost:4000> (health: `/health`) |
| Customer website (Next.js) | `pnpm dev:showroom` | <http://localhost:3000> |
| Dealer dashboard (Next.js) | `pnpm dev:portal` | <http://localhost:3001> |
| Mobile app (Expo, Metro) | `pnpm dev:mobile` | `exp://<your-LAN-IP>:8081` (QR in the terminal) |
| PostgreSQL | your local server (or docker) | `localhost:5432` |

`pnpm dev` starts API + showroom + portal + Metro together (shared packages rebuild on change). Expo's QR code and keyboard shortcuts only
appear in an interactive terminal, so **use `pnpm dev:mobile` in its own terminal when you want to scan the QR**.

## 1. Prerequisites

- **Node.js 22+** and **pnpm 9** (`corepack enable`)
- **PostgreSQL 14+** running locally (or `docker compose -f infrastructure/docker/docker-compose.yml up -d`)
- A **Supabase** project for sign-in and image uploads. *Optional for first run*: without it the whole stack still starts, public browsing works, and
  sign-in is disabled (see step 3).
- Phone: **Expo Go** from the App Store / Google Play. The phone must be on the **same Wi-Fi** as your computer.
- Optional: Xcode (iOS Simulator), Android Studio (emulator), an Expo account + `eas-cli` for development builds.

## 2. Install

```bash
pnpm install
```

## 3. Configure environment

**Backend and web apps** read the repo-root `.env`:

```bash
cp .env.example .env
```

Edit `DATABASE_URL`, `DIRECT_URL`, `TEST_DATABASE_URL` for your Postgres (include a user/password if your server needs them). Fill the `SUPABASE_*`
values to enable sign-in. Leaving them blank or as the `<project-ref>` placeholders is accepted **in development only**: the API logs a warning and
rejects every sign-in (no bypass). In production they are required.

**Mobile app** reads `apps/mobile/.env` (Expo inlines `EXPO_PUBLIC_*` values into the app, so they are public):

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

| Variable | Meaning |
|---|---|
| `EXPO_PUBLIC_API_URL` | API base URL. **Leave empty in development**: the app derives `http://<Metro host>:4000` automatically (LAN IP for phones, `10.0.2.2` for the Android emulator, `localhost` for the iOS simulator). Set it explicitly for tunnels, staging (`https://…`) or if auto-detection is wrong. The API has no `/v1` prefix. |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase **anon/publishable** key. Never the service-role key. |

Restart Metro after changing `.env` (`pnpm dev:mobile`, or press `r` after `--clear`).

## 4. Database

```bash
createdb car_dealer_dev && createdb car_dealer_test
pnpm db:generate        # Prisma client
pnpm db:deploy          # apply migrations (safe: never resets data)
pnpm db:seed            # optional demo branches, models and vehicles (idempotent; refuses in production)
```

Schema changes: edit `packages/database/prisma/schema.prisma`, then `pnpm db:migrate`. Nothing in the project drops or resets a database.
Check connectivity at any time with `curl localhost:4000/health` (`"database":"up"`).

## 5. Start everything

```bash
pnpm dev                # api + showroom + portal + Metro
```

Or individually, each in its own terminal:

```bash
pnpm dev:api
pnpm dev:showroom
pnpm dev:portal
pnpm dev:mobile         # Expo Go; prints the QR code
```

On start the API prints the addresses a phone can use, e.g. `reachable from your phone at http://192.168.1.20:4000`.
It binds to `0.0.0.0` by default (`API_HOST`), so other devices on your network can reach it.

## 6. Open the mobile app

### iPhone (Expo Go)
1. `pnpm dev:mobile`
2. Open the **Camera** app, point it at the QR code, tap the **Expo Go** banner. (Or open Expo Go and enter the `exp://…` URL.)
3. First launch: allow **Local Network** access when iOS asks (needed to reach Metro and the API).

### Android (Expo Go)
1. `pnpm dev:mobile`
2. Open **Expo Go** → **Scan QR code**.

### Simulators
- iOS Simulator: `pnpm dev:mobile:ios` (press `i` in the Metro terminal, or run with a booted simulator).
- Android emulator: `pnpm dev:mobile:android` (press `a`). The API is reached at `10.0.2.2:4000`.

### Check the connection from inside the app
In development builds the **Account** tab shows a *Developer connection* card with the API URL in use and a **Test API connection** button.

## 7. Website and dashboard

- Showroom: <http://localhost:3000>. Works without sign-in; shows live API data.
- Dealer portal: <http://localhost:3001>. Staff sign-in required (Supabase). To become the first admin, sign in once, then run
  `UPDATE profiles SET role = 'SUPER_ADMIN' WHERE email = 'you@example.com';` and sign in to the portal again.
- Without Supabase configured, the portal shows its sign-in page and cannot go further.

## 8. Development builds (custom native code)

Expo Go includes a fixed set of native modules. Everything this app uses currently runs in Expo Go. Use a **development build** when you add native
libraries or want production-like behaviour. `expo-dev-client` is already installed and configured.

```bash
# one-time (run from the repo root; `pnpm eas` / `pnpm expo` always run inside apps/mobile)
pnpm eas login
pnpm eas init                                    # creates the EAS project and writes its id into app config
# edit ios.bundleIdentifier / android.package in apps/mobile/app.json (defaults: com.cardealer.mobile)
```

Cloud builds (profiles in `apps/mobile/eas.json`; all set `APP_VARIANT=development`):

```bash
pnpm --filter @car-dealer/mobile eas:dev:ios-simulator   # installable on the iOS Simulator
pnpm --filter @car-dealer/mobile eas:dev:ios             # physical iPhone (needs an Apple developer account + `eas device:create`)
pnpm --filter @car-dealer/mobile eas:dev:android         # APK for a physical Android device or emulator
```

Install from the link/QR EAS prints, then start Metro for dev-client mode and open the installed app:

```bash
pnpm dev:mobile:dev-client
```

Local builds (needs Xcode / Android SDK): `pnpm --filter @car-dealer/mobile run:ios` or `run:android`.

**Plain HTTP in development.** Phones talk to your computer over `http://`. Release builds block cleartext traffic by default, so `app.config.ts` enables it **only**
when `APP_VARIANT=development` (Android `usesCleartextTraffic`, iOS `NSAllowsLocalNetworking`). `preview` and `production` builds don't get it: staging and
production must use **HTTPS**.

> **`ConfigError: Cannot determine the project's Expo SDK version because the module 'expo' is not installed`**:
> you ran `expo` or `eas` from the repo root (or another folder), which isn't an Expo project. Use `pnpm expo …` / `pnpm eas …` from anywhere in the
> repo, or `cd apps/mobile` first. Do not `npm install expo` at the root.

## 9. Troubleshooting phone ↔ API connectivity

1. **Never use `localhost` on a physical phone**: it means the phone itself. The app warns and, in development, derives the LAN IP for you.
2. **Same network?** Phone and computer must be on the same Wi-Fi (guest/"client isolation" networks block device-to-device traffic).
3. **Test from the phone's browser**: open `http://<your-LAN-IP>:4000/health`. If that fails, it's network/firewall, not the app.
   Find your IP: `ipconfig getifaddr en0` (macOS Wi-Fi).
4. **macOS firewall**: allow incoming connections for `node` when prompted (System Settings → Network → Firewall).
5. **Tunnel mode** (`expo start --tunnel`) only tunnels Metro, **not the API**. Set `EXPO_PUBLIC_API_URL` to an address the phone can reach (LAN IP, or your
   own tunnel such as ngrok/cloudflared pointed at port 4000).
6. **Android emulator**: use `http://10.0.2.2:4000` (auto-detected). A physical Android phone needs the LAN IP.
7. **"Could not connect to the server" in Expo Go**: Metro isn't running or isn't reachable. Check <http://localhost:8081/status> prints `packager-status:running`.
8. **Stale config after editing `.env`**: restart Metro with `pnpm --filter @car-dealer/mobile exec expo start --go --clear`.
9. **Sign-in says "not configured"**: set the two `EXPO_PUBLIC_SUPABASE_*` values in `apps/mobile/.env` and the `SUPABASE_*` values in the root `.env`
   (the API must verify tokens from the *same* Supabase project), then restart both.
10. **API 401 after sign-in**: the API's `SUPABASE_JWKS_URL` / `SUPABASE_JWT_ISSUER` must match the project the app signs in to.

## 10. Stop and restart

- Stop: `Ctrl+C` in the terminal (stops everything started by that command).
- Free a stuck port: `lsof -nP -iTCP:4000 -sTCP:LISTEN` then `kill <pid>` (ports: 4000 API, 3000 showroom, 3001 portal, 8081 Metro).
- Restart one service: re-run its `pnpm dev:*` command. Metro cache reset: add `--clear`.

## 11. Verify your setup

```bash
pnpm lint && pnpm typecheck && pnpm test      # unit + API integration (needs TEST_DATABASE_URL migrated: pnpm db:test:prepare)
pnpm build && pnpm test:e2e                   # browser tests against production builds (needs a seeded DB)
pnpm --filter @car-dealer/mobile expo:doctor  # Expo project diagnostics
```

## Known limits

- Android has been verified by a successful Hermes bundle build only, not by running on an emulator or device in this environment.
- Sign-in, reservation, enquiry and test-drive *submission* from the app need a real Supabase project; they are covered by API integration tests, not by
  on-device runs.
- Vehicle photos show "Photos coming soon" until images are uploaded through the API's signed-upload flow (no uploader UI yet).
- The portal is read-mostly (see the README).
