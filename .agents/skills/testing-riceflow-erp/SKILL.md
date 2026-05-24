---
name: testing-riceflow-erp
description: Test the RiceFlow/Grainix ERP application end-to-end. Use when verifying backend API, frontend UI, or infrastructure changes.
---

# Testing Grainix ERP

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

3. **Kill stale processes on port 4000** (if needed):
   ```bash
   fuser -k 4000/tcp 2>/dev/null
   ```

4. **Start backend** (port 4000):
   ```bash
   cd apps/backend && npm run start:dev
   ```
   Wait for: `🌾 Grainix ERP API running on http://localhost:4000`
   All modules should initialize with 0 errors.

5. **Start frontend** (port 3000, may fall back to 3001 if busy):
   ```bash
   cd apps/frontend && npm run dev
   ```
   Wait for: `✓ Ready in ...ms`

6. **Verify connectivity**:
   ```bash
   curl -s http://localhost:4000/api/v1/health
   # Should return: {"status":"ok","timestamp":"...","service":"grainix-erp-api","version":"0.1.0"}
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
   # Should return: 200
   ```

## Auth Flow for API Testing

```bash
# Register a new org + admin user
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@grainix.com","password":"SecurePass123!","firstName":"Test","lastName":"User","organizationName":"Test Rice Mills"}')
TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# Use token in subsequent requests
curl -s http://localhost:4000/api/v1/auth/profile -H "Authorization: Bearer $TOKEN"
```

**IMPORTANT**: JWT access tokens expire after **15 minutes**. For long test sessions, re-login:
```bash
LOGIN_RESP=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@grainix.com","password":"SecurePass123!"}')
TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")
```

## Prerequisites for Finance Testing

Before testing any finance features, you MUST:
1. **Seed Chart of Accounts**: `POST /finance/accounts/seed` — creates standard accounts (1110=Cash in Hand, 1130=Accounts Receivable, 4100=Sales Revenue, etc.)
2. **Create Fiscal Year**: `POST /finance/fiscal-years` with `{"name":"FY 2026","startDate":"2026-01-01","endDate":"2026-12-31","isActive":true}`
3. **Create a Customer** (for sales receipts): `POST /sales/customers` with `{"name":"...","phone":"...","email":"...","address":"..."}`

## Key Module Endpoints

### Core Modules
| Module | Prefix | Key Endpoints |
|--------|--------|---------------|
| Auth | `/api/v1/auth` | register, login, refresh, profile |
| Finance | `/api/v1/finance` | fiscal-years, accounts, accounts/seed, journal-entries, journal-entries/:id/post, trial-balance, profit-loss, balance-sheet, cash-payment-vouchers, cash-receipt-vouchers, sales-receipts, sales-receipts/:id/post |
| HR | `/api/v1/hr` | employees, attendance, leaves, salary-slips, payroll, loans, performance-reviews |
| Procurement | `/api/v1/procurement` | suppliers, rice-varieties, paddy-purchases, rates |
| Production | `/api/v1/production` | batches, milling-records, plans |
| Inventory | `/api/v1/inventory` | warehouses, stock-movements, adjustments, zones, bins, cycle-counts, reservations |
| Sales | `/api/v1/sales` | customers, orders, invoices, challans |
| Transport | `/api/v1/transport` | vehicles, drivers, freights, fuel-logs, routes |
| CRM | `/api/v1/crm` | leads, brokers, communications, follow-ups, meetings |
| Settings | `/api/v1/settings` | system, numbering-series, notifications, audit-logs, custom-fields, license, branding |
| Setup Wizard | `/api/v1/setup` | tutorials |
| Announcements | `/api/v1/announcements` | (root), :id/acknowledge |

