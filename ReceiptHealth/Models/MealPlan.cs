namespace ReceiptHealth.Models;

public class MealPlan
{
    public int Id { get; set; }
    public string Name { get; set; } = "Weekly Meal Plan";
    public DateTime CreatedAt { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = true;
    public string? DietaryPreference { get; set; } // Healthy, CheatDay, HighProtein, LowCarb, Vegetarian, Vegan
    
    // Navigation properties
    public ICollection<MealPlanDay> Days { get; set; } = new List<MealPlanDay>();
}

public class MealPlanDay
{
    public int Id { get; set; }
    public int MealPlanId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public DateTime Date { get; set; }
    public int RecipeId { get; set; }
    
    // Navigation properties
    public MealPlan MealPlan { get; set; } = null!;
    public Recipe Recipe { get; set; } = null!;
}

public class Recipe
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CookingTimeMinutes { get; set; }
    public int Servings { get; set; } = 4;
    public string Instructions { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    
    // Dietary tags
    public bool IsHealthy { get; set; }
    public bool IsHighProtein { get; set; }
    public bool IsLowCarb { get; set; }
    public bool IsVegetarian { get; set; }
    public bool IsVegan { get; set; }
    public bool IsCheatDay { get; set; }
    
    // Nutritional info (optional)
    public int? Calories { get; set; }
    public int? ProteinGrams { get; set; }
    public int? CarbsGrams { get; set; }
    public int? FatGrams { get; set; }
    
    // Navigation properties
    public ICollection<RecipeIngredient> Ingredients { get; set; } = new List<RecipeIngredient>();
    public ICollection<MealPlanDay> MealPlanDays { get; set; } = new List<MealPlanDay>();
}

public class RecipeIngredient
{
    public int Id { get; set; }
    public int RecipeId { get; set; }
    public string IngredientName { get; set; } = string.Empty;
    public string Quantity { get; set; } = string.Empty; // e.g., "2 cups", "500g", "1 tbsp"
    public string? Category { get; set; } // Produce, Meat, Dairy, etc.
    
    // Navigation property
    public Recipe Recipe { get; set; } = null!;
}
