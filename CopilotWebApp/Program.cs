using GitHub.Copilot.SDK;
using Microsoft.Extensions.AI;
using System.ComponentModel;

var builder = WebApplication.CreateBuilder(args);

// Configure HTTP URL
builder.WebHost.UseUrls("http://localhost:5001");

var app = builder.Build();

// Enable static files (for serving HTML)
app.UseStaticFiles();

// Create Copilot client as a singleton
var copilotClient = new CopilotClient();

// Store uploaded file contents in memory
var uploadedFiles = new Dictionary<string, string>();

// ========================================
// PERSISTENT SESSION WITH REQUEST SEMAPHORE
// ========================================
CopilotSession? persistentSession = null;
SemaphoreSlim requestLock = new SemaphoreSlim(1, 1); // Only one request at a time
DateTime lastSessionCreated = DateTime.MinValue;
TimeSpan sessionTimeout = TimeSpan.FromMinutes(30);
bool handlersAttached = false;
HttpContext? activeContext = null; // Current request's context

// ========================================
// AZURE DEVOPS MCP SERVER CONFIGURATION  
// ========================================
var azureDevOpsOrganization = "aerdelyi12185";

// Note: Azure DevOps is now integrated via MCP server
// The Copilot SDK automatically handles the MCP server lifecycle when configured in the session

// ========================================
// AI TOOLS DEFINITION
// ========================================

// Tool 1: Weather Information
var getWeather = AIFunctionFactory.Create(
    ([Description("The city name")] string city) =>
    {
        var conditions = new[] { "sunny", "cloudy", "rainy", "partly cloudy" };
        var temp = Random.Shared.Next(50, 80);
        var condition = conditions[Random.Shared.Next(conditions.Length)];
        return new { city, temperature = $"{temp}°F", condition };
    },
    "get_weather",
    "Get the current weather for a city");

// Tool 2: Application Documentation
var getAppInfo = AIFunctionFactory.Create(
    () =>
    {
        var readmePath = Path.Combine(Directory.GetCurrentDirectory(), "README.md");
        if (File.Exists(readmePath))
        {
            return File.ReadAllText(readmePath);
        }
        return "README.md not found. Unable to provide application documentation.";
    },
    "get_app_info",
    "Read the application's README.md file to answer questions about the app's features, usage, purpose, license, technical details, and any other documentation");

// Tool 3: Uploaded Files Search
var searchUploadedFiles = AIFunctionFactory.Create(
    ([Description("Optional: specific filename to search for. If not provided, searches all uploaded files")] string? fileName) =>
    {
        if (uploadedFiles.Count == 0)
        {
            return "No files have been uploaded yet.";
        }

        if (!string.IsNullOrEmpty(fileName))
        {
            var matchingFile = uploadedFiles.FirstOrDefault(f => 
                f.Key.Contains(fileName, StringComparison.OrdinalIgnoreCase));
            
            if (matchingFile.Key != null)
            {
                return $"File: {matchingFile.Key}\n\nContent:\n{matchingFile.Value}";
            }
            return $"File '{fileName}' not found. Available files: {string.Join(", ", uploadedFiles.Keys)}";
        }

        // Return all uploaded files content
        var allContent = string.Join("\n\n---\n\n", uploadedFiles.Select(f => 
            $"File: {f.Key}\n\nContent:\n{f.Value}"));
        return allContent;
    },
    "search_uploaded_files",
    "Search and retrieve content from uploaded files. Can search a specific file by name or return all uploaded file contents.");

// Note: Azure DevOps queries are now handled by the MCP server
// The SDK will automatically discover and use tools provided by the MCP server

// ========================================
// SESSION MANAGEMENT FUNCTION
// ========================================
async Task<CopilotSession> GetOrCreateSessionAsync()
{
    bool needNewSession = persistentSession == null || 
                         (DateTime.UtcNow - lastSessionCreated) > sessionTimeout;
    
    if (needNewSession)
    {
        Console.WriteLine("🔄 Creating new persistent session with MCP server...");
        
        if (persistentSession != null)
        {
            await persistentSession.DisposeAsync();
        }
        
        persistentSession = await copilotClient.CreateSessionAsync(new SessionConfig
        {
            Model = "gpt-4.1",
            Streaming = true,
            Tools = [getWeather, getAppInfo, searchUploadedFiles],
            McpServers = new Dictionary<string, object>
            {
                ["azure-devops"] = new McpLocalServerConfig
                {
                    Type = "local",
                    Command = "npx",
                    Args = new List<string> { "-y", "@azure-devops/mcp", azureDevOpsOrganization },
                    Tools = new List<string> { "*" },
                    Timeout = 30000
                }
            }
        });
        
        lastSessionCreated = DateTime.UtcNow;
        handlersAttached = false;
        Console.WriteLine("✅ Session created (will reuse for 30 minutes)");
    }
    else
    {
        Console.WriteLine("♻️ Reusing existing session (authenticated MCP server)");
    }
    
    // Attach event handlers only once per session
    if (!handlersAttached)
    {
        persistentSession.On(ev =>
        {
            var ctx = activeContext; // Capture current active context
            if (ctx != null)
            {
                if (ev is AssistantMessageDeltaEvent deltaEvent)
                {
                    var data = $"data: {System.Text.Json.JsonSerializer.Serialize(new { content = deltaEvent.Data.DeltaContent })}\n\n";
                    ctx.Response.WriteAsync(data).Wait();
                    ctx.Response.Body.FlushAsync().Wait();
                }
            }
        });
        handlersAttached = true;
        Console.WriteLine("📡 Event handlers attached to session");
    }
    
    return persistentSession;
}

