#!/bin/bash
# ============================================================
# Grainix ERP — Automated Setup Script (Mac/Linux)
# ============================================================
# Usage: chmod +x scripts/setup.sh && ./scripts/setup.sh
# ============================================================

set -e

echo ""
echo "========================================"
echo "  Grainix ERP — Automated Setup"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m'

# -----------------------------------------------------------
# 1. Check Node.js
# -----------------------------------------------------------
echo -e "${YELLOW}[1/8] Checking Node.js...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed!${NC}"
    echo "Please install Node.js 20 LTS from: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node --version)
MAJOR_VERSION=$(echo "$NODE_VERSION" | sed 's/v\([0-9]*\).*/\1/')

if [ "$MAJOR_VERSION" -ge 25 ]; then
    echo -e "${RED}WARNING: You have Node.js $NODE_VERSION${NC}"
    echo "Node.js 25+ is too new. Please install Node.js 20 LTS."
    exit 1
fi

if [ "$MAJOR_VERSION" -lt 18 ]; then
    echo -e "${RED}WARNING: You have Node.js $NODE_VERSION${NC}"
    echo "Node.js 18 or higher is required."
    exit 1
fi

if [ "$MAJOR_VERSION" -ge 24 ]; then
    echo -e "  Node.js $NODE_VERSION detected"
    echo -e "${YELLOW}  WARNING: Node.js 24 is very new. If you encounter issues,${NC}"
    echo -e "${YELLOW}  install Node.js 20 LTS from https://nodejs.org${NC}"
else
    echo -e "${GREEN}  Node.js $NODE_VERSION — OK${NC}"
fi

# -----------------------------------------------------------
# 2. Check npm
# -----------------------------------------------------------
echo -e "${YELLOW}[2/8] Checking npm...${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}ERROR: npm not found. Reinstall Node.js.${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}  npm v$NPM_VERSION — OK${NC}"

# -----------------------------------------------------------
# 3. Find project root
# -----------------------------------------------------------
echo -e "${YELLOW}[3/8] Finding project files...${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ ! -f "$PROJECT_ROOT/apps/backend/package.json" ]; then
    if [ -f "./apps/backend/package.json" ]; then
        PROJECT_ROOT="$(pwd)"
    else
        echo -e "${RED}ERROR: Cannot find project files.${NC}"
        echo "Make sure you run this script from the riceflow-erp folder."
        exit 1
    fi
fi

echo -e "${GREEN}  Project root: $PROJECT_ROOT — OK${NC}"

# -----------------------------------------------------------
# 4. Check PostgreSQL
# -----------------------------------------------------------
echo -e "${YELLOW}[4/8] Checking PostgreSQL...${NC}"

if ! command -v psql &> /dev/null; then
    echo -e "${RED}WARNING: PostgreSQL (psql) not found!${NC}"
    echo ""
    echo "Install PostgreSQL:"
    echo "  Mac:   brew install postgresql@16 && brew services start postgresql@16"
    echo "  Ubuntu: sudo apt install postgresql postgresql-contrib"
    echo "  Fedora: sudo dnf install postgresql-server postgresql-contrib"
    echo ""
    echo "After installing, run this setup script again."
    exit 1
fi

echo -e "${GREEN}  PostgreSQL found — OK${NC}"

# -----------------------------------------------------------
# 5. Create database
# -----------------------------------------------------------
echo -e "${YELLOW}[5/8] Setting up database...${NC}"

echo ""
echo "  Enter your PostgreSQL password"
echo "  (leave blank if using peer/trust authentication)"
read -sp "  PostgreSQL password: " PG_PASSWORD
echo ""

