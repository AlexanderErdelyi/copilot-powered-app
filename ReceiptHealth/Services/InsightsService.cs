using GitHub.Copilot.SDK;
using Microsoft.Extensions.AI;
using Microsoft.EntityFrameworkCore;
using ReceiptHealth.Data;
using ReceiptHealth.Models;

namespace ReceiptHealth.Services;

public interface IInsightsService
{
    Task<string> ProcessNaturalLanguageQueryAsync(string query);
    Task<List<AnomalyAlert>> DetectAnomaliesAsync();
    Task<BudgetPrediction> PredictMonthlyBudgetAsync();
}

public class InsightsService : IInsightsService
{
    private readonly ReceiptHealthContext _context;
    private readonly CopilotClient _copilotClient;

    public InsightsService(ReceiptHealthContext context)
    {
        _context = context;
        _copilotClient = new CopilotClient();
    }

    public async Task<string> ProcessNaturalLanguageQueryAsync(string query)
    {
        // Detect if query is asking about specific items/products/purchases
        var queryLower = query.ToLower();
        var isDetailedQuery = queryLower.Contains("what did i buy") || 
                             queryLower.Contains("what i bought") ||
                             queryLower.Contains("items") ||
                             queryLower.Contains("products") ||
                             queryLower.Contains("purchased") ||
                             queryLower.Contains("list");

        // Try to extract date information from the query
        var dateRange = ParseDateFromQuery(query);

        // Gather relevant data
        var receiptsQuery = _context.Receipts
            .Include(r => r.LineItems)
            .Include(r => r.CategorySummary)
            .AsQueryable();

        // Filter by date if specified
        if (dateRange.HasValue)
        {
            receiptsQuery = receiptsQuery.Where(r => r.Date >= dateRange.Value.start && r.Date <= dateRange.Value.end);
        }

        var receipts = await receiptsQuery
            .OrderByDescending(r => r.Date)
            .Take(100)
            .ToListAsync();

        var context = isDetailedQuery 
            ? BuildDetailedDataContext(receipts, dateRange)
            : BuildDataContext(receipts);

        var prompt = $@"You are a helpful shopping and nutrition assistant. Answer the user's question based on their receipt history.

User Question: {query}

Receipt Data Context:
{context}

Provide a clear, concise answer with specific numbers and insights. If the data doesn't contain enough information, say so.";

        var session = await _copilotClient.CreateSessionAsync();
        var response = await session.SendAndWaitAsync(new MessageOptions { Prompt = prompt });

        return response?.Data?.Content?.Trim() ?? "I couldn't process that query. Please try again.";
    }

    public async Task<List<AnomalyAlert>> DetectAnomaliesAsync()
    {
        var alerts = new List<AnomalyAlert>();

        // Get recent receipts (last 60 days)
        var recentReceipts = await _context.Receipts
            .Include(r => r.CategorySummary)
            .Where(r => r.Date >= DateTime.Now.AddDays(-60))
            .OrderByDescending(r => r.Date)
            .ToListAsync();

        if (recentReceipts.Count < 5)
        {
            return alerts; // Not enough data
        }

        // Detect spending anomalies
        var avgTotal = recentReceipts.Average(r => r.Total);
        var stdDev = CalculateStandardDeviation(recentReceipts.Select(r => (double)r.Total).ToList());

        foreach (var receipt in recentReceipts.Take(10)) // Check last 10 receipts
        {
            if (receipt.Total > (decimal)((double)avgTotal + 2 * stdDev))
            {
                alerts.Add(new AnomalyAlert
                {
                    Type = "high_spending",
                    Title = "Unusually High Spending",
                    Message = $"You spent {receipt.Total:C} at {receipt.Vendor} on {receipt.Date:MMM dd}, which is {((receipt.Total - avgTotal) / avgTotal * 100):F0}% above your average.",
                    Severity = "warning",
                    Date = receipt.Date,
                    ReceiptId = receipt.Id
                });
            }
        }

        // Detect junk food spikes
        var avgJunkPercentage = recentReceipts
            .Where(r => r.Total > 0)
            .Average(r => ((r.CategorySummary?.JunkTotal ?? 0) / r.Total) * 100);

        foreach (var receipt in recentReceipts.Take(10))
        {
            if (receipt.Total > 0)
            {
                var junkPercentage = ((receipt.CategorySummary?.JunkTotal ?? 0) / receipt.Total) * 100;
                if (junkPercentage > avgJunkPercentage * 1.5m && junkPercentage > 40)
                {
                    alerts.Add(new AnomalyAlert
                    {
                        Type = "high_junk",
                        Title = "High Junk Food Purchase",
                        Message = $"At {receipt.Vendor}, you spent {junkPercentage:F0}% on junk food ({receipt.CategorySummary?.JunkTotal:C}), much higher than usual.",
                        Severity = "info",
                        Date = receipt.Date,
                        ReceiptId = receipt.Id
                    });
                }
            }
        }

        // Detect health score drops
        var avgHealthScore = recentReceipts.Average(r => r.HealthScore);
        foreach (var receipt in recentReceipts.Take(5))
        {
            if (receipt.HealthScore < avgHealthScore - 20)
            {
                alerts.Add(new AnomalyAlert
                {
                    Type = "low_health_score",
                    Title = "Health Score Drop",
                    Message = $"Your health score of {receipt.HealthScore:F0} at {receipt.Vendor} is significantly lower than your average of {avgHealthScore:F0}.",
                    Severity = "warning",
                    Date = receipt.Date,
                    ReceiptId = receipt.Id
                });
            }
        }

        return alerts.OrderByDescending(a => a.Date).ToList();
    }

