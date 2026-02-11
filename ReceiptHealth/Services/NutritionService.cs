using GitHub.Copilot.SDK;
using Microsoft.Extensions.AI;
using Microsoft.EntityFrameworkCore;
using ReceiptHealth.Data;
using ReceiptHealth.Models;

namespace ReceiptHealth.Services;

public interface INutritionService
{
    Task<NutritionInfo> EstimateNutritionAsync(LineItem lineItem);
    Task<DailyNutritionSummary> GetDailyNutritionAsync(DateTime date);
    Task<WeeklyNutritionSummary> GetWeeklyNutritionAsync(DateTime weekStart);
    Task PopulateNutritionDataAsync(Receipt receipt);
}

public class NutritionService : INutritionService
{
    private readonly ReceiptHealthContext _context;
    private readonly CopilotClient _copilotClient;

    // Recommended Daily Intake (RDI) based on 2000 calorie diet
    private const int RDI_CALORIES = 2000;
    private const decimal RDI_PROTEIN = 50;      // grams
    private const decimal RDI_CARBS = 275;       // grams
    private const decimal RDI_FAT = 78;          // grams
    private const decimal RDI_FIBER = 28;        // grams
    private const decimal RDI_SUGAR = 50;        // grams
    private const decimal RDI_SODIUM = 2300;     // mg

    public NutritionService(ReceiptHealthContext context)
    {
        _context = context;
        _copilotClient = new CopilotClient();
    }

    public async Task<NutritionInfo> EstimateNutritionAsync(LineItem lineItem)
    {
        // Check if we already have nutrition data
        var existing = await _context.NutritionInfos
            .FirstOrDefaultAsync(ni => ni.LineItemId == lineItem.Id);

        if (existing != null)
        {
            return existing;
        }

        // Use AI to estimate nutrition
        var prompt = $@"Estimate the nutritional information for this food item: '{lineItem.Description}' (Quantity: {lineItem.Quantity}).

Provide ONLY a JSON response with these fields (use null for unknown values):
{{
  ""calories"": <integer>,
  ""protein"": <decimal grams>,
  ""carbohydrates"": <decimal grams>,
  ""fat"": <decimal grams>,
  ""fiber"": <decimal grams>,
  ""sugar"": <decimal grams>,
  ""sodium"": <decimal milligrams>
}}

Estimate for typical serving sizes. If the item is clearly packaged (e.g., 'Pepsi 330ml'), estimate for that specific amount.";

        try
        {
            var session = await _copilotClient.CreateSessionAsync();
            var response = await session.SendAndWaitAsync(new MessageOptions { Prompt = prompt });
            
            var nutritionData = ParseNutritionResponse(response?.Data?.Content?.Trim() ?? "");
            
            var nutritionInfo = new NutritionInfo
            {
                LineItemId = lineItem.Id,
                Calories = nutritionData.Calories,
                Protein = nutritionData.Protein,
                Carbohydrates = nutritionData.Carbohydrates,
                Fat = nutritionData.Fat,
                Fiber = nutritionData.Fiber,
                Sugar = nutritionData.Sugar,
                Sodium = nutritionData.Sodium,
                IsEstimated = true,
                EstimatedAt = DateTime.UtcNow
            };

            _context.NutritionInfos.Add(nutritionInfo);
            await _context.SaveChangesAsync();

            return nutritionInfo;
        }
        catch
        {
            // Return default nutrition info if AI fails
            return new NutritionInfo
            {
                LineItemId = lineItem.Id,
                IsEstimated = true,
                EstimatedAt = DateTime.UtcNow
            };
        }
    }

    public async Task<DailyNutritionSummary> GetDailyNutritionAsync(DateTime date)
    {
        var receipts = await _context.Receipts
            .Include(r => r.LineItems)
            .Where(r => r.Date.Date == date.Date)
            .ToListAsync();

        var lineItemIds = receipts.SelectMany(r => r.LineItems.Select(li => li.Id)).ToList();
        
        var nutritionData = await _context.NutritionInfos
            .Where(ni => lineItemIds.Contains(ni.LineItemId))
            .ToListAsync();

        var summary = new DailyNutritionSummary
        {
            Date = date.Date,
            TotalCalories = nutritionData.Sum(n => n.Calories ?? 0),
            TotalProtein = nutritionData.Sum(n => n.Protein ?? 0),
            TotalCarbohydrates = nutritionData.Sum(n => n.Carbohydrates ?? 0),
            TotalFat = nutritionData.Sum(n => n.Fat ?? 0),
            TotalFiber = nutritionData.Sum(n => n.Fiber ?? 0),
            TotalSugar = nutritionData.Sum(n => n.Sugar ?? 0),
            TotalSodium = nutritionData.Sum(n => n.Sodium ?? 0)
        };

        // Calculate percentages of RDI
        summary.CaloriesPercent = ((decimal)summary.TotalCalories / RDI_CALORIES) * 100;
        summary.ProteinPercent = (summary.TotalProtein / RDI_PROTEIN) * 100;
        summary.CarbsPercent = (summary.TotalCarbohydrates / RDI_CARBS) * 100;
        summary.FatPercent = (summary.TotalFat / RDI_FAT) * 100;
        summary.FiberPercent = (summary.TotalFiber / RDI_FIBER) * 100;
        summary.SugarPercent = (summary.TotalSugar / RDI_SUGAR) * 100;
        summary.SodiumPercent = (summary.TotalSodium / RDI_SODIUM) * 100;

        return summary;
    }

