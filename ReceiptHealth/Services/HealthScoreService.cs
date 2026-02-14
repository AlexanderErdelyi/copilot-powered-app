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
            _logger.LogDebug("No line items, returning default score of 50");
            return 50m;
        }

        decimal totalAmount = lineItems.Sum(item => item.Price * item.Quantity);
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

        // Calculate percentages
        decimal healthyPercent = totalAmount > 0 ? (healthyAmount / totalAmount) * 100m : 0m;
        decimal junkPercent = totalAmount > 0 ? (junkAmount / totalAmount) * 100m : 0m;
        decimal otherPercent = totalAmount > 0 ? (otherAmount / totalAmount) * 100m : 0m;

        // New algorithm: 
        // - Healthy items contribute positively (worth full value)
        // - Junk items contribute negatively
        // - Other items are treated as slightly positive (60% of neutral = 60 points)
        // Formula: (Healthy% * 100) + (Other% * 60) + (Junk% * 0)
        decimal score = (healthyPercent * 1.0m) + (otherPercent * 0.6m) + (junkPercent * 0m);
        
        // Clamp to 0-100
        score = Math.Max(0m, Math.Min(100m, score));

        _logger.LogInformation(
            "Computed health score: {Score:F2} (Healthy={HealthyPercent:F1}%, Junk={JunkPercent:F1}%, Other={OtherPercent:F1}%)",
            score, healthyPercent, junkPercent, otherPercent);

        return Math.Round(score, 2);
    }
}
