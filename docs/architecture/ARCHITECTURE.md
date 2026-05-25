# RICEFLOW ERP — Software Architecture

## 1. Architecture Decision: Modular Monolith

**Decision**: Modular Monolith over Microservices.

**Rationale**:
- An ERP system has deeply interconnected modules (finance touches everything).
- Microservices add operational overhead (service mesh, distributed transactions, eventual consistency) that is premature for a new product.
- A modular monolith gives us clean module boundaries, independent testing, and the option to extract services later.
- NestJS modules map perfectly to ERP domain modules.
- Single deployment unit simplifies DevOps for early-stage SaaS.

**Future Path**: Any module can be extracted into a standalone microservice by:
1. Moving it to its own NestJS application.
2. Replacing direct imports with message-based communication (Redis/NATS).
3. Giving it its own database schema (already isolated by Prisma schema namespacing).

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                  │
│  Next.js PWA │ Mobile App │ API Consumers │ Third-party         │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / WSS
┌──────────────────────────┴──────────────────────────────────────┐
│                     API GATEWAY / NGINX                         │
│            Rate Limiting │ SSL │ Load Balancing                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                    NESTJS APPLICATION                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │   Auth   │ │  Org Mgmt│ │  HR/Pay  │ │ Finance  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │Procurement│ │Production│ │Inventory │ │  Sales   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │Transport │ │   CRM    │ │Reporting │ │    AI    │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  Shared: Guards │ Interceptors │ Pipes │ Filters │ Events      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
┌────────┴───────┐ ┌───────┴──────┐ ┌───────┴──────┐
│  PostgreSQL    │ │    Redis     │ │  S3/Supabase │
│  (Prisma ORM)  │ │  Cache/Queue │ │   Storage    │
└────────────────┘ └──────────────┘ └──────────────┘
```

---

## 3. Module Architecture

Each domain module follows Clean Architecture:

```
module/
├── controllers/       # HTTP endpoints (REST)
├── services/          # Business logic
├── repositories/      # Data access (Prisma)
├── dto/               # Data transfer objects (validation)
├── entities/          # Domain entities
├── events/            # Domain events
├── guards/            # Module-specific guards
├── interfaces/        # TypeScript interfaces
└── module.ts          # NestJS module definition
```

### Module Dependency Rules:
1. Modules communicate via **exported services** or **events** (never direct repository access).
2. Every module has a clearly defined **public API** (exported services only).
3. Cross-module DB queries go through the owning module's service.
4. The `common` module provides shared utilities but has ZERO business logic.

---

## 4. Database Architecture

### Schema Strategy
- **Single database**, logically partitioned by module.
- All tables prefixed by module (e.g., `fin_journal_entries`, `inv_stock_movements`).
- Prisma schema split into multiple `.prisma` files using `prismaSchemaFolder` preview feature.
- Multi-tenant via `organization_id` foreign key on all business tables.

### Key Design Principles:
- Soft deletes (`deleted_at` timestamp) on all major entities.
- Audit columns (`created_at`, `updated_at`, `created_by`, `updated_by`) on all tables.
- UUID primary keys for all tables.
- Proper indexes on foreign keys and commonly queried columns.
- JSONB columns for flexible metadata where appropriate.

---

## 5. Authentication & Authorization

### Authentication Flow:
1. User submits credentials → Backend validates → Issues JWT access + refresh tokens.
2. Access token (15 min TTL) sent in Authorization header.
3. Refresh token (7 day TTL) stored in httpOnly cookie.
4. Redis stores active sessions for token revocation.

### Authorization (RBAC):
```
Organization
  └── Branches
       └── Departments
            └── Roles (Admin, Manager, Accountant, Operator, Viewer, Custom)
                 └── Permissions (module:action — e.g., "finance:create_journal")
