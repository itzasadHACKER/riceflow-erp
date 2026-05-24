# ============================================================
# Grainix ERP — Automated Setup Script (Windows PowerShell)
# ============================================================
# Usage: Right-click this file → "Run with PowerShell"
#   OR open PowerShell and run: .\scripts\setup.ps1
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Grainix ERP — Automated Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------
# 1. Check Node.js
# -----------------------------------------------------------
Write-Host "[1/8] Checking Node.js..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version 2>$null
} catch {
    $nodeVersion = $null
}

if (-not $nodeVersion) {
    Write-Host ""
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js 20 LTS from:" -ForegroundColor White
    Write-Host "  https://nodejs.org/en/download" -ForegroundColor Green
    Write-Host ""
    Write-Host "Download the Windows Installer (.msi) for Node.js 20 LTS" -ForegroundColor White
    Write-Host "After installing, close this window and run setup again." -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Extract major version number
$majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')

if ($majorVersion -ge 25) {
    Write-Host ""
    Write-Host "WARNING: You have Node.js $nodeVersion" -ForegroundColor Red
    Write-Host "Node.js 25+ is too new and may cause compatibility issues." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js 20 LTS instead:" -ForegroundColor White
    Write-Host "  https://nodejs.org/en/download" -ForegroundColor Green
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

if ($majorVersion -lt 18) {
    Write-Host ""
    Write-Host "WARNING: You have Node.js $nodeVersion" -ForegroundColor Red
    Write-Host "Node.js 18 or higher is required." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js 20 LTS:" -ForegroundColor White
    Write-Host "  https://nodejs.org/en/download" -ForegroundColor Green
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

if ($majorVersion -ge 24) {
    Write-Host "  Node.js $nodeVersion detected" -ForegroundColor White
    Write-Host "  WARNING: Node.js 24 is very new. If you encounter issues," -ForegroundColor Yellow
    Write-Host "  install Node.js 20 LTS from https://nodejs.org" -ForegroundColor Yellow
} else {
    Write-Host "  Node.js $nodeVersion — OK" -ForegroundColor Green
}

# -----------------------------------------------------------
# 2. Check npm
# -----------------------------------------------------------
Write-Host "[2/8] Checking npm..." -ForegroundColor Yellow

try {
    $npmVersion = npm --version 2>$null
    Write-Host "  npm v$npmVersion — OK" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm not found. Reinstall Node.js from https://nodejs.org" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# -----------------------------------------------------------
# 3. Find project root
# -----------------------------------------------------------
Write-Host "[3/8] Finding project files..." -ForegroundColor Yellow

# Try to find the project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

# Verify we're in the right place
if (-not (Test-Path "$projectRoot\apps\backend\package.json")) {
    # Maybe script was run from project root
    if (Test-Path ".\apps\backend\package.json") {
        $projectRoot = Get-Location
    } else {
        Write-Host "ERROR: Cannot find project files." -ForegroundColor Red
        Write-Host "Make sure you run this script from the riceflow-erp folder." -ForegroundColor White
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "  Project root: $projectRoot — OK" -ForegroundColor Green

# -----------------------------------------------------------
# 4. Check PostgreSQL
# -----------------------------------------------------------
Write-Host "[4/8] Checking PostgreSQL..." -ForegroundColor Yellow

$pgFound = $false
$psqlPath = $null

# Check if psql is in PATH
try {
    $psqlCheck = psql --version 2>$null
    if ($psqlCheck) {
        $pgFound = $true
        $psqlPath = "psql"
        Write-Host "  PostgreSQL found in PATH — OK" -ForegroundColor Green
    }
} catch {}

# Check common PostgreSQL installation paths
if (-not $pgFound) {
    $pgVersions = @("17", "16", "15", "14")
    foreach ($ver in $pgVersions) {
        $testPath = "C:\Program Files\PostgreSQL\$ver\bin\psql.exe"
        if (Test-Path $testPath) {
            $pgFound = $true
            $psqlPath = $testPath
            Write-Host "  PostgreSQL $ver found at $testPath — OK" -ForegroundColor Green
            break
        }
    }
}

if (-not $pgFound) {
    Write-Host ""
    Write-Host "WARNING: PostgreSQL not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL 16 from:" -ForegroundColor White
    Write-Host "  https://www.postgresql.org/download/windows/" -ForegroundColor Green
    Write-Host ""
    Write-Host "During installation:" -ForegroundColor White
    Write-Host "  - Remember the password you set for 'postgres' user" -ForegroundColor White
    Write-Host "  - Keep the default port 5432" -ForegroundColor White
    Write-Host "  - Check 'pgAdmin 4' in components" -ForegroundColor White
    Write-Host ""
    Write-Host "After installing PostgreSQL, run this setup script again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# -----------------------------------------------------------
# 5. Create database
# -----------------------------------------------------------
Write-Host "[5/8] Setting up database..." -ForegroundColor Yellow

Write-Host ""
Write-Host "  Enter your PostgreSQL password" -ForegroundColor White
Write-Host "  (the one you set when installing PostgreSQL)" -ForegroundColor Gray

$pgPassword = Read-Host "  PostgreSQL password"

if (-not $pgPassword) {
    Write-Host "  No password entered. Trying common defaults..." -ForegroundColor Yellow
    $pgPassword = "postgres"
}

# Set PGPASSWORD for non-interactive psql
$env:PGPASSWORD = $pgPassword

# Try to create the database
try {
    if ($psqlPath -eq "psql") {
        $result = & psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='grainix_erp'" -t 2>$null
    } else {
        $result = & $psqlPath -U postgres -c "SELECT 1 FROM pg_database WHERE datname='grainix_erp'" -t 2>$null
    }

    if ($result -and $result.Trim() -eq "1") {
        Write-Host "  Database 'grainix_erp' already exists — OK" -ForegroundColor Green
    } else {
        if ($psqlPath -eq "psql") {
            & psql -U postgres -c "CREATE DATABASE grainix_erp" 2>$null
        } else {
            & $psqlPath -U postgres -c "CREATE DATABASE grainix_erp" 2>$null
        }
        Write-Host "  Database 'grainix_erp' created — OK" -ForegroundColor Green
    }
} catch {
    Write-Host ""
    Write-Host "  Could not connect to PostgreSQL automatically." -ForegroundColor Yellow
    Write-Host "  Please create the database manually:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Option A: Use pgAdmin (from Start menu)" -ForegroundColor White
    Write-Host "    1. Open pgAdmin 4" -ForegroundColor Gray
    Write-Host "    2. Connect to PostgreSQL server" -ForegroundColor Gray
    Write-Host "    3. Right-click Databases > Create > Database" -ForegroundColor Gray
    Write-Host "    4. Name: grainix_erp" -ForegroundColor Gray
    Write-Host "    5. Click Save" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Option B: Use command line" -ForegroundColor White
    Write-Host "    & '$psqlPath' -U postgres" -ForegroundColor Gray
    Write-Host "    CREATE DATABASE grainix_erp;" -ForegroundColor Gray
    Write-Host "    \q" -ForegroundColor Gray
    Write-Host ""
    $continue = Read-Host "  Have you created the database? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "  Please create the database and run setup again." -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Clear the password from environment
$env:PGPASSWORD = ""

# -----------------------------------------------------------
# 6. Configure .env files
# -----------------------------------------------------------
Write-Host "[6/8] Configuring environment files..." -ForegroundColor Yellow

$backendEnv = "$projectRoot\apps\backend\.env"

if (Test-Path $backendEnv) {
    Write-Host "  Backend .env already exists — skipping" -ForegroundColor Green
    Write-Host "  (Delete it and re-run setup to regenerate)" -ForegroundColor Gray
} else {
    $envContent = @"
# Grainix ERP — Backend Configuration (auto-generated by setup)
DATABASE_URL="postgresql://postgres:${pgPassword}@localhost:5432/grainix_erp?schema=public"
JWT_SECRET="grainix-local-$(Get-Random -Maximum 999999)-jwt-secret"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_SECRET="grainix-local-$(Get-Random -Maximum 999999)-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=4000
NODE_ENV=development
API_PREFIX=api/v1
CORS_ORIGINS=http://localhost:3000
"@
    Set-Content -Path $backendEnv -Value $envContent -Encoding UTF8
    Write-Host "  Backend .env created — OK" -ForegroundColor Green
}

# -----------------------------------------------------------
# 7. Install dependencies
# -----------------------------------------------------------
Write-Host "[7/8] Installing dependencies (this may take 3-5 minutes)..." -ForegroundColor Yellow

Write-Host "  Installing root dependencies..." -ForegroundColor Gray
Set-Location $projectRoot
npm install --loglevel=error 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Retrying root install..." -ForegroundColor Yellow
    npm install --loglevel=error 2>$null
}

Write-Host "  Installing backend dependencies..." -ForegroundColor Gray
Set-Location "$projectRoot\apps\backend"
npm install --loglevel=error 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Retrying backend install..." -ForegroundColor Yellow
    npm install --loglevel=error 2>$null
}

Write-Host "  Installing frontend dependencies..." -ForegroundColor Gray
Set-Location "$projectRoot\apps\frontend"
npm install --loglevel=error 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Retrying frontend install..." -ForegroundColor Yellow
    npm install --loglevel=error 2>$null
}

Write-Host "  Dependencies installed — OK" -ForegroundColor Green

# -----------------------------------------------------------
# 8. Set up database tables
# -----------------------------------------------------------
Write-Host "[8/8] Setting up database tables..." -ForegroundColor Yellow

Set-Location "$projectRoot\apps\backend"

Write-Host "  Generating Prisma client..." -ForegroundColor Gray
npx prisma generate 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Prisma generate failed. Check your .env DATABASE_URL" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "  Creating database tables..." -ForegroundColor Gray
npx prisma db push 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  ERROR: Could not connect to database." -ForegroundColor Red
    Write-Host "  Check that:" -ForegroundColor Yellow
    Write-Host "    1. PostgreSQL is running (check Services app)" -ForegroundColor White
    Write-Host "    2. Password in .env matches your PostgreSQL password" -ForegroundColor White
    Write-Host "    3. Database 'grainix_erp' exists" -ForegroundColor White
    Write-Host ""
    Write-Host "  To fix the password, edit: $backendEnv" -ForegroundColor White
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "  Database tables created — OK" -ForegroundColor Green

# -----------------------------------------------------------
# Done!
# -----------------------------------------------------------
Set-Location $projectRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start Grainix ERP, run:" -ForegroundColor White
Write-Host "  .\scripts\start.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or start manually:" -ForegroundColor White
Write-Host "  Terminal 1 (Backend):" -ForegroundColor Gray
Write-Host "    cd $projectRoot\apps\backend" -ForegroundColor Gray
Write-Host "    npx nest start --watch" -ForegroundColor Gray
Write-Host ""
Write-Host "  Terminal 2 (Frontend):" -ForegroundColor Gray
Write-Host "    cd $projectRoot\apps\frontend" -ForegroundColor Gray
Write-Host "    npx next dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  Then open: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to close"
