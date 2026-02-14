namespace ReceiptHealth.Models;

public class ShoppingList
{
    public int Id { get; set; }
    public string Name { get; set; } = "My Shopping List";
    public DateTime CreatedAt { get; set; }
    public DateTime? LastModifiedAt { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public ICollection<ShoppingListItem> Items { get; set; } = new List<ShoppingListItem>();
}

public class ShoppingListItem
{
    public int Id { get; set; }
    public int ShoppingListId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string NormalizedName { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public bool IsPurchased { get; set; } = false;
    public DateTime AddedAt { get; set; }
    public decimal? LastKnownPrice { get; set; }
    public string? LastKnownVendor { get; set; }
    
    // New: Foreign key to Categories table
    public int? CategoryId { get; set; }
    
    // Deprecated: Keep for backward compatibility during migration
    public string Category { get; set; } = "Unknown";
    
    // Navigation properties
    public ShoppingList ShoppingList { get; set; } = null!;
    public Category? CategoryNavigation { get; set; }
}
