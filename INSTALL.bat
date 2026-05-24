@echo off
REM ================================================================
REM  Grainix ERP — One-Click Install & Run (Windows)
REM ================================================================
REM  Double-click this file to:
REM    1. Check prerequisites (Node.js, PostgreSQL)
REM    2. Install all dependencies
REM    3. Set up the database
REM    4. Start both backend and frontend servers
REM    5. Open the app in your browser
REM ================================================================

title Grainix ERP — Installing...
color 0B

echo.
echo  ============================================
echo   GRAINIX ERP — One-Click Install ^& Run
echo  ============================================
echo.

cd /d "%~dp0"

REM -------------------------------------------------------
REM  Step 1: Check Node.js
REM -------------------------------------------------------
echo [1/7] Checking Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo  ERROR: Node.js is not installed!
    echo.
    echo  Please install Node.js 20 LTS from:
    echo    https://nodejs.org/en/download
    echo.
    echo  After installing, close this window and double-click INSTALL.bat again.
    echo.
    pause
    exit /b 1
)
for /f "tokens=1 delims=." %%a in ('node -v') do set NODE_MAJOR=%%a
set NODE_MAJOR=%NODE_MAJOR:v=%
echo   Node.js v%NODE_MAJOR% found — OK
echo.

REM -------------------------------------------------------
REM  Step 2: Check npm
REM -------------------------------------------------------
echo [2/7] Checking npm...
npm --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  ERROR: npm not found. Reinstall Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo   npm found — OK
echo.

REM -------------------------------------------------------
REM  Step 3: Fix PowerShell execution policy (for npx)
REM -------------------------------------------------------
echo [3/7] Fixing PowerShell execution policy...
powershell -Command "Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force" >nul 2>&1
echo   Execution policy set — OK
echo.

REM -------------------------------------------------------
REM  Step 4: Find PostgreSQL
REM -------------------------------------------------------
echo [4/7] Checking PostgreSQL...
set PSQL_PATH=
set PG_FOUND=0

REM Check if psql is in PATH
psql --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set PSQL_PATH=psql
    set PG_FOUND=1
    echo   PostgreSQL found in PATH — OK
    goto :pg_done
)

REM Check common installation paths
for %%v in (17 16 15 14) do (
    if exist "C:\Program Files\PostgreSQL\%%v\bin\psql.exe" (
        set "PSQL_PATH=C:\Program Files\PostgreSQL\%%v\bin\psql.exe"
        set PG_FOUND=1
        echo   PostgreSQL %%v found — OK
        goto :pg_done
    )
)

if %PG_FOUND% equ 0 (
    echo.
    echo  WARNING: PostgreSQL not found!
    echo.
    echo  Please install PostgreSQL 16 from:
    echo    https://www.postgresql.org/download/windows/
    echo.
    echo  During installation:
    echo    - Remember your password for 'postgres' user
    echo    - Keep default port 5432
    echo.
    echo  After installing, double-click INSTALL.bat again.
    echo.
    pause
    exit /b 1
)
:pg_done
echo.

REM -------------------------------------------------------
REM  Step 5: Create database and configure .env
REM -------------------------------------------------------
echo [5/7] Setting up database...
echo.
echo   Enter your PostgreSQL password
echo   (the one you set when installing PostgreSQL)
echo.
set /p PG_PASSWORD="   Password: "

if "%PG_PASSWORD%"=="" (
    echo   No password entered, using 'postgres' as default
    set PG_PASSWORD=postgres
)

REM Try to create the database
set PGPASSWORD=%PG_PASSWORD%
"%PSQL_PATH%" -U postgres -c "SELECT 1" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo   ERROR: Could not connect to PostgreSQL with that password.
    echo   Please check your password and try again.
    echo.
    echo   Alternative: Create the database using pgAdmin:
    echo     1. Open pgAdmin 4 from Start menu
    echo     2. Right-click Databases ^> Create ^> Database
    echo     3. Name: grainix_erp
    echo     4. Click Save
    echo     5. Then double-click INSTALL.bat again
    echo.
    pause
    exit /b 1
)

