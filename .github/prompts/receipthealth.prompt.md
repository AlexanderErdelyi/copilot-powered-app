---
title: ReceiptHealth Development Workflow
description: Complete instructions for rebuilding, testing, and deploying the ReceiptHealth full-stack application
tags: [dotnet, react, vite, testing, deployment, receipthealth]
version: 1.0.0
author: copilot-powered-app
---

# ReceiptHealth Development Workflow

> **Purpose**: This prompt provides step-by-step instructions for rebuilding, testing, and running the ReceiptHealth application (React + .NET full-stack app).

## Quick Context

**Ports**:
- Backend: `http://localhost:5100` (dotnet)
- Frontend: `http://localhost:5173` (Vite)
- ⚠️ Never use port 5000 (conflicts with other services)

**Key Files**:
- Backend config: `Program.cs` (line 14), `Properties/launchSettings.json`
- Frontend proxy: `client/vite.config.js` (line 10)
- Scripts: `start-backend.ps1`, `start-frontend.ps1`, `start-dev.ps1`

---

## 🎯 Primary Task: Rebuild and Test

When user says **"rebuild and test"** or **"test ReceiptHealth"**, execute this sequence:

### Step 1: Stop Running Servers

```powershell
$ports = @(5000, 5100, 5173); foreach ($port in $ports) { $proc = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($proc -and $proc -ne 0) { Stop-Process -Id $proc -Force; Write-Host "Killed process on port $port" } }
```

**Tool parameters**:
- `goal`: "Clean up ports"
- `explanation`: "Stopping any running servers"
- `isBackground`: false
- `timeout`: 5000

### Step 2: Rebuild Backend

```powershell
cd C:\VSCodeProjects\GitHub\copilot-powered-app\ReceiptHealth; dotnet build
```

**Tool parameters**:
- `goal`: "Build backend"
- `explanation`: "Building .NET backend"
- `isBackground`: false
- `timeout`: 60000

### Step 3: Start Backend

```powershell
& C:\VSCodeProjects\GitHub\copilot-powered-app\ReceiptHealth\start-backend.ps1
```

**Tool parameters**:
- `goal`: "Start backend"
- `explanation`: "Starting backend server on port 5100"
- `isBackground`: true
- `timeout`: 0

**Then**: Wait 3 seconds and check terminal output for errors using `await_terminal` with 5000ms timeout.

### Step 4: Start Frontend

```powershell
& C:\VSCodeProjects\GitHub\copilot-powered-app\ReceiptHealth\start-frontend.ps1
```

**Tool parameters**:
- `goal`: "Start frontend"
- `explanation`: "Starting Vite dev server on port 5173"
- `isBackground`: true
- `timeout`: 0

### Step 5: Verify Both Servers

```powershell
Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -in @(5100, 5173)} | Select-Object LocalAddress, LocalPort, @{Name='Process';Expression={(Get-Process -Id $_.OwningProcess).ProcessName}} | Format-Table
```

**Expected output**:
```
LocalAddress LocalPort Process
------------ --------- -------
::1               5100 dotnet 
127.0.0.1         5173 node   
127.0.0.1         5100 dotnet 
```

### Step 6: Report Success

Tell user:
> ✅ Both servers running successfully:
> - Backend: http://localhost:5100
> - Frontend: http://localhost:5173
> 
> Opening browser...

Then open `http://localhost:5173` in simple browser.

---

## ⚠️ Critical Rules

### Always Use PowerShell Scripts

**NEVER** run these commands:
- ❌ `dotnet bin\Debug\net8.0\ReceiptHealth.dll` (wrong path context)
- ❌ `dotnet run` (Windows Defender blocks)
- ❌ Direct DLL execution without script

**ALWAYS** use:
- ✅ `& C:\VSCodeProjects\GitHub\copilot-powered-app\ReceiptHealth\start-backend.ps1`
- ✅ `& C:\VSCodeProjects\GitHub\copilot-powered-app\ReceiptHealth\start-frontend.ps1`

### Why Scripts Are Required

1. **Path handling**: Scripts use `$PSScriptRoot` to find correct DLL location
2. **Emoji issues**: Scripts avoid encoding problems in PowerShell
3. **Error checking**: Scripts validate build success before running
4. **Consistent behavior**: Same result every time

---

## 🔍 Verification & Health Checks

### Backend Health Check

```powershell
curl http://localhost:5100/api/receipts
```

**Expected**: JSON array (could be empty) with 200 status  
**Problem**: 404 or connection refused = backend not running on 5100

### Frontend Check

- Open: http://localhost:5173/
- Verify: Navigation with 5 pages (Dashboard, Receipts, Insights, Meal Planner, Shopping Lists)
- Check: Browser console (F12) for errors
- Confirm: API calls in Network tab show correct proxy to 5100

---

## 🚨 Common Issues & Auto-Fix

### Issue: "Address already in use" on port 5000

**Detection**: Error message contains "Failed to bind to address http://127.0.0.1:5000"

**Root cause**: `Program.cs` line 14 has wrong port

**Auto-fix**:
1. Read `Program.cs` lines 10-20
2. Replace `builder.WebHost.UseUrls("http://localhost:5000");` with `builder.WebHost.UseUrls("http://localhost:5100");`
3. Rebuild and restart

### Issue: "vite command not found"

**Detection**: Terminal shows "Der Befehl 'vite' ist entweder falsch geschrieben..."

**Root cause**: npm dependencies not installed

**Auto-fix**:
```powershell
cd C:\VSCodeProjects\GitHub\copilot-powered-app\ReceiptHealth\client; npm install
```

### Issue: Frontend CORS errors

**Detection**: Browser console shows CORS policy errors

**Root cause**: `vite.config.js` proxy pointing to wrong port