if [ -z "$PG_PASSWORD" ]; then
    # Try without password (peer auth on Linux, trust on Mac)
    DB_EXISTS=$(psql -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname='grainix_erp'" 2>/dev/null || echo "")
else
    export PGPASSWORD="$PG_PASSWORD"
    DB_EXISTS=$(psql -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname='grainix_erp'" 2>/dev/null || echo "")
fi

if echo "$DB_EXISTS" | grep -q "1"; then
    echo -e "${GREEN}  Database 'grainix_erp' already exists — OK${NC}"
else
    if [ -z "$PG_PASSWORD" ]; then
        psql -U postgres -c "CREATE DATABASE grainix_erp" 2>/dev/null || {
            # Try with sudo (Linux peer auth)
            sudo -u postgres psql -c "CREATE DATABASE grainix_erp" 2>/dev/null || {
                echo -e "${YELLOW}  Could not create database automatically.${NC}"
                echo "  Please create it manually:"
                echo "    psql -U postgres -c 'CREATE DATABASE grainix_erp'"
                read -p "  Have you created the database? (y/n) " CREATED
                if [ "$CREATED" != "y" ] && [ "$CREATED" != "Y" ]; then
                    echo "  Please create the database and run setup again."
                    exit 1
                fi
            }
        }
    else
        psql -U postgres -c "CREATE DATABASE grainix_erp" 2>/dev/null || {
            echo -e "${YELLOW}  Could not create database automatically.${NC}"
            echo "  Please create it manually:"
            echo "    psql -U postgres -c 'CREATE DATABASE grainix_erp'"
            read -p "  Have you created the database? (y/n) " CREATED
            if [ "$CREATED" != "y" ] && [ "$CREATED" != "Y" ]; then
                echo "  Please create the database and run setup again."
                exit 1
            fi
        }
    fi
    echo -e "${GREEN}  Database 'grainix_erp' created — OK${NC}"
fi

unset PGPASSWORD

# -----------------------------------------------------------
# 6. Configure .env files
# -----------------------------------------------------------
echo -e "${YELLOW}[6/8] Configuring environment files...${NC}"

BACKEND_ENV="$PROJECT_ROOT/apps/backend/.env"

if [ -f "$BACKEND_ENV" ]; then
    echo -e "${GREEN}  Backend .env already exists — skipping${NC}"
    echo -e "${GRAY}  (Delete it and re-run setup to regenerate)${NC}"
else
    if [ -z "$PG_PASSWORD" ]; then
        DB_URL="postgresql://postgres@localhost:5432/grainix_erp?schema=public"
    else
        DB_URL="postgresql://postgres:${PG_PASSWORD}@localhost:5432/grainix_erp?schema=public"
    fi
    cat > "$BACKEND_ENV" << EOF
# Grainix ERP — Backend Configuration (auto-generated by setup)
DATABASE_URL="${DB_URL}"
JWT_SECRET="grainix-local-${RANDOM}-jwt-secret"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_SECRET="grainix-local-${RANDOM}-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=4000
NODE_ENV=development
API_PREFIX=api/v1
CORS_ORIGINS=http://localhost:3000
EOF
    echo -e "${GREEN}  Backend .env created — OK${NC}"
fi

# -----------------------------------------------------------
# 7. Install dependencies
# -----------------------------------------------------------
echo -e "${YELLOW}[7/8] Installing dependencies (this may take 3-5 minutes)...${NC}"

echo -e "${GRAY}  Installing root dependencies...${NC}"
cd "$PROJECT_ROOT"
npm install --loglevel=error 2>/dev/null || npm install --loglevel=error

echo -e "${GRAY}  Installing backend dependencies...${NC}"
cd "$PROJECT_ROOT/apps/backend"
npm install --loglevel=error 2>/dev/null || npm install --loglevel=error

echo -e "${GRAY}  Installing frontend dependencies...${NC}"
cd "$PROJECT_ROOT/apps/frontend"
npm install --loglevel=error 2>/dev/null || npm install --loglevel=error

echo -e "${GREEN}  Dependencies installed — OK${NC}"

# -----------------------------------------------------------
# 8. Set up database tables
# -----------------------------------------------------------
echo -e "${YELLOW}[8/8] Setting up database tables...${NC}"

cd "$PROJECT_ROOT/apps/backend"

echo -e "${GRAY}  Generating Prisma client...${NC}"
npx prisma generate 2>/dev/null || {
    echo -e "${RED}  ERROR: Prisma generate failed.${NC}"
    exit 1
}

echo -e "${GRAY}  Creating database tables...${NC}"
npx prisma db push 2>/dev/null || {
    echo -e "${RED}  ERROR: Could not connect to database.${NC}"
    echo "  Check that PostgreSQL is running and .env is correct."
    exit 1
}

echo -e "${GREEN}  Database tables created — OK${NC}"

# -----------------------------------------------------------
# Done!
# -----------------------------------------------------------
cd "$PROJECT_ROOT"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SETUP COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "To start Grainix ERP, run:"
echo -e "${CYAN}  ./scripts/start.sh${NC}"
echo ""
echo "Or start manually in two terminals:"
echo "  Terminal 1 (Backend):"
echo "    cd $PROJECT_ROOT/apps/backend"
echo "    npx nest start --watch"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd $PROJECT_ROOT/apps/frontend"
echo "    npx next dev"
echo ""
echo -e "  Then open: ${GREEN}http://localhost:3000${NC}"
echo ""
