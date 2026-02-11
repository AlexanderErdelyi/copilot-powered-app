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

        decimal totalWeight = 0m;
        decimal weightedSum = 0m;

        foreach (var item in lineItems)
        {
            var amount = item.Price * item.Quantity;
            
            // Weight based on category
            decimal weight = item.Category switch
            {
                "Healthy" => 1m,  // +1 per currency unit
                "Junk" => -1m,    // -1 per currency unit
                "Other" => 0m,    // neutral
                "Unknown" => 0m,  // neutral
                _ => 0m
            };

            weightedSum += weight * amount;
            totalWeight += Math.Abs(weight) * amount;
        }

        // If no weighted items (all Other/Unknown), return 50
        if (totalWeight == 0m)
        {
            _logger.LogDebug("No weighted items, returning default score of 50");
            return 50m;
        }

        // Normalize to 0-100 scale
        // weightedSum ranges from -totalWeight to +totalWeight
        // Map to 0-100: ((weightedSum + totalWeight) / (2 * totalWeight)) * 100
        var normalizedScore = ((weightedSum + totalWeight) / (2 * totalWeight)) * 100m;
        
        // Clamp to 0-100
        normalizedScore = Math.Max(0m, Math.Min(100m, normalizedScore));

        _logger.LogInformation("Computed health score: {Score:F2} (WeightedSum={WeightedSum:F2}, TotalWeight={TotalWeight:F2})",
            normalizedScore, weightedSum, totalWeight);

        return Math.Round(normalizedScore, 2);
    }
}
