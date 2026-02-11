using System.Text;
using System.Text.Json;
using GitHub.Copilot.SDK;
using Microsoft.Extensions.AI;
using Microsoft.EntityFrameworkCore;
using ReceiptHealth.Data;
using ReceiptHealth.Models;

namespace ReceiptHealth.Services;

public interface IMealPlannerService
{
    Task<MealPlan> CreateMealPlanAsync(string name, DateTime startDate, string? dietaryPreference = null);
    Task<MealPlan> GetMealPlanAsync(int id);
    Task<List<MealPlan>> GetAllMealPlansAsync();
    Task<MealPlan> GenerateWeeklyMealPlanAsync(string dietaryPreference, DateTime startDate);
    Task<ShoppingList> GenerateShoppingListFromMealPlanAsync(int mealPlanId, string shoppingListName);
    Task<bool> DeleteMealPlanAsync(int id);
    Task<List<Recipe>> GetRecipesAsync(string? dietaryPreference = null);
}

public class MealPlannerService : IMealPlannerService
{
    private readonly ReceiptHealthContext _context;
    private readonly IShoppingListService _shoppingListService;
    private readonly ILogger<MealPlannerService> _logger;
    private readonly CopilotClient _copilotClient;

    public MealPlannerService(
        ReceiptHealthContext context,
        IShoppingListService shoppingListService,
        ILogger<MealPlannerService> logger)
    {
        _context = context;
        _shoppingListService = shoppingListService;
        _logger = logger;
        _copilotClient = new CopilotClient();
    }

    public async Task<MealPlan> CreateMealPlanAsync(string name, DateTime startDate, string? dietaryPreference = null)
    {
        var mealPlan = new MealPlan
        {
            Name = name,
            CreatedAt = DateTime.UtcNow,
            StartDate = startDate.Date,
            EndDate = startDate.Date.AddDays(6),
            DietaryPreference = dietaryPreference
        };

        _context.MealPlans.Add(mealPlan);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created meal plan: {MealPlanId} - {Name}", mealPlan.Id, mealPlan.Name);
        return mealPlan;
    }

    public async Task<MealPlan> GetMealPlanAsync(int id)
    {
        var mealPlan = await _context.MealPlans
            .Include(mp => mp.Days)
                .ThenInclude(d => d.Recipe)
                    .ThenInclude(r => r.Ingredients)
            .FirstOrDefaultAsync(mp => mp.Id == id);

        if (mealPlan == null)
        {
            throw new ArgumentException($"Meal plan with ID {id} not found");
        }

        return mealPlan;
    }

    public async Task<List<MealPlan>> GetAllMealPlansAsync()
    {
        return await _context.MealPlans
            .Include(mp => mp.Days)
                .ThenInclude(d => d.Recipe)
            .OrderByDescending(mp => mp.CreatedAt)
            .ToListAsync();
    }

