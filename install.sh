#!/bin/bash
# ================================================================
#  Grainix ERP — One-Click Install & Run (Mac / Linux)
# ================================================================
#  Run this file to:
#    1. Check prerequisites (Node.js, PostgreSQL)
#    2. Install all dependencies
#    3. Set up the database
#    4. Start both backend and frontend servers
#    5. Open the app in your browser
#
#  Usage:
#    chmod +x install.sh
#    ./install.sh
# ================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo ""
echo -e "${CYAN}${BOLD} ============================================${NC}"
echo -e "${CYAN}${BOLD}  GRAINIX ERP — One-Click Install & Run${NC}"
echo -e "${CYAN}${BOLD} ============================================${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# -------------------------------------------------------
#  Step 1: Check Node.js
# -------------------------------------------------------
echo -e "${YELLOW}[1/7] Checking Node.js...${NC}"

if ! command -v node &> /dev/null; then
    echo ""
    echo -e "${RED}  ERROR: Node.js is not installed!${NC}"
    echo ""
    echo "  Install Node.js 20 LTS:"
    echo ""
    echo "  Mac (Homebrew):"
    echo "    brew install node@20"
    echo ""
    echo "  Ubuntu/Debian:"
    echo "    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "    sudo apt-get install -y nodejs"
    echo ""
    echo "  Or download from: https://nodejs.org/en/download"
    echo ""
    echo "  After installing, run this script again."
    exit 1
fi

NODE_VERSION=$(node -v)
NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v\([0-9]*\).*/\1/')

if [ "$NODE_MAJOR" -ge 25 ]; then
    echo -e "${RED}  WARNING: Node.js $NODE_VERSION is too new.${NC}"
    echo "  Please install Node.js 20 LTS from https://nodejs.org"
    exit 1
fi

if [ "$NODE_MAJOR" -lt 18 ]; then
    echo -e "${RED}  ERROR: Node.js $NODE_VERSION is too old. Need 18+.${NC}"
    echo "  Please install Node.js 20 LTS from https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}  Node.js $NODE_VERSION — OK${NC}"
echo ""

# -------------------------------------------------------
#  Step 2: Check npm
# -------------------------------------------------------
echo -e "${YELLOW}[2/7] Checking npm...${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}  ERROR: npm not found. Reinstall Node.js from https://nodejs.org${NC}"
    exit 1
fi

echo -e "${GREEN}  npm v$(npm --version) — OK${NC}"
echo ""

# -------------------------------------------------------
#  Step 3: Check PostgreSQL
# -------------------------------------------------------
echo -e "${YELLOW}[3/7] Checking PostgreSQL...${NC}"

PSQL_CMD=""
PG_FOUND=0

if command -v psql &> /dev/null; then
    PSQL_CMD="psql"
    PG_FOUND=1
    echo -e "${GREEN}  PostgreSQL found — OK${NC}"
elif command -v docker &> /dev/null; then
    # Check if Docker has PostgreSQL running
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q postgres; then
        echo -e "${GREEN}  PostgreSQL running via Docker — OK${NC}"
        PSQL_CMD="docker exec -i $(docker ps --filter 'name=postgres' -q | head -1) psql"
        PG_FOUND=1
    fi
fi

