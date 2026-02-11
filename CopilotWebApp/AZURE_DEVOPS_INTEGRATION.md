# Azure DevOps Integration Guide

This application integrates with Azure DevOps through the Model Context Protocol (MCP) to query and retrieve project data.

## 🔧 Configuration

### Organization Setup

The Azure DevOps organization is configured in `Program.cs`:

```csharp
var azureDevOpsOrganization = "aerdelyi12185";
```

**To use your own organization:**
1. Open `Program.cs`
2. Find the `AZURE DEVOPS CONNECTOR` section (around line 19)
3. Replace `"aerdelyi12185"` with your Azure DevOps organization name

### MCP Server

The integration uses the Azure DevOps MCP server:
- **Package**: `@azure-devops/mcp`
- **Command**: `npx -y @azure-devops/mcp <organization>`
- **Protocol**: stdio (Standard Input/Output)

## 🔐 Authentication

The MCP server handles authentication. You may need to:
1. Be logged in via Azure CLI: `az login`
2. Or provide credentials through environment variables
3. Or authenticate through the MCP server's prompts

## 📊 Available Queries

You can ask natural language questions about your Azure DevOps data:

### Work Items
- "Show my work items"
- "List all bugs in the current sprint"
- "What tasks are assigned to me?"
- "Get work item #12345"
- "Show open issues"

### Pull Requests
- "Show active pull requests"
- "List my open PRs"
- "What pull requests need review?"
- "Show recently merged PRs"

### Builds
- "Show recent builds"
- "What's the status of the latest build?"
- "List failed builds"
- "Show build history"

### Repositories
- "List all repositories"
- "Show repository information"

### Sprints & Iterations
- "What's in the current sprint?"
- "Show sprint information"
- "List upcoming iterations"

## 🏗️ Architecture

### Code Structure

```
Program.cs
├── AZURE DEVOPS CONNECTOR (Lines ~19-50)
│   ├── azureDevOpsOrganization - Configuration
│   └── QueryAzureDevOpsMCP() - MCP Communication Function
│
├── AI TOOLS DEFINITION (Lines ~51-120)
│   ├── Tool 1: getWeather - Weather information
│   ├── Tool 2: getAppInfo - Application documentation
│   ├── Tool 3: searchUploadedFiles - File search
│   └── Tool 4: queryAzureDevOps - Azure DevOps queries
│
└── API ENDPOINTS (Lines ~121+)
    ├── /api/upload - File upload
    ├── /api/files - List files
    ├── /api/files/{fileName} - Delete file
    └── /api/chat - Chat with AI
```

### How It Works

1. **User asks a question** in the chat interface
2. **AI analyzes the question** and determines which tool(s) to use
3. **If Azure DevOps related**, AI calls the `queryAzureDevOps` tool
4. **Tool spawns MCP process**: `npx -y @azure-devops/mcp aerdelyi12185`
5. **Query is sent to MCP** via stdin
6. **MCP returns data** via stdout
7. **AI processes the response** and formats it for the user
8. **User sees the answer** streamed word-by-word

### Process Communication

```
Application (Program.cs)
    ↓ spawns process
MCP Server (npx @azure-devops/mcp)
    ↓ authenticates & queries
Azure DevOps API
    ↓ returns data
MCP Server
    ↓ formats response
Application
    ↓ AI processes
User sees result
```

## 🚀 Usage Examples

### Combined Queries

The AI can intelligently combine multiple data sources:

**Example 1**: Mixed query
```
User: "What's the weather in Seattle and show my Azure DevOps tasks?"
AI: Uses both getWeather and queryAzureDevOps tools
```

**Example 2**: Cross-reference
```
User: "Upload project-plan.txt, then show work items and compare with the plan"
AI: Uses searchUploadedFiles and queryAzureDevOps tools together
```

### Query Patterns

The AI understands various query patterns:

- **Direct queries**: "Show work items"
- **Filtered queries**: "Show my bugs"
- **Status queries**: "What's the build status?"
- **Assignment queries**: "What's assigned to me?"
- **Time-based**: "Recent pull requests"

## 🛠️ Troubleshooting

### Issue: "Error connecting to Azure DevOps"

**Solutions:**
1. Check your organization name is correct
2. Ensure you have internet connectivity
3. Verify you're authenticated with Azure
4. Check if npx can run: `npx --version`
5. Test MCP server manually: `npx -y @azure-devops/mcp your-org`

### Issue: "No data returned from Azure DevOps"

**Solutions:**
1. Verify you have access to the organization
2. Check if the project exists
3. Ensure you have permissions to read work items
4. Try a simpler query first

### Issue: MCP server timeout

**Solutions:**
1. Increase timeout if needed (currently waits for process completion)
2. Check network connection
3. Verify Azure DevOps service is available

## 📝 Customization

### Adding More Organizations

You can support multiple organizations by modifying the tool:

```csharp
var queryAzureDevOps = AIFunctionFactory.Create(
    ([Description("Organization name")] string organization,
     [Description("Query")] string query) =>
    {
        return QueryAzureDevOpsMCP(organization, query).Result;
    },
    "query_azure_devops",
    "Query Azure DevOps...");
```

### Adding Custom Queries

Extend the `QueryAzureDevOpsMCP` function to handle specific query types or add preprocessing of queries before sending to MCP.

### Caching Responses

For better performance, consider caching frequent queries:

```csharp
var cache = new Dictionary<string, (string result, DateTime timestamp)>();
// Check cache before calling MCP
```

## 🔒 Security Considerations

1. **Credentials**: Never hardcode Personal Access Tokens
2. **Process Isolation**: MCP servers run in separate processes
3. **Input Validation**: User queries are passed to MCP - be aware of injection risks
4. **Network**: Ensure secure connection to Azure DevOps
5. **Access Control**: Users inherit your Azure DevOps permissions

## 📦 Dependencies

- **Node.js/npm**: Required for npx
- **@azure-devops/mcp**: Automatically downloaded by npx
- **Azure CLI**: Optional, for authentication

## 🎯 Future Enhancements

Potential improvements:
- [ ] Support for multiple organizations
- [ ] Query result caching
- [ ] Custom authentication methods
- [ ] Advanced filtering options
- [ ] Export query results
- [ ] Query history tracking
- [ ] Rate limiting for API calls

## 📚 Resources

- [Azure DevOps REST API Documentation](https://docs.microsoft.com/en-us/rest/api/azure/devops/)
- [Model Context Protocol (MCP) Specification](https://modelcontextprotocol.io/)
- [Azure DevOps MCP Server](https://www.npmjs.com/package/@azure-devops/mcp)

---

**Built with ❤️ using GitHub Copilot SDK and Azure DevOps MCP**
