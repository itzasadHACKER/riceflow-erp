# Grainix ERP — Complete Local Installation Guide

**Powered by Asad Ali | 0308-4420406**

Install and run Grainix ERP on your own Windows/Mac/Linux computer. Your PC acts as the server — access the software through your browser at `http://localhost:3000`.

---

## Table of Contents

1. [What You Need (Prerequisites)](#what-you-need-prerequisites)
2. [Step 1: Install Node.js](#step-1-install-nodejs)
3. [Step 2: Install PostgreSQL](#step-2-install-postgresql)
4. [Step 3: Install Git](#step-3-install-git)
5. [Step 4: Download Grainix ERP](#step-4-download-grainix-erp)
6. [Step 5: Create the Database](#step-5-create-the-database)
7. [Step 6: Configure the Software](#step-6-configure-the-software)
8. [Step 7: Install Dependencies](#step-7-install-dependencies)
9. [Step 8: Set Up Database Tables](#step-8-set-up-database-tables)
10. [Step 9: Start the Software](#step-9-start-the-software)
11. [Step 10: Register and Start Using](#step-10-register-and-start-using)
12. [How to Use Grainix ERP](#how-to-use-grainix-erp)
13. [Daily Usage (Start/Stop)](#daily-usage-startstop)
14. [Docker Alternative (Easier)](#docker-alternative-easier)
15. [Access from Other PCs on Your Network](#access-from-other-pcs-on-your-network)
16. [Backup Your Data](#backup-your-data)
17. [Updating the Software](#updating-the-software)
18. [Troubleshooting](#troubleshooting)
19. [System Requirements](#system-requirements)

---

## What You Need (Prerequisites)

You need to install **3 free programs** on your computer before setting up Grainix ERP:

| Program | What It Does | Download Link |
|---|---|---|
| **Node.js 20 LTS** | Runs the backend and frontend code | https://nodejs.org |
| **PostgreSQL 16** | Stores all your data (customers, invoices, etc.) | https://www.postgresql.org/download |
| **Git** | Downloads the Grainix ERP source code | https://git-scm.com |

**Time required:** About 30-45 minutes for first-time setup.

---

## Step 1: Install Node.js

### Windows

1. Go to **https://nodejs.org**
2. Click the big green **"Download Node.js (LTS)"** button
3. Run the downloaded `.msi` file
4. Click **Next** through all steps (keep all defaults)
5. On the "Tools for Native Modules" page, check **"Automatically install the necessary tools"** if prompted
6. Click **Install** → **Finish**

**Verify it worked:** Open **Command Prompt** (press `Win+R`, type `cmd`, press Enter) and run:
```
node --version
npm --version
```
You should see something like `v20.x.x` and `10.x.x`. If you see `'node' is not recognized`, restart your computer and try again.

### Mac

Open **Terminal** (press `Cmd+Space`, type "Terminal", press Enter):
```bash
# Install Homebrew first (if you don't have it):
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Then install Node.js:
brew install node@20
```

### Linux (Ubuntu/Debian)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## Step 2: Install PostgreSQL

### Windows

1. Go to **https://www.postgresql.org/download/windows/**
2. Click **"Download the installer"** → this takes you to EDB's site
3. Download the **PostgreSQL 16** installer for Windows x86-64
4. Run the installer:
   - **Installation Directory:** Keep default (`C:\Program Files\PostgreSQL\16`)
   - **Select Components:** Keep all checked (PostgreSQL Server, pgAdmin 4, Stack Builder, Command Line Tools)
   - **Data Directory:** Keep default
   - **Password:** **Set a password for the `postgres` user** — for example: `postgres123`
     - **WRITE THIS PASSWORD DOWN! You will need it later.**
   - **Port:** Keep default `5432`
   - **Locale:** Keep default
   - Click **Next** → **Next** → **Finish**
5. **Uncheck** "Launch Stack Builder" when asked → Click **Finish**

**Verify it worked:**
- Open **pgAdmin 4** from your Start menu — if it opens without error, PostgreSQL is installed correctly
- Or open Command Prompt and run: `psql -U postgres --version`

### Mac

```bash
brew install postgresql@16
brew services start postgresql@16
```

### Linux (Ubuntu/Debian)

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update

# Install PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-client-16

# Start the service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

## Step 3: Install Git

### Windows

1. Go to **https://git-scm.com/download/win**
2. The download should start automatically
3. Run the installer → keep clicking **Next** with all default options → **Install** → **Finish**

**Verify:** Open Command Prompt and run:
```
git --version
```
You should see `git version 2.x.x`.

### Mac

```bash
# Git comes with Xcode Command Line Tools:
xcode-select --install
# Or via Homebrew:
brew install git
```

### Linux

```bash
sudo apt install -y git
```

---

## Step 4: Download Grainix ERP

### Where to Run Commands

- **Windows:** Open **Command Prompt** (press `Win+R` → type `cmd` → Enter) or **PowerShell** (press `Win+X` → select "Windows PowerShell")
- **Mac:** Open **Terminal** (press `Cmd+Space` → type "Terminal" → Enter)
- **Linux:** Open your terminal application

### Download

```bash
# Go to your Desktop (or wherever you want to install)
cd Desktop

# Download the Grainix ERP code
git clone https://github.com/itzasadHACKER/riceflow-erp.git

# Enter the project folder
cd riceflow-erp
```

This creates a folder called `riceflow-erp` on your Desktop containing all the source code.

---

## Step 5: Create the Database

You need to create an empty database that Grainix ERP will use to store all your data.

### Windows — Using pgAdmin (Graphical — Easier)

1. Open **pgAdmin 4** from your Start menu
2. When asked for a master password, set one (e.g., `pgadmin123`) — this is different from the postgres password
3. In the left sidebar, expand **Servers** → **PostgreSQL 16**
4. Enter your `postgres` password when prompted (the one you set during PostgreSQL installation)
5. Right-click **Databases** → **Create** → **Database...**
6. In the **Database** field, type: `grainix_erp`
7. Click **Save**

### Windows — Using Command Line

Open Command Prompt:
```bash
# Connect to PostgreSQL (enter your postgres password when prompted)
psql -U postgres

# Create the database
CREATE DATABASE grainix_erp;

# Create a dedicated user (optional but recommended)
CREATE USER grainix WITH PASSWORD 'grainix_secret';
GRANT ALL PRIVILEGES ON DATABASE grainix_erp TO grainix;
ALTER DATABASE grainix_erp OWNER TO grainix;

# Exit
\q
```

**If `psql` is not recognized on Windows:**
- Add PostgreSQL to your PATH: Go to **System Properties** → **Environment Variables** → Edit **Path** → Add `C:\Program Files\PostgreSQL\16\bin`
- Or use the full path: `"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres`

### Mac

```bash
# If using Homebrew PostgreSQL:
createdb grainix_erp

# Or using psql:
psql postgres -c "CREATE DATABASE grainix_erp;"
```

### Linux

```bash
sudo -u postgres psql -c "CREATE DATABASE grainix_erp;"
sudo -u postgres psql -c "CREATE USER grainix WITH PASSWORD 'grainix_secret';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE grainix_erp TO grainix;"
sudo -u postgres psql -c "ALTER DATABASE grainix_erp OWNER TO grainix;"
```

---

## Step 6: Configure the Software

### 6.1 — Configure the Backend

Navigate to the backend folder and create the configuration file:

```bash
# From the riceflow-erp folder:
cd apps/backend

# Copy the example config file:
# Windows (Command Prompt):
copy .env.example .env

# Mac/Linux:
cp .env.example .env
```

Now open the `.env` file in a text editor:
- **Windows:** Open with Notepad: `notepad .env`
- **Mac/Linux:** Open with nano: `nano .env`
- **Or** use VS Code: `code .env` (if you have VS Code installed)

Update these values in the `.env` file:

```env
# === DATABASE ===
# If you created a dedicated user in Step 5:
DATABASE_URL="postgresql://grainix:grainix_secret@localhost:5432/grainix_erp"

# OR if you're using the default postgres user:
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/grainix_erp"

# === AUTHENTICATION ===
# Change this to any random long string (the longer the better)
JWT_SECRET="my-super-secret-key-change-this-in-production-abc123xyz789"

# === SERVER ===
PORT=4000
NODE_ENV=development

# === CORS ===
CORS_ORIGINS="http://localhost:3000"
```

**IMPORTANT:** Replace `YOUR_POSTGRES_PASSWORD` with the actual password you set when installing PostgreSQL (e.g., `postgres123`).

Save the file:
- **Notepad:** `Ctrl+S`
- **nano:** `Ctrl+X` → `Y` → `Enter`
- **VS Code:** `Ctrl+S`

### 6.2 — Configure the Frontend (Optional)

The frontend should work with defaults, but if the backend runs on a different port, create a config file:

```bash
# From apps/frontend folder:
cd ../frontend
```

Create a file called `.env.local`:
- **Windows:** `notepad .env.local`
- **Mac/Linux:** `nano .env.local`

Add:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

Save and close.

```bash
# Go back to project root
cd ../..
```

---

## Step 7: Install Dependencies

This downloads all the code libraries that Grainix ERP needs. Run these commands from the `riceflow-erp` folder:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd apps/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Go back to project root
cd ../..
```

**This takes 3-8 minutes** depending on your internet speed. You'll see a progress bar and lots of text — that's normal.

**If you see errors:**
- Try running the failed command again
- Make sure you have Node.js 20+ installed (`node --version`)
- On Windows, if you see `EPERM` errors, try running Command Prompt as Administrator

---

## Step 8: Set Up Database Tables

This creates all the tables in your database (customers, invoices, accounts, etc.):

```bash
cd apps/backend

# Generate the database client
npx prisma generate

# Create all tables in your database
npx prisma db push

# Go back to project root
cd ../..
```

You should see: `Your database is now in sync with your Prisma schema.`

**If you get a connection error:** Double-check your `DATABASE_URL` in the `.env` file. Make sure:
- PostgreSQL is running (check Windows Services or run `sudo systemctl status postgresql` on Linux)
- The password is correct
- The database `grainix_erp` exists

---

## Step 9: Start the Software

You need **TWO terminal windows** — one for the backend API server and one for the frontend web server.

### Terminal 1 — Start the Backend

```bash
cd apps/backend
npm run start:dev
```

**Wait until you see:** `Nest application successfully started` and `Listening on port 4000`

**Keep this terminal window open!** The backend must stay running.

### Terminal 2 — Start the Frontend

Open a **new/second terminal window** (don't close the first one!):
- **Windows:** Press `Win+R` → type `cmd` → Enter (for a new Command Prompt)
- **Mac:** Press `Cmd+T` in Terminal (new tab) or `Cmd+N` (new window)

```bash
# Navigate to the frontend folder (adjust path based on where you cloned)
cd Desktop/riceflow-erp/apps/frontend
npm run dev
```

**Wait until you see:** `Ready on http://localhost:3000`

**Keep this terminal window open too!**

---

## Step 10: Register and Start Using

1. Open your web browser (**Google Chrome** recommended)
2. Go to: **http://localhost:3000**
3. You'll see the Grainix ERP login page with a purple gradient on the left
4. Click **"Sign up"** to register a new account
5. Fill in:
   - **First Name** and **Last Name**
   - **Email:** Use any email (e.g., `admin@mycompany.com`)
   - **Password:** At least 8 characters
   - **Organization Name:** Your rice mill name (e.g., "Ahmad Rice Mills")
6. Click **Register**
7. You'll be taken to the **Dashboard** with 41 colorful module cards

**Congratulations! Grainix ERP is now running on your PC!**

---

## How to Use Grainix ERP

### Dashboard Overview

After logging in, you'll see:
- **6 KPI Cards** at the top (Revenue, Purchases, Sales, Inventory, Production, Employees)
- **41 Module Cards** below — click any card to open that module

### Key Modules for a Rice Mill

| Module | What It Does | How to Use |
|---|---|---|
| **Finance** | Chart of Accounts, Journal Entries, Trial Balance | Click "Finance" → View/create accounts → Post journal entries |
| **Procurement** | Buy paddy from farmers | Click "Procurement" → "New Purchase Order" → Select supplier → Add items |
| **Sales** | Sell rice to customers | Click "Sales" → "New Sales Order" → Select customer → Add products |
| **Inventory** | Track stock in warehouses | Click "Inventory" → View stock levels → Transfer between warehouses |
| **Production** | Track milling/shelling | Click "Production" → Create production batch → Record input/output |
| **HR & Payroll** | Manage employees and salaries | Click "HR" → Add employees → Process payroll |
| **Weighbridge** | Record truck weights | Click "Weighbridge" (under Logistics) → Record gross weight → Record tare weight |
| **Bardana** | Track bags issued/received | Click "Bardana" → Issue bags → Record returns |
| **Khata/Ledger** | Party-wise running balance | Click "Party Khata" (under Finance) → Search customer/supplier → View balance |
| **Purchase Invoices** | Non-paddy purchases | Click "Purchase Invoices" → Create invoice with line items |
| **Assets** | Track fixed assets | Click "Assets" → Add machinery/vehicles → Track depreciation |
| **Reports** | Financial reports | Click "Reports" → Select report type → View/download PDF |

### Common Workflows

**1. Record a Paddy Purchase:**
```
Procurement → New Purchase Order → Select Farmer → Add Paddy Details
(Variety, Quantity, Moisture %, Rate) → Save → Mark as Received
```

**2. Create a Sales Invoice:**
```
Sales → New Sales Order → Select Customer → Add Rice Products
(Variety, Bags, Rate per Bag) → Save → Generate Invoice → Print PDF
```

**3. Check Customer Balance (Khata):**
```
Finance → Party Khata → Search Customer Name → View Running Balance
(Shows all purchases, payments, credits with running DR/CR balance)
```

**4. Record Weighbridge Entry:**
```
Weighbridge → New Slip → Enter Vehicle Number → Record Gross Weight
→ After unloading → Record Tare Weight → Net Weight auto-calculated
```

**5. View Financial Reports:**
```
Reports → Trial Balance / P&L / Balance Sheet → Select Date Range → View/Print
```

### Quick Search (Cmd+K / Ctrl+K)

Press **Ctrl+K** (Windows/Linux) or **Cmd+K** (Mac) from anywhere to open the command palette. Type any module name to quickly jump to it.

### Sidebar Navigation

The left sidebar organizes all 41+ modules into categories:
- **Organization** — Company settings, HR, Workflow
- **Finance** — Accounting, Expenses, Bank, Budgeting
- **Sales & CRM** — Sales Orders, Quotations, CRM, Marketing
- **Purchasing** — Purchase Orders, Invoices, RFQ
- **Inventory & Logistics** — Stock, Transport, Gate Pass, Weighbridge, Bardana
- **Production** — Milling, BOM, MRP, Quality Control
- **Intelligence** — Reports, Analytics, AI Assistant
- **Administration** — Settings, Audit Trail, Data Import

Click the arrow (>) next to any section to expand/collapse sub-modules.

---

## Daily Usage (Start/Stop)

### Starting the Software (Every Time You Want to Use It)

Open **two terminal windows** and run:

**Terminal 1:**
```bash
cd Desktop/riceflow-erp/apps/backend
npm run start:dev
```

**Terminal 2:**
```bash
cd Desktop/riceflow-erp/apps/frontend
npm run dev
```

Then open browser: **http://localhost:3000**

### Stopping the Software

Press **Ctrl+C** in both terminal windows. This safely stops the servers.

### Is My Data Safe When I Stop?

**Yes!** Your data is stored in PostgreSQL, which runs independently. Stopping the Grainix servers does NOT delete any data. When you start again, all your invoices, customers, and transactions will still be there.

---

## Docker Alternative (Easier)

If you find the manual setup too complex, Docker handles everything automatically.

### Install Docker

- **Windows/Mac:** Download **Docker Desktop** from https://www.docker.com/products/docker-desktop/ and install
- **Linux:** `sudo apt install -y docker.io docker-compose`

### Start Everything with One Command

```bash
cd Desktop/riceflow-erp
docker compose up
```

This automatically:
- Starts PostgreSQL (no need to install separately)
- Starts the Backend API
- Starts the Frontend
- Creates all database tables

Access at: **http://localhost:3000**

### Stop

Press `Ctrl+C` or run:
```bash
docker compose down
```

### Restart

```bash
docker compose up
```

---

## Access from Other PCs on Your Network

If you want other computers in your office (on the same WiFi/LAN) to access Grainix while your PC runs the server:

### 1. Find Your PC's Local IP Address

**Windows:** Open Command Prompt → type:
```
ipconfig
```
Look for **"IPv4 Address"** under your active network adapter (e.g., `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig
# or
ip addr
```
Look for your IP (e.g., `192.168.1.100`)

### 2. Update Configuration

Update `CORS_ORIGINS` in `apps/backend/.env`:
```env
CORS_ORIGINS="http://localhost:3000,http://192.168.1.100:3000"
```

### 3. Start Frontend with Network Access

```bash
cd apps/frontend
npx next dev -H 0.0.0.0
```

### 4. Access from Other PCs

Other computers on the same network can now open: `http://192.168.1.100:3000`

(Replace `192.168.1.100` with your actual IP from step 1)

---

## Backup Your Data

### Manual Backup

```bash
# From the riceflow-erp folder:
bash scripts/backup.sh daily
```

This creates a backup file in the `backups/` folder.

### Restore from Backup

```bash
# Replace the filename with your actual backup file:
psql -U postgres grainix_erp < backups/daily/grainix_erp_2025-05-23.sql
```

### Automated Backup (Linux/Mac)

Set up a daily automatic backup:
```bash
crontab -e
```
Add this line:
```
0 2 * * * cd /path/to/riceflow-erp && bash scripts/backup.sh daily
```

---

## Updating the Software

When new updates are available:

```bash
cd Desktop/riceflow-erp

# Download latest code
git pull

# Update dependencies
cd apps/backend && npm install
cd ../frontend && npm install
cd ../..

# Update database tables (if schema changed)
cd apps/backend
npx prisma generate
npx prisma db push

# Restart the software (Ctrl+C in both terminals, then start again)
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `'node' is not recognized` | Restart your computer after installing Node.js. If still not working, reinstall Node.js |
| `'git' is not recognized` | Restart your computer after installing Git |
| `Cannot connect to database` | Make sure PostgreSQL is running. On Windows: open **Services** (Win+R → `services.msc`) → find **postgresql** → make sure it says **Running** |
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL is not running. Start it from Services (Windows) or `sudo systemctl start postgresql` (Linux) |
| `password authentication failed` | Wrong password in `.env` file. Check the `DATABASE_URL` password matches what you set during PostgreSQL installation |
| `database "grainix_erp" does not exist` | You forgot Step 5. Go back and create the database |
| `Port 4000 already in use` | Something else is using port 4000. Either close that program or change `PORT=4001` in `.env` |
| `Port 3000 already in use` | Close other dev servers. Or change the frontend port: `npx next dev -p 3001` |
| `npm install fails with EPERM` | On Windows, run Command Prompt as **Administrator** (right-click → Run as administrator) |
| `npm install fails with EACCES` | On Mac/Linux, don't use `sudo npm install`. Instead fix permissions: `sudo chown -R $(whoami) ~/.npm` |
| `Prisma error: migration failed` | Delete `prisma/migrations` folder and run `npx prisma db push` again |
| `Module not found` errors | Run `npm install` in the specific folder (backend or frontend) |
| `next: command not found` | Run `npm install` in the `apps/frontend` folder |
| `nest: command not found` | Run `npm install` in the `apps/backend` folder |
| Browser shows blank page | Check both terminals for errors. Make sure backend AND frontend are both running |
| `CORS error` in browser | Check `CORS_ORIGINS` in `apps/backend/.env` includes `http://localhost:3000` |
| Slow performance | Make sure you have at least 4 GB RAM free. Close other heavy programs |

---

## System Requirements

| Component | Minimum | Recommended |
|---|---|---|
| **CPU** | 2 cores | 4+ cores |
| **RAM** | 4 GB | 8+ GB |
| **Disk Space** | 2 GB free | 10+ GB free |
| **OS** | Windows 10, macOS 12, Ubuntu 20.04 | Windows 11, macOS 14, Ubuntu 22.04 |
| **Node.js** | v18 | v20 LTS |
| **PostgreSQL** | 14 | 16 |
| **Browser** | Chrome 90+ | Latest Chrome/Edge |

---

## Quick Reference Card

| Action | Command |
|---|---|
| **Start backend** | `cd apps/backend && npm run start:dev` |
| **Start frontend** | `cd apps/frontend && npm run dev` |
| **Open in browser** | `http://localhost:3000` |
| **Stop servers** | `Ctrl+C` in both terminals |
| **Update database** | `cd apps/backend && npx prisma db push` |
| **Manual backup** | `bash scripts/backup.sh daily` |
| **Update software** | `git pull && cd apps/backend && npm install && npx prisma db push` |
| **Quick search** | `Ctrl+K` (Windows/Linux) or `Cmd+K` (Mac) |

---

**Need help?** Contact Asad Ali — 0308-4420406