**Auto-fix**:
1. Read `client/vite.config.js`
2. Verify line 10: `target: 'http://localhost:5100'`
3. If wrong, fix and restart frontend only (no rebuild needed)

### Issue: PowerShell script encoding errors

**Detection**: "Die Zeichenfolge hat kein Abschlusszeichen"

**Root cause**: Emoji characters in script files

**Auto-fix**: Scripts already updated to use plain text only (no emojis)

---

## 📋 When Code Changes Require Rebuild

### Rebuild Backend Required:
- ✅ Editing `Program.cs`
- ✅ Editing any `.cs` files in Services/, Models/, Data/
- ✅ Changing `appsettings.json`
- ✅ Modifying `launchSettings.json`

**Action**: Stop backend → `dotnet build` → restart backend

### Rebuild Frontend NOT Required:
- ❌ Editing React components (`.jsx` files)
- ❌ Editing CSS/Tailwind
- ❌ Changing frontend routes

**Action**: Vite hot reload handles it automatically

### Rebuild Frontend Required:
- ✅ Editing `vite.config.js`
- ✅ Installing new npm packages
- ✅ Changing `package.json` scripts

**Action**: Stop frontend → restart frontend (build happens automatically)

---

## 📦 Tech Stack Reference

### Backend
- .NET 8.0 with Entity Framework Core
- SQLite database (`receipts.db`)
- Swagger/OpenAPI documentation
- GitHub Copilot SDK integration

### Frontend  
- React 18 + Vite 7
- Tailwind CSS for styling
- Chart.js for visualizations
- Lucide React for icons
- React Router for navigation

### Pages
1. Dashboard - Health score overview
2. Receipts - Upload and manage receipts
3. Insights - Analytics and trends
4. Meal Planner - AI meal planning
5. Shopping Lists - List management

---

## 🎯 Success Criteria

After executing the rebuild and test workflow, the following must be true:

✅ **Backend (port 5100)**:
- Process running (verify with netstat command)
- Swagger UI accessible at http://localhost:5100/swagger
- API responds to curl requests
- Console shows EF Core query logs

✅ **Frontend (port 5173)**:
- Vite dev server running
- Page loads without console errors
- All 5 navigation items visible and clickable
- Network tab shows API calls proxied to port 5100

✅ **Integration**:
- No CORS errors
- API responses return successfully
- Hot reload works for React changes
- Database queries execute correctly

---

## 🔄 Alternative: Single Script Startup

For quick testing, use the combined script:

```powershell
& C:\VSCodeProjects\GitHub\copilot-powered-app\ReceiptHealth\start-dev.ps1
```

This script:
1. Kills existing processes automatically
2. Starts backend in background job
3. Waits 3 seconds
4. Starts frontend in foreground
5. Shows all logs in one terminal

**Note**: Less flexible than individual scripts but faster for simple testing.

---

## 📝 Prompt Usage Examples

### Example 1: User says "test the app"
Execute the full 6-step rebuild sequence above.

### Example 2: User says "restart backend"
```powershell
# Kill backend only
$proc = Get-NetTCPConnection -LocalPort 5100 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($proc -and $proc -ne 0) { Stop-Process -Id $proc -Force }

# Rebuild
cd C:\VSCodeProjects\GitHub\copilot-powered-app\ReceiptHealth; dotnet build

# Start
& C:\VSCodeProjects\GitHub\copilot-powered-app\ReceiptHealth\start-backend.ps1
```

### Example 3: User says "frontend won't connect"
1. Verify backend is running on 5100
2. Check `client/vite.config.js` proxy configuration
3. Restart frontend only (no backend changes needed)

### Example 4: User says "clean rebuild"
Add database reset step:
```powershell
cd C:\VSCodeProjects\GitHub\copilot-powered-app\ReceiptHealth
Remove-Item receipts.db -ErrorAction SilentlyContinue
Remove-Item -Recurse storage -ErrorAction SilentlyContinue
```
Then execute normal rebuild sequence.

---

## 🎓 Learning from Failures

### If Backend Fails to Start
1. Check terminal output for specific error
2. Common: "Address in use" → wrong port in Program.cs
3. Common: "DLL not found" → wrong working directory
4. Always use scripts to avoid path issues

### If Frontend Fails to Start
1. Check for "vite not found" → run npm install
2. Check for port conflict → kill process on 5173
3. Check for dependency issues → delete node_modules and reinstall

### If Integration Fails
1. Open browser DevTools Network tab
2. Look for failed API calls
3. Check if calls go to correct port (5100)
4. Verify vite.config.js proxy settings

---

## 💡 Pro Tips

1. **Keep terminals visible**: Background processes need monitoring
2. **Use await_terminal**: Check for errors after starting background processes
3. **Port conflicts**: Always kill ALL ports (5000, 5100, 5173) before starting
4. **Build errors**: Read carefully - often point to exact line number
5. **Frontend changes**: Usually no rebuild needed (hot reload)
6. **Backend changes**: Always rebuild before restarting

---

## ✅ Final Checklist for Copilot

Before reporting success to user, verify:

- [ ] Kill command executed without errors
- [ ] Build completed with 0 errors (warnings OK)
- [ ] Backend started in background terminal
- [ ] Frontend started in background terminal  
- [ ] Port verification shows both dotnet and node
- [ ] User informed of both URLs
- [ ] Browser opened to http://localhost:5173

**Then and only then**, report: "✅ Both servers running successfully!"

---

## 📚 Related Documentation

- Full project README: `ReceiptHealth/README.md`
- API documentation: Available at http://localhost:5100/swagger when running
- Frontend README: `ReceiptHealth/client/README.md`
- Main instructions: `.github/copilot-instructions.md`

---

**End of Prompt**