if [ "$PG_FOUND" -eq 0 ]; then
    echo ""
    echo -e "${YELLOW}  PostgreSQL not found. Checking for Docker...${NC}"
    
    if command -v docker &> /dev/null && command -v docker compose &> /dev/null 2>&1; then
        echo -e "${YELLOW}  Starting PostgreSQL via Docker Compose...${NC}"
        docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null
        
        # Wait for PostgreSQL to be ready
        echo "  Waiting for PostgreSQL to start..."
        for i in $(seq 1 30); do
            if docker compose exec -T postgres pg_isready -U riceflow &>/dev/null 2>&1; then
                echo -e "${GREEN}  PostgreSQL started via Docker — OK${NC}"
                PG_FOUND=2  # Docker mode
                break
            fi
            sleep 1
        done
        
        if [ "$PG_FOUND" -ne 2 ]; then
            echo -e "${RED}  PostgreSQL failed to start via Docker.${NC}"
        fi
    fi
    
    if [ "$PG_FOUND" -eq 0 ]; then
        echo ""
        echo -e "${RED}  ERROR: PostgreSQL not found!${NC}"
        echo ""
        echo "  Install PostgreSQL:"
        echo ""
        echo "  Mac (Homebrew):"
        echo "    brew install postgresql@16"
        echo "    brew services start postgresql@16"
        echo ""
        echo "  Ubuntu/Debian:"
        echo "    sudo apt-get install -y postgresql postgresql-contrib"
        echo "    sudo systemctl start postgresql"
        echo ""
        echo "  Or use Docker (recommended):"
        echo "    Install Docker: https://docs.docker.com/get-docker/"
        echo "    Then run this script again."
        echo ""
        exit 1
    fi
fi
echo ""

# -------------------------------------------------------
#  Step 4: Set up database
# -------------------------------------------------------
echo -e "${YELLOW}[4/7] Setting up database...${NC}"

if [ "$PG_FOUND" -eq 2 ]; then
    # Docker mode — database is created by docker-compose.yml
    echo -e "${GREEN}  Database managed by Docker Compose — OK${NC}"
    
    # Create .env with Docker credentials
    if [ ! -f "apps/backend/.env" ]; then
        cat > apps/backend/.env << 'ENVEOF'
DATABASE_URL="postgresql://riceflow:riceflow_secret@localhost:5432/riceflow_erp?schema=public"
JWT_SECRET="grainix-local-jwt-secret-$(date +%s)"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_SECRET="grainix-local-refresh-secret-$(date +%s)"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=4000
NODE_ENV=development
API_PREFIX=api/v1
CORS_ORIGINS=http://localhost:3000
ENVEOF
        # Replace the $(date) placeholders with actual values
        sed -i.bak "s/\$(date +%s)/$(date +%s)/g" apps/backend/.env 2>/dev/null || \
        sed -i '' "s/\$(date +%s)/$(date +%s)/g" apps/backend/.env 2>/dev/null
        rm -f apps/backend/.env.bak
        echo -e "${GREEN}  Configuration file created (Docker mode) — OK${NC}"
    else
        echo -e "${GREEN}  Configuration file already exists — OK${NC}"
    fi