    public async Task<MealPlan> GenerateWeeklyMealPlanAsync(string dietaryPreference, DateTime startDate)
    {
        _logger.LogInformation("🤖 Generating AI-powered weekly meal plan with preference: {Preference}", dietaryPreference);

        // Create meal plan first
        var mealPlan = await CreateMealPlanAsync(
            $"{dietaryPreference} Meal Plan - Week of {startDate:MMM dd}",
            startDate,
            dietaryPreference);

        try
        {
            // Generate 7 dinner recipes using AI
            _logger.LogInformation("📝 Requesting 7 recipes from AI...");
            var recipes = await GenerateRecipesWithAIAsync(dietaryPreference, 7);
            _logger.LogInformation("✅ Received {Count} recipes from AI", recipes.Count);

            // Create meal plan days
            for (int i = 0; i < 7; i++)
            {
                var date = startDate.Date.AddDays(i);
                var recipe = recipes[i];

                var mealPlanDay = new MealPlanDay
                {
                    MealPlanId = mealPlan.Id,
                    DayOfWeek = date.DayOfWeek,
                    Date = date,
                    RecipeId = recipe.Id
                };

                _context.MealPlanDays.Add(mealPlanDay);
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("✅ Generated meal plan with {RecipeCount} recipes", recipes.Count);

            // Reload with all related data
            return await GetMealPlanAsync(mealPlan.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error generating meal plan: {Message}", ex.Message);
            
            // Delete the partially created meal plan if it was saved
            try
            {
                var entry = _context.Entry(mealPlan);
                if (entry.State != Microsoft.EntityFrameworkCore.EntityState.Detached)
                {
                    _context.MealPlans.Remove(mealPlan);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("🗑️ Cleaned up partial meal plan");
                }
            }
            catch (Exception cleanupEx)
            {
                _logger.LogError(cleanupEx, "❌ Error cleaning up meal plan");
            }
            
            throw new Exception($"Failed to generate meal plan: {ex.Message}", ex);
        }
    }

    private async Task<List<Recipe>> GenerateRecipesWithAIAsync(string dietaryPreference, int count)
    {
        try
        {
            var prompt = BuildRecipeGenerationPrompt(dietaryPreference, count);
            _logger.LogInformation("📤 Sending prompt to AI ({Length} chars)", prompt.Length);

            var session = await _copilotClient.CreateSessionAsync();
            _logger.LogInformation("✅ Copilot session created");
            
            // Increase timeout to 3 minutes for complex recipe generation
            var timeout = TimeSpan.FromMinutes(3);
            _logger.LogInformation("⏳ Waiting for AI response (timeout: {Timeout})", timeout);
            var response = await session.SendAndWaitAsync(new MessageOptions { Prompt = prompt }, timeout);

            var content = response?.Data?.Content?.Trim();
            if (string.IsNullOrEmpty(content))
            {
                _logger.LogError("❌ AI returned empty response");
                throw new Exception("AI returned empty response");
            }
            
            _logger.LogInformation("📝 AI Response received ({Length} chars): {Preview}...", 
                content.Length, 
                content[..Math.Min(100, content.Length)]);

            // Parse the JSON response
            var recipesData = ParseRecipesFromAI(content);
            _logger.LogInformation("✅ Parsed {Count} recipes from AI response", recipesData.Count);

            // Save recipes to database
            var recipes = new List<Recipe>();
            for (int i = 0; i < recipesData.Count; i++)
            {
                var recipeData = recipesData[i];
                _logger.LogInformation("💾 Saving recipe {Index}/{Total}: {Name}", i + 1, recipesData.Count, recipeData.Name);
                
                var recipe = new Recipe
                {
                    Name = recipeData.Name,
                    Description = recipeData.Description,
                    CookingTimeMinutes = recipeData.CookingTime,
                    Servings = recipeData.Servings,
                    Instructions = recipeData.Instructions,
                    ImageUrl = recipeData.ImageUrl ?? "🍽️",
                    CreatedAt = DateTime.UtcNow,
                    IsHealthy = dietaryPreference.Contains("Healthy", StringComparison.OrdinalIgnoreCase),
                    IsHighProtein = dietaryPreference.Contains("Protein", StringComparison.OrdinalIgnoreCase) || 
                                   dietaryPreference.Contains("Workout", StringComparison.OrdinalIgnoreCase),
                    IsLowCarb = dietaryPreference.Contains("Low Carb", StringComparison.OrdinalIgnoreCase) ||
                               dietaryPreference.Contains("Keto", StringComparison.OrdinalIgnoreCase),
                    IsVegetarian = dietaryPreference.Contains("Vegetarian", StringComparison.OrdinalIgnoreCase),
                    IsVegan = dietaryPreference.Contains("Vegan", StringComparison.OrdinalIgnoreCase),
                    IsCheatDay = dietaryPreference.Contains("Cheat", StringComparison.OrdinalIgnoreCase),
                    Calories = recipeData.Calories,
                    ProteinGrams = recipeData.Protein,
                    CarbsGrams = recipeData.Carbs,
                    FatGrams = recipeData.Fat
                };

                _context.Recipes.Add(recipe);
                await _context.SaveChangesAsync(); // Save to get ID

                // Add ingredients
                foreach (var ingredient in recipeData.Ingredients)
                {
                    var recipeIngredient = new RecipeIngredient
                    {
                        RecipeId = recipe.Id,
                        IngredientName = ingredient.Name,
                        Quantity = ingredient.Quantity,
                        Category = ingredient.Category
                    };
                    _context.RecipeIngredients.Add(recipeIngredient);
                }

                await _context.SaveChangesAsync();
                recipes.Add(recipe);
            }

            _logger.LogInformation("✅ Successfully saved {Count} recipes to database", recipes.Count);
            return recipes;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error generating recipes with AI: {Message}", ex.Message);
            throw new Exception($"Failed to generate recipes: {ex.Message}", ex);
        }
    }

    private string BuildRecipeGenerationPrompt(string dietaryPreference, int count)
    {
        return $@"Generate {count} delicious dinner recipes that can be made in under 60 minutes.

Dietary Preference: {dietaryPreference}

Requirements:
- Each recipe should take less than 60 minutes to prepare and cook
- Include variety (different proteins, cooking methods, cuisines)
- Appropriate for the dietary preference specified
- Include complete ingredient lists with quantities
- Provide clear, step-by-step instructions
- Include nutritional information (calories, protein, carbs, fat)

Return ONLY a valid JSON array with this exact structure (no markdown, no extra text):
[
  {{
    ""name"": ""Recipe Name"",
    ""description"": ""Brief description"",
    ""cookingTime"": 45,
    ""servings"": 4,
    ""instructions"": ""Step 1: ... Step 2: ..."",
    ""imageUrl"": ""🍽️"",
    ""calories"": 500,
    ""protein"": 30,
    ""carbs"": 40,
    ""fat"": 15,
    ""ingredients"": [
      {{
        ""name"": ""Chicken breast"",
        ""quantity"": ""500g"",
        ""category"": ""Meat""
      }}
    ]
  }}
]";
    }

    private List<RecipeData> ParseRecipesFromAI(string? content)
    {
        if (string.IsNullOrEmpty(content))
        {
            throw new Exception("Empty response from AI");
        }

        try
        {
            // Clean up the response - remove markdown code blocks if present
            content = content.Trim();
            if (content.StartsWith("```json"))
            {
                content = content.Substring(7);
            }
            if (content.StartsWith("```"))
            {
                content = content.Substring(3);
            }
            if (content.EndsWith("```"))
            {
                content = content.Substring(0, content.Length - 3);
            }
            content = content.Trim();

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var recipes = JsonSerializer.Deserialize<List<RecipeData>>(content, options);
            
            if (recipes == null || recipes.Count == 0)
            {
                throw new Exception("No recipes parsed from AI response");
            }

            return recipes;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "❌ Failed to parse AI response as JSON: {Content}", content);
            throw new Exception("Failed to parse recipes from AI response", ex);
        }
    }

    public async Task<ShoppingList> GenerateShoppingListFromMealPlanAsync(int mealPlanId, string shoppingListName)
    {
        var mealPlan = await GetMealPlanAsync(mealPlanId);

        // Create shopping list
        var shoppingList = await _shoppingListService.CreateShoppingListAsync(
            shoppingListName.IsNullOrEmpty() ? $"Shopping List - {mealPlan.Name}" : shoppingListName);

        // Collect all ingredients from all recipes
        var ingredientCounts = new Dictionary<string, (string quantity, string category)>();

        foreach (var day in mealPlan.Days)
        {
            foreach (var ingredient in day.Recipe.Ingredients)
            {
                var normalizedName = ingredient.IngredientName.ToLowerInvariant().Trim();
                
                if (!ingredientCounts.ContainsKey(normalizedName))
                {
                    ingredientCounts[normalizedName] = (ingredient.Quantity, ingredient.Category ?? "Unknown");
                }
            }
        }

        // Add items to shopping list
        foreach (var (ingredientName, (quantity, category)) in ingredientCounts)
        {
            await _shoppingListService.AddItemAsync(shoppingList.Id, ingredientName, 1);
        }

        _logger.LogInformation("✅ Generated shopping list with {ItemCount} items", ingredientCounts.Count);

        return await _shoppingListService.GetShoppingListAsync(shoppingList.Id);
    }

    public async Task<bool> DeleteMealPlanAsync(int id)
    {
        var mealPlan = await _context.MealPlans.FindAsync(id);
        if (mealPlan == null)
        {
            return false;
        }

        _context.MealPlans.Remove(mealPlan);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<Recipe>> GetRecipesAsync(string? dietaryPreference = null)
    {
        var query = _context.Recipes.Include(r => r.Ingredients).AsQueryable();

        if (!string.IsNullOrEmpty(dietaryPreference))
        {
            query = dietaryPreference.ToLowerInvariant() switch
            {
                "healthy" => query.Where(r => r.IsHealthy),
                "highprotein" or "workout" => query.Where(r => r.IsHighProtein),
                "lowcarb" or "keto" => query.Where(r => r.IsLowCarb),
                "vegetarian" => query.Where(r => r.IsVegetarian),
                "vegan" => query.Where(r => r.IsVegan),
                "cheatday" => query.Where(r => r.IsCheatDay),
                _ => query
            };
        }

        return await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
    }
}

// Helper classes for JSON parsing
internal class RecipeData
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CookingTime { get; set; }
    public int Servings { get; set; }
    public string Instructions { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int? Calories { get; set; }
    public int? Protein { get; set; }
    public int? Carbs { get; set; }
    public int? Fat { get; set; }
    public List<IngredientData> Ingredients { get; set; } = new();
}

internal class IngredientData
{
    public string Name { get; set; } = string.Empty;
    public string Quantity { get; set; } = string.Empty;
    public string? Category { get; set; }
}

// Extension method
internal static class StringExtensions
{
    public static bool IsNullOrEmpty(this string? str) => string.IsNullOrEmpty(str);
}
