# RICEFLOW ERP — Database Design

## Overview

PostgreSQL 16 with Prisma ORM. Single database, logically partitioned by domain module.

## Naming Conventions

- Tables: `snake_case`, plural (e.g., `organizations`, `journal_entries`)
- Columns: `snake_case`
- Primary keys: `id` (UUID)
- Foreign keys: `<entity>_id` (e.g., `organization_id`)
- Timestamps: `created_at`, `updated_at`, `deleted_at`
- Audit: `created_by`, `updated_by`
- Booleans: `is_<adjective>` (e.g., `is_active`)
- Enums: `PascalCase` values

## Module Schemas

### 1. Organization & Auth
```
organizations
├── id, name, slug, logo_url, address, phone, email, tax_id
├── settings (JSONB), is_active, subscription_tier
├── created_at, updated_at, deleted_at

branches
├── id, organization_id (FK), name, code, address, phone, is_head_office
├── is_active, created_at, updated_at, deleted_at

departments
├── id, organization_id (FK), branch_id (FK), name, code
├── head_user_id (FK), is_active, created_at, updated_at, deleted_at

users
├── id, email, password_hash, first_name, last_name, phone, avatar_url
├── organization_id (FK), is_active, is_superadmin
├── last_login_at, created_at, updated_at, deleted_at

roles
├── id, organization_id (FK), name, slug, description, is_system_role
├── created_at, updated_at

permissions
├── id, module, entity, action, description

role_permissions
├── role_id (FK), permission_id (FK)

user_roles
├── user_id (FK), role_id (FK), branch_id (FK)

user_sessions
├── id, user_id (FK), token_hash, ip_address, user_agent
├── expires_at, created_at
```

### 2. HR & Payroll
```
employees
├── id, organization_id, branch_id, department_id, user_id (optional)
├── employee_code, first_name, last_name, phone, email, cnic
├── designation, employment_type (FULL_TIME, PART_TIME, CONTRACT)
├── join_date, exit_date, base_salary, bank_account, bank_name
├── is_active, created_at, updated_at, deleted_at

attendance_records
├── id, employee_id, date, check_in, check_out, status (PRESENT, ABSENT, HALF_DAY, LEAVE)
├── overtime_hours, notes, created_at

leave_types
├── id, organization_id, name, days_allowed, is_paid, is_active

leave_requests
├── id, employee_id, leave_type_id, from_date, to_date, days
├── reason, status (PENDING, APPROVED, REJECTED), approved_by
├── created_at, updated_at

salary_slips
├── id, employee_id, month, year, base_salary, allowances (JSONB)
├── deductions (JSONB), overtime_amount, net_salary, status
├── paid_at, created_at

employee_advances
├── id, employee_id, amount, reason, status (PENDING, APPROVED, DEDUCTED)
├── approved_by, deducted_in_slip_id, created_at
```

### 3. Finance & Accounts
```
fiscal_years
├── id, organization_id, name, start_date, end_date, is_active, is_closed

chart_of_accounts
├── id, organization_id, code, name, type (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
├── parent_id (self-ref), is_group, is_system, balance_type (DEBIT, CREDIT)
├── opening_balance, is_active, created_at, updated_at

journal_entries
├── id, organization_id, entry_number, date, reference, narration
├── entry_type (MANUAL, SYSTEM, ADJUSTMENT), fiscal_year_id
├── is_posted, posted_by, posted_at
├── created_by, created_at, updated_at, deleted_at

journal_entry_lines
├── id, journal_entry_id, account_id, debit, credit, narration
├── cost_center, created_at

bank_accounts
├── id, organization_id, account_name, bank_name, account_number
├── branch_code, iban, account_id (FK to chart_of_accounts)
├── opening_balance, is_active, created_at, updated_at

payment_vouchers
├── id, organization_id, voucher_number, date, party_type, party_id
├── amount, payment_mode (CASH, BANK, CHEQUE), bank_account_id
├── reference, narration, journal_entry_id, status
├── created_by, created_at, updated_at

receipt_vouchers
├── id, organization_id, voucher_number, date, party_type, party_id
├── amount, payment_mode, bank_account_id
├── reference, narration, journal_entry_id, status
├── created_by, created_at, updated_at

tax_configurations
├── id, organization_id, name, rate, type (GST, INCOME_TAX, WHT)
├── account_id, is_active, created_at

expense_claims
├── id, organization_id, employee_id, claim_number, date
├── total_amount, status, approved_by, journal_entry_id
├── created_at, updated_at
```

### 4. Rice Procurement
```
suppliers
├── id, organization_id, name, company, phone, email, address
├── cnic, ntn, supplier_type (FARMER, DEALER, COMMISSION_AGENT)
├── account_id (FK to chart_of_accounts), credit_limit
├── is_active, created_at, updated_at, deleted_at

rice_varieties
├── id, organization_id, name, code, type (PADDY, RICE)
├── category (BASMATI, NON_BASMATI, SELLA, STEAM, PARBOILED)
├── default_moisture, description, is_active, created_at

paddy_purchases
├── id, organization_id, branch_id, purchase_number, date
├── supplier_id, rice_variety_id, broker_id (optional)
├── gross_weight, tare_weight, net_weight
├── moisture_percentage, deduction_percentage, final_weight
├── rate_per_unit, gross_amount, deductions (JSONB), net_amount
├── quality_grade, lot_number, vehicle_number, gate_pass_number
├── payment_status (UNPAID, PARTIAL, PAID), journal_entry_id
├── notes, created_at, updated_at, deleted_at

quality_tests
├── id, paddy_purchase_id, test_date, moisture, broken_percentage
├── foreign_matter, chalky_grains, damaged_grains, grade
├── tested_by, notes, created_at

purchase_rates
├── id, organization_id, rice_variety_id, rate, effective_from
├── effective_to, min_moisture, max_moisture, is_active, created_at
```

