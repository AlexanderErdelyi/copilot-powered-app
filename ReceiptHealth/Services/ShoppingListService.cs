using Microsoft.EntityFrameworkCore;
using ReceiptHealth.Data;
using ReceiptHealth.Models;
using GitHub.Copilot.SDK;
using Microsoft.Extensions.AI;

namespace ReceiptHealth.Services;

public interface IShoppingListService
{
    Task<ShoppingList> CreateShoppingListAsync(string name);
    Task<ShoppingList> GetShoppingListAsync(int id);
    Task<List<ShoppingList>> GetAllShoppingListsAsync();
    Task<ShoppingListItem> AddItemAsync(int listId, string itemName, int quantity = 1);
    Task<bool> MarkItemPurchasedAsync(int itemId, bool isPurchased);
    Task<bool> RemoveItemAsync(int itemId);
    Task<bool> DeleteShoppingListAsync(int listId);
    Task<ShoppingList> GenerateFromHealthyItemsAsync(int daysBack = 30);
    Task<ShoppingList> GenerateWeeklyEssentialsAsync();
    Task<ShoppingList> GenerateQuickMealListAsync();
    Task<ShoppingList> GenerateFromTextAsync(string text);
    Task<List<PriceAlert>> GetPriceAlertsAsync(int listId);
    Task<ShoppingList> AddRecipeIngredientsAsync(int recipeId, int? shoppingListId = null);
}

public class ShoppingListService : IShoppingListService
{
    private readonly ReceiptHealthContext _context;
    private readonly ICategoryService _categoryService;
    private const int CATEGORIZATION_TIMEOUT_MS = 5000; // 5 seconds timeout for AI categorization

    public ShoppingListService(ReceiptHealthContext context, ICategoryService categoryService)
    {
        _context = context;
        _categoryService = categoryService;
    }

