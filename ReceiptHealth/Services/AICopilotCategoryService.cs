using GitHub.Copilot.SDK;
using Microsoft.Extensions.AI;
using ReceiptHealth.Models;
using System.Text.Json;

namespace ReceiptHealth.Services;

/// <summary>
/// AI-powered category service using GitHub Copilot SDK for intelligent food categorization.
/// Automatically recognizes food items in any language and categorizes them by nutritional value.
/// </summary>
public class AICopilotCategoryService : ICategoryService
{
    private readonly ILogger<AICopilotCategoryService> _logger;

    public AICopilotCategoryService(ILogger<AICopilotCategoryService> logger)
    {
        _logger = logger;
    }

    public string CategorizeItem(string description, string? vendor = null)
    {
        // Synchronous wrapper for async method
        return CategorizeItemAsync(description).GetAwaiter().GetResult();
    }

    /// <summary>
    /// Batch categorize all items efficiently with a single AI session
    /// </summary>
    public async Task<Dictionary<string, string>> BatchCategorizeItemsAsync(List<string> descriptions)
    {
        _logger.LogInformation("🤖 Batch AI categorization starting for {Count} items", descriptions.Count);
        
        var results = new Dictionary<string, string>();
        
        try
        {
            using var copilotClient = new CopilotClient();
            
            await using var session = await copilotClient.CreateSessionAsync(new SessionConfig
            {
                Model = "gpt-4.1",
                Streaming = false
            });

            // Build numbered list of items
            var itemsList = string.Join("\n", descriptions.Select((desc, i) => $"{i + 1}. {desc}"));

            var prompt = $@"Categorize ALL of these {descriptions.Count} food/grocery items into categories.

**Categories:**
- **Healthy**: Fresh produce, vegetables, fruits, whole grains, yogurt, kefir, salads, lean proteins, organic items, healthy beverages
- **Junk**: Candy, chocolate, chips, cookies, soda, ice cream, highly processed snacks, sugary drinks
- **Other**: Bread, pasta, rice, pizza dough, tortelloni, basic staples, bottle deposits (Pfand), neutral items

**Items to categorize:**
{itemsList}

IMPORTANT RULES:
1. Categorize EVERY SINGLE ITEM - all {descriptions.Count} items must have a category
2. Recognize language automatically (English, German, Italian, French, etc.)
3. Return ONLY a JSON array with {descriptions.Count} entries
4. Format: [""Healthy"", ""Junk"", ""Other"", ""Healthy"", ...]
5. Order must match the numbered list exactly
6. No explanations, no markdown, just the JSON array

Example response format:
[""Healthy"", ""Healthy"", ""Junk"", ""Other"", ""Healthy"", ""Other""]

Your response (JSON array only):";

            var response = await session.SendAndWaitAsync(new MessageOptions { Prompt = prompt });
            var jsonResponse = response?.Data?.Content?.Trim() ?? "[]";
            
            _logger.LogInformation("📝 Batch categorization response: {Response}", 
                jsonResponse.Length > 200 ? jsonResponse.Substring(0, 200) + "..." : jsonResponse);
            
            // Clean up response
            jsonResponse = jsonResponse.Trim();
            if (jsonResponse.StartsWith("```json"))
                jsonResponse = jsonResponse.Substring(7);
            if (jsonResponse.StartsWith("```"))
                jsonResponse = jsonResponse.Substring(3);
            if (jsonResponse.EndsWith("```"))
                jsonResponse = jsonResponse.Substring(0, jsonResponse.Length - 3);
            jsonResponse = jsonResponse.Trim();

            // Parse JSON array
            var categories = JsonSerializer.Deserialize<List<string>>(jsonResponse);
            
            if (categories == null || categories.Count != descriptions.Count)
            {
                _logger.LogError("❌ Batch categorization returned {Actual} categories, expected {Expected}", 
                    categories?.Count ?? 0, descriptions.Count);
                
                // Fallback: Try one-by-one categorization
                _logger.LogWarning("⚠️ Falling back to one-by-one categorization");
                foreach (var desc in descriptions)
                {
                    results[desc] = await CategorizeItemAsync(desc);
                }
                return results;
            }

            // Map results
            for (int i = 0; i < descriptions.Count; i++)
            {
                var category = categories[i].Trim();
                if (category != "Healthy" && category != "Junk" && category != "Other")
                {
                    _logger.LogWarning("⚠️ Invalid category '{Category}' for item: {Item}", category, descriptions[i]);
                    category = "Unknown";
                }
                results[descriptions[i]] = category;
                _logger.LogInformation("  📊 {Index}. {Item} → {Category}", i + 1, descriptions[i], category);
            }

            _logger.LogInformation("✅ Batch categorization complete: {Count} items processed", results.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error in batch categorization");
            
            // Fallback: Try one-by-one categorization
            _logger.LogWarning("⚠️ Falling back to one-by-one categorization after error");
            foreach (var desc in descriptions)
            {
                try
                {
                    results[desc] = await CategorizeItemAsync(desc);
                }
                catch
                {
                    results[desc] = "Unknown";
                }
            }
        }
        
        return results;
    }

    public CategorySummary ComputeCategorySummary(List<LineItem> lineItems)
    {
        _logger.LogInformation("🤖 AI-powered categorization starting for {Count} items", lineItems.Count);

        var healthyTotal = 0m;
        var junkTotal = 0m;
        var otherTotal = 0m;
        var unknownTotal = 0m;

        foreach (var item in lineItems)
        {
            var category = CategorizeItem(item.Description);
            _logger.LogInformation("  📊 {Item} → {Category}", item.Description, category);

            switch (category)
            {
                case "Healthy":
                    healthyTotal += item.Price;
                    break;
                case "Junk":
                    junkTotal += item.Price;
                    break;
                case "Other":
                    otherTotal += item.Price;
                    break;
                default:
                    unknownTotal += item.Price;
                    break;
            }
        }

        _logger.LogInformation("✅ Categorization complete: H={Healthy:C}, J={Junk:C}, O={Other:C}, U={Unknown:C}",
            healthyTotal, junkTotal, otherTotal, unknownTotal);

        return new CategorySummary
        {
            HealthyTotal = healthyTotal,
            JunkTotal = junkTotal,
            OtherTotal = otherTotal,
            UnknownTotal = unknownTotal
        };
    }

    public CategorySummary ComputeCategorySummaryFromCategorizedItems(List<LineItem> lineItems)
    {
        _logger.LogInformation("📊 Computing category summary from {Count} already-categorized items", lineItems.Count);

        var healthyTotal = 0m;
        var junkTotal = 0m;
        var otherTotal = 0m;
        var unknownTotal = 0m;

        foreach (var item in lineItems)
        {
            // Use item.Category which was already set during batch categorization
            var category = item.Category ?? "Unknown";

            switch (category)
            {
                case "Healthy":
                    healthyTotal += item.Price;
                    break;
                case "Junk":
                    junkTotal += item.Price;
                    break;
                case "Other":
                    otherTotal += item.Price;
                    break;
                default:
                    unknownTotal += item.Price;
                    break;
            }
        }

        _logger.LogInformation("✅ Summary: H={Healthy:C}, J={Junk:C}, O={Other:C}, U={Unknown:C}",
            healthyTotal, junkTotal, otherTotal, unknownTotal);

        return new CategorySummary
        {
            HealthyTotal = healthyTotal,
            JunkTotal = junkTotal,
            OtherTotal = otherTotal,
            UnknownTotal = unknownTotal
        };
    }

    private async Task<string> CategorizeItemAsync(string itemDescription)
    {
        try
        {
            using var copilotClient = new CopilotClient();
            
            await using var session = await copilotClient.CreateSessionAsync(new SessionConfig
            {
                Model = "gpt-4.1",
                Streaming = false
            });

            var prompt = $@"Categorize this food/grocery item into ONE of these categories:

**Healthy**: Fresh produce, vegetables, fruits, whole grains, yogurt, kefir, salads, lean proteins, organic items, healthy beverages (water, tea)
**Junk**: Candy, chocolate, chips, cookies, soda, ice cream, highly processed snacks, sugary drinks
**Other**: Bread, pasta, rice, pizza dough, tortelloni, basic staples, bottle deposits (Pfand), neutral items

Item to categorize: ""{itemDescription}""

IMPORTANT: 
- Recognize the language automatically (English, German, Italian, etc.)
- Respond with ONLY the category name: Healthy, Junk, or Other
- No explanations, just the category word
- Examples:
  - ""Kefir 1,5%"" → Healthy
  - ""Krautsalat"" → Healthy
  - ""Pepsi Zero Zucker"" → Junk
  - ""Pr.Tortelloni Funghi"" → Other
  - ""Puccia Salentina"" → Other (it's Italian bread)
  - ""Pfand 0,25 A"" → Other (bottle deposit)

Category:";

            var response = await session.SendAndWaitAsync(new MessageOptions { Prompt = prompt });
            var category = response?.Data?.Content?.Trim() ?? "Unknown";

            // Validate response
            if (category == "Healthy" || category == "Junk" || category == "Other")
            {
                return category;
            }

            _logger.LogWarning("⚠️ Unexpected category response: {Response} for item: {Item}", 
                category, itemDescription);
            return "Unknown";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error categorizing item: {Item}", itemDescription);
            return "Unknown";
        }
    }
}
