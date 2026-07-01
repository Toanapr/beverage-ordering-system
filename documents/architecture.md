# Architecture — Beverage Ordering System

## 1. Purpose of This Document

While `project-overview.md` explains **what** the project is and **how to run it**, this document explains **how the codebase is organized internally**: layering, module structure, the repository pattern, the local authentication layer, and the conventions every module must follow.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Web/Mobile)                  │
│                        (Stateful Cart)                      │
└───────────────────────────┬─────────────────────────────────┘
                             │ HTTP (REST)
┌───────────────────────────▼─────────────────────────────────┐
│                         NestJS Application                  │
│                                                             │
│  Guards → Interceptors → Pipes → Controller → Service →     │
│  Repository (interface) → Repository (impl)                 │
│                                                             │
│  Cross-cutting: Exception Filters, Response Interceptor,   │
│  Swagger Decorators, Rate Limiting, Custom JWT Auth         │
│  Local Integrations: Local Storage Service (Multer)         │
└──────────────┬───────────────────────────────┬──────────────┘
               │ SQL Queries (TypeORM / Prisma) │
┌──────────────▼──────────────┐                │
│         PostgreSQL          │◄───────────────┘
│      Relational DB          │
└─────────────────────────────┘
```

The system follows NestJS's standard layered architecture:

| Layer | Responsibility |
|---|---|
| **Controller** | Route definitions, request/response shape, applies guards/pipes/Swagger decorators |
| **Service** | Business logic (order state transitions, RBAC checks, password hashing) — depends only on a repository **interface** or core service interfaces, never on raw database models directly |
| **Repository (interface)** | Defines the contract for data access (`findById`, `create`, `paginate`, etc.) — decouples service logic from database library queries |
| **Repository (implementation)** | SQL-based implementation of the interface (e.g. using TypeORM or Prisma) — the only layer writing SQL queries or using ORM managers |
| **Entity / Model** | Database mapping definition (e.g., TypeORM `@Entity` class or Prisma model) |
| **DTO** | Input validation (`class-validator`) and Swagger schema (`@ApiProperty`) |
| **Guard** | Authentication (custom JWT verification) and authorization (role-based, store-membership based) |
| **Interceptor** | Response transformation (Unified Response Format) |
| **Pipe** | Validation & transformation of incoming request payloads |
| **Filter** | Unified exception and error response shape |
| **Swagger Decorator** | Per-endpoint API documentation metadata |

---

## 3. Module Structure (Feature Modules)

Every feature module (`stores`, `orders`, `products`, `auth`, `users`, etc.) is self-contained and follows the same internal structure.

```
src/modules/stores/
├── stores.module.ts
├── stores.controller.ts
├── stores.service.ts
├── dto/
│   ├── create-store.dto.ts
│   └── update-store.dto.ts
├── entities/                    ← Database mapping entity (or prisma client references)
│   └── store.entity.ts
├── repositories/                 ← data-access layer (interface + SQL impl)
│   ├── store.repository.interface.ts
│   ├── store.repository.ts
│   └── store.repository.spec.ts
├── decorators/                   ← Swagger documentation only (see §3.1)
│   ├── index.ts
│   ├── create-store.swagger.ts
│   └── update-store.swagger.ts
├── guards/                        ← module-scoped authorization logic (see §3.2)
│   └── store-staff.guard.ts
└── stores.controller.spec.ts
```

### 3.1 The `decorators/` folder is Swagger-only

Each module's `decorators/` folder exists **only** to hold per-endpoint Swagger documentation decorators — one file per endpoint (`create-store.swagger.ts`, etc.), each bundling everything Swagger needs for that route (`@ApiOperation`, `@ApiResponse`, etc.) into a single decorator applied on the controller method. A barrel `index.ts` re-exports all of them.

### 3.2 The `guards/` folder holds module-scoped authorization logic

Any authorization check that is specific to a module's domain (for example, confirming a Staff user is actually assigned to *this specific* store, and not another store) is implemented as a self-contained guard in that module's `guards/` folder. It reads route parameters and the user payload attached to the request by the global auth guard.

---

## 4. Repository Layer

**Goal:** services should never query the database directly. Every module that touches the database defines a **repository interface** describing what data operations are available (`findById`, `paginate`, `create`, `updateById`, etc.), and a **SQL-based implementation** of that interface (using TypeORM/Prisma).

**File layout**, per module:
- `repositories/<name>.repository.interface.ts` — the contract. Contains no ORM-specific details.
- `repositories/<name>.repository.ts` — the ORM implementation; the only file in the module allowed to write SQL/ORM queries.
- `repositories/<name>.repository.spec.ts` — unit tests against the repository interface using mock stubs.

---

## 5. Local Integrations & Custom Services

Unlike environments using external providers, this MVP implements core services locally:

- **Custom JWT Auth:** Rather than using external identity services (like Clerk), the authentication module handles registration (bcrypt hashing), credentials login, JWT token emission (Access + Refresh tokens), and database session tracking (to blacklist/revoke tokens).
- **Local File Uploads:** Uploaded files (product images) are parsed using `multer` via NestJS's upload interceptors. Validated files are saved locally to `/uploads/` and mapped to HTTP static paths for serving.

---

## 6. Common (Cross-Cutting) Layer

```
src/common/
├── decorators/
│   ├── auth.decorator.ts          # Composes JWT auth guard + role guard + Swagger auth marker
│   ├── current-user.decorator.ts  # Extracts the parsed user from the request
│   ├── roles.decorator.ts         # Sets role metadata read by the global RolesGuard
│   ├── public.decorator.ts        # Marks a route as not requiring authentication
│   └── swagger/                   # Reusable app-wide Swagger decorators
├── guards/
│   ├── jwt-auth.guard.ts          # Verifies the custom JWT token, attaches user payload
│   └── roles.guard.ts             # Checks the user's role against @Roles()
├── interceptors/
│   └── response.interceptor.ts    # Wraps responses in the unified format
├── filters/
│   └── http-exception.filter.ts   # Unified error response formatter
├── pipes/
│   └── validation.pipe.ts
└── dto/
    ├── pagination-query.dto.ts
    └── paginated-response.dto.ts
