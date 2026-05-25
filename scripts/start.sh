#!/bin/bash
# ============================================================
# Grainix ERP — Start Script (Mac/Linux)
# ============================================================
# Usage: ./scripts/start.sh
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ ! -f "$PROJECT_ROOT/apps/backend/package.json" ]; then
    if [ -f "./apps/backend/package.json" ]; then
        PROJECT_ROOT="$(pwd)"
    else
        echo "ERROR: Cannot find project files."
        exit 1
    fi
fi

if [ ! -f "$PROJECT_ROOT/apps/backend/.env" ]; then
    echo "ERROR: Backend .env not found. Run ./scripts/setup.sh first."
    exit 1
fi

echo ""
echo "========================================"
echo "  Starting Grainix ERP..."
echo "========================================"
echo ""

# Start backend in background
echo "Starting backend server..."
cd "$PROJECT_ROOT/apps/backend"
npx nest start --watch &
BACKEND_PID=$!

# Wait a moment
sleep 3

# Start frontend in background
echo "Starting frontend server..."
cd "$PROJECT_ROOT/apps/frontend"
npx next dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "  Grainix ERP is starting!"
echo "========================================"
echo ""
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:4000"
echo "  API Docs: http://localhost:4000/docs"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo ""

# Handle Ctrl+C to kill both processes
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

# Wait for both processes
wait
