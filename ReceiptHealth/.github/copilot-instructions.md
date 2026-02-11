# Copilot Instructions for CopilotWebApp

## 🚨 CRITICAL: Server Management Commands

### Always Use Full Paths for Build and Run!

**WRONG (causes errors):**
```powershell
dotnet bin\Debug\net8.0\CopilotWebApp.dll
```

**CORRECT:**
```powershell
cd C:\VSCodeProjects\GitHub\copilot-powered-app\CopilotWebApp; dotnet bin\Debug\net8.0\CopilotWebApp.dll
```

## Required Command Sequence

### 1. Stop the Server
```powershell
$port = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($port) { Stop-Process -Id $port -Force; Write-Host "✅ Killed process $port" } else { Write-Host "No process found" }
```

### 2. Build the Application
```powershell
cd C:\VSCodeProjects\GitHub\copilot-powered-app\CopilotWebApp; dotnet build
```

### 3. Run the Application
```powershell
cd C:\VSCodeProjects\GitHub\copilot-powered-app\CopilotWebApp; dotnet bin\Debug\net8.0\CopilotWebApp.dll
```
- Use `isBackground: true` when starting the server
- The server must run from the CopilotWebApp directory to find the wwwroot folder

## Project Structure

```
copilot-powered-app/
├── CopilotDemo/           # Original console app
└── CopilotWebApp/         # Web application with chat UI
    ├── Program.cs         # Backend API with AI tools
    ├── wwwroot/
    │   └── index.html    # Frontend chat interface
    ├── bin/Debug/net8.0/
    │   └── CopilotWebApp.dll  # Compiled application
    └── README.md
```

## Important Technical Details

### Backend (Program.cs)
- **Port:** http://localhost:5001
- **AI Tools:** getWeather, getAppInfo, searchUploadedFiles
- **MCP Server:** Azure DevOps integration via `@azure-devops/mcp`
- **Conversation History:** Sends last 10 messages as context to avoid repeated authentication
- **Logging:** Console shows 📩 📝 ✅ ❌ emoji indicators

### Frontend (index.html)
- **Streaming:** Uses Server-Sent Events (SSE) with EventSource
- **Features:** Drag-drop file upload, clickable URL links, conversation history
- **Logging:** Browser console shows 📤 📚 ✅ ❌ for debugging

### Windows Defender Workaround
- Always run: `dotnet bin\Debug\net8.0\CopilotWebApp.dll`
- Never run: `dotnet run` (gets blocked by Windows Defender)

### Azure DevOps MCP Requirements
- PowerShell 6+ (pwsh): `winget install --id Microsoft.Powershell --source winget`
- Node.js/npm: For running `npx -y @azure-devops/mcp`
- Organization: "aerdelyi12185"

## Common Issues

### Issue: "File not found" error when running DLL
**Cause:** Running from wrong directory
**Solution:** Always use `cd C:\VSCodeProjects\GitHub\copilot-powered-app\CopilotWebApp` before running

### Issue: "WebRootPath not found" warning
**Cause:** Running from parent directory
**Solution:** Ensure working directory is CopilotWebApp when starting server

### Issue: "Address already in use" error
**Cause:** Previous server instance still running
**Solution:** Run the stop command first (see section 1)

### Issue: Repeated Azure DevOps authentication
**Cause:** Sending each history message separately
**Solution:** Already fixed - history is now combined into single context

### Issue: No response when sending chat messages
**Cause:** Check browser console and server logs for errors
**Solution:** Verify server is running on port 5001, check both frontend and backend logs

## Testing Checklist

After making changes, test:
1. ✅ Server starts on port 5001
2. ✅ http://localhost:5001 loads chat interface
3. ✅ Weather queries work: "What's the weather in Paris?"
4. ✅ File upload works (drag-drop .txt, .md files)
5. ✅ Conversation context maintained across messages
6. ✅ URLs are clickable links
7. ✅ Console logs show activity with emojis
8. ✅ Azure DevOps queries work (if pwsh installed)

## Code Editing Guidelines

### When editing Program.cs:
- Always include 3-5 lines of context before and after changes
- Use `multi_replace_string_in_file` for multiple independent changes
- Check for compilation errors after edits
- Test that conversation history doesn't cause repeated auth

### When editing index.html:
- Preserve the streaming SSE implementation
- Maintain conversationHistory array functionality
- Keep URL auto-linking regex: `/(https?:\/\/[^\s]+)/g`
- Ensure error messages are user-friendly

## Deployment Notes

- Application uses .NET 8.0 SDK
- GitHub Copilot SDK v0.1.23
- GPT-4.1 model with streaming
- HTTP only (HTTPS not configured)
