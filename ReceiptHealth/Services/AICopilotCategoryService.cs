using GitHub.Copilot.SDK;
using Microsoft.Extensions.AI;
using ReceiptHealth.Models;
using ReceiptHealth.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace ReceiptHealth.Services;

/// <summary>
/// AI-powered category service using GitHub Copilot SDK for intelligent food categorization.
/// Automatically recognizes food items in any language and categorizes them by nutritional value.
/// </summary>
public class AICopilotCategoryService : ICategoryService
{
    private readonly ILogger<AICopilotCategoryService> _logger;
    private readonly ReceiptHealthContext _context;

    public AICopilotCategoryService(ILogger<AICopilotCategoryService> logger, ReceiptHealthContext context)
    {
        _logger = logger;
        _context = context;
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

            // Load all available categories from database
            var allCategories = await _context.Categories
                .Where(c => !c.IsSystemCategory || c.Name == "Healthy" || c.Name == "Junk" || c.Name == "Other")
                .OrderBy(c => c.IsSystemCategory ? 0 : 1)
                .Select(c => c.Name)
                .ToListAsync();

            var categoriesList = allCategories.Any() ? string.Join(", ", allCategories) : "Healthy, Junk, Other";
            
            // Build numbered list of items
            var itemsList = string.Join("\n", descriptions.Select((desc, i) => $"{i + 1}. {desc}"));

            var prompt = $@"Categorize ALL of these {descriptions.Count} items into ONE of these categories: {categoriesList}

**Category Guidelines:**
- **Healthy**: Fresh produce, vegetables, fruits, whole grains, yogurt, kefir, salads, lean proteins, organic items, healthy beverages
- **Junk**: Candy, chocolate, chips, cookies, soda, ice cream, highly processed snacks, sugary drinks
- **Clothing**: Apparel, shirts, pants, dresses, shoes, accessories, fashion items, pullovers, t-shirts
- **Other**: Bread, pasta, rice, pizza dough, basic staples, bottle deposits (Pfand), neutral items, household items

**Items to categorize:**
{itemsList}

IMPORTANT RULES:
1. Categorize EVERY SINGLE ITEM - all {descriptions.Count} items must have a category
2. Recognize language automatically (English, German, Italian, French, etc.)
3. Use ONLY these categories: {categoriesList}
4. For clothing items (shirts, pullovers, etc.), use ""Clothing"" if available, otherwise ""Other""
5. Return ONLY a JSON array with {descriptions.Count} entries
6. Format: [""Healthy"", ""Clothing"", ""Other"", ""Healthy"", ...]
7. Order must match the numbered list exactly
8. No explanations, no markdown, just the JSON array

Example response format:
[""Healthy"", ""Clothing"", ""Junk"", ""Other"", ""Healthy"", ""Other""]

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

            // Validate categories against database
            var validCategoryNames = await _context.Categories
                .Select(c => c.Name)
                .ToListAsync();
            
            // Map results
            for (int i = 0; i < descriptions.Count; i++)
            {
                var category = categories[i].Trim();
                
                // Try AI-powered matching to handle variations like "Clothing" → "Clothes"
                var validCategory = await FindBestCategoryMatchAsync(category, validCategoryNames);
                
                if (validCategory != null)
                {
                    if (!validCategory.Equals(category, StringComparison.OrdinalIgnoreCase))
                    {
                        _logger.LogInformation("🔄 AI matched '{AiCategory}' → '{DbCategory}'", category, validCategory);
                    }
                    category = validCategory; // Use exact DB casing
                }
                else
                {
                    _logger.LogWarning("⚠️ Invalid category '{Category}' for item: {Item}, defaulting to Other", category, descriptions[i]);
                    category = "Other";
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

            // Load all available categories from database (excluding Unknown)
            var allCategories = await _context.Categories
                .Where(c => c.Name != "Unknown")
                .OrderBy(c => c.IsSystemCategory ? 0 : 1)
                .ThenBy(c => c.Name)
                .Select(c => c.Name)
                .ToListAsync();

            // If we have custom categories, use them; otherwise fall back to system categories
            var categoriesList = allCategories.Any() ? string.Join(", ", allCategories) : "Healthy, Junk, Other";
            
            var prompt = $@"Categorize this item into ONE of these categories: {categoriesList}

**Category Guidelines:**
- **Healthy**: Fresh produce, vegetables, fruits, whole grains, yogurt, kefir, salads, lean proteins, organic items, healthy beverages
- **Junk**: Candy, chocolate, chips, cookies, soda, ice cream, highly processed snacks, sugary drinks
- **Clothing**: Apparel, shirts, pants, dresses, shoes, accessories, fashion items, pullovers, t-shirts
- **Other**: Bread, pasta, rice, pizza dough, basic staples, bottle deposits (Pfand), neutral items

Item to categorize: ""{itemDescription}""

IMPORTANT: 
- Recognize the language automatically (English, German, Italian, etc.)
- If the item is clothing/apparel and ""Clothing"" category exists, use it
- Respond with ONLY the category name from the list: {categoriesList}
- No explanations, just the category word
- Examples:
  - ""Kefir 1,5%"" → Healthy
  - ""D PULLOVER"" → Clothing (if available) or Other
  - ""T-SHIRT"" → Clothing (if available) or Other
  - ""Pepsi Zero Zucker"" → Junk
  - ""Pr.Tortelloni Funghi"" → Other

Category:";

            var response = await session.SendAndWaitAsync(new MessageOptions { Prompt = prompt });
            var category = response?.Data?.Content?.Trim() ?? "Unknown";

            // Validate response against available categories
            var validCategory = await _context.Categories
                .FirstOrDefaultAsync(c => c.Name.ToLower() == category.ToLower());
            
            if (validCategory != null)
            {
                return validCategory.Name;
            }

            // Fallback to system categories if exact match not found
            if (category.Equals("Healthy", StringComparison.OrdinalIgnoreCase) || 
                category.Equals("Junk", StringComparison.OrdinalIgnoreCase) || 
                category.Equals("Other", StringComparison.OrdinalIgnoreCase))
            {
                return char.ToUpper(category[0]) + category.Substring(1).ToLower();
            }

            _logger.LogWarning("⚠️ Unexpected category response: {Response} for item: {Item}", 
                category, itemDescription);
            return "Other";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error categorizing item: {Item}", itemDescription);
            return "Unknown";
        }
    }

    public async Task<int?> GetCategoryIdAsync(string categoryName)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Name.ToLower() == categoryName.ToLower());
        return category?.Id;
    }

    public async Task<CategoryResult> CategorizeItemWithIdAsync(string description, string? vendor = null)
    {
        var categoryName = await CategorizeItemAsync(description);
        var categoryId = await GetCategoryIdAsync(categoryName);
        
        return new CategoryResult
        {
            CategoryId = categoryId,
            CategoryName = categoryName
        };
    }

    public async Task<Dictionary<string, CategoryResult>> BatchCategorizeItemsWithIdAsync(List<string> descriptions)
    {
        // Get all categories from database once
        var categories = await _context.Categories
            .ToDictionaryAsync(c => c.Name.ToLower(), c => c.Id);
        
        // Batch categorize items
        var categoryNames = await BatchCategorizeItemsAsync(descriptions);
        
        var results = new Dictionary<string, CategoryResult>();
        foreach (var (desc, categoryName) in categoryNames)
        {
            var categoryId = categories.TryGetValue(categoryName.ToLower(), out var id) ? id : (int?)null;
            
            results[desc] = new CategoryResult
            {
                CategoryId = categoryId,
                CategoryName = categoryName
            };
        }
        
        return results;
    }

    /// <summary>
    /// Use AI to intelligently match category name to database categories (e.g., "Clothing" → "Clothes")
    /// </summary>
    private async Task<string?> FindBestCategoryMatchAsync(string aiCategory, List<string> validCategories)
    {
        aiCategory = aiCategory.Trim();
        
        // 1. Try exact match first (case-insensitive) - fast path
        var exactMatch = validCategories
            .FirstOrDefault(c => c.Equals(aiCategory, StringComparison.OrdinalIgnoreCase));
        if (exactMatch != null) return exactMatch;
        
        // 2. If no exact match, ask AI to find the best match
        try
        {
            using var copilotClient = new CopilotClient();
            
            await using var session = await copilotClient.CreateSessionAsync(new SessionConfig
            {
                Model = "gpt-4.1",
                Streaming = false
            });

            var categoriesList = string.Join(", ", validCategories);
            
            var prompt = $@"Find the best matching category from the available list for the given category name.

Available categories: {categoriesList}

Category to match: ""{aiCategory}""

RULES:
1. Return ONLY the category name from the available list that best matches semantically
2. Examples of semantic matches:
   - ""Clothing"" → ""Clothes""
   - ""Drinks"" → ""Beverages""
   - ""Healthy Food"" → ""Healthy""
   - ""Apparel"" → ""Clothes""
3. If no good semantic match exists, return ""NONE""
4. Return ONLY the category name, nothing else

Best match:";

            var response = await session.SendAndWaitAsync(new MessageOptions { Prompt = prompt });
            var match = response?.Data?.Content?.Trim() ?? "NONE";
            
            // Validate the response
            if (match != "NONE" && validCategories.Any(c => c.Equals(match, StringComparison.OrdinalIgnoreCase)))
            {
                _logger.LogInformation("🤖 AI matched '{AiCategory}' → '{DbCategory}'", aiCategory, match);
                return validCategories.First(c => c.Equals(match, StringComparison.OrdinalIgnoreCase));
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "⚠️ AI category matching failed for '{Category}', using fallback", aiCategory);
        }
        
        return null;
    }
}
