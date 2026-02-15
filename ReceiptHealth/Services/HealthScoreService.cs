using ReceiptHealth.Models;

namespace ReceiptHealth.Services;

public interface IHealthScoreService
{
    decimal ComputeHealthScore(List<LineItem> lineItems);
}

public class HealthScoreService : IHealthScoreService
{
    private readonly ILogger<HealthScoreService> _logger;

    public HealthScoreService(ILogger<HealthScoreService> logger)
    {
        _logger = logger;
    }

    public decimal ComputeHealthScore(List<LineItem> lineItems)
    {
        if (lineItems.Count == 0)
        {
            _logger.LogDebug("No line items, returning default score of 0");
            return 0m;
        }

        decimal healthyAmount = 0m;
        decimal junkAmount = 0m;
        decimal otherAmount = 0m;

        foreach (var item in lineItems)
        {
            var amount = item.Price * item.Quantity;
            
            switch (item.Category)
            {
                case "Healthy":
                    healthyAmount += amount;
                    break;
                case "Junk":
                    junkAmount += amount;
                    break;
                default:
                    otherAmount += amount;
                    break;
            }
        }

        // Calculate total of only Healthy and Junk items
        decimal healthyJunkTotal = healthyAmount + junkAmount;

        // If there are no Healthy or Junk items, return 0 (neutral)
        if (healthyJunkTotal == 0)
        {
            _logger.LogInformation(
                "No Healthy or Junk items found (Other={OtherAmount:F2}), returning score of 0",
                otherAmount);
            return 0m;
        }

        // New formula: Healthy / (Healthy + Junk) * 100
        // This focuses only on food health, ignoring "Other" and "Unknown" categories
        decimal score = (healthyAmount / healthyJunkTotal) * 100m;
        
        // Clamp to 0-100 (should already be in range, but just in case)
        score = Math.Max(0m, Math.Min(100m, score));

        _logger.LogInformation(
            "Computed health score: {Score:F2} (Healthy={HealthyAmount:F2}, Junk={JunkAmount:F2}, Other={OtherAmount:F2})",
            score, healthyAmount, junkAmount, otherAmount);

        return Math.Round(score, 2);
    }
}
