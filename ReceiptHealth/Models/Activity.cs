namespace ReceiptHealth.Models;

public class Activity
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty; // "receipt_upload", "category_added", "shopping_list_created", etc.
    public string Description { get; set; } = string.Empty;
    public string? EntityType { get; set; } // "receipt", "category", "shopping_list", etc.
    public int? EntityId { get; set; } // ID of the related entity
    public DateTime Timestamp { get; set; }
    public bool IsSuccess { get; set; } = true;
    public bool IsRead { get; set; } = false;
    public string? ErrorMessage { get; set; }
    public string? Icon { get; set; } // Icon for the activity
    public string? NavigateUrl { get; set; } // URL to navigate to when clicked
}
