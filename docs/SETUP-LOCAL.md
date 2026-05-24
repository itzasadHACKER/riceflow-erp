# Grainix ERP — Local Installation Guide

**Powered by Asad Ali | 0308-4420406**

Install and run Grainix ERP on your own PC. Works on Windows, Mac, and Linux.

---

## Table of Contents

1. [Prerequisites (Install These First)](#prerequisites-install-these-first)
2. [Quick Setup (Automated — Recommended)](#quick-setup-automated--recommended)
3. [Starting the Software Daily](#starting-the-software-daily)
4. [Manual Setup (Step-by-Step)](#manual-setup-step-by-step)
5. [How to Use Grainix ERP](#how-to-use-grainix-erp)
6. [Docker Alternative](#docker-alternative)
7. [Access from Other PCs](#access-from-other-pcs-on-your-network)
8. [Backup & Updates](#backup-your-data)
9. [Troubleshooting](#troubleshooting)
10. [System Requirements](#system-requirements)

---

## Prerequisites (Install These First)

Install these **3 free programs** before running the setup:

| # | Program | Download | Notes |
|---|---------|----------|-------|
| 1 | **Node.js 20 LTS** | https://nodejs.org | Click the green "Download" button. **Use version 20 LTS — NOT version 24.** |
| 2 | **PostgreSQL 16** | https://www.postgresql.org/download | During install: **remember the password** you set for the `postgres` user. Keep port `5432`. |
| 3 | **Git** | https://git-scm.com | Click Next through all defaults. |

### Important Notes for Windows Users

After installing all three, **restart your computer** to ensure all PATH changes take effect.

**PowerShell Execution Policy:** If you see "running scripts is disabled", open PowerShell **as Administrator** and run:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Type `Y` and press Enter. Then close and reopen PowerShell.

**Node.js Version Check:** Open a terminal and verify:
```
node --version
```
You should see `v20.x.x`. If you see `v24.x.x`, uninstall it and install Node.js 20 LTS instead — version 24 has compatibility issues with some packages.

---

## Quick Setup (Automated — Recommended)

### Step 1 — Download the code

Open **PowerShell** (Windows) or **Terminal** (Mac/Linux):

```bash
cd Desktop
git clone https://github.com/itzasadHACKER/riceflow-erp.git
cd riceflow-erp
```

### Step 2 — Run the setup script

**Windows (PowerShell):**
```powershell
.\scripts\setup.ps1
```

**Mac/Linux (Terminal):**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

The script will:
- Check Node.js and PostgreSQL are installed
- Ask for your PostgreSQL password
- Create the `grainix_erp` database automatically
- Generate the `.env` configuration file
- Install all dependencies (3-5 minutes)
- Create database tables

### Step 3 — Start the software

**Windows (PowerShell):**
```powershell
.\scripts\start.ps1
```

**Windows (Double-click):**
Open the `scripts` folder in File Explorer and double-click **`start.bat`**

**Mac/Linux:**
```bash
./scripts/start.sh
```

### Step 4 — Open in browser

Go to **http://localhost:3000** → Click **Sign up** → Register your account → Done!

---

## Starting the Software Daily

Every time you want to use Grainix ERP:

**Windows — Double-click method:**
1. Open the `riceflow-erp\scripts` folder
2. Double-click **`start.bat`**
3. Two command windows will open (backend + frontend)
4. Browser opens automatically to http://localhost:3000

**Windows — PowerShell method:**
```powershell
cd Desktop\riceflow-erp
.\scripts\start.ps1
```

**Mac/Linux:**
```bash
cd ~/Desktop/riceflow-erp
./scripts/start.sh
```

**Stopping:** Press `Ctrl+C` in both server windows, or simply close them.

**Is my data safe?** Yes! Data is stored in PostgreSQL which runs independently. Stopping the servers does NOT delete any data.

---

## Manual Setup (Step-by-Step)

Use this if the automated setup script doesn't work for you.

### 1. Download the code

```bash
cd Desktop
git clone https://github.com/itzasadHACKER/riceflow-erp.git
cd riceflow-erp
```

### 2. Create the database

**Option A — Using pgAdmin (graphical, easier for Windows):**
1. Open **pgAdmin 4** from your Start menu
2. Set a master password when asked (e.g., `pgadmin123`)
3. Expand **Servers** → **PostgreSQL 16** → enter your postgres password
4. Right-click **Databases** → **Create** → **Database...**
5. Name: `grainix_erp` (use **underscore**, not hyphen)
6. Click **Save**

**Option B — Using command line:**

Windows PowerShell:
```powershell
& 'C:\Program Files\PostgreSQL\16\bin\psql.exe' -U postgres
```

Mac:
```bash
psql postgres
```

Linux:
```bash
sudo -u postgres psql
```

Then type:
```sql
CREATE DATABASE grainix_erp;
\q
```

### 3. Configure the backend

```bash
cd apps/backend
```

Windows:
```powershell
copy .env.example .env
notepad .env
```

Mac/Linux:
```bash
cp .env.example .env
nano .env
```

Find the `DATABASE_URL` line and replace `YOUR_PASSWORD` with your PostgreSQL password:
```
DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/grainix_erp?schema=public"
```

Save and close the file.

### 4. Install dependencies

```bash
cd ../..

# Root
npm install

# Backend
cd apps/backend
npm install

# Frontend
cd ../frontend
npm install

cd ../..
```

This takes 3-5 minutes. If you get network errors, try running `npm install` again.

### 5. Set up database tables

```bash
cd apps/backend
npx prisma generate
npx prisma db push
cd ../..
```

You should see: `Your database is now in sync with your Prisma schema.`

### 6. Start the software

You need **two terminal windows** running at the same time:

**Terminal 1 — Backend:**
```bash
cd apps/backend
npx nest start --watch
```
Wait for: `Grainix ERP API running on http://localhost:4000`

**Terminal 2 — Frontend (open a new window):**
```bash
cd apps/frontend
npx next dev
```
Wait for: `Ready on http://localhost:3000`

### 7. Open browser

Go to **http://localhost:3000** → Register → Start using!

---

## How to Use Grainix ERP

### Dashboard

After logging in, you'll see:
- **6 KPI Cards** at the top (Revenue, Purchases, Sales, Inventory, Production, Employees)
- **Module Cards** below — click any card to open that module
- **Ctrl+K** — Quick search to jump to any module

### Key Modules for Rice Mills

| Module | What It Does |
|--------|-------------|
| **Finance** | Chart of Accounts, Journal Entries, Trial Balance, P&L, Balance Sheet |
| **Procurement** | Buy paddy from farmers with purchase orders |
| **Sales** | Sell rice with itemized invoices (variety, quantity, rate per row) |
| **Inventory** | Track stock — auto-updates on sales and purchases |
| **Production** | Track milling/shelling batches |
| **Weighbridge** | Record truck weights — gross, tare, net with sequential slip numbers |
| **Bardana** | Track bags issued/received/returned with outstanding balance |
| **Khata/Ledger** | Party-wise running balance (DR/CR) for customers and suppliers |
| **Purchase Invoices** | Non-paddy purchases with line items |
| **HR & Payroll** | Employee management and salary processing |
| **Reports** | Financial reports with PDF download |

### Common Workflows

**Record a Paddy Purchase:**
Procurement → New Purchase Order → Select Farmer → Add Paddy Details → Save → Mark as Received

**Create a Sales Invoice:**
Sales → New Sales Order → Select Customer → Add Rice Products (variety, bags, rate) → Save → Print PDF

**Check Customer Balance:**
Finance → Party Khata → Search Customer → View Running Balance

**Record Weighbridge Entry:**
Weighbridge → New Slip → Enter Vehicle Number → Record Gross Weight → After unloading → Record Tare Weight

**View Financial Reports:**
Reports → Trial Balance / P&L / Balance Sheet → Select Date Range → View/Print

---

## Docker Alternative

If you have Docker installed, you can skip the manual setup entirely:

```bash
cd Desktop/riceflow-erp
docker compose up
```

This automatically starts PostgreSQL + Backend + Frontend. Access at http://localhost:3000.

Stop with: `Ctrl+C` or `docker compose down`

Install Docker Desktop from: https://www.docker.com/products/docker-desktop/

---

## Access from Other PCs on Your Network

1. Find your PC's IP: Run `ipconfig` (Windows) or `ip addr` (Linux/Mac) — look for `192.168.x.x`
2. Update `CORS_ORIGINS` in `apps/backend/.env`:
   ```
   CORS_ORIGINS="http://localhost:3000,http://192.168.1.100:3000"
   ```
3. Start frontend with: `npx next dev -H 0.0.0.0`
4. Other PCs open: `http://192.168.1.100:3000`

---

## Backup Your Data

```bash
# Manual backup
bash scripts/backup.sh daily

# Restore from backup
psql -U postgres grainix_erp < backups/daily/grainix_erp_2025-05-23.sql
```

## Updating the Software

```bash
cd Desktop/riceflow-erp
git pull
cd apps/backend && npm install && npx prisma generate && npx prisma db push
cd ../frontend && npm install
cd ../..
```

Then restart the servers.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `'node' is not recognized` | Restart PC after installing Node.js |
| `node --version` shows v24 | Uninstall Node 24, install Node.js 20 LTS from https://nodejs.org |
| `running scripts is disabled` | Run PowerShell as Admin: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| `psql is not recognized` | Use pgAdmin instead, or use full path: `& 'C:\Program Files\PostgreSQL\16\bin\psql.exe' -U postgres` |
| `password authentication failed` | Wrong password in `.env`. Edit `apps/backend/.env` and fix `DATABASE_URL` password |
| `database "grainix_erp" does not exist` | Create it using pgAdmin or psql (see Step 2 in Manual Setup) |
| `Cannot find module '@nestjs/platform-express'` | Run `npm install` in `apps/backend` folder |
| `'nest' is not recognized` | Use `npx nest start --watch` instead of `nest start --watch` |
| `Port 4000 already in use` | Change `PORT=4001` in `apps/backend/.env` |
| `Port 3000 already in use` | Use `npx next dev -p 3001` |
| `npm install ECONNRESET` | Network issue. Try again, or switch to mobile hotspot temporarily |
| `CORS error in browser` | Check `CORS_ORIGINS` in `.env` includes `http://localhost:3000` |
| Blank page in browser | Make sure BOTH backend and frontend are running |
| `Cannot find module 'src/main'` | You may have Node 24. Install Node.js 20 LTS instead |

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Windows 10, macOS 12, Ubuntu 20.04 | Windows 11, macOS 14, Ubuntu 22.04 |
| **Node.js** | v18 | **v20 LTS** |
| **PostgreSQL** | 14 | 16 |
| **RAM** | 4 GB | 8+ GB |
| **Disk** | 2 GB free | 10+ GB free |
| **Browser** | Chrome 90+ | Latest Chrome/Edge |

---

## Quick Reference

| Action | Command |
|--------|---------|
| **Setup (first time)** | `.\scripts\setup.ps1` (Windows) / `./scripts/setup.sh` (Mac/Linux) |
| **Start** | `.\scripts\start.ps1` or double-click `scripts\start.bat` |
| **Stop** | Close server windows or `Ctrl+C` |
| **Open in browser** | http://localhost:3000 |
| **API docs** | http://localhost:4000/docs |
| **Update** | `git pull` then re-run setup |

---

**Need help?** Contact Asad Ali — 0308-4420406
