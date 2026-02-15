using ReceiptHealth.Models;
using ReceiptHealth.Data;
using Microsoft.EntityFrameworkCore;

namespace ReceiptHealth.Services;

public interface ICategoryService
{
    string CategorizeItem(string description, string? vendor = null);
    Task<Dictionary<string, string>> BatchCategorizeItemsAsync(List<string> descriptions);
    CategorySummary ComputeCategorySummary(List<LineItem> lineItems);
    CategorySummary ComputeCategorySummaryFromCategorizedItems(List<LineItem> lineItems);
    
    // New methods that work with CategoryId
    Task<int?> GetCategoryIdAsync(string categoryName);
    Task<CategoryResult> CategorizeItemWithIdAsync(string description, string? vendor = null);
    Task<Dictionary<string, CategoryResult>> BatchCategorizeItemsWithIdAsync(List<string> descriptions);
}

public class CategoryResult
{
    public int? CategoryId { get; set; }
    public string CategoryName { get; set; } = "Unknown";
}

public class RuleBasedCategoryService : ICategoryService
{
    private readonly ILogger<RuleBasedCategoryService> _logger;
    private readonly ReceiptHealthContext _context;
    
    // TODO(Copilot): Make this configurable via appsettings.json
    private readonly Dictionary<string, string> _keywordCategories = new(StringComparer.OrdinalIgnoreCase)
    {
        // Healthy - English
        ["salad"] = "Healthy",
        ["vegetables"] = "Healthy",
        ["fruits"] = "Healthy",
        ["fruit"] = "Healthy",
        ["oats"] = "Healthy",
        ["yogurt"] = "Healthy",
        ["banana"] = "Healthy",
        ["apple"] = "Healthy",
        ["orange"] = "Healthy",
        ["spinach"] = "Healthy",
        ["broccoli"] = "Healthy",
        ["organic"] = "Healthy",
        
        // Healthy - German
        ["salat"] = "Healthy",
        ["kraut"] = "Healthy",
        ["gemüse"] = "Healthy",
        ["obst"] = "Healthy",
        ["joghurt"] = "Healthy",
        ["kefir"] = "Healthy",
        ["bio"] = "Healthy",
        ["vollkorn"] = "Healthy",
        
        // Junk - English
        ["chips"] = "Junk",
        ["soda"] = "Junk",
        ["candy"] = "Junk",
        ["chocolate"] = "Junk",
        ["cookie"] = "Junk",
        ["cake"] = "Junk",
        ["donut"] = "Junk",
        ["ice cream"] = "Junk",
        ["cola"] = "Junk",
        ["pepsi"] = "Junk",
        
        // Junk - German
        ["schokolade"] = "Junk",
        ["kuchen"] = "Junk",
        ["kekse"] = "Junk",
        ["süßigkeiten"] = "Junk",
        
        // Other - English
        ["water"] = "Other",
        ["milk"] = "Other",
        ["bread"] = "Other",
        ["rice"] = "Other",
        ["pasta"] = "Other",
        ["tortelloni"] = "Other",
        ["pizza"] = "Other",
        ["dough"] = "Other",
        
        // Other - German  
        ["wasser"] = "Other",
        ["milch"] = "Other",
        ["brot"] = "Other",
        ["reis"] = "Other",
        ["nudeln"] = "Other",
        ["pfand"] = "Other",
        ["flamm"] = "Other",
        ["teig"] = "Other"
    };

    public RuleBasedCategoryService(ILogger<RuleBasedCategoryService> logger, ReceiptHealthContext context)
    {
        _logger = logger;
        _context = context;
    }

    public async Task<int?> GetCategoryIdAsync(string categoryName)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Name.ToLower() == categoryName.ToLower());
        return category?.Id;
    }

    public async Task<CategoryResult> CategorizeItemWithIdAsync(string description, string? vendor = null)
    {
        var categoryName = CategorizeItem(description, vendor);
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
        
        var results = new Dictionary<string, CategoryResult>();
        foreach (var desc in descriptions)
        {
            var categoryName = CategorizeItem(desc);
            var categoryId = categories.TryGetValue(categoryName.ToLower(), out var id) ? id : (int?)null;
            
            results[desc] = new CategoryResult
            {
                CategoryId = categoryId,
                CategoryName = categoryName
            };
        }
        
        return results;
    }

    public string CategorizeItem(string description, string? vendor = null)
    {
        var lowerDesc = description.ToLowerInvariant();
        
        // Check each keyword
        foreach (var (keyword, category) in _keywordCategories)
        {
            if (lowerDesc.Contains(keyword.ToLowerInvariant()))
            {
                _logger.LogDebug("Item '{Description}' matched keyword '{Keyword}' -> {Category}", 
                    description, keyword, category);
                return category;
            }
        }
        
        // TODO(Copilot): Add vendor-level bias logic
        // e.g., if vendor contains "organic" or "wholesome", slightly favor Healthy category
        
        _logger.LogDebug("Item '{Description}' -> Unknown (no keyword match)", description);
        return "Unknown";
    }

    public Task<Dictionary<string, string>> BatchCategorizeItemsAsync(List<string> descriptions)
    {
        // Rule-based is fast, so just categorize each item individually
        var results = new Dictionary<string, string>();
        foreach (var desc in descriptions)
        {
            results[desc] = CategorizeItem(desc);
        }
        return Task.FromResult(results);
    }

    public CategorySummary ComputeCategorySummaryFromCategorizedItems(List<LineItem> lineItems)
    {
        // Use already-set categories from lineItems
        var summary = new CategorySummary();
        
        foreach (var item in lineItems)
        {
            var totalPrice = item.Price * item.Quantity;
            var category = item.Category ?? "Unknown";
            
            switch (category)
            {
                case "Healthy":
                    summary.HealthyTotal += totalPrice;
                    summary.HealthyCount++;
                    break;
                case "Junk":
                    summary.JunkTotal += totalPrice;
                    summary.JunkCount++;
                    break;
                case "Other":
                    summary.OtherTotal += totalPrice;
                    summary.OtherCount++;
                    break;
                default:
                    summary.UnknownTotal += totalPrice;
                    summary.UnknownCount++;
                    break;
            }
        }
        
        return summary;
    }

    public CategorySummary ComputeCategorySummary(List<LineItem> lineItems)
    {
        var summary = new CategorySummary();
        
        foreach (var item in lineItems)
        {
            var totalPrice = item.Price * item.Quantity;
            
            switch (item.Category)
            {
                case "Healthy":
                    summary.HealthyTotal += totalPrice;
                    summary.HealthyCount++;
                    break;
                case "Junk":
                    summary.JunkTotal += totalPrice;
                    summary.JunkCount++;
                    break;
                case "Other":
                    summary.OtherTotal += totalPrice;
                    summary.OtherCount++;
                    break;
                default:
                    summary.UnknownTotal += totalPrice;
                    summary.UnknownCount++;
                    break;
            }
        }
        
        _logger.LogInformation("Category Summary: Healthy={HealthyTotal:C}, Junk={JunkTotal:C}, Other={OtherTotal:C}, Unknown={UnknownTotal:C}",
            summary.HealthyTotal, summary.JunkTotal, summary.OtherTotal, summary.UnknownTotal);
        
        return summary;
    }
}
