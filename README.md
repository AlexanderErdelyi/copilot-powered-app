# Copilot-Powered Weather Assistant 🌤️

An interactive weather assistant built with the GitHub Copilot SDK for .NET, demonstrating AI-powered conversations with custom tool integration.

## Features

- 🤖 **AI-Powered Responses**: Uses GitHub Copilot to provide natural language interactions
- 📡 **Streaming Responses**: Real-time streaming of AI responses for a better user experience
- 🛠️ **Custom Tools**: Weather lookup tool that Copilot can call to get weather data
- 💬 **Interactive Mode**: Chat-style interface for continuous conversations

## Prerequisites

Before you begin, make sure you have:

- **.NET** 8.0+ installed
- **GitHub Copilot CLI** installed and authenticated ([Installation guide](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli))

Verify the CLI is working:

```bash
copilot --version
```

Verify .NET is installed:

```bash
dotnet --version
```

## Installation

Restore dependencies:

```bash
dotnet restore
```

## Usage

### Simple Example

Run the basic example that demonstrates streaming responses and custom tool usage:

```bash
dotnet run
```

This will ask Copilot about the weather in Seattle and Tokyo, demonstrating how the AI assistant calls the custom weather tool.

### Interactive Weather Assistant

For a fully interactive experience with continuous conversation, you can run the WeatherAssistant.cs file directly using `dotnet-script` or by temporarily swapping it with Program.cs:

**Option 1: Using dotnet-script (recommended)**

First install dotnet-script:
```bash
dotnet tool install -g dotnet-script
```

Then run the interactive assistant:
```bash
dotnet script WeatherAssistant.cs
```

**Option 2: Swap with Program.cs**

```bash
# Backup the simple example
mv Program.cs ProgramSimple.cs

# Use the interactive assistant
cp WeatherAssistant.cs Program.cs

# Build and run
dotnet run

# Restore when done
mv ProgramSimple.cs Program.cs
```

You can then chat with the assistant:

```
🌤️  Weather Assistant (type 'exit' to quit)
   Try: 'What's the weather in Paris?'

You: What's the weather like in Seattle?
Assistant: Let me check the weather for Seattle...
         Currently 62°F and cloudy with a chance of rain.

You: How about Tokyo?
Assistant: In Tokyo it's 75°F and sunny. Great day to be outside!

You: Compare weather in NYC and LA
Assistant: [Calls weather tool for both cities and provides comparison]

You: exit
```

## How It Works

This app demonstrates the GitHub Copilot SDK's key features:

1. **Client Initialization**: Creates a `CopilotClient` to manage AI interactions
2. **Session Management**: Creates sessions with specific models and configurations
3. **Streaming**: Enables real-time response streaming for better UX
4. **Custom Tools**: Defines a `get_weather` tool using `AIFunctionFactory` that Copilot can call autonomously
5. **Event Handling**: Listens for `AssistantMessageDeltaEvent` and `SessionIdleEvent`

## Project Structure

- `Program.cs` - Simple example showing basic usage with streaming and tools
- `WeatherAssistant.cs` - Interactive chat assistant with continuous conversation
- `CopilotWeatherApp.csproj` - Project file with dependencies

## Learn More

This project is based on the [GitHub Copilot SDK Getting Started Guide](https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md).

For more information about the Copilot SDK:
- [Documentation](https://github.com/github/copilot-sdk)
- [.NET SDK Reference](https://github.com/github/copilot-sdk/tree/main/dotnet)
- [API Reference](https://github.com/github/copilot-sdk/tree/main/docs)
