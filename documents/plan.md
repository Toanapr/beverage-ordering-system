# Plan — Beverage Ordering System Roadmap

## 1. Purpose of This Document

`project-overview.md` explains **what** the project is and how to run it. `architecture.md` explains **how the codebase is structured**. This document explains **the order in which things get built** and **why** — the macro-strategy.

Its job is to prevent scope creep: at any point in the project, this file should answer "what phase are we in, what's actually in scope right now, and what is intentionally deferred." When picking up a task, check which phase it belongs to before starting — work that clearly belongs to a later phase should be flagged, not silently pulled forward.

**Status legend:** ⬜ Not started · 🟨 In progress · ✅ Done

---

## 2. Roadmap Overview

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9
Foundation  Auth      Catalog   Ordering  Order     Ratings   Admin     Owner     Hardening  Release
                                          Lifecycle  & Reports           Actions
```

Phases are mostly sequential — each one depends on the data models and conventions established by the previous one — but phases 5 and 6 can be developed in parallel once Phase 4 is stable, since Admin reporting only reads data that Phase 1–4 already produce.

---

## 3. Milestones

### Phase 0 — Foundation & Project Setup ⬜

**Goal:** a running skeleton that every later phase builds on. No business features yet.

- [ ] NestJS project scaffolding, module folder convention (see `architecture.md` §3)
- [ ] `common/` cross-cutting layer: `ResponseInterceptor`, `HttpExctionPipe`
- [ ] Unified pagination DTOs (`PaginationQueryDto`, `PaginatedResponseDto`) — offset-based
- [ ] Swagger bootstrap at `/api/docs`, plus the `common/decorators/swagger/` convention
- [ ] Docker Compose (`api` + `mongo`) runnable locally by a reviewer with just `.env.example`
- [ ] `.env.example` with every variable used by later phases stubbed in

**Exit criteria:** `docker compose up` gives a working app with an empty Swagger page and a passing (trivial) test suite.

---

### Phase 1 — Auth & User Management ⬜

**Goal:** every role (`customer`, `staff`, `owner`, `admin`) can be created, authenticated, and identified on every request.

- [ ] User schema + repository (shared collection, discriminated by `role`)
- [ ] Registration (email/password or phone), validation, duplicate check
- [ ] Email OTP / verification link — unverified accounts cannot order
- [ ] Login with JWT (access + refresh token), logout (client-side token clear)
- [ ] Forgot / reset password via OTP
- [ ] `JwtAuthGuard`, `RolesGuard`, `@Roles()`, `@Auth()`, `@CurrentUser()` (see `architecture.md` §5)
- [ ] Profile: view/update info, change avatar (upload validation, see Phase 8), change password
- [ ] Address book (Customer): add/edit/delete address, set default
- [ ] Login rate limiting (5 failed attempts → 15 min lock)

**Exit criteria:** all four roles can register/login and hit a protected `/me` endpoint that correctly reflects their role.

**Depends on:** Phase 0.

---

### Phase 2 — Store & Catalog Management ⬜

**Goal:** Staff/Owner can fully manage what a store sells.

- [ ] Store schema + repository, store profile CRUD (name, phone, address, avatar/cover)
- [ ] Store status: open / temporarily closed (day-to-day toggle, distinct from Phase 7's pause)
- [ ] Category CRUD + display order (delete only if empty)
- [ ] Product (menu item) CRUD: name, description, price, image, category, visibility (visible/hidden/out-of-stock)
- [ ] Option groups (Size, Topping, Sugar level, Ice level): required-single vs. multi-select, price deltas
- [ ] `store-owner.guard.ts` / `is-store-owner.decorator.ts` (module-scoped, see `architecture.md` §3)

**Exit criteria:** a Staff or Owner account can build a full menu with option groups end-to-end, visible correctly to Customers.

**Depends on:** Phase 1 (roles + auth).

---

### Phase 3 — Customer Ordering Flow ⬜

**Goal:** a Customer can go from browsing to a placed order.

- [ ] Store discovery: list (open/closed filter), search by name
- [ ] Product search across the platform
- [ ] Store detail page data, category list, product detail
- [ ] Cart: add item with selected options, update quantity, remove item/clear cart
- [ ] Single-store cart constraint (prompt to clear cart when switching stores)
- [ ] Voucher: list valid vouchers for a store, apply/validate against subtotal
- [ ] Checkout: pick address, COD payment, place order (`pending`), generate short order code
- [ ] Voucher usage count decremented atomically on successful order placement

**Exit criteria:** a Customer can place a real order that lands in the target store's dashboard as `pending`.

**Depends on:** Phase 1, Phase 2.

**⚠️ Note:** online payment gateways are explicitly **out of scope** here — COD only (see backlog, §5).

---

### Phase 4 — Order Lifecycle & Realtime ⬜

**Goal:** orders move through their full lifecycle with both sides kept in sync live.

- [ ] Order state machine: `pending → preparing → ready → completed`, plus `cancelled`
- [ ] Customer: view active orders, order history, order detail, cancel (only while `pending`, reason required)
- [ ] Staff/Owner: view/filter orders, accept (`pending → preparing`), advance state, cancel with reason (any state before `completed`)
- [ ] WebSocket gateway: push new order to Staff/Owner, push status updates to Customer
- [ ] Auto-cancel job: `pending` orders older than `ORDER_AUTO_CANCEL_MINUTES` auto-cancel with reason "Store did not respond"
- [ ] Audit log entries for cancellations and state changes

**Exit criteria:** an order placed in Phase 3 can be fully processed to `completed` or `cancelled`, with both sides seeing live updates and no order silently stuck in `pending`.

**Depends on:** Phase 3.

---

### Phase 5 — Ratings & Store Reports ⬜

**Goal:** feedback loop and store-level business insight.

- [ ] Rating: 1–5 stars + short comment, only after `completed`, one rating per order
- [ ] Average rating surfaced on store detail page
- [ ] Store revenue stats (today / this week / this month / custom range)
- [ ] Order stats (completed vs. cancelled counts)
- [ ] Top 5 best-selling products (chart-ready data)

**Exit criteria:** a completed order can be rated, and a Staff/Owner dashboard shows accurate revenue + top-products numbers for a given date range.

**Depends on:** Phase 4.

---

### Phase 6 — Admin Module ⬜

**Goal:** platform-level oversight and moderation.

- [ ] Store list with status filter (active / locked / pending approval)
- [ ] Create store flow: create store → create default Owner account → store starts as `pending_approval`
- [ ] Approve / lock / unlock stores
- [ ] Platform-wide order list, search by order code / customer / store, status-change history for dispute resolution
- [ ] User management: list Customers/Staff/Owners, ban/unban
- [ ] Platform-wide stats: total revenue, new signups by month, store revenue ranking

**Exit criteria:** Admin can onboard a new store end-to-end and investigate a disputed order using only in-app tools.

**Depends on:** Phase 1–5 (reads data produced by all of them). Can start in parallel with Phase 5.

---

### Phase 7 — Owner-Specific Store Actions ⬜

**Goal:** the extra authority that distinguishes `owner` from `staff`.

- [ ] Delete store (soft-delete, `owner`-only, `StoreOwnerGuard`)
- [ ] Pause store operation (stop accepting new orders — distinct from the open/closed toggle in Phase 2)
- [ ] Resume store operation
- [ ] Swagger docs + audit log entries for all three actions
- [ ] RBAC unit tests proving `staff` is rejected on these three endpoints while `owner` succeeds

**Exit criteria:** an Owner can pause, resume, and delete their own store; a Staff account attempting the same gets a 403.

**Depends on:** Phase 2 (store module must exist), Phase 1 (roles).

---

### Phase 8 — Hardening & Non-Functional Requirements ⬜

**Goal:** the project meets the checklist bar for review, not just "works on my machine."

- [ ] Swagger coverage audit — every endpoint from Phase 1–7 documented (`@ApiOperation`, response types, error responses)
- [ ] Unit test coverage ≥ 70% on business logic (voucher calc, order state machine, auto-cancel, upload validation, RBAC) — see `architecture.md` §4.6 on why the repository pattern makes this realistic
- [ ] Upload validation finalized: 5MB limit, jpg/png/webp only, Cloudinary/S3 wired
- [ ] Rate limiting finalized: 100 req/min/IP general, 5 failed logins/15 min lock
- [ ] Audit log completeness pass across all mutating admin/owner/staff actions
- [ ] MongoDB indexes verified (`Products` on `storeId`+`status`, `Orders` on `customerId`+`status`)
- [ ] Docker Compose reviewed for a clean reviewer experience (`cp .env.example .env && docker compose up -d --build`)
- [ ] README finalized per `project-overview.md` §11
- [ ] Commit history conforms to Conventional Commits (retroactive cleanup if needed before submission)

**Exit criteria:** all checklist items from `project-overview.md` §7–§9 are demonstrably true, not just "in progress."

**Depends on:** all feature phases (0–7) being functionally complete.

---

### Phase 9 — Deployment & Release ⬜

**Goal:** the system is reachable outside a local machine.

- [ ] Production environment variables finalized and secured (no secrets in repo)
- [ ] Production Dockerfile (multi-stage build, non-root user)
- [ ] Deployment target chosen and configured (see Risk R8 below — not yet decided)
- [ ] Health check endpoint for uptime monitoring
- [ ] Basic logging/monitoring in production (at minimum: structured logs + error alerting)
- [ ] Swagger disabled or protected in production per `architecture.md`/`project-overview.md` guidance

**Exit criteria:** the system is running on a real URL, reachable by the intended reviewer/user base.

**Depends on:** Phase 8.

---

## 4. Technical Risks

| # | Risk | Why it matters | Mitigation |
|---|---|---|---|
| R1 | **Voucher race condition** — two customers apply the same limited-use voucher simultaneously, both succeed, usage count exceeds the limit | Overselling a discount is a real business cost | Use an atomic Mongo update (`findOneAndUpdate` with a `usedCount < maxUsage` filter) instead of read-then-write; revisit in Phase 3 |
| R2 | **Multi-document consistency** — placing an order touches `Orders`, `Vouchers` (usage count), and possibly `Carts` in one logical operation | MongoDB is not ACID-by-default across collections without transactions | Use Mongoose sessions/transactions (replica set required) for order placement in Phase 3; document the replica-set requirement in `docker-compose.yml` |
| R3 | **Auto-cancel job timing drift** — a scheduled job checking every N minutes doesn't guarantee an exact 15-minute cutoff | Business rule says "15 minutes," not "15–20 minutes" | Accept a small tolerance window (e.g. run every 1 minute) and document the tolerance explicitly rather than promising exact timing |
| R4 | **WebSocket scaling** — `@nestjs/websockets` gateway holds connections in-memory; multiple app instances won't share state | Fine for Phase 4 (single instance), breaks silently if the app is ever scaled horizontally in Phase 9 | Flag explicitly at Phase 9: adopt a Redis adapter for Socket.IO before scaling beyond one instance |
| R5 | **JWT refresh token revocation** — stateless JWTs can't be invalidated server-side by default | A stolen/leaked refresh token stays valid until expiry even after "logout" | Decide in Phase 1 whether to accept this limitation for MVP or add a refresh-token denylist collection |
| R6 | **Upload validation bypass** — client-side MIME type is not trustworthy | A renamed malicious file could pass a naive extension check | Validate actual file signature/magic bytes server-side, not just the extension, in Phase 8 |
| R7 | **70% coverage target on repository-heavy code** — repositories are thin wrappers around Mongoose and are low-value to unit test exhaustively | Chasing coverage % on repositories wastes effort that should go to service-layer business logic | Coverage strategy: prioritize services (voucher calc, state machine, RBAC) for depth; repositories get lighter/integration-style coverage — clarify in Phase 8 rather than late in the project |
| R8 | **Deployment target undecided** | Blocks Phase 9 planning (env config, Dockerfile specifics, DB hosting) | Decide before Phase 8 wraps up — flag as an open decision, not a default |
| R9 | **Store/staff/owner permission overlap** — `owner` inherits all `staff` permissions; a bug in guard composition could either over- or under-grant access | Security-sensitive, especially for delete/pause/resume | RBAC-specific unit tests are a named line item in Phase 7, not left to general test coverage |

---

## 5. Future Feature Backlog (explicitly out of scope for now)

These are acknowledged as valuable but **not** part of the current roadmap. Listing them here exists specifically so they don't get pulled into an earlier phase by accident.

- Online payment gateway integration (in addition to COD)
- Dedicated delivery/shipper role and live delivery tracking
- Push notifications (mobile) in addition to in-app WebSocket + email
- Multi-language support (i18n)
- Full-text/typo-tolerant search (e.g. Elasticsearch) beyond basic name search
- Loyalty points / membership tiers
- Multi-branch support for a single store brand
- CMS-managed homepage banners/promotions
- Fine-grained admin permission levels (beyond a single `admin` role)
- GraphQL API alongside REST
- Native mobile apps
- In-app chat between Customer and Store

If a task from this list is requested mid-project, treat it as a scope-expansion decision, not a normal backlog item — confirm it against this roadmap before starting.

---

## 6. How to Use This Document

- Before starting a task, identify which **Phase** it belongs to. If it belongs to a later phase than the one currently in progress, flag that instead of silently doing it early.
- If a task doesn't fit any phase or matches something in the **Future Backlog**, treat that as a signal to pause and confirm scope rather than proceeding.
- Update the status checkboxes (⬜ / 🟨 / ✅) as work completes — this file should always reflect where the project actually is, not just where it was planned to be.
- Cross-reference `architecture.md` for *how* to implement a phase's tasks (module structure, decorators, repository pattern) and `project-overview.md` for *environment/setup* details needed along the way.