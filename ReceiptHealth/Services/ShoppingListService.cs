using Microsoft.EntityFrameworkCore;
using ReceiptHealth.Data;
using ReceiptHealth.Models;

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
    Task<List<PriceAlert>> GetPriceAlertsAsync(int listId);
}

public class ShoppingListService : IShoppingListService
{
    private readonly ReceiptHealthContext _context;
    private readonly ICategoryService _categoryService;

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
            if (await Task.WhenAny(categoryTask, Task.Delay(5000)) == categoryTask)
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
        Console.WriteLine($"🥗 Generating healthy shopping list from last {daysBack} days...");
        var cutoffDate = DateTime.Now.AddDays(-daysBack);
        
        // Find frequently purchased healthy items
        // Load into memory first to avoid SQLite decimal Average limitation
        var healthyLineItems = await _context.LineItems
            .Include(li => li.Receipt)
            .Where(li => li.Category == "Healthy" && li.Receipt.Date >= cutoffDate)
            .ToListAsync();
        
        Console.WriteLine($"📊 Found {healthyLineItems.Count} healthy line items");
        
        var healthyItems = healthyLineItems
            .GroupBy(li => li.Description)
            .Select(g => new
            {
                ItemName = g.Key,
                Frequency = g.Count(),
                AvgPrice = g.Average(li => (double)li.Price) // Convert to double for in-memory average
            })
            .OrderByDescending(x => x.Frequency)
            .Take(20)
            .ToList();

        Console.WriteLine($"✅ Grouped into {healthyItems.Count} unique items");

        var list = await CreateShoppingListAsync($"Healthy Items (Generated {DateTime.Now:yyyy-MM-dd})");

        foreach (var item in healthyItems)
        {
            await AddItemAsync(list.Id, item.ItemName, 1);
        }

        Console.WriteLine($"✅ Generated shopping list '{list.Name}' with {healthyItems.Count} items");
        return list;
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
