namespace ReceiptHealth.Models;

public class LineItem
{
    public int Id { get; set; }
    public int ReceiptId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; } = 1;
    public string Category { get; set; } = "Unknown"; // Healthy, Junk, Other, Unknown
    
    // Navigation property
    public Receipt Receipt { get; set; } = null!;
}
