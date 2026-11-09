# Production readiness and scale plan

## Current release decision

Do **not** claim support for 1,000, 10,000, or 100,000 simultaneous users yet. The code is now safer at the HTTP edge and faster during a cold storefront load, but the current persistence adapter still loads the whole store into each API process and synchronizes whole collections on a write. That design can lose concurrent updates across replicas and grows in work as the store grows. A CDN cannot correct that data-integrity problem.

The safe release path is:

1. Deploy the security changes in this release to a staging environment.
2. Replace the whole-database `getDatabase` / `saveDatabase` adapter with resource-specific PostgreSQL queries and transactions.
3. Add Redis, observability, and a load-test result that meets the targets below.
4. Run a payment, cancellation, and inventory-concurrency test before enabling real payments.

## Changes in this release

- Session cookies now require a real 32+ character server secret; there is no predictable fallback. They are `HttpOnly`, `Secure` in production, `SameSite=Strict`, and high priority.
- The built-in `admin123` fallback and direct `ADMIN_PASSWORD` login bypass were removed. Create the owner from a private PBKDF2 hash as described in the README.
- CORS and mutation-origin checks now accept only exact origins listed in `FRONTEND_URL`; lookalike `*.vercel.app`, `localhost`, and IP domains are not trusted.
- API error responses no longer expose provider/database exception messages.
- Public, non-admin catalog data is compressed and carries short `s-maxage` / stale-while-revalidate directives. The storefront now bootstraps its catalog, categories, promotions, settings, marquees, and layout in one cacheable response rather than seven API calls; customer, admin, payment, and mutation responses are never shared-cacheable.
- Concurrent cold requests share one Supabase hydration instead of each first-page request starting its own full eight-query hydration.
- `/ready` checks database readiness and is the Render health probe.
- If `REDIS_URL` is set, global, authentication, and upload rate limits use shared Redis counters across API replicas. Without it, the server warns that its in-memory limiter is single-instance only.
- Expired unpaid cart reservations are released during checkout, and payment verification/rejection is idempotent/state-checked to avoid repeated stock deductions.
- Admin access now uses three independent checks: owner password, one pre-provisioned Google Authenticator-compatible TOTP code, and a pre-provisioned shared six-digit Admin PIN. Neither factor can be created, replaced, or changed by normal login/dashboard users. The owner temporarily enables the separately held `ADMIN_SECURITY_SETUP_KEY` in Render to use `/admin/security-setup`; removing that variable disables the setup actions. The PIN is stored as a PBKDF2 hash and the TOTP secret is AES-256-GCM encrypted before it reaches Supabase. QR codes are short-lived and a pending QR does not replace a working authenticator until its current code is confirmed.

## Required production configuration

Set these only in the backend host's secret manager:

```dotenv
NODE_ENV=production
FRONTEND_URL=https://store.example.com
SESSION_SECRET=<at least 32 random characters>
TOTP_ENCRYPTION_KEY=<different 32+ character secret; do not rotate after enrollment without a recovery plan>
# Temporary and owner-only; remove after provisioning is complete.
ADMIN_SECURITY_SETUP_KEY=<different 32+ character secret>
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SECRET_KEY=<server-only key>
SUPABASE_STORAGE_BUCKET=<existing public Supabase Storage bucket name>
REDIS_URL=rediss://<managed-redis-endpoint>
RAZORPAY_KEY_ID=<live key, only when enabling Razorpay>
RAZORPAY_KEY_SECRET=<live secret, only when enabling Razorpay>
RAZORPAY_WEBHOOK_SECRET=<webhook secret, only when enabling Razorpay>
```

Generate a session secret with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. Rotate any secret or payment key that was ever placed in a source file, browser variable, screenshot, or shared chat.

`FRONTEND_URL` supports a comma-separated, exact allowlist when a separate staging frontend is needed. Never use wildcard origins with credentialed cookies.

For the current deployment, `FRONTEND_URL` must be the exact Vercel URL such as `https://satya-stores-zeta.vercel.app`—no trailing slash.

## CDN and request topology

The current Next.js rewrite keeps browser API requests on the storefront origin. Deploy the frontend on Vercel (or place the custom storefront domain behind Cloudflare) and leave these public GET responses cacheable at the edge for one minute:

```text
Browser → Cloudflare/Vercel edge → Next.js storefront /api rewrite → Express API → Supabase/Redis/Supabase Storage
```

Cache only `GET /api/storefront` (the preferred bootstrap response), `/api/products`, `/api/categories`, `/api/promotions`, `/api/marquees`, `/api/layout`, `/api/settings`, and product reviews. Never cache an authenticated route, request with an admin response, checkout, payment, account, upload, webhook, or any mutation. The code sends `Vary: Cookie` and `no-store` for sensitive responses to enforce this distinction.

The CDN improves first-page latency and absorbs catalog traffic; it is not an API database or a substitute for Redis/PostgreSQL transactions. Configure image delivery through a public Supabase Storage bucket or an image CDN, not inline base64 data or Render's ephemeral disk.

## Database work required before horizontal scale

`backend/db/database.ts` is appropriate only for local development and a temporary small single-instance demo. Before more than one API instance, replace it with a repository layer that:

- selects only required columns and uses cursor pagination for catalog, users, orders, reviews, and inventory history;
- updates one row per mutation instead of upserting every table and re-reading IDs;
- creates orders and reserves inventory in one PostgreSQL transaction/RPC with a conditional stock update;
- stores idempotency keys for checkout, Razorpay verification, refunds, and webhooks;
- moves password-reset tokens, one-time codes, distributed rate limits, and cache invalidation to Redis;
- uses a durable job queue for email/SMS, image processing, webhook retries, and noncritical inventory events.

Add indexes to match actual query plans. At minimum, investigate indexes on `products(publication_status, category_id)`, `orders(user_id, created_at DESC)`, `reviews(product_id, created_at DESC)`, and `inventory_movements(product_id, created_at DESC)` with `EXPLAIN (ANALYZE, BUFFERS)` against production-sized staging data.

## Capacity validation

Use an isolated staging environment with production-size data and synthetic accounts—never production. The included read-only test is [catalog.js](../load-tests/catalog.js).

```powershell
# 100 virtual users, API-origin catalog test
k6 run -e BASE_URL=https://api-staging.example.com -e FRONTEND_ORIGIN=https://staging.example.com -e TARGET_VUS=100 load-tests/catalog.js
```

Run in stages: 100 VUs first, then 1,000. A 10,000- or 100,000-VU test requires distributed load generators and written cost/rate-limit approval; one laptop cannot generate or accurately represent it. VUs are not automatically equal to concurrent humans—set think time and request mix from analytics.

Pass criteria for the public catalog at each approved stage:

| Metric | Target |
| --- | --- |
| Error rate | <1% |
| P95 API latency | <500 ms |
| P99 API latency | <1 s |
| Database connection saturation | <70% sustained |
| CPU/memory | <70% sustained with no growth after a soak test |
| Inventory/payment tests | no oversell, duplicate capture, or duplicate refund |

For checkout, use separate low-rate tests with isolated test inventory and provider sandbox keys. Observe p50/p95/p99, HTTP 429s/5xx, Redis latency, database query time, connection-pool usage, and event-loop lag. Stop a run immediately if error rate rises above 2%, database saturation exceeds 85%, or any payment/inventory invariant fails.

## Operational controls

- Use at least two API instances only after the database adapter has been transactional and Redis-backed; protect them with a managed load balancer and health checks.
- Add structured logs with request IDs, metrics, traces, uptime alerts, database slow-query monitoring, and a protected error tracker. Do not log passwords, session cookies, payment evidence, full UTRs, or authorization headers.
- Keep Supabase RLS enabled and do not expose its service-role key to the frontend. Apply `backend/migrations/20261108_lock_down_public_access.sql` where it has not already been applied.
- Apply `backend/migrations/20261109_add_user_2fa_columns.sql`, `backend/migrations/20261109_admin_mfa_and_passkeys.sql`, and `backend/migrations/20261109_admin_pin_auth.sql` before deploying the admin MFA feature, so encrypted authenticator state and the hashed Admin PIN survive API restarts.
- Schedule dependency, secret, and staging security scans in CI. Block deployment on critical/high dependency findings or a failed load-test gate.
