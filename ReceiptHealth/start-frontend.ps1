# ReceiptHealth Frontend Startup Script
Write-Host "Starting ReceiptHealth frontend..." -ForegroundColor Cyan

$clientPath = Join-Path $PSScriptRoot "client"
Set-Location $clientPath

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "npm install failed!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Starting Vite dev server..." -ForegroundColor Green
npm run dev
