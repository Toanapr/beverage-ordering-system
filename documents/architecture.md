# Architecture — Beverage Ordering System

## 1. Purpose of This Document

While `project-overview.md` explains **what** the project is and **how to run it**, this document explains **how the codebase is organized internally**: layering, module structure, the repository pattern, the shared integrations layer, and the conventions every module must follow.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Web/Mobile)                    │
└───────────────────────────┬─────────────────────────────────┘
                             │ HTTP / WebSocket
┌───────────────────────────▼─────────────────────────────────┐
│                         NestJS Application                    │
│                                                                 │
│  Guards → Interceptors → Pipes → Controller → Service →       │
│  Repository (interface) → Repository (impl)                    │
│                                                                 │
│  Cross-cutting: Exception Filters, Response Interceptor,      │
│  Swagger Decorators, Rate Limiting, Audit Logging              │
│  Shared Integrations: Clerk (auth), Cloudinary (storage),      │
│  Mail (transactional email)                                    │
└──────────────┬───────────────────────────────┬───────────────┘
               │ Mongoose                       │ HTTPS (third-party APIs)
┌──────────────▼──────────────┐   ┌─────────────▼───────────────┐
│           MongoDB             │   │  Clerk / Cloudinary / Mail   │
└──────────────────────────────┘   └──────────────────────────────┘
```

The system follows NestJS's standard layered architecture:

| Layer | Responsibility |
|---|---|
| **Controller** | Route definitions, request/response shape, applies guards/pipes/Swagger decorators |
| **Service** | Business logic (voucher calculation, order state transitions, RBAC checks) — depends only on a repository **interface** and on shared-integration **interfaces**, never on Mongoose or a third-party SDK directly |
| **Repository (interface)** | Defines the contract for data access (`findById`, `create`, `paginate`, etc.) — no Mongoose types leak through it |
| **Repository (implementation)** | Mongoose-based implementation of the interface — the only layer allowed to import a Mongoose `Model` and write queries |
| **Schema/Model** | Mongoose schema definition, indexes |
| **DTO** | Input validation (`class-validator`) and Swagger schema (`@ApiProperty`) |
| **Guard** | Authentication (Clerk session verification) and authorization (role-based, ownership-based) |
| **Interceptor** | Response transformation, logging, timeout |
| **Pipe** | Validation & transformation of incoming data |
| **Filter** | Unified error response shape |
| **Swagger Decorator** | Per-endpoint API documentation metadata |
| **Shared Integration** | Wrapper around a third-party service (Clerk, Cloudinary, Mail), exposed to the rest of the app through an interface |

---

## 3. Module Structure (Feature Modules)

Every feature module (`stores`, `orders`, `products`, `vouchers`, etc.) is self-contained and follows the same internal structure. This keeps modules independent and makes it obvious where to add new code.

```
src/modules/stores/
├── stores.module.ts
├── stores.controller.ts
├── stores.service.ts
├── dto/
│   ├── create-store.dto.ts
│   ├── update-store.dto.ts
│   └── pause-store.dto.ts
├── schemas/
│   └── store.schema.ts
├── repositories/                 ← data-access layer (interface + Mongoose impl)
│   ├── store.repository.interface.ts
│   ├── store.repository.ts
│   └── store.repository.spec.ts
├── decorators/                   ← Swagger documentation only (see §3.1)
│   ├── index.ts
│   ├── create-store.swagger.ts
│   ├── update-store.swagger.ts
│   ├── pause-store.swagger.ts
│   └── delete-store.swagger.ts
├── guards/                        ← module-scoped authorization logic (see §3.2)
│   └── store-owner.guard.ts
└── stores.controller.spec.ts
```

### 3.1 The `decorators/` folder is Swagger-only

Each module's `decorators/` folder exists **only** to hold per-endpoint Swagger documentation decorators — one file per endpoint (`create-store.swagger.ts`, `pause-store.swagger.ts`, and so on), each bundling everything Swagger needs for that route (`@ApiOperation`, `@ApiResponse`, `@ApiParam`, error responses) into a single decorator applied on the controller method. A barrel `index.ts` re-exports all of them so a controller only needs one import line.

Naming convention: `*.swagger.ts` — this makes it immediately obvious, next to a controller method, which decorator is documentation-only versus which one affects request handling (guards, pipes).

**Reusable vs. module-specific Swagger decorators:**

- Used across 2+ modules (e.g. a generic paginated-response wrapper, or a bundle of standard error responses used everywhere) → `src/common/decorators/swagger/`
- Specific to one endpoint of one module → `src/modules/<module>/decorators/`

This module-level `decorators/` folder does **not** hold behavior-changing decorators (parameter extraction, ownership metadata, etc.) — that kind of domain logic now lives directly inside the module's `guards/` folder instead, described next.

### 3.2 The `guards/` folder holds module-scoped authorization logic

Any authorization check that's specific to one module's domain (for example, confirming the current user actually owns *this particular* store, not just that their role is `owner`) is implemented as a self-contained guard in that module's `guards/` folder. It reads whatever it needs directly from the request (route params, the authenticated user attached by the global auth guard) without requiring a companion decorator — keeping the module lean to just two concerns: Swagger docs and authorization.

Module-scoped guards run *after* the common, app-wide guards (Clerk session check, global role check) in the guard chain — see §7 for the full request lifecycle.

---

## 4. Repository Layer

**Goal:** services should never talk to Mongoose directly. Every module that touches the database defines a **repository interface** describing what data operations are available (`findById`, `findByOwnerId`, `paginate`, `create`, `updateById`, `softDeleteById`, etc.), and a **Mongoose-based implementation** of that interface. The service depends on the interface only, injected through a dedicated token — which keeps business logic testable and decoupled from the persistence technology.

**File layout**, per module:

- `repositories/<name>.repository.interface.ts` — the contract, plus the injection token used to bind it in the module's providers. Contains no Mongoose types.
- `repositories/<name>.repository.ts` — the Mongoose implementation; the only file in the module allowed to import a Mongoose `Model` and write actual queries.
- `repositories/<name>.repository.spec.ts` — unit tests, typically written against the interface with a mocked implementation.

**Why bother with an interface** instead of injecting the Mongoose model straight into the service:

- **Testability** — unit tests mock the repository interface with a plain stub, no need to spin up MongoDB or mock Mongoose's chainable query API. This is what makes the 70% coverage target on services realistic.
- **Decoupling** — business logic has zero knowledge of Mongoose. If the persistence layer ever changes, only the repository implementation changes.
- **Single responsibility** — query logic (filters, pagination, projections) lives in one place per module instead of being scattered across service methods.
- **Consistent contract** — every module's repository exposes a predictable shape, which makes onboarding to a new module faster.

**Optional base repository:** if most repositories share the same CRUD shape (`findById`, `updateById`, `softDeleteById`), that shared behavior can be extracted into a generic base class under `src/common/repositories/`, extended by each module's concrete repository. Each module's own interface can likewise extend a shared base interface for the common methods and add module-specific ones on top.

---

## 5. Shared Integrations Layer (Third-Party Services)

**Goal:** third-party services that aren't owned by any single business domain — authentication (Clerk), file storage (Cloudinary/S3), and transactional email (Mail) — get one shared home instead of being duplicated or awkwardly imported across unrelated feature modules.

```
src/integrations/
├── clerk/
│   ├── clerk.module.ts
│   ├── clerk.service.ts               # wraps Clerk SDK: verify session, fetch user, handle webhooks
│   └── clerk.service.interface.ts
├── cloudinary/
│   ├── cloudinary.module.ts
│   ├── cloudinary.service.ts
│   └── cloudinary.service.interface.ts   # swappable for an S3 implementation later
└── mail/
    ├── mail.module.ts
    ├── mail.service.ts
    └── mail.service.interface.ts
