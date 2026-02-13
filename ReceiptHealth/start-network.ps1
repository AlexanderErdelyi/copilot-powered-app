#!/usr/bin/env pwsh
# Start ReceiptHealth for network/mobile testing

Write-Host "Checking for processes on port 5100..." -ForegroundColor Cyan

# Kill any process using port 5100
$connections = Get-NetTCPConnection -LocalPort 5100 -ErrorAction SilentlyContinue
if ($connections) {
    $processId = $connections[0].OwningProcess
    Write-Host "Found process $processId on port 5100. Stopping it..." -ForegroundColor Yellow
    Stop-Process -Id $processId -Force
    Start-Sleep -Seconds 2
    Write-Host "Process stopped" -ForegroundColor Green
} else {
    Write-Host "Port 5100 is free" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting backend on http://0.0.0.0:5100..." -ForegroundColor Cyan
Write-Host "Backend will be accessible from:" -ForegroundColor Gray
Write-Host "  - Local: http://localhost:5100" -ForegroundColor Gray
Write-Host "  - Network: http://192.168.0.220:5100" -ForegroundColor Gray

# Start backend in background
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    $env:ASPNETCORE_ENVIRONMENT = "Development"
    dotnet run --launch-profile http
}

Write-Host "Backend starting (Job ID: $($backendJob.Id))" -ForegroundColor Green

Write-Host ""
Write-Host "Starting React dev server..." -ForegroundColor Cyan
Write-Host "React app will be accessible from:" -ForegroundColor Gray
Write-Host "  - Local: http://localhost:5173" -ForegroundColor Gray
Write-Host "  - Network: http://192.168.0.220:5173" -ForegroundColor Gray
Write-Host ""

# Navigate to client directory and start frontend
Set-Location client
npm run dev

# Note: When you press Ctrl+C to stop the frontend, the backend job will still be running
# To stop it, run: Get-Job | Stop-Job; Get-Job | Remove-Job
