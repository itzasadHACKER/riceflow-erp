# ============================================================
# Grainix ERP — Start Script (Windows PowerShell)
# ============================================================
# Usage: Right-click this file → "Run with PowerShell"
#   OR open PowerShell and run: .\scripts\start.ps1
# ============================================================

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Grainix ERP..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

if (-not (Test-Path "$projectRoot\apps\backend\package.json")) {
    if (Test-Path ".\apps\backend\package.json") {
        $projectRoot = Get-Location
    } else {
        Write-Host "ERROR: Cannot find project files." -ForegroundColor Red
        Write-Host "Run this script from the riceflow-erp folder." -ForegroundColor White
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check if .env exists
if (-not (Test-Path "$projectRoot\apps\backend\.env")) {
    Write-Host "ERROR: Backend .env file not found!" -ForegroundColor Red
    Write-Host "Run the setup script first: .\scripts\setup.ps1" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Starting backend server..." -ForegroundColor Yellow

# Start backend in a new PowerShell window
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$projectRoot\apps\backend'; Write-Host 'Grainix ERP — Backend Server' -ForegroundColor Cyan; Write-Host 'Starting on http://localhost:4000...' -ForegroundColor Gray; Write-Host '(Press Ctrl+C to stop)' -ForegroundColor Gray; Write-Host ''; npx nest start --watch"
)

Write-Host "  Backend starting in new window..." -ForegroundColor Green
Write-Host ""

# Wait a moment for backend to initialize
Start-Sleep -Seconds 3

Write-Host "Starting frontend server..." -ForegroundColor Yellow

# Start frontend in a new PowerShell window
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$projectRoot\apps\frontend'; Write-Host 'Grainix ERP — Frontend Server' -ForegroundColor Cyan; Write-Host 'Starting on http://localhost:3000...' -ForegroundColor Gray; Write-Host '(Press Ctrl+C to stop)' -ForegroundColor Gray; Write-Host ''; npx next dev"
)

Write-Host "  Frontend starting in new window..." -ForegroundColor Green
Write-Host ""

# Wait for servers to be ready
Write-Host "Waiting for servers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Open browser
Write-Host "Opening browser..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Grainix ERP is running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:4000" -ForegroundColor Cyan
Write-Host "  API Docs: http://localhost:4000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Two PowerShell windows opened:" -ForegroundColor Gray
Write-Host "    - Backend server window" -ForegroundColor Gray
Write-Host "    - Frontend server window" -ForegroundColor Gray
Write-Host "  Keep both windows open while using the app." -ForegroundColor Gray
Write-Host ""
Write-Host "  To stop: Close both server windows" -ForegroundColor Yellow
Write-Host "           or press Ctrl+C in each window" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to close this window"
