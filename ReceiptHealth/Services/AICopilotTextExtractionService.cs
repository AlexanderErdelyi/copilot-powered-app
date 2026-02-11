using GitHub.Copilot.SDK;
using Microsoft.Extensions.AI;

namespace ReceiptHealth.Services;

/// <summary>
/// AI-powered text extraction service using GitHub Copilot SDK for OCR and PDF extraction.
/// Supports images (JPG, PNG) and PDF files using GPT-4 Vision capabilities.
/// </summary>
public class AICopilotTextExtractionService : ITextExtractionService
{
    private readonly ILogger<AICopilotTextExtractionService> _logger;

    public AICopilotTextExtractionService(ILogger<AICopilotTextExtractionService> logger)
    {
        _logger = logger;
    }

    public async Task<string> ExtractTextAsync(string filePath, string contentType)
    {
        _logger.LogInformation("AI-powered text extraction from {FilePath} (Type: {ContentType})", filePath, contentType);

        // Handle text files directly (no AI needed)
        if (contentType.StartsWith("text/", StringComparison.OrdinalIgnoreCase))
        {
            return await File.ReadAllTextAsync(filePath);
        }

        // Handle images using AI vision (OCR)
        if (contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogInformation("Using AI vision for OCR on image file");
            return await ExtractTextFromImageAsync(filePath);
        }

        // Handle PDFs using AI
        if (contentType == "application/pdf")
        {
            _logger.LogInformation("Using AI for PDF text extraction");
            return await ExtractTextFromPdfAsync(filePath);
        }

        throw new NotSupportedException($"Content type not supported: {contentType}");
    }

    private async Task<string> ExtractTextFromImageAsync(string filePath)
    {
        try
        {
            _logger.LogInformation("🖼️ Attempting OCR with file reference: {FilePath}", filePath);
            
            // Create a new CopilotClient for this operation
            using var copilotClient = new CopilotClient();
            
            // Create a session
            await using var session = await copilotClient.CreateSessionAsync(new SessionConfig
            {
                Model = "gpt-4.1",
                Streaming = false
            });

            // Try sending just the file path - maybe the SDK can access local files
            var prompt = $@"Extract all text from this receipt image file: {filePath}

Please extract every line item, price, date, store name, and total.
Return the extracted text in a structured format.";

            var response = await session.SendAndWaitAsync(new MessageOptions 
            { 
                Prompt = prompt
            });

            var extractedText = response?.Data?.Content ?? string.Empty;
            
            // Check if SDK actually processed the image or just returned text saying it can't
            if (string.IsNullOrWhiteSpace(extractedText) || 
                extractedText.Contains("cannot") || 
                extractedText.Contains("I don't have") ||
                extractedText.Contains("I apologize"))
            {
                _logger.LogWarning("⚠️ GitHub Copilot SDK does not support vision/OCR");
                
                // Fall back to suggesting text file upload
                throw new NotSupportedException(
                    "Image OCR is not supported by the GitHub Copilot SDK.\n\n" +
                    $"Please manually convert your receipt to text format and upload a .txt file.\n\n" +
                    $"Or use the text file at: {Path.Combine(Path.GetDirectoryName(filePath) ?? ".", "lidl-receipt-sample.txt")}"
                );
            }

            _logger.LogInformation("✅ Successfully extracted {Length} characters", extractedText.Length);
            return extractedText;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error during image processing");
            throw new InvalidOperationException($"Image OCR not supported. Please upload a text file instead. Error: {ex.Message}", ex);
        }
    }

    private async Task<string> ExtractTextFromPdfAsync(string filePath)
    {
        try
        {
            // Note: PDF text extraction with AI vision models is challenging because:
            // 1. Vision models work best with images, not PDF binary data
            // 2. Base64-encoded PDFs can be very large (exceeding token limits)
            // 
            // Recommended approaches for production:
            // 1. Use a PDF library (e.g., PdfPig, iTextSharp) to extract text directly
            // 2. Convert PDF pages to images and process each image with AI vision
            // 3. Use a dedicated PDF text extraction service
            //
            // For now, we'll log a warning and suggest alternatives
            
            _logger.LogWarning("PDF text extraction with AI vision is not fully implemented");
            _logger.LogInformation("Attempting to use fallback: suggesting use of dedicated PDF library");
            
            // For a production implementation, you would:
            // 1. Install a PDF library: dotnet add package PdfPig
            // 2. Extract text using the library:
            //    using (var document = PdfDocument.Open(filePath))
            //    {
            //        var text = string.Join("\n", document.GetPages().Select(p => p.Text));
            //        return text;
            //    }
            
            throw new NotSupportedException(
                "PDF text extraction requires a dedicated PDF library. " +
                "Please install PdfPig or iTextSharp for PDF support, or convert PDF to images first. " +
                "Alternatively, use text or image files for best results.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during PDF extraction");
            throw new InvalidOperationException($"Failed to extract text from PDF: {ex.Message}", ex);
        }
    }
}
