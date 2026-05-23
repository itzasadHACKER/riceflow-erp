# 🌾 RiceFlow ERP

**Enterprise Rice Industry Management Platform**

A modern, scalable, modular ERP system built specifically for the rice industry — rice mills, traders, commission agents, arhtis, exporters, warehouse operations, paddy procurement, shelling units, brokers, and transporters.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4, ShadCN UI, Framer Motion, React Query, Zustand |
| **Backend** | Node.js, NestJS 11, TypeScript, Prisma ORM |
| **Database** | PostgreSQL 16 |
| **Auth** | JWT + Refresh Tokens, RBAC with granular permissions |
| **Infrastructure** | Docker, Docker Compose, Redis |
| **API Docs** | Swagger / OpenAPI (auto-generated) |

---

## Project Structure

```
riceflow-erp/
├── apps/
│   ├── backend/                 # NestJS API server
│   │   ├── prisma/              # Database schema & migrations
│   │   └── src/
│   │       ├── common/          # Shared utilities, decorators, guards
│   │       └── modules/         # Domain modules (auth, org, user, etc.)
│   └── frontend/                # Next.js web application
│       └── src/
│           ├── app/             # App Router pages & layouts
│           ├── components/      # UI components (ShadCN + custom)
│           ├── lib/             # Utilities & API client
│           └── stores/          # Zustand state stores
├── docs/                        # Architecture & design documentation
├── docker-compose.yml           # Dev environment (Postgres + Redis)
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js >= 20
- Docker & Docker Compose
- npm

### 1. Clone & Install

```bash
git clone <repo-url> riceflow-erp
cd riceflow-erp

# Install root dependencies
npm install

# Install backend dependencies
cd apps/backend && npm install && cd ../..

# Install frontend dependencies
cd apps/frontend && npm install && cd ../..
```

### 2. Start Infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL (port 5432) and Redis (port 6379).

### 3. Setup Database

```bash
cd apps/backend

# Copy environment file
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init
```

### 4. Start Development

```bash
# From project root
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Docs**: http://localhost:4000/docs
- **Prisma Studio**: `cd apps/backend && npx prisma studio`

---

## ERP Modules

| Module | Description | Status |
|--------|-------------|--------|
| Organization | Multi-company, multi-branch, departments | Phase 1 ✓ |
| Auth & RBAC | JWT auth, role-based permissions | Phase 1 ✓ |
| HR & Payroll | Employees, attendance, salary, leaves | Phase 2 |
| Finance | Chart of accounts, journal entries, ledgers | Phase 2 |
| Procurement | Paddy purchase, suppliers, quality grading | Phase 3 |
| Production | Milling, shelling, yield calculations | Phase 3 |
| Inventory | Warehouses, stock movements, batch tracking | Phase 3 |
| Sales | Orders, invoices, delivery challans | Phase 4 |
| Transport | Vehicles, freight, dispatch tracking | Phase 4 |
| CRM | Leads, customers, brokers, follow-ups | Phase 5 |
| Reports | Dynamic reports, BI dashboards, exports | Phase 5 |
| AI | Predictive analytics, smart alerts, chatbot | Phase 6 |

---

## API Architecture

- **Base URL**: `http://localhost:4000/api/v1`
- **Auth**: Bearer token in `Authorization` header
- **Response format**: `{ success, data, meta, errors }`
- **Pagination**: `?page=1&limit=20&search=...&sortBy=...&sortOrder=asc|desc`

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register organization + admin |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/profile` | Get current user profile |
| GET | `/organizations/current` | Get organization details |
| GET | `/organizations/dashboard/stats` | Dashboard statistics |
| GET | `/users` | List users (paginated) |
| POST | `/users` | Create a new user |
| GET | `/health` | API health check |
| GET | `/health/db` | Database health check |

---

## Database Schema

The Prisma schema covers 40+ models across all modules:

- **Organization & Auth**: organizations, branches, departments, users, roles, permissions
- **HR**: employees, attendance, leaves, salary slips, advances
- **Finance**: chart of accounts, journal entries, bank accounts, vouchers, taxes
- **Procurement**: suppliers, rice varieties, paddy purchases, quality tests, rates
- **Production**: batches, outputs, costs, milling records
- **Inventory**: warehouses, items, stock movements, adjustments
- **Sales**: customers, orders, invoices, delivery challans
- **Transport**: vehicles, drivers, freight entries
- **CRM**: leads, brokers, communication logs, follow-ups
- **System**: audit logs, notifications, settings, file attachments

---

## Development Guidelines

### Commit Convention

```
feat: add paddy purchase form
fix: correct moisture calculation formula
refactor: extract inventory valuation logic
docs: update API endpoint documentation
chore: update dependencies
```

### Architecture Rules

1. Each domain module is self-contained with controllers, services, DTOs, and entities
2. Cross-module communication via exported services or events
3. All business tables include `organization_id` for multi-tenancy
4. Soft deletes (`deleted_at`) on all major entities
5. Audit columns on all tables (`created_at`, `updated_at`, `created_by`, `updated_by`)

### Code Style

- TypeScript strict mode
- ESLint + Prettier enforced
- Barrel exports via `index.ts`
- DTO validation with `class-validator`
- API documentation with Swagger decorators

---

## Docker

### Development

```bash
docker compose up -d       # Start Postgres + Redis
docker compose down        # Stop all services
docker compose logs -f     # View logs
```

### Production Build

```bash
# Backend
cd apps/backend && docker build -t riceflow-api .

# Frontend
cd apps/frontend && docker build -t riceflow-web .
```

---

## License

MIT

---

Built with ❤️ for the Rice Industry