    public async Task<ShoppingList> CreateShoppingListAsync(string name)
    {
        var list = new ShoppingList
        {
            Name = name,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.ShoppingLists.Add(list);
        await _context.SaveChangesAsync();

        return list;
    }

    public async Task<ShoppingList> GetShoppingListAsync(int id)
    {
        var list = await _context.ShoppingLists
            .Include(sl => sl.Items)
            .FirstOrDefaultAsync(sl => sl.Id == id);

        return list ?? throw new InvalidOperationException($"Shopping list {id} not found");
    }

    public async Task<List<ShoppingList>> GetAllShoppingListsAsync()
    {
        return await _context.ShoppingLists
            .Include(sl => sl.Items)
            .OrderByDescending(sl => sl.CreatedAt)
            .ToListAsync();
    }

    public async Task<ShoppingListItem> AddItemAsync(int listId, string itemName, int quantity = 1)
    {
        Console.WriteLine($"📝 Adding item '{itemName}' (qty: {quantity}) to list {listId}");
        
        var list = await _context.ShoppingLists.FindAsync(listId);
        if (list == null)
        {
            Console.WriteLine($"❌ Shopping list {listId} not found");
            throw new InvalidOperationException($"Shopping list {listId} not found");
        }

        // Get category for the item (with fallback to Unknown)
        // Use Task.Run with timeout to avoid deadlocks with synchronous category service calls
        string category = "Unknown";
        try
        {
            var categoryTask = Task.Run(() => _categoryService.CategorizeItem(itemName));
            if (await Task.WhenAny(categoryTask, Task.Delay(CATEGORIZATION_TIMEOUT_MS)) == categoryTask)
            {
                category = await categoryTask;
                Console.WriteLine($"✅ Categorized '{itemName}' as '{category}'");
            }
            else
            {
                Console.WriteLine($"⚠️ Categorization timed out for '{itemName}', using 'Unknown'");
                category = "Unknown";
            }
        }
        catch (Exception ex)
        {
            // If categorization fails, default to Unknown
            Console.WriteLine($"⚠️ Categorization failed for '{itemName}': {ex.Message}");
            category = "Unknown";
        }
        
        // Get last known price
        var normalizedName = NormalizeItemName(itemName);
        var lastPrice = await _context.PriceComparisons
            .Where(pc => pc.NormalizedName == normalizedName)
            .OrderByDescending(pc => pc.Date)
            .FirstOrDefaultAsync();

        var item = new ShoppingListItem
        {
            ShoppingListId = listId,
            ItemName = itemName,
            NormalizedName = normalizedName,
            Quantity = quantity,
            AddedAt = DateTime.UtcNow,
            Category = category,
            LastKnownPrice = lastPrice?.Price,
            LastKnownVendor = lastPrice?.Vendor
        };

        _context.ShoppingListItems.Add(item);
        list.LastModifiedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        
        Console.WriteLine($"✅ Added item {item.Id}: '{itemName}' to list {listId}");

        return item;
    }

    public async Task<bool> MarkItemPurchasedAsync(int itemId, bool isPurchased)
    {
        var item = await _context.ShoppingListItems.FindAsync(itemId);
        if (item == null)
        {
            return false;
        }

        item.IsPurchased = isPurchased;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveItemAsync(int itemId)
    {
        var item = await _context.ShoppingListItems.FindAsync(itemId);
        if (item == null)
        {
            return false;
        }

        _context.ShoppingListItems.Remove(item);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteShoppingListAsync(int listId)
    {
        var list = await _context.ShoppingLists
            .Include(sl => sl.Items)
            .FirstOrDefaultAsync(sl => sl.Id == listId);
        
        if (list == null)
        {
            return false;
        }

        // Remove all items first
        _context.ShoppingListItems.RemoveRange(list.Items);
        
        // Remove the list
        _context.ShoppingLists.Remove(list);
        await _context.SaveChangesAsync();
        
        return true;
    }

    public async Task<ShoppingList> GenerateFromHealthyItemsAsync(int daysBack = 30)
    {
        Console.WriteLine($"🥗 AI-powered healthy shopping list generation from last {daysBack} days...");
        var cutoffDate = DateTime.Now.AddDays(-daysBack);
        
        // Find frequently purchased healthy items
        var healthyLineItems = await _context.LineItems
            .Include(li => li.Receipt)
            .Where(li => li.Category == "Healthy" && li.Receipt.Date >= cutoffDate)
            .ToListAsync();
        
        Console.WriteLine($"📊 Found {healthyLineItems.Count} healthy line items");
        
        if (healthyLineItems.Count == 0)
        {
            Console.WriteLine("⚠️ No healthy items found in history, using AI to generate healthy essentials...");
            return await GenerateAIHealthyEssentials();
        }
        
        var healthyItems = healthyLineItems
            .GroupBy(li => li.Description)
            .Select(g => new
            {
                ItemName = g.Key,
                Frequency = g.Count(),
                AvgPrice = g.Average(li => (double)li.Price)
            })
            .OrderByDescending(x => x.Frequency)
            .Take(20)
            .ToList();

        Console.WriteLine($"✅ Grouped into {healthyItems.Count} unique items");

        // Use AI to enhance the list with smart quantities
        var itemsText = string.Join(", ", healthyItems.Select(i => i.ItemName));
        Console.WriteLine($"🧠 Using AI to optimize quantities for: {itemsText}");
        
        try
        {
            var optimizedItems = await ParseShoppingListWithAI($"Create a healthy shopping list with these items from my purchase history: {itemsText}. Suggest appropriate quantities for a weekly shop.");
            
            var list = await CreateShoppingListAsync($"AI Healthy List ({DateTime.Now:yyyy-MM-dd HH:mm})");
            
            foreach (var item in optimizedItems)
            {
                await AddItemAsync(list.Id, item.Name, item.Quantity);
            }
            
            Console.WriteLine($"✅ Generated AI-enhanced healthy list with {optimizedItems.Count} items");
            return list;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ AI enhancement failed: {ex.Message}, using basic quantities");
            
            var list = await CreateShoppingListAsync($"Healthy Items ({DateTime.Now:yyyy-MM-dd})");
            foreach (var item in healthyItems)
            {
                await AddItemAsync(list.Id, item.ItemName, 1);
            }
            
            return list;
        }
    }

    private async Task<ShoppingList> GenerateAIHealthyEssentials()
    {
        Console.WriteLine("🤖 Generating AI-powered healthy essentials list...");
        
        var healthyItems = await ParseShoppingListWithAI(@"Create a healthy grocery shopping list with essential nutritious items for a week. 
Include: fresh vegetables, fruits, lean proteins, whole grains, and healthy fats. 
Suggest appropriate quantities (e.g., 2-3 for fruits, 1 for proteins like chicken).");
        
        var list = await CreateShoppingListAsync($"AI Healthy Essentials ({DateTime.Now:yyyy-MM-dd HH:mm})");
        
        foreach (var item in healthyItems)
        {
            await AddItemAsync(list.Id, item.Name, item.Quantity);
        }
        
        Console.WriteLine($"✅ Generated AI healthy essentials with {healthyItems.Count} items");
        return list;
    }

    public async Task<ShoppingList> GenerateWeeklyEssentialsAsync()
    {
        Console.WriteLine("🛒 Generating weekly essentials shopping list...");
        
        var weeklyItems = new Dictionary<string, int>
        {
            // Dairy
            { "Milk", 2 },
            { "Eggs", 12 },
            { "Butter", 1 },
            { "Yogurt", 4 },
            { "Cheese", 1 },
            // Bread & Grains
            { "Bread", 2 },
            { "Rice", 1 },
            { "Pasta", 1 },
            { "Cereal", 1 },
            // Fruits
            { "Banana", 6 },
            { "Apple", 6 },
            { "Orange", 4 },
            // Vegetables
            { "Tomato", 4 },
            { "Lettuce", 1 },
            { "Carrot", 1 },
            { "Onion", 2 },
            { "Potato", 1 },
            // Protein
            { "Chicken", 1 },
            { "Ground Beef", 1 },
            // Pantry
            { "Salt", 1 },
            { "Pepper", 1 },
            { "Oil", 1 },
            { "Sugar", 1 },
        };

        var list = await CreateShoppingListAsync($"Weekly Essentials (Generated {DateTime.Now:yyyy-MM-dd})");

        foreach (var item in weeklyItems)
        {
            await AddItemAsync(list.Id, item.Key, item.Value);
        }

        Console.WriteLine($"✅ Generated weekly essentials list with {weeklyItems.Count} items");
        return list;
    }

    public async Task<ShoppingList> GenerateQuickMealListAsync()
    {
        Console.WriteLine("⚡ Generating quick meal shopping list...");
        
        var quickMealItems = new List<(string Name, int Quantity)>
        {
            ("Pasta", 2),
            ("Pasta Sauce", 2),
            ("Frozen Pizza", 2),
            ("Instant Noodles", 4),
            ("Canned Soup", 3),
            ("Eggs", 12),
            ("Bread", 1),
            ("Cheese", 1),
            ("Deli Meat", 1),
            ("Peanut Butter", 1),
            ("Jam", 1),
            ("Frozen Vegetables", 2),
            ("Rice", 1),
            ("Canned Beans", 2),
            ("Tortillas", 1),
            ("Salsa", 1),
            ("Ground Beef", 1),
            ("Chicken Breast", 1),
            ("Butter", 1),
            ("Milk", 1),
        };

        var list = await CreateShoppingListAsync($"Quick Meals (Generated {DateTime.Now:yyyy-MM-dd})");

        foreach (var item in quickMealItems)
        {
            await AddItemAsync(list.Id, item.Name, item.Quantity);
        }

        Console.WriteLine($"✅ Generated quick meal list with {quickMealItems.Count} items");
        return list;
    }

    public async Task<ShoppingList> GenerateFromTextAsync(string text)
    {
        Console.WriteLine($"🤖 AI-powered shopping list generation from text: {text}");
        
        try
        {
            // First, extract the list name from the user's request
            var listName = await ExtractListNameFromTextAsync(text);
            Console.WriteLine($"📝 Extracted list name: {listName}");
            
            var parsedItems = await ParseShoppingListWithAI(text);
            
            if (parsedItems.Count == 0)
            {
                throw new InvalidOperationException("No items could be parsed from the text");
            }

            var list = await CreateShoppingListAsync(listName);

            foreach (var item in parsedItems)
            {
                Console.WriteLine($"➕ Adding: {item.Name} x{item.Quantity}");
                await AddItemAsync(list.Id, item.Name, item.Quantity);
            }

            Console.WriteLine($"✅ Generated AI-powered list '{listName}' with {parsedItems.Count} items");
            return list;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ AI parsing failed: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            throw;
        }
    }

    private async Task<string> ExtractListNameFromTextAsync(string text)
    {
        Console.WriteLine("🧠 Extracting list name from user request...");
        
        using var copilotClient = new CopilotClient();
        await using var session = await copilotClient.CreateSessionAsync(new SessionConfig
        {
            Model = "gpt-4.1",
            Streaming = false
        });

        var prompt = $@"Extract the shopping list name from this user request. If they specify a name, use it. Otherwise, generate a descriptive name.

User request: ""{text}""

Examples:
- ""Create a Shopping list with name: Alex"" → Alex
- ""make me a grocery list called Weekend Shopping"" → Weekend Shopping  
- ""shopping list for party"" → Party Shopping List
- ""create list with items I bought"" → My Shopping List ({DateTime.Now:yyyy-MM-dd})
- ""what I bought in february"" → February Purchases ({DateTime.Now:yyyy-MM-dd})

Return ONLY the list name, nothing else. Maximum 50 characters.";

        var response = await session.SendAndWaitAsync(new MessageOptions { Prompt = prompt });
        var listName = response?.Data?.Content?.Trim() ?? $"AI Custom List ({DateTime.Now:yyyy-MM-dd HH:mm})";
        
        // Sanitize and limit length
        listName = listName.Replace("\"", "").Replace("'", "").Trim();
        if (listName.Length > 50)
        {
            listName = listName.Substring(0, 50);
        }
        
        return listName;
    }

    private async Task<List<(string Name, int Quantity)>> ParseShoppingListWithAI(string userInput)
    {
        Console.WriteLine("🧠 Using GitHub Copilot AI to parse shopping list...");
        
        // Check if user is asking about historical purchases
        var historicalKeywords = new[] { "bought", "purchased", "last week", "first week", "february", "january", 
            "last month", "history", "before", "previous", "usual", "normally", "rewe", "lidl", "aldi" };
        var isHistoricalQuery = historicalKeywords.Any(keyword => 
            userInput.ToLowerInvariant().Contains(keyword));

        string receiptContext = "";
        if (isHistoricalQuery)
        {
            Console.WriteLine("📊 Historical query detected - fetching receipt data...");
            receiptContext = await GetReceiptContextForAI(userInput);
        }
        
        using var copilotClient = new CopilotClient();
        
        await using var session = await copilotClient.CreateSessionAsync(new SessionConfig
        {
            Model = "gpt-4.1",
            Streaming = false
        });

        var prompt = $@"You are a smart shopping list assistant with access to the user's purchase history.

{(string.IsNullOrEmpty(receiptContext) ? "" : $@"RECEIPT DATABASE CONTEXT:
{receiptContext}

")}User request: ""{userInput}""

{(string.IsNullOrEmpty(receiptContext) ? @"Parse the user's natural language input into a structured shopping list.

CONTEXT UNDERSTANDING:
- ""some apples"" = 3-4 apples (multiple)
- ""a few bananas"" = 2-3 bananas  
- ""milk"" = 1 milk
- ""2 apples"" = exactly 2 apples
- ""ingredients for pasta"" = suggest common pasta ingredients" : @"ANALYZE THE RECEIPT DATA ABOVE and create a shopping list based EXACTLY on what the user is asking for.

CRITICAL: Pay attention to filtering keywords in the user's request:
- ""most expensive item"" / ""priciest"" → Return ONLY the single highest-priced item FROM THE DETAILED RECEIPT ITEMS LIST ABOVE
- ""cheapest item"" / ""least expensive"" → Return ONLY the single lowest-priced item
- ""only X"" / ""just X"" / ""add X to list"" → Return ONLY that specific item
- ""top 3 items"" / ""3 most expensive"" → Return only the top 3 by price
- ""all items"" / ""everything"" / ""what I bought"" → Return all items from that receipt/timeframe

IMPORTANT: Use the EXACT item names from the 'Detailed Receipt Items' section above.
Look at the prices shown (€X.XX) and select accordingly.
For 'most expensive from Lidl', find the Lidl receipt and return the item with the HIGHEST price.")}

Return ONLY a valid JSON array with this exact format (lowercase property names, no markdown, no code blocks, just raw JSON):
[
  {{""name"": ""XXL Hähn.-Schnitzel"", ""quantity"": 1}},
  {{""name"": ""Brötchen"", ""quantity"": 6}}
]

CRITICAL RULES:
1. FOLLOW THE USER'S FILTERING REQUEST EXACTLY ('most expensive' = 1 item, not all items!)
2. Use the EXACT item names from the 'Detailed Receipt Items' section (copy them character-for-character)
3. Property names must be lowercase: ""name"" and ""quantity""
4. If no specific filter is mentioned, include 8-15 commonly purchased items
5. Return ONLY the JSON array, nothing else - NO explanatory text, NO markdown formatting";

        var response = await session.SendAndWaitAsync(new MessageOptions { Prompt = prompt });
        
        var aiResponse = response?.Data?.Content?.Trim() ?? string.Empty;
        Console.WriteLine($"🤖 AI Response (raw): {aiResponse}");
        
        if (string.IsNullOrEmpty(aiResponse))
        {
            throw new InvalidOperationException("AI returned empty response");
        }
        
        // Clean up potential markdown formatting
        aiResponse = aiResponse.Replace("```json", "").Replace("```", "").Trim();
        Console.WriteLine($"🤖 AI Response (cleaned): {aiResponse}");
        
        // Parse JSON response with case-insensitive property matching
        List<ShoppingItemDTO>? items = null;
        try
        {
            var jsonOptions = new System.Text.Json.JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
            items = System.Text.Json.JsonSerializer.Deserialize<List<ShoppingItemDTO>>(aiResponse, jsonOptions);
        }
        catch (System.Text.Json.JsonException ex)
        {
            Console.WriteLine($"❌ JSON parsing error: {ex.Message}");
            Console.WriteLine($"Failed to parse: {aiResponse}");
            throw new InvalidOperationException($"Failed to parse AI response as JSON: {ex.Message}");
        }
        
        if (items == null || items.Count == 0)
        {
            Console.WriteLine("❌ AI returned no items or null");
            throw new InvalidOperationException("AI returned no items");
        }

        var result = items.Select(i => (Name: i.Name ?? "Item", Quantity: i.Quantity)).ToList();
        
        Console.WriteLine($"✅ AI parsed {result.Count} items:");
        foreach (var item in result)
        {
            Console.WriteLine($"  📌 {item.Name} x{item.Quantity}");
        }
        
        return result;
    }

    private async Task<string> GetReceiptContextForAI(string userQuery)
    {
        // Parse date range from user query
        var (startDate, endDate) = ParseDateRangeFromQuery(userQuery);
        
        // Check if user is asking about a specific store
        var storeName = ExtractStoreNameFromQuery(userQuery);
        
        Console.WriteLine($"📅 Querying receipts from {startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}");
        if (!string.IsNullOrEmpty(storeName))
        {
            Console.WriteLine($"🏪 Filtering for store: {storeName}");
        }
        
        // Fetch receipts from database
        var receiptsQuery = _context.Receipts
            .Include(r => r.LineItems)
            .Where(r => r.Date >= startDate && r.Date <= endDate);
        
        // Filter by store if specified
        if (!string.IsNullOrEmpty(storeName))
        {
            receiptsQuery = receiptsQuery.Where(r => r.Vendor.Contains(storeName));
        }
        
        var receipts = await receiptsQuery
            .OrderByDescending(r => r.Date)
            .ToListAsync();
        
        if (receipts.Count == 0)
        {
            return $"No receipts found between {startDate:yyyy-MM-dd} and {endDate:yyyy-MM-dd}" + 
                   (string.IsNullOrEmpty(storeName) ? "" : $" for store {storeName}");
        }
        
        Console.WriteLine($"📊 Found {receipts.Count} receipts with {receipts.Sum(r => r.LineItems.Count)} items");
        
        // Build context string for AI
        var context = new System.Text.StringBuilder();
        context.AppendLine($"Receipt data from {startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}" + 
                          (string.IsNullOrEmpty(storeName) ? ":" : $" for {storeName}:"));
        context.AppendLine($"Total receipts: {receipts.Count}");
        context.AppendLine();
        
        // Show detailed items from each receipt (especially for "most expensive" queries)
        context.AppendLine("Detailed Receipt Items:");
        foreach (var receipt in receipts.Take(5)) // Show last 5 receipts in detail
        {
            context.AppendLine($"\n📄 Receipt from {receipt.Vendor} on {receipt.Date:yyyy-MM-dd} (Total: €{receipt.Total:F2}):");
            var sortedItems = receipt.LineItems.OrderByDescending(li => li.Price).ToList();
            foreach (var item in sortedItems)
            {
                context.AppendLine($"   • {item.Description} - €{item.Price:F2} (qty: {item.Quantity}, category: {item.Category})");
            }
        }
        
        // Group items by name and count frequency
        var itemFrequency = receipts
            .SelectMany(r => r.LineItems)
            .GroupBy(li => li.Description)
            .Select(g => new
            {
                ItemName = g.Key,
                Count = g.Count(),
                TotalQuantity = g.Sum(li => li.Quantity),
                AvgPrice = g.Average(li => (double)li.Price),
                Category = g.First().Category
            })
            .OrderByDescending(x => x.Count)
            .Take(30) // Top 30 items
            .ToList();
        
        context.AppendLine("Most frequently purchased items:");
        foreach (var item in itemFrequency)
        {
            context.AppendLine($"- {item.ItemName}: purchased {item.Count}x (total qty: {item.TotalQuantity}, avg €{item.AvgPrice:F2}, category: {item.Category})");
        }
        
        context.AppendLine();
        context.AppendLine("Receipts summary:");
        foreach (var receipt in receipts.Take(10)) // Show last 10 receipts
        {
            context.AppendLine($"- {receipt.Date:yyyy-MM-dd} at {receipt.Vendor}: €{receipt.Total:F2} ({receipt.LineItems.Count} items)");
        }
        
        return context.ToString();
    }

    private (DateTime StartDate, DateTime EndDate) ParseDateRangeFromQuery(string query)
    {
        var queryLower = query.ToLowerInvariant();
        var now = DateTime.Now;
        
        // February first week pattern
        if (queryLower.Contains("february") && (queryLower.Contains("first week") || queryLower.Contains("1st week")))
        {
            var year = now.Year;
            if (now.Month < 2) year--; // If we're in January, use last year's February
            
            return (new DateTime(year, 2, 1), new DateTime(year, 2, 7));
        }
        
        // February patterns
        if (queryLower.Contains("february") || queryLower.Contains("feb"))
        {
            var year = now.Year;
            if (now.Month < 2) year--; 
            
            return (new DateTime(year, 2, 1), new DateTime(year, 2, DateTime.DaysInMonth(year, 2)));
        }
        
        // Last week
        if (queryLower.Contains("last week"))
        {
            var lastWeekStart = now.AddDays(-7 - (int)now.DayOfWeek);
            return (lastWeekStart, lastWeekStart.AddDays(7));
        }
        
        // Last month
        if (queryLower.Contains("last month"))
        {
            var lastMonth = now.AddMonths(-1);
            var start = new DateTime(lastMonth.Year, lastMonth.Month, 1);
            var end = new DateTime(lastMonth.Year, lastMonth.Month, DateTime.DaysInMonth(lastMonth.Year, lastMonth.Month));
            return (start, end);
        }
        
        // This week
        if (queryLower.Contains("this week"))
        {
            var weekStart = now.AddDays(-(int)now.DayOfWeek);
            return (weekStart, now);
        }
        
        // Default: last 30 days
        return (now.AddDays(-30), now);
    }

    private string ExtractStoreNameFromQuery(string query)
    {
        var queryLower = query.ToLowerInvariant();
        
        // Common store names
        var stores = new[] { "lidl", "aldi", "rewe", "edeka", "penny", "netto", "kaufland", "dm" };
        
        foreach (var store in stores)
        {
            if (queryLower.Contains(store))
            {
                // Return capitalized store name
                return char.ToUpper(store[0]) + store.Substring(1);
            }
        }
        
        return string.Empty;
    }

    // DTO for AI JSON response
    private class ShoppingItemDTO
    {
        public string Name { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
    }

    public async Task<List<PriceAlert>> GetPriceAlertsAsync(int listId)
    {
        var list = await _context.ShoppingLists
            .Include(sl => sl.Items)
            .FirstOrDefaultAsync(sl => sl.Id == listId);

        if (list == null)
        {
            return new List<PriceAlert>();
        }

        var alerts = new List<PriceAlert>();

        foreach (var item in list.Items.Where(i => !i.IsPurchased))
        {
            // Find current prices for this item
            var currentPrices = await _context.PriceComparisons
                .Where(pc => pc.NormalizedName == item.NormalizedName)
                .OrderByDescending(pc => pc.Date)
                .Take(5)
                .ToListAsync();

            if (currentPrices.Any() && item.LastKnownPrice.HasValue)
            {
                var lowestPrice = currentPrices.Min(pc => pc.Price);
                var lowestVendor = currentPrices.First(pc => pc.Price == lowestPrice);

                if (lowestPrice < item.LastKnownPrice.Value * 0.9m) // 10% cheaper
                {
                    alerts.Add(new PriceAlert
                    {
                        ItemName = item.ItemName,
                        CurrentPrice = lowestPrice,
                        PreviousPrice = item.LastKnownPrice.Value,
                        Vendor = lowestVendor.Vendor,
                        SavingsAmount = item.LastKnownPrice.Value - lowestPrice,
                        SavingsPercent = ((item.LastKnownPrice.Value - lowestPrice) / item.LastKnownPrice.Value) * 100
                    });
                }
            }
        }

        return alerts;
    }

    private string NormalizeItemName(string itemName)
    {
        var normalized = itemName.ToLowerInvariant().Trim();
        var wordsToRemove = new[] { "kg", "g", "ml", "l", "pack", "bottle", "can", "organic", "bio" };
        foreach (var word in wordsToRemove)
        {
            normalized = normalized.Replace(word, " ");
        }
        return string.Join(" ", normalized.Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }

    public async Task<ShoppingList> AddRecipeIngredientsAsync(int recipeId, int? shoppingListId = null)
    {
        Console.WriteLine($"📝 Adding ingredients from recipe {recipeId} to shopping list {shoppingListId?.ToString() ?? "(new)"}");

        // Get the recipe with ingredients
        var recipe = await _context.Recipes
            .Include(r => r.Ingredients)
            .FirstOrDefaultAsync(r => r.Id == recipeId);

        if (recipe == null)
        {
            throw new InvalidOperationException($"Recipe {recipeId} not found");
        }

        // Get or create shopping list
        ShoppingList shoppingList;
        if (shoppingListId.HasValue)
        {
            shoppingList = await GetShoppingListAsync(shoppingListId.Value);
        }
        else
        {
            // Create a new shopping list or get the most recent active one
            var recentList = await _context.ShoppingLists
                .Where(sl => sl.IsActive)
                .OrderByDescending(sl => sl.CreatedAt)
                .FirstOrDefaultAsync();

            if (recentList != null)
            {
                shoppingList = await GetShoppingListAsync(recentList.Id);
            }
            else
            {
                shoppingList = await CreateShoppingListAsync($"Shopping List - {DateTime.Now:MMM dd}");
            }
        }

        // Add ingredients to shopping list
        var addedCount = 0;
        foreach (var ingredient in recipe.Ingredients)
        {
            try
            {
                await AddItemAsync(shoppingList.Id, ingredient.IngredientName, 1);
                addedCount++;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Failed to add ingredient '{ingredient.IngredientName}': {ex.Message}");
            }
        }

        Console.WriteLine($"✅ Added {addedCount} ingredients from recipe '{recipe.Name}' to shopping list '{shoppingList.Name}'");

        // Reload shopping list with items
        return await GetShoppingListAsync(shoppingList.Id);
    }
}

public class PriceAlert
{
    public string ItemName { get; set; } = string.Empty;
    public decimal CurrentPrice { get; set; }
    public decimal PreviousPrice { get; set; }
    public string Vendor { get; set; } = string.Empty;
    public decimal SavingsAmount { get; set; }
    public decimal SavingsPercent { get; set; }
}
