#!/usr/bin/env pwsh
# Kill all development servers (Node.js/Vite and .NET)

Write-Host "Finding running development servers..." -ForegroundColor Cyan

# Kill Node.js processes (Vite, npm, etc.)
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Killing $($nodeProcesses.Count) Node.js process(es)..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
    Write-Host "Node.js processes stopped" -ForegroundColor Green
} else {
    Write-Host "No Node.js processes running" -ForegroundColor Green
}

# Kill .NET processes (ReceiptHealth backend)
$dotnetProcesses = Get-Process dotnet -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*ReceiptHealth*" -or $_.Path -like "*ReceiptHealth*" }
if ($dotnetProcesses) {
    Write-Host "Killing $($dotnetProcesses.Count) .NET process(es)..." -ForegroundColor Yellow
    $dotnetProcesses | Stop-Process -Force
    Write-Host ".NET processes stopped" -ForegroundColor Green
} else {
    Write-Host "No ReceiptHealth .NET processes running" -ForegroundColor Green
}

# Free specific ports (5100 and 5173)
$ports = @(5100, 5173, 5174, 5175)
foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $processId = $connection.OwningProcess | Select-Object -First 1
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Freeing port $port (Process: $($process.ProcessName))..." -ForegroundColor Yellow
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Write-Host "Port $port freed" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "All development servers stopped!" -ForegroundColor Cyan
Write-Host "You can now press F5 to start fresh" -ForegroundColor Gray