```

Each integration follows the same interface-behind-a-token pattern already used for repositories (§4): consumers depend on `IStorageService` or `IMailService`, not on the Cloudinary or nodemailer SDK directly. This means swapping Cloudinary for S3, or one mail provider for another, only touches the corresponding folder under `integrations/`.

**How feature modules use this layer:**

- Any module that accepts an image upload (`stores`, `products`, `users`' avatar) depends on the storage interface exported by `integrations/cloudinary/`.
- Any module that needs to send a transactional email (order confirmation, account notices) depends on the mail interface exported by `integrations/mail/`.
- The global authentication guard in `common/guards/` depends on `integrations/clerk/` to verify the incoming session and resolve the caller's identity. Clerk owns authentication and identity; it does **not** own the platform's domain-specific role (`customer`/`staff`/`owner`/`admin`) — that still lives on the app's own `User` record, kept in sync with Clerk via webhook (handled by `clerk.service.ts`) whenever a user is created or updated on Clerk's side.

**Rule of thumb for what belongs in `integrations/` vs. a feature module:** if the thing you're wrapping is a call to an external vendor's API/SDK, it belongs in `integrations/`. If it's domain logic that happens to use one of those integrations, it stays in the feature module's service and simply injects the integration's interface.

---

## 6. Common (Cross-Cutting) Layer

```
src/common/
├── decorators/
│   ├── auth.decorator.ts          # composes the Clerk auth guard + role guard + Swagger auth marker
│   ├── current-user.decorator.ts  # extracts the resolved user from the request
│   ├── roles.decorator.ts         # sets role metadata read by the global RolesGuard
│   ├── public.decorator.ts        # marks a route as not requiring authentication
│   └── swagger/                    # reusable, app-wide Swagger decorators
│       ├── index.ts
│       ├── api-paginated-response.decorator.ts
│       └── api-standard-errors.decorator.ts
├── guards/
│   ├── clerk-auth.guard.ts         # verifies the Clerk session, attaches the resolved user
│   └── roles.guard.ts              # checks the user's domain role against @Roles()
├── interceptors/
│   ├── response.interceptor.ts     # wraps every response in the unified format
│   └── logging.interceptor.ts
├── filters/
│   └── http-exception.filter.ts    # unified error shape
├── pipes/
│   └── validation.pipe.ts
├── repositories/
│   └── base.repository.ts          # optional shared CRUD base (see §4)
└── dto/
    ├── pagination-query.dto.ts
    └── paginated-response.dto.ts
