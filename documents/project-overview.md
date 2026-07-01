# Project Overview — Beverage Ordering System

## 1. Project Description

This is a web system that allows customers (**Customer**) to order beverages from multiple stores (**Store**) on the same platform. Each store manages its own menu, categories, vouchers, and processes its own orders through a dashboard used by **Staff** and **Owner**. **Admin** manages the full list of stores, users, and orders across the entire system.

### User Roles

| Role | Description |
|---|---|
| `customer` | End user who browses, orders beverages, tracks orders, and leaves ratings |
| `staff` | Store employee who manages the menu, categories, vouchers, and processes incoming orders |
| `owner` | Store owner — has **all `staff` permissions**, plus the exclusive ability to **delete the store** or **pause/resume store operation** (deactivate/reactivate) |
| `admin` | System administrator: approves/locks stores, manages users, views platform-wide reports |

> **Note on `owner` vs `staff`:** functionally, `owner` inherits everything `staff` can do (profile management, categories, menu/options, vouchers, order processing, store reports). The only difference is that `owner` additionally has the authority to:
> - Permanently **delete** the store (soft-delete recommended, e.g. `status: deleted`)
> - **Pause** store operations (temporarily stop accepting new orders, distinct from the day-to-day "open/closed" toggle available to staff)
> - **Resume** store operations after a pause
>
> These owner-only actions should be protected by a dedicated role guard (e.g. `@Roles('owner')`) separate from the general `@Roles('staff', 'owner')` guard used on shared endpoints.

### Core Functional Scope

- Auth & user management (Clerk-based registration/login, profile, address book)
- Store & product discovery, cart, ordering, COD payment, voucher application
- Real-time order tracking, order cancellation, order rating
- Store management: categories, menu, option groups, vouchers, order processing workflow
- Owner-exclusive store lifecycle actions: delete store, pause/resume store operation
- System administration: approve/lock stores, manage users, platform-wide revenue reports
- Background jobs: auto-cancel overdue orders, audit log, rate limiting, validated image upload

> For internal code organization — module layout, the repository pattern, the Swagger-only decorators folder, and the shared integrations layer (Clerk, Cloudinary, Mail) — see **`architecture.md`**. This document stays focused on what the project is and how to set it up and run it.

---

## 2. Tech Stack

| Component | Technology |
|---|---|
| Backend framework | [NestJS](https://nestjs.com/) (TypeScript) |
| Database | MongoDB + [Mongoose](https://mongoosejs.com/) |
| API Docs | Swagger (`@nestjs/swagger`) — **mandatory for every endpoint** |
| Auth | [Clerk](https://clerk.com/) (hosted authentication, session management & user identity) |
| Realtime | WebSocket (Socket.IO / `@nestjs/websockets`) |
| File storage | Cloudinary or AWS S3 (5MB limit, jpg/png/webp only) |
| Testing | Jest (unit tests, minimum 70% coverage on business logic) |
| Containerization | Docker + Docker Compose |
| Job scheduling | `@nestjs/schedule` (auto-cancel orders left pending for 15+ minutes) |
| Rate limiting | `@nestjs/throttler` |

---

## 3. Installation

### Prerequisites

- Node.js ≥ 18.x
- npm ≥ 9.x (or yarn/pnpm)
- Docker & Docker Compose (recommended for running MongoDB locally)
- A Clerk account (for `CLERK_SECRET_KEY` / `CLERK_PUBLISHABLE_KEY`)

### Setup Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd <project-folder>

# 2. Install dependencies
npm install

# 3. Create the .env file from the sample
cp .env.example .env
# → edit the environment variables as described in section 4

# 4. Start MongoDB (and any supporting services) via Docker Compose
docker compose up -d

# 5. Run migrations / seed sample data (if applicable)
npm run seed

# 6. Start the app in dev mode
npm run start:dev
```

The app runs by default at: `http://localhost:3000`
Swagger UI: `http://localhost:3000/api/docs`

---

## 4. Environment Variables (Configuration)

Create a `.env` file based on `.env.example`:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# MongoDB
MONGO_URI=mongodb://localhost:27017/beverage-ordering
MONGO_URI_TEST=mongodb://localhost:27017/beverage-ordering-test

# Clerk (Auth)
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Email (transactional notifications, e.g. order confirmation)
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your_mail_user
MAIL_PASSWORD=your_mail_password
MAIL_FROM="Beverage App <no-reply@example.com>"

# Upload (choose one)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
# or
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=

UPLOAD_MAX_SIZE_MB=5
UPLOAD_ALLOWED_TYPES=jpg,png,webp

# Rate limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
LOGIN_THROTTLE_LIMIT=5
LOGIN_THROTTLE_BLOCK_MINUTES=15

# Auto-cancel order job
ORDER_AUTO_CANCEL_MINUTES=15
```

> Note: **never commit a real `.env` file** to the repository — only commit `.env.example`.

---

## 5. Running the Project (Usage)

```bash
# Run in dev mode (watch)
npm run start:dev

# Build for production
npm run build
npm run start:prod

# Lint & format
npm run lint
npm run format

# Run unit tests
npm run test

# Run unit tests with coverage report (must be ≥ 70%)
npm run test:cov

# Run e2e tests
npm run test:e2e

# Run the full stack via Docker
docker compose up -d --build
```

---

## 6. API Documentation (Swagger)

- **Every endpoint must** declare Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`, DTOs with `@ApiProperty`).
- Swagger UI is available at: `GET /api/docs` (enable in `development`/`staging`; disable or protect with basic-auth in `production` if needed).
- Each module (`auth`, `users`, `stores`, `products`, `carts`, `orders`, `vouchers`, `ratings`, `admin`, etc.) has its own tag for easier navigation.
- Standard error responses (400/401/403/404/409/500) must be declared for every endpoint.
- Owner-only endpoints (delete store, pause/resume store) should be clearly tagged, e.g. `@ApiOperation({ summary: 'Delete store (owner only)' })`, and documented with the required `owner` role in the description.
- See `architecture.md` for how per-endpoint Swagger decorators are organized within each module.

---

## 7. Testing

Unit tests are required for **core business logic**, in particular:

- Cart total calculation and voucher application
- Order status transition flow (`pending → preparing → ready → completed`, cancellation)
- Auto-cancel job (orders left pending for more than 15 minutes)
- Image upload validation (size, format)
- Login rate-limiting logic
- Role-based access control: verifying `staff` cannot access owner-only actions (delete/pause/resume store), while `owner` can access both staff and owner-only actions

**Minimum coverage: 70%** — check with `npm run test:cov`, report generated at `coverage/lcov-report/index.html`.

Test files should sit next to the source file as `*.spec.ts`, or under `test/unit/` depending on team convention.

The CI pipeline (if configured) should fail the build if coverage falls below the 70% threshold.

---

## 8. Coding & Response Conventions

### 8.1 Unified Response Format

All API responses go through a shared interceptor, for example:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { },
  "timestamp": "2026-07-01T10:00:00.000Z"
}
```

Errors follow a unified format via an Exception Filter:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["email must be a valid email"],
  "timestamp": "2026-07-01T10:00:00.000Z"
}
```

### 8.2 Standard Pagination (offset-based)

Applied to every list endpoint (store list, order list, product list, etc.):

**Query params:**

```
GET /api/v1/stores?page=1&limit=10
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "items": [ ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalItems": 125,
      "totalPages": 13
    }
  }
}
```

- `page` defaults to 1, `limit` defaults to 10, `limit` max is 100.
- Use a shared `PaginationQueryDto` and `PaginatedResponseDto` across all modules.

### 8.3 Conventional Commits

Commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/) standard:

```
<type>(<scope>): <short description>
```

Common `type` values:

| Type | Meaning |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code formatting, no logic change |
| `refactor` | Code restructuring, no new feature or bug fix |
| `test` | Adding/updating unit tests |
| `chore` | Config, dependency, or tooling updates |
| `perf` | Performance improvements |

Examples:

```
feat(orders): add auto-cancel job for pending orders over 15 minutes
feat(stores): add owner-only endpoint to pause/resume store operation
fix(auth): fix Clerk webhook not syncing role changes
docs(readme): update environment variable setup instructions
test(vouchers): add unit test for percentage-based discount calculation
```

---

## 9. Docker Compose

The `docker-compose.yml` file should provide at minimum 2 services so reviewers can run the project locally with ease:

```yaml
version: "3.8"
services:
  api:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      - mongo
    volumes:
      - .:/app
      - /app/node_modules

  mongo:
    image: mongo:7
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

Reviewers only need to run:

```bash
cp .env.example .env
docker compose up -d --build
```

to access the API at `http://localhost:3000` and Swagger at `http://localhost:3000/api/docs`.

---

## 10. Minimum README Requirements

The root `README.md` should include:

1. A short project description (linking to `project-overview.md` for details, and `architecture.md` for internal structure).
2. Quick setup instructions (from sections 3, 4, 5 above).
3. A table of required environment variables (section 4).
4. A link to the Swagger docs.
5. Instructions for running tests and viewing coverage.
6. Instructions for running via Docker Compose.
7. Commit message conventions (section 8.3).

---

## 11. Additional Technical Notes

- **MongoDB indexes**: `Products` collection indexed on `storeId`, `status`; `Orders` collection indexed on `customerId`, `status` for optimized queries.
- **Audit log**: important actions (order cancellation, status changes, account locking, store deletion/pause/resume) are written to the `audit_logs` collection with `actorId`, `action`, and `timestamp`.
- **Rate limiting**: 100 requests/minute/IP for standard endpoints; login endpoint allows a maximum of 5 failed attempts before a 15-minute lockout.
- **Real-time**: WebSocket gateway pushes new-order notifications to Staff/Owner and status updates to Customers.
- **Role-based access control**: use a general guard (e.g. `@Roles('staff', 'owner')`) for endpoints shared by staff and owner, and a stricter guard (e.g. `@Roles('owner')`) for store deletion and pause/resume actions.
- **Identity vs. domain role**: Clerk owns authentication and user identity; the platform's own `User` record (synced via Clerk webhook) owns the domain-specific `role` (`customer`/`staff`/`owner`/`admin`) used for authorization. See `architecture.md` for how this is wired.