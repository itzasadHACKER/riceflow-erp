---
name: testing-riceflow-erp
description: Test the RiceFlow ERP application end-to-end. Use when verifying backend API, frontend UI, or infrastructure changes.
---

# Testing RiceFlow ERP

## Prerequisites

- Docker must be running (for PostgreSQL + Redis)
- Node.js installed (backend and frontend use npm)

## Devin Secrets Needed

None — all dev credentials are in `apps/backend/.env` (committed for local dev):
- DB: `postgresql://riceflow:riceflow_secret@localhost:5432/riceflow_erp`
- JWT_SECRET: `dev-jwt-secret-change-in-production`
- JWT_REFRESH_SECRET: `dev-refresh-secret-change-in-production`

## Environment Setup

1. **Start Docker services**:
   ```bash
   cd /home/ubuntu/repos/riceflow-erp
   docker compose up -d
   # Wait for health checks — both postgres and redis should show "healthy"
   docker compose ps
   ```

2. **Run database migration** (first time or after schema changes):
   ```bash
   cd apps/backend
   npx prisma migrate dev --name init
   ```
   If migration already exists, this is a no-op.

3. **Start backend** (port 4000):
   ```bash
   cd apps/backend && npm run start:dev
   ```
   Wait for: `🌾 RiceFlow ERP API running on http://localhost:4000`

4. **Start frontend** (port 3000, may fall back to 3001 if busy):
   ```bash
   cd apps/frontend && npm run dev
   ```
   Wait for: `✓ Ready in ...ms`

5. **Verify connectivity**:
   ```bash
   curl -s http://localhost:4000/api/v1/health
   # Should return: {"status":"ok","timestamp":"...","service":"riceflow-erp-api","version":"0.1.0"}
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
   # Should return: 200
   ```

## Key Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/health` | GET | No | Basic health check |
| `/api/v1/health/db` | GET | No | Database connectivity check |
| `/api/v1/auth/register` | POST | No | Register new org + admin user |
| `/api/v1/auth/login` | POST | No | Login with email/password |
| `/api/v1/auth/refresh` | POST | No | Refresh JWT tokens |
| `/api/v1/auth/profile` | GET | Bearer | Get current user profile |
| `/api/v1/organizations/current` | GET | Bearer | Get current org |
| `/api/v1/organizations/dashboard/stats` | GET | Bearer | Dashboard statistics |
| `/api/v1/users` | GET/POST | Bearer | User management |
| `/docs` | GET | No | Swagger API documentation |

## Frontend Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with module overview |
| `/login` | Login form (static placeholder in Phase 1) |
| `/register` | Register form (static placeholder in Phase 1) |
| `/dashboard` | Main dashboard with sidebar, stats, recent activity |

## Testing the Auth API (curl)

```bash
# Register
curl -s -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@riceflow.com","password":"SecurePass123!","firstName":"Test","lastName":"User","organizationName":"Test Rice Mills"}'

# Login
curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@riceflow.com","password":"SecurePass123!"}'

# Refresh (replace TOKEN)
curl -s -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"TOKEN"}'

# Profile (replace TOKEN)
curl -s -H "Authorization: Bearer TOKEN" http://localhost:4000/api/v1/auth/profile
```

## Expected API Response Shape

All successful responses follow: `{ success: true, data: <payload> }`
- Register: `data: { user: {id, email, firstName, lastName, organizationId}, organization: {id, name, slug}, accessToken, refreshToken }`
- Login: `data: { user: {...}, organization: {...}, accessToken, refreshToken }`
- Refresh: `data: { accessToken, refreshToken }`
- Profile: `data: { id, email, firstName, lastName, organization: {...}, roles: [...] }`

## UI Testing Checklist

- [ ] Landing page: RiceFlow logo, hero heading, 3 feature cards, 12 module cards
- [ ] Register: 5 form fields (Org Name, First Name, Last Name, Email, Password) + submit button
- [ ] Dashboard: Sidebar with 12 modules (Dashboard, Organization, HR & Payroll, Finance, Procurement, Production, Inventory, Sales, Transport, CRM, Reports, AI Assistant)
- [ ] Dashboard: 6 stats cards (Total Revenue, Paddy Purchased, Rice in Stock, Active Orders, Production Today, Active Suppliers)
- [ ] Theme toggle: Sun/Moon icon in header toggles dark/light mode
- [ ] Swagger: `/docs` (on port 4000) shows all API endpoints grouped by section

## Known Gotchas

- Frontend auth forms are static placeholders in Phase 1 — they use `setTimeout` to navigate to `/dashboard` without calling the backend API. This is documented and expected.
- Port 3000 might be occupied — frontend will fall back to port 3001. Check the terminal output for the actual port.
- Port 4000 might be occupied from previous sessions — use `fuser -k 4000/tcp` to kill stale processes.
- `lsof` might not be installed — use `fuser` instead for finding processes by port.
- Next.js may show a lockfile warning about workspace root — this is harmless.
- The "2 Issues" badge at bottom-left of Next.js is the dev overlay — not a test failure.
