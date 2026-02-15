namespace ReceiptHealth.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Color { get; set; } // Hex color code for UI
    public string? Icon { get; set; } // Emoji or icon identifier
    public bool IsSystemCategory { get; set; } = false; // Built-in categories (Healthy, Junk, Other)
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public int SortOrder { get; set; } = 0; // For custom ordering
}