    public async Task<BudgetPrediction> PredictMonthlyBudgetAsync()
    {
        // Get last 3 months of data
        var threeMonthsAgo = DateTime.Now.AddMonths(-3);
        var receipts = await _context.Receipts
            .Include(r => r.CategorySummary)
            .Where(r => r.Date >= threeMonthsAgo)
            .ToListAsync();

        if (!receipts.Any())
        {
            return new BudgetPrediction
            {
                PredictedTotal = 0,
                PredictedHealthy = 0,
                PredictedJunk = 0,
                Confidence = "low",
                Message = "Not enough historical data for prediction"
            };
        }

        // Calculate monthly averages
        var monthlyTotals = receipts
            .GroupBy(r => new { r.Date.Year, r.Date.Month })
            .Select(g => new
            {
                Total = g.Sum(r => r.Total),
                Healthy = g.Sum(r => r.CategorySummary?.HealthyTotal ?? 0),
                Junk = g.Sum(r => r.CategorySummary?.JunkTotal ?? 0)
            })
            .ToList();

        var avgMonthlyTotal = monthlyTotals.Average(m => m.Total);
        var avgHealthy = monthlyTotals.Average(m => m.Healthy);
        var avgJunk = monthlyTotals.Average(m => m.Junk);

        // Check current month progress
        var currentMonth = DateTime.Now;
        var currentMonthReceipts = receipts.Where(r => r.Date.Year == currentMonth.Year && r.Date.Month == currentMonth.Month).ToList();
        var currentMonthSpend = currentMonthReceipts.Sum(r => r.Total);
        var daysIntoMonth = currentMonth.Day;
        var daysInMonth = DateTime.DaysInMonth(currentMonth.Year, currentMonth.Month);
        var projectionMultiplier = (decimal)daysInMonth / daysIntoMonth;

        var predicted = currentMonthSpend * projectionMultiplier;

        return new BudgetPrediction
        {
            PredictedTotal = predicted,
            PredictedHealthy = avgHealthy * projectionMultiplier,
            PredictedJunk = avgJunk * projectionMultiplier,
            CurrentMonthSpend = currentMonthSpend,
            AverageMonthlySpend = avgMonthlyTotal,
            Confidence = monthlyTotals.Count >= 3 ? "high" : "medium",
            Message = $"Based on your spending pattern, you'll likely spend around {predicted:C} this month."
        };
    }

