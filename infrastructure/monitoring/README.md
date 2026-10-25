# Monitoring

Nothing here is deployed by this repository; it records what to watch and where the signals come from.

| Signal | Source | Suggested alert |
|---|---|---|
| API liveness + database reachability | `GET /health` (200 `{status:"ok",database:"up"}`; 503 when the DB is unreachable). Not rate limited. | Uptime check every minute; page after 3 consecutive failures |
| 5xx rate | API logs: `Exceptions` logger lines with a `[requestId]` | > 1% of requests over 5 min |
| 429 rate | `HTTP` log lines with status 429 | Sudden spike (credential stuffing / scraping) |
| Reservation sweeper | `ReservationExpiryJob` logs `released N lapsed reservation(s)` | None expected; investigate if lapsed holds accumulate |
| Outbox backlog | `SELECT count(*) FROM outbox_events WHERE "processedAt" IS NULL` | > 100 for 10 min, or any row with `attempts >= 5` |
| Audit trail | `audit_events` (append-only) | Review `profile.role_changed` and `staff.assigned` events |

Every response carries `x-request-id`; the same id appears in the API log line and in error bodies, so a
customer-reported error can be traced end to end.

Logs contain identifiers and timings only, never request bodies or tokens.
