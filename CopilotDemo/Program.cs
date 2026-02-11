using GitHub.Copilot.SDK;
using Microsoft.Extensions.AI;
using System.ComponentModel;

// Define the weather tool using AIFunctionFactory
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

// Define the app info tool to read and return README documentation
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

await using var client = new CopilotClient();
await using var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "gpt-4.1",
    Streaming = true,
    Tools = [getWeather, getAppInfo]
});

// Listen for response chunks
session.On(ev =>
{
    if (ev is AssistantMessageDeltaEvent deltaEvent)
    {
        Console.Write(deltaEvent.Data.DeltaContent);
    }
    if (ev is SessionIdleEvent)
    {
        Console.WriteLine();
    }
});

Console.WriteLine("🤖 Copilot Agent Demo - Weather & App Info Assistant (type 'exit' to quit)");
Console.WriteLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
Console.WriteLine("Ask me about:");
Console.WriteLine("  🌤️  Weather - 'What's the weather in Paris?' or 'Compare NYC and LA'");
Console.WriteLine("  📱 This App - 'What can you do?' or 'How does this work?'\n");

while (true)
{
    Console.Write("You: ");
    var input = Console.ReadLine();

    if (string.IsNullOrEmpty(input) || input.Equals("exit", StringComparison.OrdinalIgnoreCase))
    {
        break;
    }

    Console.Write("Assistant: ");
    await session.SendAndWaitAsync(new MessageOptions { Prompt = input });
    Console.WriteLine("\n");
}