namespace ReceiptHealth.Models;

public class Achievement
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = "🏆"; // Emoji or icon identifier
    public string Type { get; set; } = string.Empty; // "streak", "score", "category", etc.
    public int RequiredValue { get; set; } // Threshold to unlock
    public DateTime UnlockedAt { get; set; }
    public bool IsUnlocked { get; set; } = false;
}

public class Challenge
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "health_score", "category_spending", "streak", etc.
    public decimal TargetValue { get; set; }
    public decimal CurrentValue { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsCompleted { get; set; } = false;
    public DateTime? CompletedAt { get; set; }
    public string RewardBadge { get; set; } = string.Empty;
}
