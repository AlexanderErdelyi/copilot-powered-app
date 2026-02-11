using ReceiptHealth.Models;

namespace ReceiptHealth.Services;

public interface ICategoryService
{
    string CategorizeItem(string description, string? vendor = null);
    CategorySummary ComputeCategorySummary(List<LineItem> lineItems);
}

public class RuleBasedCategoryService : ICategoryService
{
    private readonly ILogger<RuleBasedCategoryService> _logger;
    
    // TODO(Copilot): Make this configurable via appsettings.json
    private readonly Dictionary<string, string> _keywordCategories = new(StringComparer.OrdinalIgnoreCase)
    {
        // Healthy
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
        
        // Junk
        ["chips"] = "Junk",
        ["soda"] = "Junk",
        ["candy"] = "Junk",
        ["chocolate"] = "Junk",
        ["cookie"] = "Junk",
        ["cake"] = "Junk",
        ["donut"] = "Junk",
        ["ice cream"] = "Junk",
        
        // Other
        ["water"] = "Other",
        ["milk"] = "Other",
        ["bread"] = "Other",
        ["rice"] = "Other",
        ["pasta"] = "Other"
    };

    public RuleBasedCategoryService(ILogger<RuleBasedCategoryService> logger)
    {
        _logger = logger;
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