    public async Task<WeeklyNutritionSummary> GetWeeklyNutritionAsync(DateTime weekStart)
    {
        var weekEnd = weekStart.AddDays(7);
        var dailySummaries = new List<DailyNutritionSummary>();

        for (var date = weekStart; date < weekEnd; date = date.AddDays(1))
        {
            var daily = await GetDailyNutritionAsync(date);
            dailySummaries.Add(daily);
        }

        return new WeeklyNutritionSummary
        {
            WeekStart = weekStart,
            WeekEnd = weekEnd,
            DailySummaries = dailySummaries,
            AverageCalories = dailySummaries.Any() ? (int)dailySummaries.Average(d => d.TotalCalories) : 0,
            AverageProtein = dailySummaries.Any() ? dailySummaries.Average(d => d.TotalProtein) : 0,
            AverageCarbs = dailySummaries.Any() ? dailySummaries.Average(d => d.TotalCarbohydrates) : 0,
            AverageFat = dailySummaries.Any() ? dailySummaries.Average(d => d.TotalFat) : 0
        };
    }

    public async Task PopulateNutritionDataAsync(Receipt receipt)
    {
        var lineItems = await _context.LineItems
            .Where(li => li.ReceiptId == receipt.Id)
            .ToListAsync();

        foreach (var item in lineItems)
        {
            await EstimateNutritionAsync(item);
        }
    }

    private (int? Calories, decimal? Protein, decimal? Carbohydrates, decimal? Fat, decimal? Fiber, decimal? Sugar, decimal? Sodium) ParseNutritionResponse(string response)
    {
        try
        {
            // Simple JSON parsing - extract values
            var json = System.Text.Json.JsonDocument.Parse(response);
            var root = json.RootElement;

            return (
                root.TryGetProperty("calories", out var cal) && cal.ValueKind == System.Text.Json.JsonValueKind.Number ? cal.GetInt32() : null,
                root.TryGetProperty("protein", out var pro) && pro.ValueKind == System.Text.Json.JsonValueKind.Number ? pro.GetDecimal() : null,
                root.TryGetProperty("carbohydrates", out var carb) && carb.ValueKind == System.Text.Json.JsonValueKind.Number ? carb.GetDecimal() : null,
                root.TryGetProperty("fat", out var fat) && fat.ValueKind == System.Text.Json.JsonValueKind.Number ? fat.GetDecimal() : null,
                root.TryGetProperty("fiber", out var fib) && fib.ValueKind == System.Text.Json.JsonValueKind.Number ? fib.GetDecimal() : null,
                root.TryGetProperty("sugar", out var sug) && sug.ValueKind == System.Text.Json.JsonValueKind.Number ? sug.GetDecimal() : null,
                root.TryGetProperty("sodium", out var sod) && sod.ValueKind == System.Text.Json.JsonValueKind.Number ? sod.GetDecimal() : null
            );
        }
        catch
        {
            return (null, null, null, null, null, null, null);
        }
    }
}

public class DailyNutritionSummary
{
    public DateTime Date { get; set; }
    public int TotalCalories { get; set; }
    public decimal TotalProtein { get; set; }
    public decimal TotalCarbohydrates { get; set; }
    public decimal TotalFat { get; set; }
    public decimal TotalFiber { get; set; }
    public decimal TotalSugar { get; set; }
    public decimal TotalSodium { get; set; }
    
    // Percentage of RDI
    public decimal CaloriesPercent { get; set; }
    public decimal ProteinPercent { get; set; }
    public decimal CarbsPercent { get; set; }
    public decimal FatPercent { get; set; }
    public decimal FiberPercent { get; set; }
    public decimal SugarPercent { get; set; }
    public decimal SodiumPercent { get; set; }
}

public class WeeklyNutritionSummary
{
    public DateTime WeekStart { get; set; }
    public DateTime WeekEnd { get; set; }
    public List<DailyNutritionSummary> DailySummaries { get; set; } = new();
    public int AverageCalories { get; set; }
    public decimal AverageProtein { get; set; }
    public decimal AverageCarbs { get; set; }
    public decimal AverageFat { get; set; }
}