### 5. Production Management
```
production_batches
├── id, organization_id, branch_id, batch_number, date
├── input_variety_id, input_lot_number, input_weight
├── process_type (SHELLING, POLISHING, SELLA, STEAM, SORTING)
├── status (PLANNED, IN_PROGRESS, COMPLETED, CANCELLED)
├── started_at, completed_at, created_by, created_at, updated_at

production_outputs
├── id, batch_id, output_variety_id, output_weight
├── recovery_percentage, grade, lot_number
├── notes, created_at

production_costs
├── id, batch_id, cost_type (LABOR, FUEL, ELECTRICITY, MAINTENANCE, OTHER)
├── description, amount, created_at

milling_records
├── id, batch_id, paddy_input_weight, rice_output_weight
├── broken_output_weight, husk_weight, bran_weight
├── recovery_percentage, broken_ratio
├── notes, created_at
```

### 6. Inventory & Warehousing
```
warehouses
├── id, organization_id, branch_id, name, code, address
├── capacity, capacity_unit, manager_id
├── is_active, created_at, updated_at, deleted_at

inventory_items
├── id, organization_id, warehouse_id, rice_variety_id
├── lot_number, batch_number, quantity, unit (KG, TON, BAG)
├── bag_count, bag_weight, quality_grade, moisture
├── valuation_rate, total_value
├── barcode, qr_code
├── created_at, updated_at

stock_movements
├── id, organization_id, movement_type (IN, OUT, TRANSFER)
├── source_warehouse_id, destination_warehouse_id
├── item_id, quantity, unit, reference_type, reference_id
├── movement_date, narration, created_by, created_at

stock_adjustments
├── id, organization_id, warehouse_id, adjustment_number, date
├── reason, item_id, quantity_change, previous_quantity, new_quantity
├── approved_by, journal_entry_id, created_at
```

### 7. Sales & Distribution
```
customers
├── id, organization_id, name, company, phone, email, address
├── customer_type (DEALER, RETAILER, EXPORTER, WHOLESALE)
├── cnic, ntn, account_id (FK), credit_limit
├── is_active, created_at, updated_at, deleted_at

sales_orders
├── id, organization_id, branch_id, order_number, date
├── customer_id, status (DRAFT, CONFIRMED, DISPATCHED, DELIVERED, CANCELLED)
├── total_amount, discount, tax_amount, net_amount
├── delivery_date, notes, created_by, created_at, updated_at

sales_order_items
├── id, sales_order_id, rice_variety_id, quantity, unit
├── rate, amount, lot_number, warehouse_id

sales_invoices
├── id, organization_id, invoice_number, date, sales_order_id
├── customer_id, total_amount, discount, tax_amount, net_amount
├── payment_status, due_date, journal_entry_id
├── created_by, created_at, updated_at

delivery_challans
├── id, organization_id, challan_number, date, sales_order_id
├── customer_id, vehicle_id, driver_name, driver_phone
├── dispatch_from_warehouse_id, status (DISPATCHED, IN_TRANSIT, DELIVERED)
├── delivered_at, receiver_name, notes
├── created_by, created_at
```

### 8. Transport & Logistics
```
vehicles
├── id, organization_id, vehicle_number, type (TRUCK, TRAILER, PICKUP)
├── capacity, capacity_unit, owner_name, owner_phone
├── is_own, is_active, created_at, updated_at

drivers
├── id, organization_id, name, phone, license_number, cnic
├── is_active, created_at, updated_at

freight_entries
├── id, organization_id, date, vehicle_id, driver_id
├── from_location, to_location, distance
├── freight_amount, loading_charges, unloading_charges, total_amount
├── reference_type, reference_id, payment_status
├── created_at, updated_at
```

### 9. CRM
```
leads
├── id, organization_id, name, company, phone, email
├── source (REFERRAL, WALK_IN, ONLINE, BROKER), status
├── assigned_to, notes, created_at, updated_at

brokers
├── id, organization_id, name, phone, email, commission_rate
├── account_id (FK), is_active, created_at, updated_at

communication_logs
├── id, organization_id, contact_type (LEAD, CUSTOMER, SUPPLIER, BROKER)
├── contact_id, channel (PHONE, EMAIL, WHATSAPP, VISIT)
├── subject, content, logged_by, created_at

follow_ups
├── id, communication_log_id, due_date, status (PENDING, DONE, OVERDUE)
├── assigned_to, notes, created_at
```

### 10. System & Audit
```
audit_logs
├── id, organization_id, user_id, entity_type, entity_id
├── action (CREATE, UPDATE, DELETE), old_values (JSONB), new_values (JSONB)
├── ip_address, user_agent, created_at

notifications
├── id, organization_id, user_id, title, message, type
├── reference_type, reference_id, is_read, read_at, created_at

system_settings
├── id, organization_id, key, value (JSONB), category
├── created_at, updated_at

file_attachments
├── id, organization_id, entity_type, entity_id
├── file_name, file_path, file_size, mime_type
├── uploaded_by, created_at
```

## Indexes Strategy

- All foreign keys are indexed.
- Composite indexes on: `(organization_id, created_at)` for most tables.
- Unique indexes on: slugs, codes, numbers (e.g., `(organization_id, purchase_number)`).
- Partial indexes on: `deleted_at IS NULL` for active record queries.
- GIN indexes on JSONB columns used for filtering.

## Data Integrity

- All monetary amounts stored as `Decimal(18,4)`.
- Cascading deletes only for child records (e.g., journal entry lines).
- Restrict deletes on referenced entities (e.g., cannot delete an account with transactions).
- Check constraints on monetary amounts (>= 0 where applicable).
