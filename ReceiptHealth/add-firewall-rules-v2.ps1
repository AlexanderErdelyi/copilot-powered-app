# Add Windows Firewall rules for ReceiptHealth
# Run this script as Administrator
# Right-click PowerShell, select "Run as Administrator", then run: .\add-firewall-rules.ps1

Write-Host "Adding firewall rules for ReceiptHealth..." -ForegroundColor Cyan

# Check if running as administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator', then run this script again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Add rule for backend port 5100
Write-Host "Adding firewall rule for backend (port 5100)..." -ForegroundColor Yellow
try {
    $rule = Get-NetFirewallRule -DisplayName "ReceiptHealth Backend" -ErrorAction SilentlyContinue
    if ($rule) {
        Remove-NetFirewallRule -DisplayName "ReceiptHealth Backend" -ErrorAction SilentlyContinue
    }
    
    New-NetFirewallRule -DisplayName "ReceiptHealth Backend" -Direction Inbound -LocalPort 5100 -Protocol TCP -Action Allow -Profile Any | Out-Null
    Write-Host "SUCCESS: Backend firewall rule added (port 5100)" -ForegroundColor Green
} catch {
    Write-Host "ERROR adding backend rule: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Add rule for frontend port 5173
Write-Host "Adding firewall rule for frontend (port 5173)..." -ForegroundColor Yellow
try {
    $rule = Get-NetFirewallRule -DisplayName "ReceiptHealth Frontend" -ErrorAction SilentlyContinue
    if ($rule) {
        Remove-NetFirewallRule -DisplayName "ReceiptHealth Frontend" -ErrorAction SilentlyContinue
    }
    
    New-NetFirewallRule -DisplayName "ReceiptHealth Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow -Profile Any | Out-Null
    Write-Host "SUCCESS: Frontend firewall rule added (port 5173)" -ForegroundColor Green
} catch {
    Write-Host "ERROR adding frontend rule: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Firewall configuration complete!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your phone should now be able to access:" -ForegroundColor White
Write-Host "  React app:  http://192.168.0.220:5173/" -ForegroundColor Cyan
Write-Host "  Old HTML:   http://192.168.0.220:5100/index.html" -ForegroundColor Cyan
Write-Host "  Backend:    http://192.168.0.220:5100/api/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Make sure your phone is on the same WiFi network!" -ForegroundColor Yellow
Write-Host ""

Read-Host "Press Enter to exit"
