# Add Windows Firewall rules for ReceiptHealth
# Run this script as Administrator

Write-Host "Adding firewall rules for ReceiptHealth..." -ForegroundColor Cyan

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator', then run this script again." -ForegroundColor Yellow
    exit 1
}

# Add rule for backend (port 5100)
try {
    $existingRule = Get-NetFirewallRule -DisplayName "ReceiptHealth Backend" -ErrorAction SilentlyContinue
    if ($existingRule) {
        Write-Host "Removing existing backend firewall rule..." -ForegroundColor Yellow
        Remove-NetFirewallRule -DisplayName "ReceiptHealth Backend"
    }
    
    New-NetFirewallRule -DisplayName "ReceiptHealth Backend" -Direction Inbound -LocalPort 5100 -Protocol TCP -Action Allow -Profile Any -Description "Allow access to ReceiptHealth backend API"
    
    Write-Host "✓ Backend firewall rule added (port 5100)" -ForegroundColor Green
} catch {
    Write-Host "ERROR adding backend rule: $_" -ForegroundColor Red
}

# Add rule for frontend (port 5173)
try {
    $existingRule = Get-NetFirewallRule -DisplayName "ReceiptHealth Frontend" -ErrorAction SilentlyContinue
    if ($existingRule) {
        Write-Host "Removing existing frontend firewall rule..." -ForegroundColor Yellow
        Remove-NetFirewallRule -DisplayName "ReceiptHealth Frontend"
    }
    
    New-NetFirewallRule -DisplayName "ReceiptHealth Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow -Profile Any -Description "Allow access to ReceiptHealth React frontend"
    
    Write-Host "✓ Frontend firewall rule added (port 5173)" -ForegroundColor Green
} catch {
    Write-Host "ERROR adding frontend rule: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Firewall configuration complete!" -ForegroundColor Green
Write-Host "Your phone should now be able to access:" -ForegroundColor Cyan
Write-Host "  - React app: http://192.168.0.220:5173/" -ForegroundColor Gray
Write-Host "  - Backend: http://192.168.0.220:5100/" -ForegroundColor Gray
