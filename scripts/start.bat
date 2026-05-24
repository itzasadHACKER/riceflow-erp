@echo off
REM ============================================================
REM Grainix ERP — Quick Start (Double-click to run)
REM ============================================================

echo.
echo ========================================
echo   Starting Grainix ERP...
echo ========================================
echo.

cd /d "%~dp0\.."

echo Starting backend server...
start "Grainix Backend" cmd /k "cd apps\backend && npx nest start --watch"

timeout /t 3 /nobreak > nul

echo Starting frontend server...
start "Grainix Frontend" cmd /k "cd apps\frontend && npx next dev"

timeout /t 8 /nobreak > nul

echo Opening browser...
start http://localhost:3000

echo.
echo ========================================
echo   Grainix ERP is running!
echo ========================================
echo.
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:4000
echo   API Docs: http://localhost:4000/docs
echo.
echo   Keep the two server windows open.
echo   To stop: Close the server windows.
echo.
pause