```

---

## 7. Request Lifecycle Example

Example: `PATCH /api/v1/products/:id` (Staff-only product update)

1. **Guard** — The global `JwtAuthGuard` verifies the Access Token, checks the database to verify the user is not banned, and attaches the user payload to the request.
2. **Guard** — The global `RolesGuard` reads the metadata set by `@Roles('staff')` and confirms the caller's role is `staff` (or `admin`).
3. **Guard** (module-scoped) — The `StoreStaffGuard` verifies that the `store_id` associated with the product matches the `store_id` of the authenticated Staff user.
4. **Pipe** — Validates request body properties (e.g. `price >= 0`) using `class-validator` based on DTO specs.
5. **Controller** — Executes the endpoint method, passing parameters to the service layer.
6. **Service** — Applies business logic and invokes the repository interface.
7. **Repository** — Runs the update query against PostgreSQL database and returns the result.
8. **Interceptor** — Wraps the response in the unified response format.

---

## 8. Role-Based Access Control (RBAC) Strategy

| Role | Guard chain used |
|---|---|
| `customer` | `JwtAuthGuard` + `RolesGuard` (`customer`) |
| `staff` | `JwtAuthGuard` + `RolesGuard` (`staff`) + `StoreStaffGuard` (verifies access to specific store resource) |
| `admin` | `JwtAuthGuard` + `RolesGuard` (`admin`) |

- For ownership/membership checks (e.g. "does this staff member belong to the store owning this product?"), a dedicated module-scoped guard is chained after the roles guard.

---

## 9. Database Layer

- Relational schemas are defined in the database database model/entities (e.g. `prisma/schema.prisma` or module `*.entity.ts` files).
- Schema indexes are configured at the database schema layer on query-heavy columns:
  - `users`: index on `email` (login lookup) and `store_id` (staff list).
  - `stores`: index on `is_open` and `is_locked` (discovery filter).
  - `products`: index on `store_id`, `status` (menu lookup).
  - `orders`: index on `customer_id` (history), `store_id` (dashboard), and `order_code` (lookup).