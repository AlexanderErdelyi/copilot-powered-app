namespace ReceiptHealth.Models;

public class LeaderboardEntry
{
    public int Id { get; set; }
    public string UserName { get; set; } = "Guest User";
    public int TotalAchievements { get; set; }
    public int CompletedChallenges { get; set; }
    public decimal AvgHealthScore { get; set; }
    public int TotalReceipts { get; set; }
    public int CurrentStreak { get; set; }
    public int Points { get; set; }
    public DateTime LastActivityDate { get; set; }
}
