# ReceiptHealth Development Environment Startup
Write-Host "🏥 Starting ReceiptHealth Development Environment" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Magenta

$projectRoot = $PSScriptRoot

# Kill any existing processes on ports 5100 and 5173
Write-Host "`n🔍 Checking for existing processes..." -ForegroundColor Cyan

$port5100 = Get-NetTCPConnection -LocalPort 5100 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($port5100) {
    Stop-Process -Id $port5100 -Force
    Write-Host "✅ Killed process on port 5100" -ForegroundColor Green
}

$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($port5173) {
    Stop-Process -Id $port5173 -Force
    Write-Host "✅ Killed process on port 5173" -ForegroundColor Green
}

Write-Host "`n📋 Starting services:" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:5100" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "`nPress Ctrl+C to stop all services`n" -ForegroundColor Yellow

# Start backend in background job
$backendScript = Join-Path $projectRoot "start-backend.ps1"
$backendJob = Start-Job -ScriptBlock {
    param($script)
    & $script
} -ArgumentList $backendScript

# Give backend time to start
Start-Sleep -Seconds 3

# Start frontend in current window (to see logs)
$frontendScript = Join-Path $projectRoot "start-frontend.ps1"
& $frontendScript

# Cleanup on exit
Stop-Job $backendJob
Remove-Job $backendJob