    private string BuildDataContext(List<Receipt> receipts)
    {
        var totalSpent = receipts.Sum(r => r.Total);
        var avgHealthScore = receipts.Any() ? receipts.Average(r => r.HealthScore) : 0;
        var totalHealthy = receipts.Sum(r => r.CategorySummary?.HealthyTotal ?? 0);
        var totalJunk = receipts.Sum(r => r.CategorySummary?.JunkTotal ?? 0);

        var topVendors = receipts
            .GroupBy(r => r.Vendor)
            .Select(g => new { Vendor = g.Key, Count = g.Count(), Total = g.Sum(r => r.Total) })
            .OrderByDescending(v => v.Total)
            .Take(5)
            .ToList();

        var topCategories = receipts
            .SelectMany(r => r.LineItems)
            .GroupBy(li => li.Category)
            .Select(g => new { Category = g.Key, Count = g.Count(), Total = g.Sum(li => li.Price) })
            .OrderByDescending(c => c.Total)
            .ToList();

        return $@"
Total Receipts: {receipts.Count}
Total Spent: {totalSpent:C}
Average Health Score: {avgHealthScore:F1}
Healthy Items: {totalHealthy:C} ({(totalSpent > 0 ? totalHealthy / totalSpent * 100 : 0):F1}%)
Junk Items: {totalJunk:C} ({(totalSpent > 0 ? totalJunk / totalSpent * 100 : 0):F1}%)

Top Vendors:
{string.Join("\n", topVendors.Select(v => $"- {v.Vendor}: {v.Count} visits, {v.Total:C}"))}

Category Breakdown:
{string.Join("\n", topCategories.Select(c => $"- {c.Category}: {c.Count} items, {c.Total:C}"))}

Date Range: {receipts.Min(r => r.Date):yyyy-MM-dd} to {receipts.Max(r => r.Date):yyyy-MM-dd}
";
    }

    private string BuildDetailedDataContext(List<Receipt> receipts, (DateTime start, DateTime end)? dateRange)
    {
        if (!receipts.Any())
        {
            return "No receipts found for the specified period.";
        }

        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"Found {receipts.Count} receipt(s)");
        
        if (dateRange.HasValue)
        {
            sb.AppendLine($"Date Range: {dateRange.Value.start:yyyy-MM-dd} to {dateRange.Value.end:yyyy-MM-dd}");
        }
        
        sb.AppendLine();

        // Group receipts by date for better organization
        var receiptsByDate = receipts
            .OrderByDescending(r => r.Date)
            .GroupBy(r => r.Date.Date);

        foreach (var dateGroup in receiptsByDate)
        {
            sb.AppendLine($"=== {dateGroup.Key:dddd, MMMM d, yyyy} ===");
            
            foreach (var receipt in dateGroup)
            {
                sb.AppendLine($"\n{receipt.Vendor} - Receipt #{receipt.Id}");
                sb.AppendLine($"Total: {receipt.Total:C} | Health Score: {receipt.HealthScore:F0}");
                
                if (receipt.LineItems?.Any() == true)
                {
                    sb.AppendLine("\nItems purchased:");
                    foreach (var item in receipt.LineItems.OrderBy(li => li.Category))
                    {
                        var quantity = item.Quantity > 0 ? $"{item.Quantity}x " : "";
                        sb.AppendLine($"  • {quantity}{item.Description} - {item.Price:C} ({item.Category})");
                    }
                }
                
                if (receipt.CategorySummary != null)
                {
                    sb.AppendLine($"\nCategory Summary:");
                    sb.AppendLine($"  Healthy: {receipt.CategorySummary.HealthyTotal:C}");
                    sb.AppendLine($"  Junk: {receipt.CategorySummary.JunkTotal:C}");
                }
                
                sb.AppendLine();
            }
        }

        // Add summary
        var totalSpent = receipts.Sum(r => r.Total);
        var totalItems = receipts.Sum(r => r.LineItems?.Count ?? 0);
        sb.AppendLine($"\n=== Summary ===");
        sb.AppendLine($"Total Spent: {totalSpent:C}");
        sb.AppendLine($"Total Items: {totalItems}");
        sb.AppendLine($"Average Receipt: {(receipts.Count > 0 ? totalSpent / receipts.Count : 0):C}");