// ========================================
// API ENDPOINTS
// ========================================

// File upload endpoint
app.MapPost("/api/upload", async (HttpContext context) =>
{
    var form = await context.Request.ReadFormAsync();
    var files = form.Files;

    if (files.Count == 0)
    {
        return Results.BadRequest(new { error = "No files uploaded" });
    }

    var uploadedFileNames = new List<string>();

    foreach (var file in files)
    {
        if (file.Length > 0)
        {
            using var reader = new StreamReader(file.OpenReadStream());
            var content = await reader.ReadToEndAsync();
            uploadedFiles[file.FileName] = content;
            uploadedFileNames.Add(file.FileName);
        }
    }

    return Results.Ok(new { 
        message = $"Successfully uploaded {uploadedFileNames.Count} file(s)", 
        files = uploadedFileNames 
    });
});

// List uploaded files endpoint
app.MapGet("/api/files", () =>
{
    return Results.Ok(new { files = uploadedFiles.Keys.ToList() });
});

// Delete file endpoint
app.MapDelete("/api/files/{fileName}", (string fileName) =>
{
    if (uploadedFiles.Remove(fileName))
    {
        return Results.Ok(new { message = $"File '{fileName}' deleted successfully" });
    }
    return Results.NotFound(new { error = "File not found" });
});

// Chat endpoint with streaming
app.MapPost("/api/chat", async (HttpContext context) =>
{
    ChatRequest? request = null;
    try
    {
        request = await context.Request.ReadFromJsonAsync<ChatRequest>();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error parsing request: {ex.Message}");
        context.Response.StatusCode = 400;
        await context.Response.WriteAsync($"Invalid request format");
        return;
    }
    
    if (request == null || string.IsNullOrWhiteSpace(request.Message))
    {
        context.Response.StatusCode = 400;
        await context.Response.WriteAsync("Message is required");
        return;
    }

    Console.WriteLine($"📩 Received: {request.Message}");
    
    context.Response.ContentType = "text/event-stream";
    context.Response.Headers.Append("Cache-Control", "no-cache");
    context.Response.Headers.Append("Connection", "keep-alive");

    try
    {
        // Acquire lock for entire request (ensures serialized processing)
        await requestLock.WaitAsync();
        
        try
        {
            // Get or create persistent session (reuses authenticated MCP server)
            var session = await GetOrCreateSessionAsync();
            
            // Set active context for event routing
            activeContext = context;

        // Send conversation history to maintain context (last 10 messages only to avoid repeated auth)
        if (request.History != null && request.History.Length > 0)
        {
            var recentHistory = request.History.TakeLast(10).ToArray();
            var contextPrompt = string.Join("\n", recentHistory);
            Console.WriteLine($"📝 Using {recentHistory.Length} messages for context");
            await session.SendAndWaitAsync(new MessageOptions { Prompt = $"Previous conversation context:\n{contextPrompt}\n\nCurrent question: {request.Message}" });
        }
        else
        {
            Console.WriteLine($"📝 No history, sending fresh message");
            // Send the current message
            await session.SendAndWaitAsync(new MessageOptions { Prompt = request.Message });
        }
        
            // Send end marker
            await context.Response.WriteAsync("data: [DONE]\n\n");
            await context.Response.Body.FlushAsync();
            Console.WriteLine($"✅ Response completed");
            
            // Clear active context
            activeContext = null;
        }
        finally
        {
            // Release lock for next request
            requestLock.Release();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error: {ex.Message}");
        Console.WriteLine($"Stack: {ex.StackTrace}");
        
        var errorData = $"data: {System.Text.Json.JsonSerializer.Serialize(new { content = $"\n\n❌ Error: {ex.Message}" })}\n\n";
        await context.Response.WriteAsync(errorData);
        await context.Response.WriteAsync("data: [DONE]\n\n");
        await context.Response.Body.FlushAsync();
        
        // Clear context and release lock
        activeContext = null;
        if (requestLock.CurrentCount == 0) requestLock.Release();
    }
});

// Serve index.html at root
app.MapGet("/", () => Results.Redirect("/index.html"));

app.Run();

record ChatRequest(string Message, string[]? History);
