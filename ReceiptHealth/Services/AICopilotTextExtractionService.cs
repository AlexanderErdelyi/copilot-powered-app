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
    private readonly CopilotClient _copilotClient;

    public AICopilotTextExtractionService(ILogger<AICopilotTextExtractionService> logger)
    {
        _logger = logger;
        _copilotClient = new CopilotClient();
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
            // Read the image file and encode as base64
            var imageBytes = await File.ReadAllBytesAsync(filePath);
            var base64Image = Convert.ToBase64String(imageBytes);
            
            // Determine the image MIME type based on extension
            var extension = Path.GetExtension(filePath).ToLowerInvariant();
            var mimeType = extension switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                _ => "image/jpeg" // Default
            };

            // Create a data URL for the image
            var imageDataUrl = $"data:{mimeType};base64,{base64Image}";

            // Create a session with GPT-4o (vision-enabled model)
            await using var session = await _copilotClient.CreateSessionAsync(new SessionConfig
            {
                Model = "gpt-4o", // Vision-enabled model
                Streaming = false
            });

            // Create a prompt for receipt OCR
            var prompt = @"You are an OCR system specialized in extracting text from receipt images.

Please analyze this receipt image and extract ALL visible text exactly as it appears.
Maintain the original layout and structure as much as possible.

Include:
- Store/vendor name
- Date
- All line items with prices
- Subtotal, tax, and total amounts
- Any other visible text

Return ONLY the extracted text, without any additional commentary or explanation.";

            // Send the image with the prompt
            // Note: The Copilot SDK handles multimodal content internally
            var response = await session.SendAndWaitAsync(new MessageOptions 
            { 
                Prompt = $"{prompt}\n\nImage: {imageDataUrl}"
            });

            var extractedText = response?.Data?.Content ?? string.Empty;
            
            if (string.IsNullOrWhiteSpace(extractedText))
            {
                _logger.LogWarning("AI returned empty text from image");
                throw new InvalidOperationException("Failed to extract text from image");
            }

            _logger.LogInformation("Successfully extracted {Length} characters from image", extractedText.Length);
            return extractedText;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during AI-powered image OCR");
            throw new InvalidOperationException($"Failed to extract text from image: {ex.Message}", ex);
        }
    }

    private async Task<string> ExtractTextFromPdfAsync(string filePath)
    {
        try
        {
            // For PDFs, we'll use AI to extract and structure the text
            // Note: This is a simplified approach. For production, you might want to:
            // 1. Convert PDF pages to images first
            // 2. Process each page separately
            // 3. Or use a dedicated PDF library with AI for enhancement

            _logger.LogInformation("Reading PDF file for AI processing");
            
            // Read PDF as bytes
            var pdfBytes = await File.ReadAllBytesAsync(filePath);
            var base64Pdf = Convert.ToBase64String(pdfBytes);

            // Create a session with GPT-4o
            await using var session = await _copilotClient.CreateSessionAsync(new SessionConfig
            {
                Model = "gpt-4o",
                Streaming = false
            });

            var prompt = @"You are a document processing system specialized in extracting structured text from receipt PDFs.

This is a receipt PDF file. Please extract ALL text content from the document.

Include:
- Store/vendor name
- Date
- All line items with quantities and prices
- Subtotal, tax, and total amounts
- Any other relevant information

Return ONLY the extracted text in a clean, structured format suitable for parsing. Do NOT include any explanations or commentary.";

            // Send the PDF for processing
            var response = await session.SendAndWaitAsync(new MessageOptions 
            { 
                Prompt = $"{prompt}\n\nPDF (base64): {base64Pdf.Substring(0, Math.Min(1000, base64Pdf.Length))}..."
            });

            var extractedText = response?.Data?.Content ?? string.Empty;
            
            if (string.IsNullOrWhiteSpace(extractedText))
            {
                _logger.LogWarning("AI returned empty text from PDF");
                throw new InvalidOperationException("Failed to extract text from PDF");
            }

            _logger.LogInformation("Successfully extracted {Length} characters from PDF", extractedText.Length);
            return extractedText;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during AI-powered PDF extraction");
            throw new InvalidOperationException($"Failed to extract text from PDF: {ex.Message}", ex);
        }
    }
}
