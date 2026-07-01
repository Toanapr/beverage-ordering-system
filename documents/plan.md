# Plan — Beverage Ordering System Roadmap

## 1. Purpose of This Document

[project-overview.md](file:///d:/Dowload/Dekon/beverage-ordering-system/documents/project-overview.md) explains **what** the project is and how to run it. [architecture.md](file:///d:/Dowload/Dekon/beverage-ordering-system/documents/architecture.md) explains **how the codebase is organized internally**. This document explains **the phases in which features are built** and **what tasks are required to complete each milestone**.

Its job is to prevent scope creep: at any point in the project, this file should answer "what phase are we in, what's actually in scope right now, and what is intentionally deferred."

**Status legend:** ⬜ Not started · 🟨 In progress · ✅ Done

---

## 2. Roadmap Overview

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9
Setup     Auth      Catalog   Ordering  Lifecycle Ratings   Admin     Uploads   Hardening Release
```

---

## 3. Milestones & Phases

### Phase 0 — Foundation & Project Setup ⬜

**Goal:** A running PostgreSQL-backed skeleton that every later phase builds on. No business features yet.

- [ ] NestJS project scaffolding, module folder convention (see [architecture.md](file:///d:/Dowload/Dekon/beverage-ordering-system/documents/architecture.md) §3)
- [ ] Connect database connection with PostgreSQL using Prisma or TypeORM
- [ ] `common/` cross-cutting layer: `ResponseInterceptor`, `HttpExceptionFilter`, validation pipes
- [ ] Unified pagination DTOs (`PaginationQueryDto`, `PaginatedResponseDto`) — offset-based
- [ ] `BaseRepository<T>` pattern (interface + SQL mapper implementation)
- [ ] Swagger bootstrap at `/api/docs` and configuration
- [ ] Docker Compose (`api` + `postgres`) runnable locally with just `.env.example`
- [ ] `.env.example` with every environment variable stubbed in

**Exit criteria:** `docker compose up` gives a working app with an empty Swagger page and passing tests.

---

### Phase 1 — Auth & User Management ⬜

**Goal:** Create accounts, log in, and authenticate users with custom JWT tokens.

- [ ] User schema mapping + repository (distinguished by `role`)
- [ ] Custom registration endpoint (email and password), credentials validation, duplicate email check
- [ ] Credentials login returning custom JWT Access Token and Refresh Token
- [ ] Refresh token storage/hashing in database to support revocation checks
- [ ] API refresh token endpoint to reissue access tokens when expired
- [ ] Logout API that invalidates/revokes the refresh token from the database
- [ ] Authentication and role guards (`JwtAuthGuard`, `RolesGuard`, `@Roles()`, `@Auth()`, `@CurrentUser()`)
- [ ] Profile management endpoints: view profile details, update profile information, change password
- [ ] Customer address book: add, edit, delete delivery addresses, set default address

**Exit criteria:** Users can sign up, log in, manage their profiles, and hit secure endpoints using JWT authorization.

---

### Phase 2 — Store & Catalog Management ⬜

**Goal:** Allow Staff to configure store details, categories, and products.

- [ ] Store mapping + repository, store profile details updates
- [ ] Store status toggle: open / temporarily closed status indicators
- [ ] Category CRUD operations (block deletion if categories contain active products)
- [ ] Product CRUD: name, description, price, category, status (active, hidden, out-of-stock)
- [ ] `store-staff.guard.ts` (verifies Staff user is assigned to the store they are managing)
- [ ] Product constraints check (block products with price < 0)

**Exit criteria:** Staff can set up their store, create category folders, and build a menu of catalog products.

---

### Phase 3 — Customer Ordering Flow ⬜

**Goal:** Allow Customers to discover products and checkout using Cash on Delivery (COD).

- [ ] Store discovery: list stores (open/closed filters), search by name
- [ ] Product search and category filters across stores
- [ ] Store detail and product detail retrieval APIs
- [ ] Frontend-driven cart support (checkout takes a list of products directly in requests)
- [ ] Single-store purchase constraint (checkout rejected if items span multiple stores)
- [ ] Checkout endpoint: receiver contact info input, delivery address selection, COD payment validation
- [ ] Order generation: create order in `pending` status, copy snapshot product names/prices to `order_items`, generate short order lookup code

**Exit criteria:** Customers can browse menus, manage a virtual cart, and submit checkout orders to a store.

---

### Phase 4 — Order Lifecycle & Management ⬜

**Goal:** Process orders through their lifecycle and track order history.

- [ ] Order state machine transitions: `pending → preparing → completed` and `cancelled`
- [ ] Customer order tracking: view active orders, order history list (offset-based pagination), cancel order (while `pending` state only, requires reason)
- [ ] Staff order dashboard: view/filter store orders, accept orders (`pending → preparing`), mark completed (`preparing → completed`), cancel orders with reasons
- [ ] State validation: prevent invalid transitions (e.g. Completed to Preparing)

**Exit criteria:** Placed orders can be successfully accepted, processed to completion, or cancelled with reasons.

---

### Phase 5 — Ratings & Store Reports ⬜

**Goal:** Customer reviews feedback loop and store revenue reports.

- [ ] Review/Rating: 1–5 stars + comment, allowed only for `completed` orders (max 1 review per order)
- [ ] Average rating updates (recalculates store average rating and counts)
- [ ] Store revenue analytics for Staff (completed order totals, cancel counts, date range filters)

**Exit criteria:** Completed orders can be rated, store profiles display average ratings, and Staff can check store metrics.

---

### Phase 6 — Admin Module ⬜

**Goal:** Platform-level moderation, store onboarding, and system statistics.

- [ ] Store management: list stores, create new store, toggle lock/unlock stores
- [ ] Staff management: create new Staff user accounts, assign them to a `store_id`
- [ ] User management: list all system users, filter by roles, ban/unban accounts (banned users are blocked from logging in)
- [ ] System-wide analytics (aggregate store counts, user counts, completed orders revenue totals)

**Exit criteria:** Admin can onboard stores, create staff users, manage account locks, and view platform revenues.

---

### Phase 7 — File Upload Integration & Validation ⬜

**Goal:** Support product image uploads with strict format and size validation.

- [ ] Multer middleware configuration in file upload module for product images
- [ ] Local storage setup to save images to `/uploads` directory
- [ ] Image validation: size limit ≤ 5MB, format check (png, jpg, jpeg, webp only)
- [ ] Static files route mapping for serving uploaded media

**Exit criteria:** Products can successfully save and render local image file uploads.

---

### Phase 8 — Hardening & Optimizations ⬜

**Goal:** Security, performance verification, and test coverage requirements.

- [ ] Swagger coverage audit — document request/response details for every endpoint
- [ ] Unit tests audit: verify at least 70% unit test coverage exists on `AuthService`, `ProductsService`, and `OrdersService`
- [ ] General rate limiting verification: ensure general limits are active
- [ ] Database indexes verification: check indexes on users (email), stores (status), products (store, status), and orders (customer, store, status)

**Exit criteria:** Swagger is complete, test coverage meets the 70% threshold, and database/rate queries are optimized.

---

### Phase 9 — Deployment & Release ⬜

**Goal:** Production release configurations.

- [ ] Production environment variables configurations (no credentials in repo)
- [ ] Multi-stage production Dockerfile (non-root execution)
- [ ] Uptime health check endpoint
- [ ] Logging configuration

**Exit criteria:** Clean Docker Compose deploy runs without errors in production mode.

---

## 4. Technical Risks

| # | Risk | Why it matters | Mitigation |
|---|---|---|---|
| R1 | **Order Transaction Consistency** | Modifying database records during checkout must occur consistently | Use SQL Transactions (e.g. Prisma `$transaction` or TypeORM `EntityManager.transaction`) for order checkout |
| R2 | **Refresh Token Blacklist Performance** | Checking refresh token validity on every auth check can cause database overhead | Hash tokens before checking; index the `token_hash` column |
| R3 | **Local Disk Upload Storage Bloat** | Storing files locally on disk can fill up disk space if unbounded | Validate file size (5MB limit) strictly; configure Docker volumes to bind to host storage |
| R4 | **Banned User Active Sessions** | Banned users might still access APIs if their Access Token hasn't expired | Perform a quick user status check (is_banned) in the `JwtAuthGuard` strategy hook |

---

## 5. Future Feature Backlog (Out of Scope for MVP)

- Online payment integration (stripe, e-wallets)
- Voucher promotions and discounts
- Product customization options (size, sugar, toppings, ice level)
- WebSockets real-time notifications and automatic order cancellations
- Multi-branch brand mapping
- Cloudinary / S3 asset storage