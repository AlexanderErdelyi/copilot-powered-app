using Microsoft.EntityFrameworkCore;
using ReceiptHealth.Data;
using ReceiptHealth.Models;

namespace ReceiptHealth.Services;

public interface IRecommendationService
{
    Task<List<HealthyAlternativeRecommendation>> GetHealthyAlternativesAsync(string junkItemName);
    Task<List<string>> GetCategoryRecommendationsAsync();
}

public class RecommendationService : IRecommendationService
{
    private readonly ReceiptHealthContext _context;
    private readonly Dictionary<string, List<string>> _healthyAlternatives;

    public RecommendationService(ReceiptHealthContext context)
    {
        _context = context;
        
        // Predefined healthy alternatives for common junk items
        _healthyAlternatives = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase)
        {
            ["soda"] = new List<string> { "sparkling water", "unsweetened iced tea", "infused water" },
            ["chips"] = new List<string> { "baked vegetable chips", "air-popped popcorn", "roasted chickpeas", "nuts" },
            ["candy"] = new List<string> { "fresh fruit", "dark chocolate (70%+)", "dried fruit (no sugar added)" },
            ["cookies"] = new List<string> { "oatmeal cookies (homemade)", "fruit bars", "rice cakes" },
            ["ice cream"] = new List<string> { "frozen yogurt", "nice cream (banana-based)", "sorbet" },
            ["energy drink"] = new List<string> { "green tea", "black coffee", "coconut water" },
            ["white bread"] = new List<string> { "whole wheat bread", "multigrain bread", "sourdough" },
            ["cereal"] = new List<string> { "oatmeal", "muesli", "bran flakes" },
            ["pizza"] = new List<string> { "whole wheat pizza", "cauliflower crust pizza", "veggie wrap" },
            ["burger"] = new List<string> { "veggie burger", "turkey burger", "grilled chicken sandwich" }
        };
    }

    public async Task<List<HealthyAlternativeRecommendation>> GetHealthyAlternativesAsync(string junkItemName)
    {
        var recommendations = new List<HealthyAlternativeRecommendation>();
        
        // Check predefined alternatives
        foreach (var kvp in _healthyAlternatives)
        {
            if (junkItemName.Contains(kvp.Key, StringComparison.OrdinalIgnoreCase))
            {
                foreach (var alternative in kvp.Value)
                {
                    // Try to find price info for the alternative
                    var priceInfo = await _context.PriceComparisons
                        .Where(pc => pc.ItemName.Contains(alternative))
                        .OrderByDescending(pc => pc.Date)
                        .FirstOrDefaultAsync();

                    recommendations.Add(new HealthyAlternativeRecommendation
                    {
                        JunkItem = junkItemName,
                        HealthyAlternative = alternative,
                        EstimatedPrice = priceInfo?.Price,
                        Currency = priceInfo?.Currency ?? "USD",
                        LastSeenVendor = priceInfo?.Vendor,
                        Reason = $"Replace {kvp.Key} with {alternative} for better health"
                    });
                }
            }
        }

        return recommendations;
    }

    public async Task<List<string>> GetCategoryRecommendationsAsync()
    {
        var recommendations = new List<string>();
        
        // Analyze recent spending patterns
        var recentReceipts = await _context.Receipts
            .Include(r => r.CategorySummary)
            .Where(r => r.Date >= DateTime.Now.AddDays(-30))
            .ToListAsync();

        if (!recentReceipts.Any())
        {
            return recommendations;
        }

        var totalJunk = recentReceipts.Sum(r => r.CategorySummary?.JunkTotal ?? 0);
        var totalHealthy = recentReceipts.Sum(r => r.CategorySummary?.HealthyTotal ?? 0);
        var totalSpend = recentReceipts.Sum(r => r.Total);

        var junkPercentage = totalSpend > 0 ? (totalJunk / totalSpend) * 100 : 0;
        var healthyPercentage = totalSpend > 0 ? (totalHealthy / totalSpend) * 100 : 0;

        if (junkPercentage > 30)
        {
            recommendations.Add($"⚠️ You're spending {junkPercentage:F1}% on junk food. Try to reduce it to under 20% for better health.");
        }

        if (healthyPercentage < 40)
        {
            recommendations.Add($"🥗 You're spending only {healthyPercentage:F1}% on healthy items. Try to increase it to at least 50%.");
        }

        var avgHealthScore = recentReceipts.Average(r => r.HealthScore);
        if (avgHealthScore < 40)
        {
            recommendations.Add($"📉 Your average health score is {avgHealthScore:F1}. Focus on buying more fruits, vegetables, and whole grains.");
        }

        // Find most purchased junk items
        var junkItems = await _context.LineItems
            .Include(li => li.Receipt)
            .Where(li => li.Category == "Junk" && li.Receipt.Date >= DateTime.Now.AddDays(-30))
            .GroupBy(li => li.Description)
            .Select(g => new { Item = g.Key, Count = g.Count(), TotalSpent = g.Sum(li => li.Price) })
            .OrderByDescending(x => x.TotalSpent)
            .Take(3)
            .ToListAsync();

        foreach (var item in junkItems)
        {
            var alternatives = await GetHealthyAlternativesAsync(item.Item);
            if (alternatives.Any())
            {
                var alt = alternatives.First();
                recommendations.Add($"💡 You bought {item.Item} {item.Count} times. Consider switching to {alt.HealthyAlternative} instead.");
            }
        }

        return recommendations;
    }
}

public class HealthyAlternativeRecommendation
{
    public string JunkItem { get; set; } = string.Empty;
    public string HealthyAlternative { get; set; } = string.Empty;
    public decimal? EstimatedPrice { get; set; }
    public string Currency { get; set; } = "USD";
    public string? LastSeenVendor { get; set; }
    public string Reason { get; set; } = string.Empty;
}
