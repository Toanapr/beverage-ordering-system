# Project Overview — Beverage Ordering System

## 1. Project Description

This is a web system that allows customers (**Customer**) to order beverages from multiple stores (**Store**). Each store has **Staff** to manage products, categories, and process incoming orders through a store dashboard. **Admin** manages the system-wide list of stores, users, and tracks orders across the entire platform.

### User Roles

| Role | Description |
|---|---|
| `customer` | End user who registers, logs in, browses stores, searches products, places orders (COD), views history, and leaves ratings. |
| `staff` | Store employee who manages categories, products (menu), store profile details (open/closed status), and processes incoming orders for their store. |
| `admin` | System administrator who manages stores (create, lock/unlock), manages Staff accounts, manages all users (banning/unbanning), and views system-wide statistics. |

---

## 2. Core Functional Scope

- **Auth & User Management:** Custom signup and signin via email/password. Custom JWT authentication with Access and Refresh tokens. Refresh token hash stored in database to support secure logout and token revocation. User lockouts (via Admin banning).
- **Customer Features:** Browse active/open stores, view store details, search and filter products, manage cart (frontend state/localStorage, single-store constraint), checkout (COD payment, receiver details, snapshot product info, short order code generation), order history (offset-based pagination), order cancellation (while `pending` state only, reason required).
- **Staff Features:** Update store profile info (name, phone, address, open/closed toggle status), create/update categories, create/update/hide products (with local image upload validation, without size/topping customizations), manage and transition orders (`pending → preparing → completed` or `cancelled` with reasons).
- **Admin Features:** Create and lock/unlock stores, create and assign Staff accounts to specific stores, platform-wide user management (view by role, ban/unban customers/staff), basic platform-wide reports (store counts, user counts, completed orders revenue totals).
- **Technical Requirements:** Unified response interceptor and exception filters, validation pipes, offset-based pagination (`meta` pagination structure), full Swagger docs, local image file uploads validation (Multer, 5MB limit, png/jpg/jpeg/webp only), at least 70% unit test coverage.

---

## 3. Tech Stack

| Component | Technology |
|---|---|
| Backend framework | [NestJS](https://nestjs.com/) (TypeScript) |
| Database | PostgreSQL (SQL relational database) |
| Database ORM | [Prisma](https://www.prisma.io/) or [TypeORM](https://typeorm.io/) |
| API Docs | Swagger (`@nestjs/swagger`) — **mandatory for every endpoint** |
| Auth | Local JWT (Access & Refresh tokens with database-backed session validation) |
| File storage | Local storage (`/uploads` directory via NestJS/Multer integration) |
| Testing | Jest (unit tests, minimum 70% coverage on business logic) |
| Containerization | Docker + Docker Compose |
| Rate limiting | `@nestjs/throttler` (general limits, login failure lockouts) |

---

## 4. Installation & Setup

### Prerequisites

- Node.js ≥ 18.x
- npm ≥ 9.x (or yarn/pnpm)
- Docker & Docker Compose (for running PostgreSQL locally)

### Setup Steps

```bash
# 1. Clone the repository
git clone <repo-url>
# 2. Install dependencies
npm install
# 3. Create the .env file from the sample
cp .env.example .env
# 4. Start PostgreSQL via Docker Compose
docker compose up -d
# 5. Run database migrations and seed demo data
npm run migration:run
npm run seed
# 6. Start the app in development mode
npm run start:dev
```

The application runs by default at: `http://localhost:3000`
Swagger documentation UI is available at: `http://localhost:3000/api/docs`

---

## 5. Environment Variables (Configuration)

Create a `.env` file based on `.env.example`:

```env
# Application Settings
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# PostgreSQL Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/beverage_ordering?schema=public"
DATABASE_URL_TEST="postgresql://postgres:postgres@localhost:5432/beverage_ordering_test?schema=public"

# JWT Authentication Configuration
JWT_ACCESS_SECRET=your_jwt_access_secret_key_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_REFRESH_EXPIRES_IN=7d

# File Upload Configuration
UPLOAD_DIR=./uploads
UPLOAD_MAX_SIZE_MB=5
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,webp

# Rate Limiting Settings
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

---

## 6. API Documentation (Swagger)

- **Every endpoint must** declare Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`, and DTOs with `@ApiProperty`).
- Swagger UI is available at: `GET /api/docs`.
- Standard error responses (400/401/403/404/409/500) must be declared for every endpoint.

---

## 7. Testing

Unit tests are required for **core business logic**, in particular:
- **AuthService:** Registration logic, password validation, duplicate email check, login, and refresh token validation.
- **ProductsService:** Creating and updating products, searching, filtering, offset pagination, store validation for Staff.
- **OrdersService:** Submitting orders, price validation, product validation (exist, active, in-stock), history lookup, permission checks, and order status transitions.

**Minimum coverage: 70%** (verified via `npm run test:cov`).

---

## 8. Coding & Response Conventions

### 8.1 Unified Response Format

All successful responses go through a shared NestJS Interceptor:

```json
{
  "success": true,
  "message": "Success message",
  "data": { }
}
```

For list endpoints, `data` contains the pagination details inside `meta`:

```json
{
  "success": true,
  "message": "Stores retrieved successfully",
  "data": {
    "items": [ ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalItems": 45,
      "totalPages": 5
    }
  }
}
```

Errors follow a unified format via an Exception Filter:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["email must be a valid email"]
}
```

### 8.2 Standard Pagination (offset-based)

Applied to all list query endpoints (`page` and `limit` parameters, e.g., `GET /api/v1/products?page=1&limit=10`).

---

## 9. Docker Compose

The `docker-compose.yml` file provides the backend API and database services:

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
      - postgres
    volumes:
      - .:/app
      - /app/node_modules
      - ./uploads:/app/uploads

  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: beverage_ordering
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```