```

**Rule of thumb:** if a guard/interceptor/behavior-decorator is used by **2+ modules**, it belongs in `common/`. If it's specific to one module's domain logic, it belongs in that module's own `guards/` folder (behavior) or `decorators/` folder (Swagger only).

---

## 7. Request Lifecycle Example

Example: `PATCH /api/v1/stores/:id/pause` (owner-only action)

1. **Guard** — the global Clerk auth guard verifies the session via the `clerk` integration and attaches the resolved user (including domain role) to the request.
2. **Guard** — the global roles guard reads the metadata set by the role requirement on the route and checks the user's domain role is `owner`.
3. **Guard** (module-scoped) — the store-ownership guard checks that the authenticated user actually owns the specific store referenced by the route, not just any store.
4. **Pipe** — validates the route param and request body against the relevant DTO.
5. **Controller** — resolves the current user and route param, then calls into the store service's pause operation.
6. **Service** — business logic: checks the store's current status, decides the new status, writes an audit log entry — calling the repository through its interface, never Mongoose directly.
7. **Repository** — the Mongoose implementation runs the actual update query against MongoDB and returns a plain result.
8. **Interceptor** — the response interceptor wraps the returned data into the unified response format.
9. **Filter** — if any step throws, the exception filter formats the unified error response.

---

## 8. Role-Based Access Control (RBAC) Strategy

| Role | Guard chain used |
|---|---|
| `customer` | Global Clerk auth guard + global roles guard (`customer`) |
| `staff` | Global Clerk auth guard + global roles guard (`staff`, `owner` on shared endpoints) |
| `owner` | Global Clerk auth guard + global roles guard (`owner`-only on delete/pause/resume) + module-scoped store-ownership guard (ensures ownership of *that specific* store) |
| `admin` | Global Clerk auth guard + global roles guard (`admin`) |

The global roles guard only checks the user's **domain role**, as stored on the app's own `User` record (synced from Clerk). For per-resource ownership checks (e.g. "is this user the owner of *this* store?"), a dedicated module-scoped guard is used instead of overloading the generic roles guard.

---

## 9. Database Layer

- Each module owns its schema(s) under `modules/<module>/schemas/`, and its repository under `modules/<module>/repositories/` (see §4).
- Schemas are only ever imported by that module's own repository — services and controllers never import a Mongoose schema/model directly.
- Shared/base schema logic (e.g. timestamps, soft-delete fields) can live in `src/database/schemas/base.schema.ts` and be extended by module schemas.
- Indexes are declared directly on the schema, not created manually in the database.

```
src/database/
└── schemas/
    └── base.schema.ts     # common fields: createdAt, updatedAt, deletedAt
```

---

## 10. Naming Conventions Recap

| Artifact | Convention | Example |
|---|---|---|
| Swagger decorator file (module) | `*.swagger.ts` | `pause-store.swagger.ts` |
| Behavior decorator file (common only) | `*.decorator.ts` | `current-user.decorator.ts` |
| Guard file | `*.guard.ts` | `store-owner.guard.ts` |
| Interceptor file | `*.interceptor.ts` | `response.interceptor.ts` |
| DTO file | `*.dto.ts` | `pause-store.dto.ts` |
| Schema file | `*.schema.ts` | `store.schema.ts` |
| Repository interface file | `*.repository.interface.ts` | `store.repository.interface.ts` |
| Repository implementation file | `*.repository.ts` | `store.repository.ts` |
| Repository injection token | `SCREAMING_SNAKE_CASE` symbol | `STORE_REPOSITORY` |
| Shared integration service file | `<vendor>.service.ts` | `cloudinary.service.ts` |
| Shared integration interface file | `<vendor>.service.interface.ts` | `mail.service.interface.ts` |

---

## 11. Summary: Where Does My New Swagger Decorator Go?

```
Is it reusable across 2+ modules?
 ├── Yes → src/common/decorators/swagger/
 └── No  → src/modules/<your-module>/decorators/
```

Anything that changes request/execution behavior instead of documentation (a new authorization rule, a new parameter resolver) is not a decorator in this architecture — it belongs in a guard, following the rule in §3.2 and §6.

---

## 12. Summary: Where Does My New Repository Go?

```
Does the module access MongoDB?
 └── Yes → src/modules/<module>/repositories/
             ├── <name>.repository.interface.ts   (the contract + DI token)
             └── <name>.repository.ts             (Mongoose implementation)

Services inject the INTERFACE (via the token), never the Mongoose Model directly.
```

---

## 13. Summary: Where Does My New Shared Integration Go?

```
Am I wrapping a call to an external vendor's SDK/API
(auth, storage, email, payments, SMS, etc.)?
 ├── Yes → src/integrations/<vendor>/
 │          ├── <vendor>.service.interface.ts   (the contract + DI token)
 │          └── <vendor>.service.ts             (the actual SDK call)
 │
 └── No (it's domain logic that happens to use an integration)
        → stays in the feature module's own service,
          which injects the integration's interface
```