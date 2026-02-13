# ReceiptHealth Backend Startup Script
Write-Host "Building ReceiptHealth backend..." -ForegroundColor Cyan

$projectRoot = $PSScriptRoot
Set-Location $projectRoot

# Build the project
dotnet build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green
Write-Host "Starting backend server on port 5100..." -ForegroundColor Cyan

# Run the DLL with full path
$dllPath = Join-Path $projectRoot "bin\Debug\net8.0\ReceiptHealth.dll"
dotnet $dllPath --urls "http://localhost:5100"
