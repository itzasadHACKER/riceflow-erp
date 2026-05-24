# RiceFlow ERP — Phase 2+ E2E Test Plan

**What changed**: 9 new backend modules (Workflow, Budgeting, Machine Management, Document Management, Currency, Commission, Market Intelligence, Export Sales, Integration Hub) and 6 enhanced existing modules (HR, Inventory, Production, Transport, CRM, Settings). All backend-only API changes — no frontend UI for new modules.

**Testing approach**: Shell-based API testing via curl. No recording needed (no GUI interactions).

## Prerequisites (already done)
- Docker (postgres + redis) running and healthy
- Prisma migration applied
- Backend running on port 4000
- Auth token obtained via register/login

---

## Test 1: Auth + Health (Prerequisite for all other tests)

**Steps**:
1. `GET /api/v1/health` → expect `{ "status": "ok" }`
2. `POST /api/v1/auth/register` with new org → expect `{ success: true, data: { accessToken, user, organization } }`
3. Save `accessToken` for all subsequent tests

**Pass/fail**: If register returns a token, all subsequent tests can proceed. If not, all tests are blocked.

---

## Test 2: Finance — Chart of Accounts + Strict Double-Entry Journal Entry

**Why adversarial**: Tests the core accounting engine. A broken double-entry validation would silently corrupt the GL.

**Steps**:
1. `POST /api/v1/finance/accounts/seed` → seed default Chart of Accounts → expect `success: true`
2. `GET /api/v1/finance/accounts` → expect array with multiple accounts (Assets, Liabilities, Income, Expense groups)
3. `POST /api/v1/finance/journal-entries` with balanced lines (debit = credit = 5000) → expect `success: true`, entry returned with `isPosted: true`
4. **Adversarial**: `POST /api/v1/finance/journal-entries` with UNBALANCED lines (debit 5000, credit 3000) → expect **400 error** with message about debits not equaling credits
5. `GET /api/v1/finance/trial-balance` → expect Cash debit = 5000, Revenue credit = 5000

**Pass/fail**:
- Step 3: Journal entry created with correct amounts
- Step 4: Server REJECTS unbalanced entry (this is the critical assertion — if it accepts, accounting is broken)
- Step 5: Trial balance reflects the posted entry

---

## Test 3: Workflow Engine — Create Definition, Initiate, Approve

**Why adversarial**: Workflow state machine must enforce correct transitions.

**Steps**:
1. `POST /api/v1/workflow/definitions` — create a 2-step approval workflow for "PURCHASE_ORDER" entity type
2. `GET /api/v1/workflow/definitions` → expect the definition we just created, with 2 steps
3. `POST /api/v1/workflow/initiate` — initiate workflow for a fake entity ID
4. `GET /api/v1/workflow/instances` → expect instance with status `PENDING`
5. `POST /api/v1/workflow/instances/:id/action` with `{ action: "APPROVE" }` → expect status update
6. `GET /api/v1/workflow/pending` → expect empty or reduced list after approval

**Pass/fail**:
- Step 2: Definition has exactly 2 steps
- Step 4: Instance status is `PENDING` (not `APPROVED` prematurely)
- Step 5: Action processed without error

---

## Test 4: Machine Management — CRUD + Maintenance + OEE

**Why adversarial**: OEE calculation requires correct time-based math.

**Steps**:
1. `POST /api/v1/machines` — create machine "Paddy Huller PH-001"
2. `GET /api/v1/machines` → expect machine in list with status `OPERATIONAL`
3. `POST /api/v1/machines/maintenance` — create PREVENTIVE maintenance log
4. `GET /api/v1/machines/maintenance?machineId=<id>` → expect 1 log
5. `POST /api/v1/machines/downtime` — create downtime record with start/end times
6. `GET /api/v1/machines/:id/oee` → expect OEE metrics returned (availability, performance, quality)

**Pass/fail**:
- Step 2: Machine exists with OPERATIONAL status
- Step 4: Maintenance log linked to correct machine
- Step 6: OEE returns numeric values (not NaN or null)

---

## Test 5: Commission & Settlement — Rule + Entry + Settlement

**Why adversarial**: Commission calculation must use the correct rate and the settlement must mark entries as settled.

**Steps**:
1. `POST /api/v1/commissions/rules` — create commission rule: 2.5% on PURCHASE entity type
2. `GET /api/v1/commissions/calculate?entityType=PURCHASE&amount=100000` → expect commission = 2500
3. `POST /api/v1/commissions/entries` — create manual commission entry for a broker
4. `GET /api/v1/commissions/pending` → expect the unsettled entry
5. `POST /api/v1/commissions/settlements` — settle for the broker
6. `GET /api/v1/commissions/summary` → expect summary data returned

**Pass/fail**:
- Step 2: Calculated commission equals 2500 (not 0, not null)
- Step 4: Entry appears in pending list
- Step 5: Settlement created without error

---

## Test 6: Multi-Currency — Create + Exchange Rate + Conversion

**Steps**:
1. `POST /api/v1/currencies` — create USD (base) and EUR
2. `POST /api/v1/currencies/exchange-rates` — set EUR rate = 0.92
3. `GET /api/v1/currencies/convert?from=<USD_ID>&to=<EUR_ID>&amount=1000` → expect ~920

**Pass/fail**:
- Step 3: Converted amount is approximately 920 (not 0, not 1000, not null)

---

## Test 7: Export Sales — Contract + LC + Shipping Doc

**Steps**:
1. `POST /api/v1/export-sales/contracts` — create export contract to UAE buyer
2. `POST /api/v1/export-sales/lc` — create Letter of Credit linked to contract
3. `PUT /api/v1/export-sales/lc/:id/status` — update LC status to CONFIRMED
4. `POST /api/v1/export-sales/shipping-documents` — add Bill of Lading
5. `GET /api/v1/export-sales/dashboard` → expect stats with 1 contract, 1 LC

**Pass/fail**:
- Step 2: LC created with DRAFT_LC status
- Step 3: Status updated to CONFIRMED
- Step 5: Dashboard shows non-zero contract count

---

## Test 8: Enhanced Modules — HR Loans, Inventory Zones, CRM Meetings

**Steps**:
1. Create employee via HR → `POST /api/v1/hr/employees`
2. Create loan for employee → `POST /api/v1/hr/employees/:id/loans`
3. Get loans → `GET /api/v1/hr/loans` → expect loan with principal amount
4. Create warehouse zone → `POST /api/v1/inventory/zones`
5. Get zones → `GET /api/v1/inventory/zones` → expect zone in list
6. Create meeting → `POST /api/v1/crm/meetings`
7. Get meetings → `GET /api/v1/crm/meetings` → expect meeting in list

**Pass/fail**:
- Each POST returns success with created entity
- Each GET returns the entity we just created

---

## Test 9: Swagger API Documentation

**Steps**:
1. `GET /docs-json` → expect Swagger JSON with paths for ALL new module controllers
2. Verify paths include: `/api/v1/workflow/*`, `/api/v1/budgets/*`, `/api/v1/machines/*`, `/api/v1/commissions/*`, `/api/v1/currencies/*`, `/api/v1/export-sales/*`, `/api/v1/market/*`, `/api/v1/documents/*`, `/api/v1/integrations/*`

**Pass/fail**:
- All 9 new module path prefixes present in Swagger JSON
