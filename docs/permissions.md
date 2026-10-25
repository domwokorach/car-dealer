# Permissions

Authorisation is decided **on the server from database state**. The client never supplies a role or a branch id that is trusted.

## Roles

| Role | Where stored | Scope |
|---|---|---|
| Customer | `profiles.role = CUSTOMER` (default on first sign-in) | Own data only |
| Sales Executive | `staff_memberships.role = SALES_EXECUTIVE` | Per assigned branch |
| Branch Manager | `staff_memberships.role = BRANCH_MANAGER` | Per assigned branch (includes everything a Sales Executive can do there) |
| Head Office Administrator | `profiles.role = HEAD_OFFICE_ADMIN` | All branches |
| Platform Super Administrator | `profiles.role = SUPER_ADMIN` | All branches + may change global roles |

A person can hold different roles at different branches. Inactive memberships and inactive branches grant nothing.

## Matrix

| Capability | Customer | Sales Exec (own branch) | Branch Manager (own branch) | Head Office | Super Admin |
|---|:-:|:-:|:-:|:-:|:-:|
| Browse public showroom, send enquiry | ✔ | ✔ | ✔ | ✔ | ✔ |
| Reserve, book test drive, save favourites | ✔ | ✔ | ✔ | ✔ | ✔ |
| Cancel own reservation | ✔ | ✔ | ✔ | ✔ | ✔ |
| View branch inventory / enquiries / test drives / reservations / orders | ✘ | ✔ | ✔ | ✔ (all) | ✔ (all) |
| Update enquiry & test-drive status | ✘ | ✔ | ✔ | ✔ | ✔ |
| Upload vehicle images | ✘ | ✔ | ✔ | ✔ | ✔ |
| Cancel any reservation at the branch | ✘ | ✔ | ✔ | ✔ | ✔ |
| Create order from a reservation, mark order **confirmed** | ✘ | ✔ | ✔ | ✔ | ✔ |
| Mark order **completed / cancelled** | ✘ | ✘ | ✔ | ✔ | ✔ |
| Create / edit stock, publish / archive listings | ✘ | ✘ | ✔ | ✔ | ✔ |
| Request a transfer (from the vehicle's current branch) | ✘ | ✘ | ✔ | ✔ | ✔ |
| Complete a transfer (at the **receiving** branch) | ✘ | ✘ | ✔ | ✔ | ✔ |
| Cancel a pending transfer (at the **sending** branch) | ✘ | ✘ | ✔ | ✔ | ✔ |
| View staff of own branch | ✘ | ✘ | ✔ | ✔ (all) | ✔ (all) |
| Create / edit branches; assign / deactivate staff; manage models & variants | ✘ | ✘ | ✘ | ✔ | ✔ |
| Read the audit log | ✘ | ✘ | ✘ | ✔ | ✔ |
| Change a profile's global role | ✘ | ✘ | ✘ | ✘ | ✔ (never your own) |

The authoritative source for the matrix is `apps/api/src/modules/*/*.service.ts` using `modules/auth/access-policy.ts`; the behaviour is asserted in
`apps/api/test/access.int-spec.ts` and `sales.int-spec.ts`.

## Bootstrapping the first administrator

There is deliberately no API to create the first super admin. After that person signs in once (which creates their
profile):

```sql
UPDATE profiles SET role = 'SUPER_ADMIN' WHERE email = 'you@example.com';
```

From then on use `PUT /staff/profiles/:id/role` (audited as `profile.role_changed`).

## Other controls

- **Token verification:** RS256 signature via Supabase JWKS, issuer and `authenticated` audience; `sub` must be a UUID. `alg=none`, forged,
  expired, wrong-issuer and wrong-audience tokens are rejected (`token-verifier.spec.ts`).
- **Disabled accounts:** `profiles.isActive = false` → 403 on every request.
- **Rate limiting:** global limit per IP (`API_RATE_LIMIT_*`) and a stricter limit (`API_STRICT_RATE_LIMIT_MAX`/minute) on enquiries,
  test drives and reservations. `/health` is exempt.
- **Uploads:** staff request a signed upload for a **server-generated path**; on confirm the API downloads the object and checks magic bytes
  (JPEG/PNG/WebP only), size ≤ 8 MB, and the path prefix, deleting it on failure. SVG/HTML are never accepted.
- **Errors:** uniform JSON with a `requestId`; no stack traces, SQL, or driver messages. Prisma `P2002` → 409, `P2025` → 404, anything else → generic 500.
- **Audit:** every staff/admin mutation writes an `audit_events` row in the same transaction.
- **Headers:** API uses Helmet; web apps set `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`; the portal is `noindex`.
- **Open redirects:** post-sign-in `next` is accepted only as a same-site relative path (`safe-redirect.ts`).
