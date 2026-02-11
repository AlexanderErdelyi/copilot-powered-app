namespace ReceiptHealth.Models;

public class CategorySummary
{
    public int Id { get; set; }
    public int ReceiptId { get; set; }
    public decimal HealthyTotal { get; set; }
    public decimal JunkTotal { get; set; }
    public decimal OtherTotal { get; set; }
    public decimal UnknownTotal { get; set; }
    public int HealthyCount { get; set; }
    public int JunkCount { get; set; }
    public int OtherCount { get; set; }
    public int UnknownCount { get; set; }
    
    // Navigation property
    public Receipt Receipt { get; set; } = null!;
}
