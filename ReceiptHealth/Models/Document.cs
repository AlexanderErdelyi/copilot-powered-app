namespace ReceiptHealth.Models;

public class Document
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string Sha256Hash { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public DateTime UploadedAt { get; set; }
    public string Status { get; set; } = "Processing"; // Processing, Processed, Failed
    public string? ErrorMessage { get; set; }
    
    // Navigation property
    public Receipt? Receipt { get; set; }
}
