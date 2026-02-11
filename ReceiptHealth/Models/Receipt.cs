namespace ReceiptHealth.Models;

public class Receipt
{
    public int Id { get; set; }
    public int DocumentId { get; set; }
    public string Vendor { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public decimal Total { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Tax { get; set; }
    public string Currency { get; set; } = "USD";
    public string? RawText { get; set; }
    public decimal HealthScore { get; set; }
    public DateTime ProcessedAt { get; set; }
    
    // Navigation properties
    public Document Document { get; set; } = null!;
    public ICollection<LineItem> LineItems { get; set; } = new List<LineItem>();
    public CategorySummary? CategorySummary { get; set; }
}