```

- Permissions are granular: `module:entity:action` (e.g., `inventory:stock:transfer`).
- Roles are collections of permissions.
- Users can have multiple roles across branches.
- Custom roles supported.

---

## 6. API Architecture

### REST API Design:
- Versioned: `/api/v1/...`
- Resource-based URLs: `/api/v1/organizations/:orgId/inventory/items`
- Consistent response envelope:
```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "limit": 20, "total": 150 },
  "errors": []
}
```
- Pagination: cursor-based for large datasets, offset-based for simple lists.
- Filtering: `?filter[status]=active&filter[date_gte]=2024-01-01`
- Sorting: `?sort=-created_at,name`
- Field selection: `?fields=id,name,status`

### WebSocket Events:
- Namespace per module: `/ws/notifications`, `/ws/inventory`, `/ws/production`
- Used for: real-time stock updates, notification delivery, live dashboard data.

---

## 7. Frontend Architecture

### Next.js App Router Structure:
```
app/
├── (auth)/              # Auth pages (login, register, forgot-password)
├── (dashboard)/         # Protected dashboard layout
│   ├── layout.tsx       # Sidebar + header + auth guard
│   ├── page.tsx         # Main dashboard
│   ├── organization/
│   ├── hr/
│   ├── finance/
│   ├── procurement/
│   ├── production/
│   ├── inventory/
│   ├── sales/
│   ├── transport/
│   ├── crm/
│   ├── reports/
│   └── ai/
├── api/                 # Next.js API routes (BFF proxy)
└── layout.tsx           # Root layout
```

### State Management:
- **Server state**: React Query (TanStack Query) — all API data.
- **Client state**: Zustand — UI state, sidebar, theme, user preferences.
- **Form state**: React Hook Form + Zod validation.

### UI Component Architecture:
- Base: ShadCN UI (Radix primitives + Tailwind)
- Custom ERP components: DataTable, FormBuilder, FilterPanel, StatCard, ChartWidget
- Design tokens: CSS variables for theming (dark/light mode)
- Animation: Framer Motion for page transitions and micro-interactions

---

## 8. Infrastructure Architecture

### Docker Compose (Development):
```yaml
services:
  postgres:    # PostgreSQL 16
  redis:       # Redis 7 (cache + queue + sessions)
  backend:     # NestJS application
  frontend:    # Next.js application
  nginx:       # Reverse proxy
```

### Production Path (Kubernetes-Ready):
- Each service has its own Dockerfile with multi-stage builds.
- Health check endpoints: `/api/health`, `/api/health/db`, `/api/health/redis`
- Structured JSON logging (Pino).
- Graceful shutdown handling.
- Horizontal scaling via stateless design.

---

## 9. Security Architecture

| Layer          | Mechanism                                          |
|----------------|---------------------------------------------------|
| Transport      | TLS 1.3, HSTS                                     |
| Authentication | JWT + Refresh Tokens, bcrypt password hashing      |
| Authorization  | RBAC with granular permissions                     |
| Input          | DTO validation (class-validator), parameterized queries |
| API            | Rate limiting (throttler), CORS, helmet            |
| Data           | Encryption at rest, soft deletes, audit logging    |
| Session        | Redis-backed session store, token revocation       |
| Monitoring     | Audit trail on all write operations                |

---

## 10. Development Roadmap

### Phase 1: Foundation (Current)
- Project setup, architecture, database schema, auth, Docker, base UI

### Phase 2: Core Business Modules
- Organization management, HR basics, Finance (chart of accounts, journal entries)

### Phase 3: Rice Industry Core
- Procurement (paddy purchase, moisture calc, quality grading)
- Production (milling, shelling, yield calculations)
- Inventory (godowns, stock movements, batch tracking)

### Phase 4: Sales & Distribution
- Sales orders, invoicing, dispatch, dealer management
- Transport & logistics

### Phase 5: Advanced Features
- CRM, dynamic reporting, BI dashboards
- PDF/Excel exports

### Phase 6: AI & Intelligence
- AI analytics, predictive models, smart alerts
- AI chatbot, OCR invoice reader

### Phase 7: SaaS & Scale
- Multi-tenant onboarding, billing, subscription management
- Kubernetes deployment, monitoring, alerting
