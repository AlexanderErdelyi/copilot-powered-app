using GitHub.Copilot.SDK;
using Microsoft.Extensions.AI;
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
    private readonly CopilotClient _copilotClient;

    public RecommendationService(ReceiptHealthContext context)
    {
        _context = context;
        _copilotClient = new CopilotClient();
        
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
            .Include(r => r.LineItems)
            .Where(r => r.Date >= DateTime.Now.AddDays(-30))
            .OrderByDescending(r => r.Date)
            .ToListAsync();

        if (!recentReceipts.Any())
        {
            recommendations.Add("📊 Start tracking your receipts to receive personalized healthy eating recommendations!");
            return recommendations;
        }

        var totalJunk = recentReceipts.Sum(r => r.CategorySummary?.JunkTotal ?? 0);
        var totalHealthy = recentReceipts.Sum(r => r.CategorySummary?.HealthyTotal ?? 0);
        var totalOther = recentReceipts.Sum(r => r.CategorySummary?.OtherTotal ?? 0);
        var totalSpend = recentReceipts.Sum(r => r.Total);

        var junkPercentage = totalSpend > 0 ? (totalJunk / totalSpend) * 100 : 0;
        var healthyPercentage = totalSpend > 0 ? (totalHealthy / totalSpend) * 100 : 0;

        // Try AI-powered recommendations first
        try
        {
            var aiRecommendations = await GenerateAIRecommendationsAsync(recentReceipts, totalSpend, junkPercentage, healthyPercentage);
            if (aiRecommendations.Any())
            {
                recommendations.AddRange(aiRecommendations);
                return recommendations;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ AI recommendations failed, using rule-based: {ex.Message}");
        }

        // Fallback to rule-based recommendations
        if (junkPercentage > 30)
        {
            recommendations.Add($"⚠️ You're spending {junkPercentage:F1}% on junk food. Try to reduce it to under 20% for better health.");
        }

        if (healthyPercentage < 40)
        {
            recommendations.Add($"🥗 You're spending only {healthyPercentage:F1}% on healthy items. Try to increase it to at least 50%.");
        }

        var avgHealthScore = recentReceipts.Average(r => r.HealthScore);
        if (avgHealthScore < 50)
        {
            recommendations.Add($"📉 Your average health score is {avgHealthScore:F1}. Focus on buying more fruits, vegetables, and whole grains.");
        }
        else if (avgHealthScore >= 70)
        {
            recommendations.Add($"🎉 Excellent! Your average health score is {avgHealthScore:F1}. Keep up the great work!");
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

        if (recommendations.Count == 0)
        {
            recommendations.Add("✅ You're maintaining a balanced diet! Keep tracking your receipts to stay on track.");
        }

        return recommendations;
    }

    private async Task<List<string>> GenerateAIRecommendationsAsync(List<Receipt> receipts, decimal totalSpend, decimal junkPercentage, decimal healthyPercentage)
    {
        var recommendations = new List<string>();

        // Build context from receipts
        var topJunkItems = receipts
            .SelectMany(r => r.LineItems)
            .Where(li => li.Category == "Junk")
            .GroupBy(li => li.Description)
            .OrderByDescending(g => g.Sum(li => li.Price))
            .Take(5)
            .Select(g => $"{g.Key} (${g.Sum(li => li.Price):F2})")
            .ToList();

        var topHealthyItems = receipts
            .SelectMany(r => r.LineItems)
            .Where(li => li.Category == "Healthy")
            .GroupBy(li => li.Description)
            .OrderByDescending(g => g.Sum(li => li.Price))
            .Take(5)
            .Select(g => $"{g.Key} (${g.Sum(li => li.Price):F2})")
            .ToList();

        var avgHealthScore = receipts.Average(r => r.HealthScore);

        var prompt = $@"You are a nutrition and healthy shopping advisor. Analyze the user's shopping patterns and provide 3-5 personalized recommendations to improve their diet.

Shopping Summary (Last 30 Days):
- Total Spent: ${totalSpend:F2}
- Junk Food: {junkPercentage:F1}%
- Healthy Food: {healthyPercentage:F1}%
- Average Health Score: {avgHealthScore:F1}/100

Top Junk Items: {(topJunkItems.Any() ? string.Join(", ", topJunkItems) : "None")}
Top Healthy Items: {(topHealthyItems.Any() ? string.Join(", ", topHealthyItems) : "None")}

Please provide 3-5 specific, actionable recommendations. Each recommendation should:
- Start with an emoji
- Be concise (1-2 sentences)
- Focus on specific items they're buying
- Suggest concrete alternatives or actions

Format: Return ONLY a numbered list, one recommendation per line.";

        var session = await _copilotClient.CreateSessionAsync();
        var response = await session.SendAndWaitAsync(new MessageOptions { Prompt = prompt });

        if (response?.Data?.Content != null)
        {
            var lines = response.Data.Content.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            foreach (var line in lines)
            {
                var trimmed = line.Trim();
                // Remove numbering (1. 2. etc.) if present
                if (trimmed.Length > 2 && char.IsDigit(trimmed[0]) && trimmed[1] == '.')
                {
                    trimmed = trimmed.Substring(2).Trim();
                }
                if (!string.IsNullOrWhiteSpace(trimmed))
                {
                    recommendations.Add(trimmed);
                }
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
