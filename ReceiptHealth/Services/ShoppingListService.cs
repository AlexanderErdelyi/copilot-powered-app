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
        var list = await _context.ShoppingLists.FindAsync(listId);
        if (list == null)
        {
            throw new InvalidOperationException($"Shopping list {listId} not found");
        }

        // Get category for the item
        var category = _categoryService.CategorizeItem(itemName);
        
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

    public async Task<ShoppingList> GenerateFromHealthyItemsAsync(int daysBack = 30)
    {
        var cutoffDate = DateTime.Now.AddDays(-daysBack);
        
        // Find frequently purchased healthy items
        var healthyItems = await _context.LineItems
            .Include(li => li.Receipt)
            .Where(li => li.Category == "Healthy" && li.Receipt.Date >= cutoffDate)
            .GroupBy(li => li.Description)
            .Select(g => new
            {
                ItemName = g.Key,
                Frequency = g.Count(),
                AvgPrice = g.Average(li => li.Price)
            })
            .OrderByDescending(x => x.Frequency)
            .Take(20)
            .ToListAsync();

        var list = await CreateShoppingListAsync($"Healthy Items (Generated {DateTime.Now:yyyy-MM-dd})");

        foreach (var item in healthyItems)
        {
            await AddItemAsync(list.Id, item.ItemName, 1);
        }

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