### Phase 2+ Modules
| Module | Prefix | Key Endpoints |
|--------|--------|---------------|
| Workflow | `/api/v1/workflow` | definitions, initiate, instances/:id/action, pending |
| Budgeting | `/api/v1/budgets` | (root), :id/status, :id/variance |
| Machines | `/api/v1/machines` | (root), maintenance, oee/:machineId, downtime, spares/list, spares/low-stock |
| Documents | `/api/v1/documents` | (root), search, expiring, contracts |
| Currency | `/api/v1/currencies` | (root), exchange-rates, convert |
| Commission | `/api/v1/commissions` | rules, entries, pending, calculate, settlements, summary |
| Market | `/api/v1/market` | rates, rates/latest, trends, compare |
| Export Sales | `/api/v1/export-sales` | contracts, lc, lc/:id/status, shipping-docs, dashboard |
| Integrations | `/api/v1/integrations` | configs, available, ai/chat, notifications, jobs |
| Assets | `/api/v1/assets` | (root), depreciation/run, depreciation/schedule/:id, :id/dispose |
| Quality Control | `/api/v1/quality-control` | inspections |
| Bank Management | `/api/v1/bank-management` | reconciliation, cheques |
| Expense | `/api/v1/expense` | categories, entries |
| Data Import | `/api/v1/data-import` | import, logs |
| Export | `/api/v1/export` | export, print-templates |

## Expected API Response Shape

All successful responses: `{ success: true, data: <payload> }`
- Register: `data: { user, organization, accessToken, refreshToken }`
- Paginated: `{ success: true, data: [...], meta: { total, page, limit, totalPages } }`

## DTO Field Name Gotchas

- **Sales Receipts**: Require `items` (array of objects), `subtotal`, `totalAmount`, `customerId`, `invoiceType`. Missing `subtotal` causes `DecimalError: Invalid argument: undefined`.
- **Sales Receipt Invoice Types**: CASH, CREDIT, POS, EXPORT, TAX_INVOICE, RETAIL. CASH/POS/RETAIL auto-debit Cash in Hand (1110). Others debit Accounts Receivable (1130).
- **Cash Payment Voucher**: Field is `paidTo` (NOT `payTo`). Also needs `accountId`, `amount`.
- **Cash Receipt Voucher**: Field is `receivedFrom` (NOT `receiveFrom`).
- **Customer**: Use `name`, `phone`, `email`, `address` (NOT `contactPerson` or `paymentTerms`).
- **HR Employee**: Use `joinDate` (NOT `dateOfJoining`), `departmentId` (NOT `department`), `baseSalary` is a number.
- **HR Loans**: Route is `POST /hr/loans` (NOT `/hr/employees/:id/loans`).
- **Inventory Warehouse**: No `location` field in DTO (use `address` instead).
- **Export Sales Shipping**: Route is `shipping-docs` (NOT `shipping-documents`).
- **Machine Maintenance**: Route is `GET /machines/maintenance` (NOT `/machines/maintenance/logs`).
- **Machine OEE**: Route is `GET /machines/oee/:machineId` (startDate/endDate are optional query params).
- **Finance**: Use `POST /finance/accounts/seed` to initialize Chart of Accounts.
- **Finance**: Journal entries are created as drafts. Use `POST /finance/journal-entries/:id/post` to post them.

## Account Codes (Seeded)

| Code | Name | Used By |
|------|------|--------|
| 1110 | Cash in Hand | Cash vouchers, CASH/POS/RETAIL sales receipts |
| 1130 | Accounts Receivable | CREDIT/EXPORT/TAX_INVOICE sales receipts |
| 4100 | Sales Revenue | All sales receipt postings (credit side) |
| 5100 | Cost of Goods Sold | Expense references |

## Testing Tips

- ESLint may hang on the full backend codebase. Use `npx tsc --noEmit` for type checking instead.
- Commission rule `minAmount`/`maxAmount` are transaction amount bounds (not commission floor/ceiling).
- Machine `:id` routes require valid UUIDs. Non-UUID values return 400.
- `lsof` might not be installed — use `fuser` instead for finding processes by port.
- Next.js may show a lockfile warning about workspace root — this is harmless.
- Backend testing is all API/curl — no screen recording needed. Only record for frontend UI testing.
- When creating sales receipts, always include `items`, `subtotal`, `taxAmount`, `discount`, `totalAmount` to avoid Decimal parse errors.

## Testing Strategy

- **Backend changes**: Test via curl (shell-based). No recording needed.
- **Frontend changes**: Test via browser. Record the session.
- **Cross-module integration**: Test by creating entities in one module and verifying effects in another (e.g., sales receipt posting → journal entry in finance → trial balance update).
- Always seed Chart of Accounts first (`POST /finance/accounts/seed`) before testing finance features.
- JWT tokens expire after 15 minutes — re-login if you get 401 errors during long test sessions.
- No CI is configured on this repo — rely on manual `npx tsc --noEmit` and `npx nest build` for verification.
