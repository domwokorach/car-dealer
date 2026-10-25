# API

REST over JSON. Base URL is `API_BASE_URL` (default `http://localhost:4000`). Request/response shapes are defined once in
[`packages/contracts`](../packages/contracts/src); `packages/api-client` is the typed client.

Authenticated calls send `Authorization: Bearer <Supabase access token>`. Every response includes `x-request-id`.

## Error format

```json
{ "statusCode": 409, "error": "CONFLICT", "message": "Vehicle is not available to reserve", "requestId": "…" }
```

Validation failures are `400` with `message: "Validation failed"` and `issues: [{ path, message }]`. Rate limiting is `429`.
Unexpected failures are a generic `500`; details are only in server logs under the same `requestId`.

## Endpoints

Auth column: **public**, **optional** (token used if present), **user** (any signed-in user), **staff** (any branch
staff or head office; finer rules in [permissions.md](./permissions.md)), **admin** (head office / super admin).

### Health & identity
| Method & path | Auth | Notes |
|---|---|---|
| `GET /health` | public | `{status, database, uptimeSeconds}`; 503 if the database is down. Not rate limited. |
| `GET /me` | user | Server-resolved role and branch access. |

### Public showroom
| Method & path | Auth | Notes |
|---|---|---|
| `GET /vehicles` | public | Published listings. Query: `condition, modelSlug, branchId, fuelType, minPricePence, maxPricePence, sort, page, pageSize`. SOLD/WITHDRAWN hidden. No VIN. |
| `GET /vehicles/:slug` | public | Detail with images. 404 if not published/visible. |
| `GET /models` | public | |
| `GET /branches` | optional | Active branches; admins also see inactive. |
| `POST /enquiries` | optional | Throttled. Branch derived from `listingId`, else `branchId` is required. |

### Customer
| Method & path | Notes |
|---|---|
| `POST /reservations` | Body `{listingId, idempotencyKey}`. Atomic; `201` with the price snapshot, `409` if unavailable. Replaying the same key + user returns the same reservation. Throttled. |
| `GET /reservations/mine` · `POST /reservations/:id/cancel` | Cancel by owner or branch staff. |
| `POST /test-drives` · `GET /test-drives/mine` | Future time only. |
| `GET /orders/mine` | |
| `GET /saved-listings` · `PUT/DELETE /saved-listings/:listingId` | Favourites. |

### Staff
| Method & path | Min. rank | Notes |
|---|---|---|
| `GET /inventory`, `GET /inventory/:id` | staff | Scoped to accessible branches; `branchId` filter must be accessible or 403. |
| `POST /inventory`, `PATCH /inventory/:id` | manager | Price/status edits blocked while reserved/sold/in transit. |
| `POST /listings`, `POST /listings/:id/archive` | manager | |
| `POST /media/upload-url`, `POST /media/confirm` | staff | See *Image uploads*. |
| `GET /reservations` | staff | Active holds in scope. |
| `POST /orders`, `GET /orders` | staff | Order created from a reservation; carries its price snapshot. |
| `PATCH /orders/:id/status` | staff (confirm) / manager (complete, cancel) | `PENDING→CONFIRMED→COMPLETED`, cancel from either. |
| `GET /enquiries`, `PATCH /enquiries/:id/status` | staff | |
| `GET /test-drives`, `PATCH /test-drives/:id/status` | staff | |
| `GET /transfers`, `POST /transfers`, `POST /transfers/:id/complete`, `POST /transfers/:id/cancel` | manager (request/cancel at sender, complete at receiver) | |
| `GET /staff` | manager | Own branches. |
| `GET /variants` | staff | |

### Head office
`POST /branches`, `PATCH /branches/:id`, `POST /staff`, `DELETE /staff/:id`, `POST /models`, `POST /variants`, `GET /audit`
(admin) · `PUT /staff/profiles/:id/role` (super admin only).

## Image uploads

1. `POST /media/upload-url` `{stockVehicleId, contentType, sizeBytes}`: allowed: `image/jpeg|png|webp`, ≤ 8 MB, caller must have branch access.
   Returns `{uploadUrl, token, storagePath}` where `storagePath` is **chosen by the server**.
2. The client uploads the bytes to `uploadUrl` (Supabase signed upload).
3. `POST /media/confirm` `{stockVehicleId, storagePath, altText?}`: the API downloads the object, checks magic bytes and size, deletes it on
   failure, and records the image.

Bucket setup (once, in Supabase): create bucket `vehicle-images` as **public read**, with a 8 MB file size limit and allowed MIME types
`image/jpeg, image/png, image/webp`, and **no** client-side insert/update/delete policies (only the service role writes).

## Rate limits

`API_RATE_LIMIT_MAX` requests per `API_RATE_LIMIT_TTL_SECONDS` per IP (default 120 / 60 s), and `API_STRICT_RATE_LIMIT_MAX` per minute (default 10) for
`POST /enquiries`, `/test-drives`, `/reservations`. The API sets `trust proxy` to 1, so run it behind exactly one proxy hop or adjust `bootstrap.ts`.
