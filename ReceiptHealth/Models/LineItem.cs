namespace ReceiptHealth.Models;

public class LineItem
{
    public int Id { get; set; }
    public int ReceiptId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; } = 1;
    
    // New: Foreign key to Categories table
    public int? CategoryId { get; set; }
    
    // Deprecated: Keep for backward compatibility during migration
    public string Category { get; set; } = "Unknown";
    
    // Navigation properties
    public Receipt Receipt { get; set; } = null!;
    public Category? CategoryNavigation { get; set; }
}
