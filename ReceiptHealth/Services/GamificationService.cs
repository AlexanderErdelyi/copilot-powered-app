using Microsoft.EntityFrameworkCore;
using ReceiptHealth.Data;
using ReceiptHealth.Models;

namespace ReceiptHealth.Services;

public interface IGamificationService
{
    Task CheckAndUnlockAchievementsAsync();
    Task<List<Achievement>> GetAchievementsAsync();
    Task<List<Challenge>> GetActiveChallengesAsync();
    Task<Challenge> CreateChallengeAsync(string name, string description, string type, decimal targetValue, int durationDays);
    Task UpdateChallengeProgressAsync();
}

public class GamificationService : IGamificationService
{
    private readonly ReceiptHealthContext _context;

    public GamificationService(ReceiptHealthContext context)
    {
        _context = context;
    }

    public async Task CheckAndUnlockAchievementsAsync()
    {
        var receipts = await _context.Receipts
            .Include(r => r.CategorySummary)
            .OrderByDescending(r => r.Date)
            .ToListAsync();

        if (!receipts.Any()) return;

        // Check various achievements
        await CheckStreakAchievements(receipts);
        await CheckHealthScoreAchievements(receipts);
        await CheckCategoryAchievements(receipts);
        await CheckReceiptCountAchievements(receipts);
    }

    private async Task CheckStreakAchievements(List<Receipt> receipts)
    {
        // Calculate healthy shopping streak (receipts with health score >= 60)
        var healthyReceipts = receipts
            .Where(r => r.HealthScore >= 60)
            .OrderByDescending(r => r.Date)
            .ToList();

        int currentStreak = 0;
        DateTime? lastDate = null;

        foreach (var receipt in healthyReceipts)
        {
            if (lastDate == null || (lastDate.Value - receipt.Date).TotalDays <= 7)
            {
                currentStreak++;
                lastDate = receipt.Date;
            }
            else
            {
                break;
            }
        }

        // Unlock streak achievements
        var streakAchievements = new[]
        {
            (3, "🌱 Healthy Start", "Made 3 healthy shopping trips in a row"),
            (7, "🔥 Week of Health", "Made 7 healthy shopping trips in a row"),
            (14, "💪 Two Week Warrior", "Made 14 healthy shopping trips in a row"),
            (30, "🏆 Health Champion", "Made 30 healthy shopping trips in a row")
        };

        foreach (var (threshold, name, description) in streakAchievements)
        {
            if (currentStreak >= threshold)
            {
                await UnlockAchievementAsync(name, description, "streak", threshold);
            }
        }
    }

    private async Task CheckHealthScoreAchievements(List<Receipt> receipts)
    {
        var avgScore = receipts.Any() ? receipts.Average(r => r.HealthScore) : 0;

        var scoreAchievements = new[]
        {
            (50m, "⭐ Balanced Shopper", "Achieved average health score of 50+"),
            (70m, "🌟 Health Conscious", "Achieved average health score of 70+"),
            (85m, "✨ Wellness Expert", "Achieved average health score of 85+"),
            (95m, "👑 Health Master", "Achieved average health score of 95+")
        };

        foreach (var (threshold, name, description) in scoreAchievements)
        {
            if ((decimal)avgScore >= threshold)
            {
                await UnlockAchievementAsync(name, description, "score", (int)threshold);
            }
        }
    }

    private async Task CheckCategoryAchievements(List<Receipt> receipts)
    {
        var recentReceipts = receipts.Where(r => r.Date >= DateTime.Now.AddDays(-30)).ToList();
        if (!recentReceipts.Any()) return;

        var totalHealthy = recentReceipts.Sum(r => r.CategorySummary?.HealthyTotal ?? 0);
        var totalSpend = recentReceipts.Sum(r => r.Total);
        var healthyPercent = totalSpend > 0 ? (totalHealthy / totalSpend) * 100 : 0;

        if (healthyPercent >= 60)
        {
            await UnlockAchievementAsync("🥗 Veggie Lover", "Spent 60%+ on healthy items this month", "category", 60);
        }

        if (healthyPercent >= 80)
        {
            await UnlockAchievementAsync("🌿 Clean Eater", "Spent 80%+ on healthy items this month", "category", 80);
        }
    }

