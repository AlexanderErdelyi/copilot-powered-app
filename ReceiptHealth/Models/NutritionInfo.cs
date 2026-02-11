namespace ReceiptHealth.Models;

public class NutritionInfo
{
    public int Id { get; set; }
    public int LineItemId { get; set; }
    public int? Calories { get; set; }
    public decimal? Protein { get; set; } // grams
    public decimal? Carbohydrates { get; set; } // grams
    public decimal? Fat { get; set; } // grams
    public decimal? Fiber { get; set; } // grams
    public decimal? Sugar { get; set; } // grams
    public decimal? Sodium { get; set; } // milligrams
    public bool IsEstimated { get; set; } = true; // If estimated by AI vs. actual data
    public DateTime EstimatedAt { get; set; }
    
    // Navigation property
    public LineItem LineItem { get; set; } = null!;
}
