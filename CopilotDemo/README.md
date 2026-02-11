# CopilotDemo - AI Agent with Tool Calling

A demonstration application showcasing GitHub Copilot SDK's capabilities for building AI agents with function calling (tool use) in .NET.

## 🎯 Purpose

This application demonstrates how to create an **agentic AI system** that can:
- Interact with users in natural language
- Invoke actual C# functions to retrieve real data
- Stream responses word-by-word for a natural conversation experience
- Integrate multiple tools that the AI can intelligently choose from

Instead of just generating text responses, the AI can execute code functions based on user queries, making it more powerful and accurate.

## ✨ Features

### 🌤️ Weather Lookup
Ask about weather conditions in any city. The AI will automatically invoke the weather function and provide current conditions.

**Example queries:**
- "What's the weather in Paris?"
- "Compare the weather in New York and Los Angeles"
- "Is it sunny in Tokyo?"

### 📱 Application Documentation
Ask questions about the application itself, including features, usage, purpose, or technical details.

**Example queries:**
- "What can this app do?"
- "How does this work?"
- "What technologies are you using?"
- "Tell me about your features"

## 🏗️ Technical Architecture

### Technology Stack
- **.NET 8.0** - Modern C# runtime
- **GitHub Copilot SDK v0.1.23** - AI integration library
- **Microsoft.Extensions.AI** - AI function factory and tool definitions
- **GPT-4.1 Model** - With streaming enabled

### Key Concepts

#### AI Function Calling
The application uses `AIFunctionFactory.Create()` to wrap C# functions into AI-callable tools:

```csharp
var getWeather = AIFunctionFactory.Create(
    ([Description("The city name")] string city) => {
        // Function implementation
    },
    "get_weather",
    "Get the current weather for a city");
```

The `[Description]` attribute helps the AI understand what parameters to extract from user queries.

#### Session Configuration
```csharp
await using var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "gpt-4.1",
    Streaming = true,
    Tools = [getWeather, getAppInfo]
});
```

- **Streaming**: Enables word-by-word response generation
- **Tools**: Array of AI-callable functions

#### Event Handling
The application listens for streaming events:
- `AssistantMessageDeltaEvent` - Receives text chunks as they're generated
- `SessionIdleEvent` - Signals when a response is complete

## 🚀 Getting Started

### Prerequisites
- .NET 8.0 SDK or later
- GitHub Copilot subscription (for SDK access)

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd CopilotDemo
   ```

2. **Restore dependencies**
   ```bash
   dotnet restore
   ```

3. **Build the project**
   ```bash
   dotnet build
   ```

### Running the Application

**Option 1: Standard run (may require Windows Defender exclusion)**
```bash
dotnet run
```

**Option 2: Run DLL directly (workaround for access issues)**
```bash
dotnet bin\Debug\net8.0\CopilotDemo.dll
```

### Windows Defender Issue

If you encounter "Access Denied" errors, add an exclusion for your project folder:

**PowerShell (as Administrator):**
```powershell
Add-MpPreference -ExclusionPath "C:\VSCodeProjects\GitHub\copilot-powered-app"
```

**Or manually via Windows Security:**
1. Open Windows Security → Virus & threat protection
2. Click "Manage settings" → Scroll to "Exclusions"
3. Add folder: Your project path

## 💡 Usage Examples

### Weather Queries
```
You: What's the weather like in Seattle?
Assistant: It's currently 63°F and cloudy in Seattle.

You: Compare weather in Boston and Miami
Assistant: In Boston it's 58°F and rainy, while Miami is enjoying 
76°F and sunny conditions.
```

### App Information Queries
```
You: What can you do?
Assistant: I have two main capabilities: I can look up weather 
information for any city, and I can answer questions about this 
application itself.

You: How does this application work?
Assistant: This is a demo built with .NET 8 and GitHub Copilot SDK. 
It showcases AI agent capabilities with tool calling, allowing me 
to invoke actual C# functions rather than just generating text.
```

### Exit the Application
```
You: exit
```

## 📚 Learning Resources

- [GitHub Copilot SDK Documentation](https://github.com/features/copilot)
- [Microsoft.Extensions.AI](https://learn.microsoft.com/dotnet/ai/)
- [Function Calling Pattern](https://platform.openai.com/docs/guides/function-calling)

## 🔧 Extending the Application

### Adding New Tools

To add a new AI-callable function:

1. **Create the function using AIFunctionFactory:**
   ```csharp
   var myNewTool = AIFunctionFactory.Create(
       ([Description("Parameter description")] string param) => {
           // Your implementation
           return "result";
       },
       "tool_name",
       "Description of what this tool does");
   ```

2. **Add it to the Tools array:**
   ```csharp
   Tools = [getWeather, getAppInfo, myNewTool]
   ```

3. **The AI will automatically know when to use it!**

## 📝 Notes

- Weather data is currently simulated with random values (for demo purposes)
- The AI intelligently decides which tool to use based on user input
- Multiple tools can be called in a single user query
- Responses stream word-by-word for a natural conversation feel

## 🤝 Contributing

This is a demonstration project. Feel free to fork and extend it with additional capabilities!

## 📄 License

This project is for educational and demonstration purposes.

---

**Built with ❤️ using GitHub Copilot SDK**