        return sb.ToString();
    }

    private (DateTime start, DateTime end)? ParseDateFromQuery(string query)
    {
        var queryLower = query.ToLower();
        var now = DateTime.Now;

        // Specific date patterns like "6th of feb", "february 6", "6 february"
        var datePatterns = new[]
        {
            @"(\d+)(st|nd|rd|th)?\s+of\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*",
            @"(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d+)",
            @"(\d+)\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*"
        };

        foreach (var pattern in datePatterns)
        {
            var match = System.Text.RegularExpressions.Regex.Match(queryLower, pattern);
            if (match.Success)
            {
                var monthName = match.Groups.Cast<System.Text.RegularExpressions.Group>()
                    .FirstOrDefault(g => g.Value.Length == 3 && !int.TryParse(g.Value, out _))?.Value;
                var dayStr = match.Groups.Cast<System.Text.RegularExpressions.Group>()
                    .FirstOrDefault(g => int.TryParse(g.Value, out _))?.Value;

                if (monthName != null && dayStr != null && int.TryParse(dayStr, out int day))
                {
                    var monthMap = new Dictionary<string, int>
                    {
                        {"jan", 1}, {"feb", 2}, {"mar", 3}, {"apr", 4},
                        {"may", 5}, {"jun", 6}, {"jul", 7}, {"aug", 8},
                        {"sep", 9}, {"oct", 10}, {"nov", 11}, {"dec", 12}
                    };

                    if (monthMap.TryGetValue(monthName, out int month))
                    {
                        var year = now.Year;
                        // If the month is in the future, assume last year
                        if (month > now.Month) year--;

                        try
                        {
                            var date = new DateTime(year, month, day);
                            return (date.Date, date.Date.AddDays(1).AddSeconds(-1));
                        }
                        catch
                        {
                            // Invalid date, continue
                        }
                    }
                }
            }
        }

        // Month-based queries like "february", "last month"
        if (queryLower.Contains("february") || queryLower.Contains("feb"))
        {
            var year = now.Month < 2 ? now.Year - 1 : now.Year;
            return (new DateTime(year, 2, 1), new DateTime(year, 2, DateTime.DaysInMonth(year, 2), 23, 59, 59));
        }

        if (queryLower.Contains("january") || queryLower.Contains("jan"))
        {
            var year = now.Month == 1 ? now.Year : now.Year - 1;
            return (new DateTime(year, 1, 1), new DateTime(year, 1, 31, 23, 59, 59));
        }

        // Relative date queries
        if (queryLower.Contains("today"))
        {
            return (now.Date, now.Date.AddDays(1).AddSeconds(-1));
        }

        if (queryLower.Contains("yesterday"))
        {
            var yesterday = now.AddDays(-1).Date;
            return (yesterday, yesterday.AddDays(1).AddSeconds(-1));
        }

        if (queryLower.Contains("last week"))
        {
            return (now.AddDays(-7).Date, now.Date.AddDays(1).AddSeconds(-1));
        }

        if (queryLower.Contains("this week"))
        {
            var startOfWeek = now.AddDays(-(int)now.DayOfWeek).Date;
            return (startOfWeek, now.Date.AddDays(1).AddSeconds(-1));
        }

        if (queryLower.Contains("last month"))
        {
            var lastMonth = now.AddMonths(-1);
            return (new DateTime(lastMonth.Year, lastMonth.Month, 1), 
                    new DateTime(lastMonth.Year, lastMonth.Month, DateTime.DaysInMonth(lastMonth.Year, lastMonth.Month), 23, 59, 59));
        }

        return null;
    }

    private double CalculateStandardDeviation(List<double> values)
    {
        if (values.Count < 2) return 0;

        var avg = values.Average();
        var sumOfSquares = values.Sum(v => Math.Pow(v - avg, 2));
        return Math.Sqrt(sumOfSquares / (values.Count - 1));
    }
}

public class AnomalyAlert
{
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Severity { get; set; } = "info"; // info, warning, error
    public DateTime Date { get; set; }
    public int? ReceiptId { get; set; }
}

public class BudgetPrediction
{
    public decimal PredictedTotal { get; set; }
    public decimal PredictedHealthy { get; set; }
    public decimal PredictedJunk { get; set; }
    public decimal CurrentMonthSpend { get; set; }
    public decimal AverageMonthlySpend { get; set; }
    public string Confidence { get; set; } = "medium";
    public string Message { get; set; } = string.Empty;
}