REM Check if database exists, create if not
"%PSQL_PATH%" -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='grainix_erp'" 2>nul | findstr "1" >nul
if %ERRORLEVEL% neq 0 (
    "%PSQL_PATH%" -U postgres -c "CREATE DATABASE grainix_erp" >nul 2>&1
    echo   Database 'grainix_erp' created — OK
) else (
    echo   Database 'grainix_erp' already exists — OK
)
set PGPASSWORD=
echo.

REM Create .env file if it doesn't exist
if not exist "apps\backend\.env" (
    echo [5b] Creating configuration file...
    (
        echo DATABASE_URL="postgresql://postgres:%PG_PASSWORD%@localhost:5432/grainix_erp?schema=public"
        echo JWT_SECRET="grainix-local-jwt-secret-%RANDOM%"
        echo JWT_EXPIRES_IN="24h"
        echo JWT_REFRESH_SECRET="grainix-local-refresh-secret-%RANDOM%"
        echo JWT_REFRESH_EXPIRES_IN="7d"
        echo PORT=4000
        echo NODE_ENV=development
        echo API_PREFIX=api/v1
        echo CORS_ORIGINS=http://localhost:3000
    ) > "apps\backend\.env"
    echo   Configuration file created — OK
) else (
    echo   Configuration file already exists — OK
)
echo.

REM -------------------------------------------------------
REM  Step 6: Install dependencies
REM -------------------------------------------------------
echo [6/7] Installing dependencies (this takes 3-10 minutes)...
echo   Please wait...
echo.

echo   Installing root packages...
call npm install --loglevel=error 2>nul
if %ERRORLEVEL% neq 0 (
    echo   Retrying root install...
    call npm install --loglevel=error 2>nul
)

echo   Installing backend packages...
cd apps\backend
call npm install --loglevel=error 2>nul
if %ERRORLEVEL% neq 0 (
    echo   Retrying backend install...
    call npm install --loglevel=error 2>nul
)

echo   Installing frontend packages...
cd ..\frontend
call npm install --loglevel=error 2>nul
if %ERRORLEVEL% neq 0 (
    echo   Retrying frontend install...
    call npm install --loglevel=error 2>nul
)

cd ..\..
echo.
echo   All dependencies installed — OK
echo.

REM -------------------------------------------------------
REM  Step 7: Set up database tables and start servers
REM -------------------------------------------------------
echo [7/7] Setting up database tables...

cd apps\backend
call npx prisma generate >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo   ERROR: Prisma generate failed.
    echo   Check your .env DATABASE_URL
    pause
    exit /b 1
)

call npx prisma db push >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo   ERROR: Could not set up database tables.
    echo   Check that PostgreSQL is running and password is correct.
    echo   Edit the password in: apps\backend\.env
    pause
    exit /b 1
)
echo   Database tables created — OK

cd ..\..
echo.

REM -------------------------------------------------------
REM  Start servers
REM -------------------------------------------------------
title Grainix ERP — Running
color 0A

echo  ============================================
echo   INSTALLATION COMPLETE! Starting servers...
echo  ============================================
echo.

echo Starting backend server (port 4000)...
start "Grainix ERP — Backend" cmd /k "cd /d "%~dp0apps\backend" && color 0E && echo. && echo   GRAINIX ERP — Backend Server && echo   http://localhost:4000 && echo   Press Ctrl+C to stop && echo. && npx nest start --watch"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting frontend server (port 3000)...
start "Grainix ERP — Frontend" cmd /k "cd /d "%~dp0apps\frontend" && color 0D && echo. && echo   GRAINIX ERP — Frontend Server && echo   http://localhost:3000 && echo   Press Ctrl+C to stop && echo. && npx next dev"

echo Waiting for frontend to start...
timeout /t 10 /nobreak > nul

echo Opening browser...
start http://localhost:3000

echo.
echo  ============================================
echo   GRAINIX ERP IS RUNNING!
echo  ============================================
echo.
echo   Open in browser: http://localhost:3000
echo   Backend API:     http://localhost:4000
echo   API Docs:        http://localhost:4000/docs
echo.
echo   Two server windows are now running.
echo   Keep them open while using the software.
echo.
echo   To use the software:
echo     1. Go to http://localhost:3000
echo     2. Click 'Sign up' to create your account
echo     3. Fill in your details and start using!
echo.
echo   To stop: Close the two server windows
echo   To restart: Double-click INSTALL.bat again
echo     (it will skip already-completed steps)
echo.
pause
