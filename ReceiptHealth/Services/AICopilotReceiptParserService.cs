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

    public AICopilotReceiptParserService(ILogger<AICopilotReceiptParserService> logger)
    {
        _logger = logger;
    }

    public async Task<(Receipt receipt, List<LineItem> lineItems)> ParseReceiptAsync(string text)
    {
        _logger.LogInformation("AI-powered receipt parsing ({Length} chars)", text.Length);
        _logger.LogInformation("📄 Receipt text to parse: {Text}", text);

        try
        {
            // Create a new CopilotClient for this operation
            using var copilotClient = new CopilotClient();
            
            // Create a session with GPT-4
            await using var session = await copilotClient.CreateSessionAsync(new SessionConfig
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
    ""currency"": ""EUR"",
    ""lineItems"": [
        {{
            ""description"": ""item name"",
            ""price"": 0.00,
            ""quantity"": 1
        }}
    ]
}}

CRITICAL RULES:
1. Extract EVERY SINGLE line item from the receipt - count carefully
2. Vendor is the store name (e.g., 'Lidl', 'REWE', 'Aldi')
3. Parse dates in any format (DD.MM.YYYY or MM/DD/YYYY or YYYY-MM-DD)
4. Detect currency from the receipt (EUR, €, USD, $, GBP, £, etc.)
5. Handle European number formats (e.g., '9,88' = 9.88, '1.234,56' = 1234.56)
6. Parse quantities like '0,79 x 2' as price=0.79, quantity=2
7. For line items with multipliers (x 2, x 3), extract the unit price and quantity separately
8. Clean descriptions but keep them recognizable (e.g., 'Kefir 1,5%', 'Pepsi Zero Zucker')
9. Look for totals with keywords: 'zu zahlen', 'total', 'sum', 'summe', 'gesamt'
10. If subtotal or tax not found, calculate: subtotal = total - tax
11. Include tax information (MwST, VAT, sales tax)
12. Return ONLY the JSON object, no markdown formatting

Date today: {DateTime.Today:yyyy-MM-dd}";

            // Send the prompt and wait for response
            var response = await session.SendAndWaitAsync(new MessageOptions { Prompt = prompt });
            
            var jsonResponse = response?.Data?.Content ?? string.Empty;
            
            _logger.LogInformation("📝 AI Response (first 500 chars): {Response}", 
                jsonResponse.Length > 500 ? jsonResponse.Substring(0, 500) + "..." : jsonResponse);
            
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
            
            _logger.LogInformation("🔍 Cleaned JSON for parsing (first 300 chars): {Json}", 
                jsonResponse.Length > 300 ? jsonResponse.Substring(0, 300) + "..." : jsonResponse);

            // Parse the JSON response
            var parsedData = JsonSerializer.Deserialize<ReceiptParseResult>(jsonResponse, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (parsedData == null)
            {
                throw new InvalidOperationException("Failed to parse AI response");
            }

            // Detect currency from the original text if AI didn't extract it
            var detectedCurrency = parsedData.Currency;
            if (string.IsNullOrEmpty(detectedCurrency))
            {
                detectedCurrency = DetectCurrency(text);
            }

            // Create Receipt object
            var receipt = new Receipt
            {
                Vendor = parsedData.Vendor ?? "Unknown",
                Date = DateTime.TryParse(parsedData.Date, out var parsedDate) ? parsedDate : DateTime.Today,
                Subtotal = parsedData.Subtotal,
                Tax = parsedData.Tax,
                Total = parsedData.Total,
                Currency = detectedCurrency,
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
    /// Detect currency from receipt text based on symbols and keywords
    /// </summary>
    private string DetectCurrency(string text)
    {
        var lowerText = text.ToLower();
        
        // Check for Euro indicators
        if (text.Contains("€") || 
            lowerText.Contains("eur") || 
            lowerText.Contains("mwst") || // German tax = Euro
            lowerText.Contains("mehrwertsteuer"))
        {
            return "EUR";
        }
        
        // Check for British Pound
        if (text.Contains("£") || lowerText.Contains("gbp") || lowerText.Contains("vat"))
        {
            return "GBP";
        }
        
        // Check for US Dollar
        if (text.Contains("$") || lowerText.Contains("usd"))
        {
            return "USD";
        }
        
        // Check for Swiss Franc
        if (lowerText.Contains("chf") || lowerText.Contains("sfr"))
        {
            return "CHF";
        }
        
        // Default to EUR (most common in Europe)
        _logger.LogInformation("No clear currency detected, defaulting to EUR");
        return "EUR";
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
            Tax = 0,
            Currency = DetectCurrency(text) // Use currency detection
        };

        var lineItems = new List<LineItem>();

        // Extract basic information using regex (simplified version)
        var lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        if (lines.Length > 0)
        {
            receipt.Vendor = lines[0].Trim();
        }

        _logger.LogInformation("Fallback parsing completed: {Vendor}, Currency: {Currency}", receipt.Vendor, receipt.Currency);
        
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
        public string? Currency { get; set; }
        public List<LineItemParseResult>? LineItems { get; set; }
    }

    private class LineItemParseResult
    {
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }
    }
}