    private async Task CheckReceiptCountAchievements(List<Receipt> receipts)
    {
        var totalReceipts = receipts.Count;

        var countAchievements = new[]
        {
            (10, "📝 Getting Started", "Uploaded 10 receipts"),
            (25, "📊 Regular Tracker", "Uploaded 25 receipts"),
            (50, "📈 Dedicated User", "Uploaded 50 receipts"),
            (100, "🎯 Century Club", "Uploaded 100 receipts")
        };

        foreach (var (threshold, name, description) in countAchievements)
        {
            if (totalReceipts >= threshold)
            {
                await UnlockAchievementAsync(name, description, "receipt_count", threshold);
            }
        }
    }

    private async Task UnlockAchievementAsync(string name, string description, string type, int requiredValue)
    {
        var existing = await _context.Achievements
            .FirstOrDefaultAsync(a => a.Name == name && a.Type == type);

        if (existing == null)
        {
            var achievement = new Achievement
            {
                Name = name,
                Description = description,
                Type = type,
                RequiredValue = requiredValue,
                IsUnlocked = true,
                UnlockedAt = DateTime.UtcNow
            };

            _context.Achievements.Add(achievement);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<Achievement>> GetAchievementsAsync()
    {
        return await _context.Achievements
            .OrderByDescending(a => a.UnlockedAt)
            .ToListAsync();
    }

    public async Task<List<Challenge>> GetActiveChallengesAsync()
    {
        return await _context.Challenges
            .Where(c => !c.IsCompleted && c.EndDate >= DateTime.Now)
            .OrderBy(c => c.EndDate)
            .ToListAsync();
    }

    public async Task<Challenge> CreateChallengeAsync(string name, string description, string type, decimal targetValue, int durationDays)
    {
        var challenge = new Challenge
        {
            Name = name,
            Description = description,
            Type = type,
            TargetValue = targetValue,
            CurrentValue = 0,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(durationDays),
            IsCompleted = false
        };

        _context.Challenges.Add(challenge);
        await _context.SaveChangesAsync();

        return challenge;
    }

    public async Task UpdateChallengeProgressAsync()
    {
        var activeChallenges = await GetActiveChallengesAsync();

        foreach (var challenge in activeChallenges)
        {
            var receipts = await _context.Receipts
                .Include(r => r.CategorySummary)
                .Where(r => r.Date >= challenge.StartDate && r.Date <= challenge.EndDate)
                .ToListAsync();

            switch (challenge.Type)
            {
                case "health_score":
                    challenge.CurrentValue = receipts.Any() ? (decimal)receipts.Average(r => r.HealthScore) : 0;
                    break;

                case "healthy_spending":
                    challenge.CurrentValue = receipts.Sum(r => r.CategorySummary?.HealthyTotal ?? 0);
                    break;

                case "reduce_junk":
                    var totalJunk = receipts.Sum(r => r.CategorySummary?.JunkTotal ?? 0);
                    var totalSpend = receipts.Sum(r => r.Total);
                    challenge.CurrentValue = totalSpend > 0 ? (totalJunk / totalSpend) * 100 : 0;
                    break;

                case "receipt_streak":
                    // Count consecutive healthy receipts
                    var healthyCount = receipts.Count(r => r.HealthScore >= 60);
                    challenge.CurrentValue = healthyCount;
                    break;
            }

            if (challenge.CurrentValue >= challenge.TargetValue)
            {
                challenge.IsCompleted = true;
                challenge.CompletedAt = DateTime.UtcNow;

                // Unlock achievement for completing challenge
                await UnlockAchievementAsync(
                    $"🎉 {challenge.Name}",
                    $"Completed challenge: {challenge.Description}",
                    "challenge",
                    (int)challenge.TargetValue
                );
            }
        }

        await _context.SaveChangesAsync();
    }
}