else
    # Local PostgreSQL mode
    echo ""
    echo "  Enter your PostgreSQL password"
    echo "  (the one you set when installing PostgreSQL)"
    echo "  Press Enter for default (postgres):"
    echo ""
    read -s -p "  Password: " PG_PASSWORD
    echo ""
    
    if [ -z "$PG_PASSWORD" ]; then
        PG_PASSWORD="postgres"
        echo "  Using default password"
    fi
    
    # Test connection
    export PGPASSWORD="$PG_PASSWORD"
    if ! $PSQL_CMD -U postgres -c "SELECT 1" &>/dev/null; then
        echo ""
        echo -e "${RED}  ERROR: Could not connect to PostgreSQL.${NC}"
        echo "  Check your password and that PostgreSQL is running."
        unset PGPASSWORD
        exit 1
    fi
    
    # Create database if not exists
    DB_EXISTS=$($PSQL_CMD -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='grainix_erp'" 2>/dev/null | tr -d ' ')
    if [ "$DB_EXISTS" != "1" ]; then
        $PSQL_CMD -U postgres -c "CREATE DATABASE grainix_erp" &>/dev/null
        echo -e "${GREEN}  Database 'grainix_erp' created — OK${NC}"
    else
        echo -e "${GREEN}  Database 'grainix_erp' already exists — OK${NC}"
    fi
    unset PGPASSWORD
    
    # Create .env file
    if [ ! -f "apps/backend/.env" ]; then
        cat > apps/backend/.env << ENVEOF
DATABASE_URL="postgresql://postgres:${PG_PASSWORD}@localhost:5432/grainix_erp?schema=public"
JWT_SECRET="grainix-local-jwt-secret-$(date +%s)"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_SECRET="grainix-local-refresh-secret-$(date +%s)"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=4000
NODE_ENV=development
API_PREFIX=api/v1
CORS_ORIGINS=http://localhost:3000
ENVEOF
        echo -e "${GREEN}  Configuration file created — OK${NC}"
    else
        echo -e "${GREEN}  Configuration file already exists — OK${NC}"
    fi
fi
echo ""

# -------------------------------------------------------
#  Step 5: Install dependencies
# -------------------------------------------------------
echo -e "${YELLOW}[5/7] Installing dependencies (this takes 3-10 minutes)...${NC}"
echo "  Please wait..."
echo ""

echo "  Installing root packages..."
npm install --loglevel=error 2>/dev/null || npm install 2>/dev/null

echo "  Installing backend packages..."
(cd apps/backend && npm install --loglevel=error 2>/dev/null || npm install 2>/dev/null)

echo "  Installing frontend packages..."
(cd apps/frontend && npm install --loglevel=error 2>/dev/null || npm install 2>/dev/null)

echo ""
echo -e "${GREEN}  All dependencies installed — OK${NC}"
echo ""

# -------------------------------------------------------
#  Step 6: Set up database tables
# -------------------------------------------------------
echo -e "${YELLOW}[6/7] Setting up database tables...${NC}"

(cd apps/backend && npx prisma generate 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${RED}  ERROR: Prisma generate failed.${NC}"
    echo "  Check your .env DATABASE_URL"
    exit 1
fi

(cd apps/backend && npx prisma db push 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${RED}  ERROR: Could not set up database tables.${NC}"
    echo "  Check that PostgreSQL is running and password is correct."
    exit 1
fi

echo -e "${GREEN}  Database tables created — OK${NC}"
echo ""

# -------------------------------------------------------
#  Step 7: Start servers
# -------------------------------------------------------
echo -e "${YELLOW}[7/7] Starting servers...${NC}"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down Grainix ERP...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID 2>/dev/null
    wait $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}Grainix ERP stopped.${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start backend
echo "  Starting backend server (port 4000)..."
(cd apps/backend && npx nest start --watch) &
BACKEND_PID=$!

# Wait for backend to start
echo "  Waiting for backend..."
for i in $(seq 1 60); do
    if curl -s http://localhost:4000/api/v1/health &>/dev/null; then
        echo -e "${GREEN}  Backend started — OK${NC}"
        break
    fi
    sleep 1
done

# Start frontend
echo "  Starting frontend server (port 3000)..."
(cd apps/frontend && npx next dev) &
FRONTEND_PID=$!

# Wait for frontend
echo "  Waiting for frontend..."
for i in $(seq 1 30); do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200"; then
        echo -e "${GREEN}  Frontend started — OK${NC}"
        break
    fi
    sleep 1
done

# Open browser
echo ""
if command -v open &> /dev/null; then
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
fi

echo ""
echo -e "${GREEN}${BOLD} ============================================${NC}"
echo -e "${GREEN}${BOLD}  GRAINIX ERP IS RUNNING!${NC}"
echo -e "${GREEN}${BOLD} ============================================${NC}"
echo ""
echo "  Open in browser: http://localhost:3000"
echo "  Backend API:     http://localhost:4000"
echo "  API Docs:        http://localhost:4000/docs"
echo ""
echo "  To use the software:"
echo "    1. Go to http://localhost:3000"
echo "    2. Click 'Sign up' to create your account"
echo "    3. Fill in your details and start using!"
echo ""
echo -e "${YELLOW}  Press Ctrl+C to stop the servers${NC}"
echo ""

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
