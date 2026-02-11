namespace ReceiptHealth.Models;

public class FeatureUsage
{
    public int Id { get; set; }
    public string FeatureName { get; set; } = string.Empty; // e.g., "voice_assistant", "meal_planner", "shopping_list"
    public DateTime UsedAt { get; set; }
    public string? Details { get; set; } // Optional JSON for additional context
}
