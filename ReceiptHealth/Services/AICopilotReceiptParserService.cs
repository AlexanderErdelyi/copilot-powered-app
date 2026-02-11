using GitHub.Copilot.SDK;
using Microsoft.Extensions.AI;
using ReceiptHealth.Models;
using System.Text.Json;

namespace ReceiptHealth.Services;

/// <summary>
/// AI-powered receipt parser using GitHub Copilot SDK for intelligent parsing and structuring.
/// Uses GPT-4 to understand receipt structure and extract structured data with high accuracy.
/// </summary>
public class AICopilotReceiptParserService : IReceiptParserService
{
    private readonly ILogger<AICopilotReceiptParserService> _logger;
    private readonly CopilotClient _copilotClient;

    public AICopilotReceiptParserService(ILogger<AICopilotReceiptParserService> logger)
    {
        _logger = logger;
        _copilotClient = new CopilotClient();
    }

    public async Task<(Receipt receipt, List<LineItem> lineItems)> ParseReceiptAsync(string text)
    {
        _logger.LogInformation("AI-powered receipt parsing ({Length} chars)", text.Length);

        try
        {
            // Create a session with GPT-4
            await using var session = await _copilotClient.CreateSessionAsync(new SessionConfig
            {
                Model = "gpt-4.1",
                Streaming = false
            });

            // Create a structured prompt for receipt parsing
            var prompt = $@"You are a receipt parsing expert. Analyze the following receipt text and extract structured information.

Receipt text:
{text}

Please extract the following information and return it as a JSON object:

{{
    ""vendor"": ""store name"",
    ""date"": ""YYYY-MM-DD"",
    ""subtotal"": 0.00,
    ""tax"": 0.00,
    ""total"": 0.00,
    ""lineItems"": [
        {{
            ""description"": ""item name"",
            ""price"": 0.00,
            ""quantity"": 1
        }}
    ]
}}

Rules:
1. Extract ALL line items from the receipt
2. Use today's date ({DateTime.Today:yyyy-MM-dd}) if the date is not clearly specified
3. Set subtotal, tax, and total to 0 if not found
4. Clean up item descriptions (remove extra spaces, formatting)
5. Ensure all prices are in decimal format (e.g., 4.99, not $4.99)
6. Return ONLY the JSON object, no other text or explanation";

            // Send the prompt and wait for response
            var response = await session.SendAndWaitAsync(new MessageOptions { Prompt = prompt });
            
            var jsonResponse = response?.Data?.Content ?? string.Empty;
            
            // Clean up the response (remove markdown code blocks if present)
            jsonResponse = jsonResponse.Trim();
            if (jsonResponse.StartsWith("```json"))
            {
                jsonResponse = jsonResponse.Substring(7);
            }
            if (jsonResponse.StartsWith("```"))
            {
                jsonResponse = jsonResponse.Substring(3);
            }
            if (jsonResponse.EndsWith("```"))
            {
                jsonResponse = jsonResponse.Substring(0, jsonResponse.Length - 3);
            }
            jsonResponse = jsonResponse.Trim();

            // Parse the JSON response
            var parsedData = JsonSerializer.Deserialize<ReceiptParseResult>(jsonResponse, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (parsedData == null)
            {
                throw new InvalidOperationException("Failed to parse AI response");
            }

            // Create Receipt object
            var receipt = new Receipt
            {
                Vendor = parsedData.Vendor ?? "Unknown",
                Date = DateTime.TryParse(parsedData.Date, out var parsedDate) ? parsedDate : DateTime.Today,
                Subtotal = parsedData.Subtotal,
                Tax = parsedData.Tax,
                Total = parsedData.Total,
                RawText = text,
                ProcessedAt = DateTime.UtcNow
            };

            // Create LineItem objects
            var lineItems = parsedData.LineItems?.Select(item => new LineItem
            {
                Description = item.Description ?? "Unknown",
                Price = item.Price,
                Quantity = item.Quantity > 0 ? item.Quantity : 1,
                Category = "Unknown" // Will be categorized by category service
            }).ToList() ?? new List<LineItem>();

            _logger.LogInformation("AI parsed receipt: Vendor={Vendor}, Date={Date}, Total={Total}, Items={Count}", 
                receipt.Vendor, receipt.Date, receipt.Total, lineItems.Count);

            return (receipt, lineItems);
        }
        catch (JsonException jsonEx)
        {
            _logger.LogError(jsonEx, "Failed to parse AI JSON response");
            // Fall back to basic parsing
            return await FallbackParseAsync(text);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during AI-powered receipt parsing");
            // Fall back to basic parsing
            return await FallbackParseAsync(text);
        }
    }

    /// <summary>
    /// Fallback parsing method using simple regex patterns (similar to original implementation)
    /// </summary>
    private async Task<(Receipt receipt, List<LineItem> lineItems)> FallbackParseAsync(string text)
    {
        await Task.CompletedTask;
        
        _logger.LogWarning("Using fallback parsing method");

        var receipt = new Receipt
        {
            RawText = text,
            ProcessedAt = DateTime.UtcNow,
            Vendor = "Unknown",
            Date = DateTime.Today,
            Total = 0,
            Subtotal = 0,
            Tax = 0
        };

        var lineItems = new List<LineItem>();

        // Extract basic information using regex (simplified version)
        var lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        if (lines.Length > 0)
        {
            receipt.Vendor = lines[0].Trim();
        }

        _logger.LogInformation("Fallback parsing completed: {Vendor}", receipt.Vendor);
        
        return (receipt, lineItems);
    }

    // Helper classes for JSON deserialization
    private class ReceiptParseResult
    {
        public string? Vendor { get; set; }
        public string? Date { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Tax { get; set; }
        public decimal Total { get; set; }
        public List<LineItemParseResult>? LineItems { get; set; }
    }

    private class LineItemParseResult
    {
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }
    }
}
