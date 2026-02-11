using Microsoft.EntityFrameworkCore;
using ReceiptHealth.Data;
using ReceiptHealth.Models;
using GitHub.Copilot.SDK;

namespace ReceiptHealth.Services;

public interface IGamificationService
{
    Task CheckAndUnlockAchievementsAsync();
    Task<List<Achievement>> GetAchievementsAsync();
    Task<List<Achievement>> GetNextAvailableAchievementsAsync();
    Task<List<Challenge>> GetActiveChallengesAsync();
    Task<Challenge> CreateChallengeAsync(string name, string description, string type, decimal targetValue, int durationDays);
    Task<List<string>> GenerateAIChallengesAsync(int count = 3);
    Task UpdateChallengeProgressAsync();
    Task TrackFeatureUsageAsync(string featureName, string? details = null);
    Task<bool> ShowCelebrationForNewAchievements();
}

public class GamificationService : IGamificationService
{
    private readonly ReceiptHealthContext _context;
    private readonly CopilotClient _copilotClient;

    public GamificationService(ReceiptHealthContext context)
    {
        _context = context;
        _copilotClient = new CopilotClient();
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

    public async Task<List<Achievement>> GetNextAvailableAchievementsAsync()
    {
        // Get all unlocked achievement types and values
        var unlocked = await _context.Achievements
            .Where(a => a.IsUnlocked)
            .Select(a => new { a.Type, a.RequiredValue })
            .ToListAsync();

        var nextAchievements = new List<Achievement>();

        // Define all possible achievements with their thresholds
        var allAchievements = new List<(string Type, int Threshold, string Name, string Description, string Icon)>
        {
            // Streak achievements
            ("streak", 3, "🌱 Healthy Start", "Make 3 healthy shopping trips in a row", "🌱"),
            ("streak", 7, "🔥 Week of Health", "Make 7 healthy shopping trips in a row", "🔥"),
            ("streak", 14, "💪 Two Week Warrior", "Make 14 healthy shopping trips in a row", "💪"),
            ("streak", 30, "🏆 Health Champion", "Make 30 healthy shopping trips in a row", "🏆"),
            
            // Score achievements
            ("score", 50, "⭐ Balanced Shopper", "Achieve average health score of 50+", "⭐"),
            ("score", 70, "🌟 Health Conscious", "Achieve average health score of 70+", "🌟"),
            ("score", 85, "✨ Wellness Expert", "Achieve average health score of 85+", "✨"),
            ("score", 95, "👑 Health Master", "Achieve average health score of 95+", "👑"),
            
            // Category achievements
            ("category", 60, "🥗 Veggie Lover", "Spend 60%+ on healthy items this month", "🥗"),
            ("category", 80, "🌿 Clean Eater", "Spend 80%+ on healthy items this month", "🌿"),
            
            // Receipt count achievements
            ("receipt_count", 10, "📝 Getting Started", "Upload 10 receipts", "📝"),
            ("receipt_count", 25, "📊 Regular Tracker", "Upload 25 receipts", "📊"),
            ("receipt_count", 50, "📈 Dedicated User", "Upload 50 receipts", "📈"),
            ("receipt_count", 100, "🎯 Century Club", "Upload 100 receipts", "🎯"),
            
            // Feature usage achievements
            ("feature_voice", 5, "🎤 Voice Explorer", "Use voice assistant 5 times", "🎤"),
            ("feature_voice", 25, "🗣️ Voice Pro", "Use voice assistant 25 times", "🗣️"),
            ("feature_meal_planner", 3, "🍳 Meal Prep Beginner", "Create 3 meal plans", "🍳"),
            ("feature_meal_planner", 10, "👨‍🍳 Master Chef", "Create 10 meal plans", "👨‍🍳"),
            ("feature_shopping_list", 5, "📝 List Maker", "Create 5 shopping lists", "📝"),
            ("feature_shopping_list", 20, "🛒 Shopping Organizer", "Create 20 shopping lists", "🛒"),
        };

        // Find next unlockable achievements (not yet unlocked, but next in progression)
        foreach (var achievement in allAchievements)
        {
            var isUnlocked = unlocked.Any(u => u.Type == achievement.Type && u.RequiredValue == achievement.Threshold);
            
            if (!isUnlocked)
            {
                // Check if this is the next in progression for this type
                var higherUnlocked = unlocked
                    .Where(u => u.Type == achievement.Type && u.RequiredValue > achievement.Threshold)
                    .Any();
                
                // Only show if there are no higher unlocked achievements of this type (maintain progression)
                if (!higherUnlocked)
                {
                    nextAchievements.Add(new Achievement
                    {
                        Name = achievement.Name,
                        Description = achievement.Description,
                        Icon = achievement.Icon,
                        Type = achievement.Type,
                        RequiredValue = achievement.Threshold,
                        IsUnlocked = false
                    });
                }
            }
        }

        return nextAchievements.Take(6).ToList(); // Return top 6 next achievements
    }

    public async Task<List<string>> GenerateAIChallengesAsync(int count = 3)
    {
        try
        {
            // Get user stats for context
            var receipts = await _context.Receipts
                .Include(r => r.CategorySummary)
                .OrderByDescending(r => r.Date)
                .Take(30)
                .ToListAsync();

            if (!receipts.Any())
            {
                return new List<string>
                {
                    "Upload 5 receipts this week|Start tracking your shopping habits|receipt_streak|5|7",
                    "Achieve a health score of 70+|Improve your shopping choices|health_score|70|14",
                    "Spend $50 on healthy items|Focus on nutritious purchases|healthy_spending|50|14"
                };
            }

            var avgHealthScore = receipts.Average(r => r.HealthScore);
            var recentHealthy = receipts.Take(10).Sum(r => r.CategorySummary?.HealthyTotal ?? 0);
            var recentJunk = receipts.Take(10).Sum(r => r.CategorySummary?.JunkTotal ?? 0);
            
            var session = await _copilotClient.CreateSessionAsync();
            
            var prompt = $@"Based on these shopping statistics, suggest {count} personalized health challenges for a grocery shopper:

Current Stats:
- Average Health Score: {avgHealthScore:F1}/100
- Recent Healthy Spending: ${recentHealthy:F2}
- Recent Junk Spending: ${recentJunk:F2}
- Recent Receipt Count: {receipts.Count}

Generate {count} SMART challenges that are:
1. Specific and measurable
2. Challenging but achievable
3. Time-bound (7-30 days)
4. Focused on improving health metrics

Format each challenge as:
Challenge Name|Description|Type|Target Value|Duration Days

Types: health_score, healthy_spending, reduce_junk, receipt_streak
Example: Reduce Junk Food by 20%|Cut junk food spending to under 20% of total|reduce_junk|20|14

Return ONLY the formatted challenges, one per line, no extra text.";

            var response = await session.SendAndWaitAsync(new MessageOptions { Prompt = prompt }, TimeSpan.FromSeconds(30));
            var content = response?.Data?.Content?.Trim();
            var challenges = (content ?? "").Split('\n', StringSplitOptions.RemoveEmptyEntries)
                .Where(line => line.Contains('|'))
                .Take(count)
                .ToList();

            return challenges.Any() ? challenges : new List<string>
            {
                $"Improve Health Score to {Math.Min(avgHealthScore + 10, 95):F0}|Beat your average health score|health_score|{Math.Min(avgHealthScore + 10, 95):F0}|14",
                $"Spend ${recentHealthy + 20:F0} on Healthy Items|Increase healthy purchases|healthy_spending|{recentHealthy + 20:F0}|14",
                $"Keep Junk Spending Under ${Math.Max(recentJunk - 10, 5):F0}|Reduce unhealthy purchases|reduce_junk|{Math.Max((recentJunk / (recentHealthy + recentJunk) * 100) - 5, 10):F0}|14"
            };
        }
        catch (Exception)
        {
            // Fallback challenges if AI fails
            return new List<string>
            {
                "Shop Healthy 5 Times|Make 5 healthy shopping trips|receipt_streak|5|14",
                "Achieve 75+ Health Score|Reach a health score of 75 or higher|health_score|75|14",
                "Spend $100 on Healthy Food|Invest in nutritious items|healthy_spending|100|21"
            };
        }
    }

    public async Task TrackFeatureUsageAsync(string featureName, string? details = null)
    {
        var usage = new FeatureUsage
        {
            FeatureName = featureName,
            UsedAt = DateTime.UtcNow,
            Details = details
        };

        _context.FeatureUsages.Add(usage);
        await _context.SaveChangesAsync();

        // Check for feature usage achievements
        await CheckFeatureUsageAchievements(featureName);
    }

    private async Task CheckFeatureUsageAchievements(string featureName)
    {
        var usageCount = await _context.FeatureUsages
            .Where(f => f.FeatureName == featureName)
            .CountAsync();

        var achievementMap = new Dictionary<string, List<(int Threshold, string Name, string Description)>>
        {
            ["voice_assistant"] = new()
            {
                (5, "🎤 Voice Explorer", "Use voice assistant 5 times"),
                (25, "🗣️ Voice Pro", "Use voice assistant 25 times")
            },
            ["meal_planner"] = new()
            {
                (3, "🍳 Meal Prep Beginner", "Create 3 meal plans"),
                (10, "👨‍🍳 Master Chef", "Create 10 meal plans")
            },
            ["shopping_list"] = new()
            {
                (5, "📝 List Maker", "Create 5 shopping lists"),
                (20, "🛒 Shopping Organizer", "Create 20 shopping lists")
            }
        };

        if (achievementMap.TryGetValue(featureName, out var achievements))
        {
            foreach (var (threshold, name, description) in achievements)
            {
                if (usageCount >= threshold)
                {
                    await UnlockAchievementAsync(name, description, $"feature_{featureName}", threshold);
                }
            }
        }
    }

    public async Task<bool> ShowCelebrationForNewAchievements()
    {
        // Check if there are any achievements unlocked in the last minute
        var recentAchievements = await _context.Achievements
            .Where(a => a.IsUnlocked && a.UnlockedAt >= DateTime.UtcNow.AddMinutes(-1))
            .ToListAsync();

        return recentAchievements.Any();
    }
}
