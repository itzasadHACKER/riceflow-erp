# Grainix ERP — Local Setup Guide (Your PC as Server)

**Powered by Asad Ali | 0308-4420406**

This guide walks you through setting up Grainix ERP on your own Windows/Mac/Linux computer. Your PC will act as the server, and you'll access the software through your web browser at `http://localhost:3000`.

---

## Prerequisites

Before starting, you need to install these free tools on your computer:

### 1. Install Node.js (v18 or higher)

**Windows:**
1. Go to https://nodejs.org
2. Download the **LTS** version (green button)
3. Run the installer → click Next through all steps → Finish
4. Open **Command Prompt** or **PowerShell** and verify:
   ```
   node --version
   npm --version
   ```
   You should see version numbers like `v18.x.x` and `9.x.x`

**Mac:**
```bash
# Using Homebrew (install from https://brew.sh if you don't have it)
brew install node@18
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install PostgreSQL 16

**Windows:**
1. Go to https://www.postgresql.org/download/windows/
2. Download the installer from EDB
3. Run installer:
   - Choose install directory (default is fine)
   - **Set a password** for the `postgres` user — **REMEMBER THIS PASSWORD!**
   - Keep default port `5432`
   - Click Next → Finish
4. Open **pgAdmin** (installed with PostgreSQL) or use command line

**Mac:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install -y postgresql-16 postgresql-client-16
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Install Git

**Windows:** Download from https://git-scm.com/download/win and install with defaults.

**Mac:** `brew install git` or it comes with Xcode Command Line Tools.

**Linux:** `sudo apt install -y git`

---

## Step-by-Step Setup

### Step 1: Download the Software

Open your terminal (Command Prompt on Windows, Terminal on Mac/Linux):

```bash
# Navigate to where you want to install (e.g., Desktop)
cd Desktop

# Clone the repository
git clone https://github.com/itzasadHACKER/riceflow-erp.git

# Enter the project folder
cd riceflow-erp
```

### Step 2: Create the Database

**Windows (using pgAdmin):**
1. Open pgAdmin
2. Connect to your local server
3. Right-click "Databases" → "Create" → "Database"
4. Name it: `grainix_erp`
5. Click Save

**Windows (using Command Prompt):**
```bash
# Open psql (you'll be prompted for the postgres password you set during installation)
psql -U postgres

# Inside psql, create the database:
CREATE DATABASE grainix_erp;

# Exit psql
\q
```

**Mac/Linux:**
```bash
sudo -u postgres psql -c "CREATE DATABASE grainix_erp;"
```

### Step 3: Configure the Backend

```bash
# Navigate to the backend folder
cd apps/backend

# Create the environment file
# On Windows (Command Prompt):
copy .env.example .env

# On Mac/Linux:
cp .env.example .env
```

Now open the `.env` file in any text editor (Notepad, VS Code, nano) and update these values:

```env
# Database connection — update YOUR_PASSWORD with the PostgreSQL password you set
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/grainix_erp"

# Secret key for authentication — change this to any random long string
JWT_SECRET="my-super-secret-key-change-this-to-something-random-123456"

# Port for the backend API
PORT=3001

# Frontend URL (for CORS)
CORS_ORIGINS="http://localhost:3000"
```

**IMPORTANT:** Replace `YOUR_PASSWORD` with the actual PostgreSQL password you set during installation.

### Step 4: Install Dependencies

```bash
# Go back to the project root
cd ../..

# Install all dependencies (this may take 2-5 minutes)
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

### Step 5: Set Up the Database Tables

```bash
cd apps/backend

# Generate Prisma client
npx prisma generate

# Create all database tables
npx prisma db push

# Go back to project root
cd ../..
```

### Step 6: Start the Software

You need to run two terminals — one for the backend and one for the frontend.

**Terminal 1 — Backend API:**
```bash
cd apps/backend
npm run start:dev
```
You should see: `Nest application successfully started` and `Listening on port 3001`

**Terminal 2 — Frontend (open a NEW terminal window):**
```bash
cd apps/frontend
npm run dev
```
You should see: `Ready on http://localhost:3000`

### Step 7: Access Grainix ERP

1. Open your web browser (Chrome, Firefox, Edge)
2. Go to: **http://localhost:3000**
3. You'll see the registration page
4. Create your first account:
   - Enter your company name
   - Select your default currency (PKR, USD, etc.)
   - Set your email and password
5. After registration, you'll be taken to the dashboard

---

## Daily Usage

Every time you want to use the software:

1. Open **Terminal 1**: `cd riceflow-erp/apps/backend && npm run start:dev`
2. Open **Terminal 2**: `cd riceflow-erp/apps/frontend && npm run dev`
3. Open browser: `http://localhost:3000`

To stop the software, press `Ctrl+C` in both terminal windows.

---

## Using Docker (Alternative — Easier)

If you prefer Docker (handles PostgreSQL automatically):

### Install Docker Desktop
- **Windows/Mac:** Download from https://www.docker.com/products/docker-desktop/
- **Linux:** `sudo apt install docker.io docker-compose`

### Start Everything with One Command
```bash
cd riceflow-erp
docker compose up
```

This starts PostgreSQL, Backend, and Frontend automatically.
Access at: **http://localhost:3000**

To stop: `Ctrl+C` or `docker compose down`

---

## Accessing from Other Computers on Your Network

If you want other computers in your office to access the software (while your PC is the server):

1. Find your PC's local IP address:
   - **Windows:** Open Command Prompt → type `ipconfig` → look for "IPv4 Address" (e.g., `192.168.1.100`)
   - **Mac/Linux:** `ifconfig` or `ip addr` → look for your IP (e.g., `192.168.1.100`)

2. Update the frontend to allow network access. In `apps/frontend/package.json`, change the dev script:
   ```json
   "dev": "next dev -H 0.0.0.0"
   ```

3. Update `CORS_ORIGINS` in `apps/backend/.env`:
   ```
   CORS_ORIGINS="http://localhost:3000,http://192.168.1.100:3000"
   ```

4. Other computers on the same network can now access: `http://192.168.1.100:3000`

---

## Backup Your Data

Run the backup script regularly to protect your data:

```bash
# Manual backup
cd riceflow-erp
bash scripts/backup.sh daily
```

Backup files will be saved in `backups/` folder.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "Cannot connect to database" | Make sure PostgreSQL is running. On Windows, check Services → postgresql |
| "Port 3001 already in use" | Another program is using port 3001. Change PORT in .env to 3002 |
| "Port 3000 already in use" | Close other dev servers or change the frontend port |
| "npm install fails" | Delete `node_modules` folder and try again. Make sure Node.js is v18+ |
| "Prisma error" | Run `npx prisma generate` again, then `npx prisma db push` |
| "Module not found" | Run `npm install` in the specific app folder (backend or frontend) |

---

## System Requirements

| Component | Minimum | Recommended |
|---|---|---|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Disk | 2 GB free | 10+ GB |
| OS | Windows 10, macOS 12, Ubuntu 20.04 | Latest versions |
| Node.js | v18 | v20 LTS |
| PostgreSQL | 14 | 16 |

---

**Need help?** Contact Asad Ali — 0308-4420406
