namespace ReceiptHealth.Models;

public class PriceComparison
{
    public int Id { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string NormalizedName { get; set; } = string.Empty; // For matching similar items
    public string Vendor { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public DateTime Date { get; set; }
    public int? ReceiptId { get; set; }
    public int? LineItemId { get; set; }
    public string Currency { get; set; } = "USD";
    
    // Navigation properties
    public Receipt? Receipt { get; set; }
    public LineItem? LineItem { get; set; }
}
