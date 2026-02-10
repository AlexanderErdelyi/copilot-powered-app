# Copilot-Powered Weather Assistant 🌤️

An interactive weather assistant built with the GitHub Copilot SDK, demonstrating AI-powered conversations with custom tool integration.

## Features

- 🤖 **AI-Powered Responses**: Uses GitHub Copilot to provide natural language interactions
- 📡 **Streaming Responses**: Real-time streaming of AI responses for a better user experience
- 🛠️ **Custom Tools**: Weather lookup tool that Copilot can call to get weather data
- 💬 **Interactive Mode**: Chat-style interface for continuous conversations

## Prerequisites

Before you begin, make sure you have:

- **Node.js** 24+ installed
- **GitHub Copilot CLI** installed and authenticated ([Installation guide](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli))

Verify the CLI is working:

```bash
copilot --version
```

## Installation

Install dependencies:

```bash
npm install
```

## Usage

### Simple Example

Run the basic example that demonstrates streaming responses and custom tool usage:

```bash
npm start
```

This will ask Copilot about the weather in Seattle and Tokyo, demonstrating how the AI assistant calls the custom weather tool.

### Interactive Weather Assistant

For a fully interactive experience, run:

```bash
npm run assistant
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
4. **Custom Tools**: Defines a `get_weather` tool that Copilot can call autonomously
5. **Event Handling**: Listens for message deltas and session events

## Project Structure

- `index.ts` - Simple example showing basic usage with streaming and tools
- `weather-assistant.ts` - Interactive chat assistant with continuous conversation
- `package.json` - Project dependencies and scripts

## Learn More

This project is based on the [GitHub Copilot SDK Getting Started Guide](https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md).

For more information about the Copilot SDK:
- [Documentation](https://github.com/github/copilot-sdk)
- [API Reference](https://github.com/github/copilot-sdk/tree/main/docs)
