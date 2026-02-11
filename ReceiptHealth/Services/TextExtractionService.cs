namespace ReceiptHealth.Services;

public interface ITextExtractionService
{
    Task<string> ExtractTextAsync(string filePath, string contentType);
}

public class TextExtractionService : ITextExtractionService
{
    private readonly ILogger<TextExtractionService> _logger;

    public TextExtractionService(ILogger<TextExtractionService> logger)
    {
        _logger = logger;
    }

    public async Task<string> ExtractTextAsync(string filePath, string contentType)
    {
        _logger.LogInformation("Extracting text from {FilePath} (Type: {ContentType})", filePath, contentType);

        // TODO(Copilot): Add Tesseract OCR support for images
        // TODO(Copilot): Add PDF text extraction support
        
        // For now, handle text files directly
        if (contentType.StartsWith("text/", StringComparison.OrdinalIgnoreCase))
        {
            return await File.ReadAllTextAsync(filePath);
        }

        // For images, return placeholder (will add Tesseract OCR)
        if (contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("OCR not yet implemented for images");
            return await GenerateMockReceiptText();
        }

        // For PDFs, return placeholder (will add PDF extraction)
        if (contentType == "application/pdf")
        {
            _logger.LogWarning("PDF text extraction not yet implemented");
            return await GenerateMockReceiptText();
        }

        throw new NotSupportedException($"Content type not supported: {contentType}");
    }

    // TODO(Copilot): Remove this mock method once OCR is implemented
    private async Task<string> GenerateMockReceiptText()
    {
        await Task.CompletedTask;
        return @"WHOLESOME MARKET
123 Health Street
Date: 2024-01-15

Fresh Salad Mix      $4.99
Organic Bananas      $3.50
Greek Yogurt         $5.99
Potato Chips         $2.99
Sparkling Water      $1.99

Subtotal: $19.46
Tax: $1.56
Total: $21.02";
    }
}
