using Microsoft.EntityFrameworkCore;
using ReceiptHealth.Data;
using ReceiptHealth.Models;

namespace ReceiptHealth.Services;

public interface IReceiptProcessingService
{
    Task<Document> ProcessUploadAsync(IFormFile file);
    Task ProcessDocumentAsync(int documentId, Action<string, string, object?>? statusUpdater = null);
}

public class ReceiptProcessingService : IReceiptProcessingService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ReceiptProcessingService> _logger;
    private readonly long _maxFileSizeBytes;

    public ReceiptProcessingService(
        IServiceProvider serviceProvider,
        IConfiguration configuration,
        ILogger<ReceiptProcessingService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _maxFileSizeBytes = configuration.GetValue<long>("ReceiptHealth:MaxFileSizeBytes", 15728640);
    }

    public async Task<Document> ProcessUploadAsync(IFormFile file)
    {
        _logger.LogInformation("Processing upload: {FileName} ({Size} bytes)", file.FileName, file.Length);

        // Validate file size
        if (file.Length > _maxFileSizeBytes)
        {
            throw new InvalidOperationException($"File size exceeds maximum allowed size of {_maxFileSizeBytes} bytes");
        }

        // Validate MIME type
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg", "application/pdf", "text/plain" };
        if (!allowedTypes.Contains(file.ContentType.ToLowerInvariant()))
        {
            throw new InvalidOperationException($"File type not supported: {file.ContentType}");
        }

        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ReceiptHealthContext>();
        var fileStorage = scope.ServiceProvider.GetRequiredService<IFileStorageService>();

        // Save file and compute hash
        var (filePath, sha256Hash) = await fileStorage.SaveFileAsync(file);

        // Check for duplicate
        var existingDoc = await context.Documents
            .FirstOrDefaultAsync(d => d.Sha256Hash == sha256Hash);
        
        if (existingDoc != null)
        {
            _logger.LogInformation("Duplicate file detected (SHA256: {Hash}), skipping processing", sha256Hash);
            return existingDoc;
        }

        // Create document record
        var document = new Document
        {
            FileName = file.FileName,
            FilePath = filePath,
            Sha256Hash = sha256Hash,
            ContentType = file.ContentType,
            FileSizeBytes = file.Length,
            UploadedAt = DateTime.UtcNow,
            Status = "Processing"
        };

        context.Documents.Add(document);
        await context.SaveChangesAsync();

        return document;
    }

    public async Task ProcessDocumentAsync(int documentId, Action<string, string, object?>? statusUpdater = null)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ReceiptHealthContext>();
            var textExtraction = scope.ServiceProvider.GetRequiredService<ITextExtractionService>();
            var receiptParser = scope.ServiceProvider.GetRequiredService<IReceiptParserService>();
            var categoryService = scope.ServiceProvider.GetRequiredService<ICategoryService>();
            var healthScoreService = scope.ServiceProvider.GetRequiredService<IHealthScoreService>();

            var document = await context.Documents.FindAsync(documentId);
            if (document == null)
            {
                _logger.LogError("Document {Id} not found", documentId);
                return;
            }

            _logger.LogInformation("Processing document {Id}: {FileName}", documentId, document.FileName);

            // Check if this document has already been processed (has a receipt)
            var existingReceipt = await context.Receipts
                .FirstOrDefaultAsync(r => r.DocumentId == documentId);
            
            if (existingReceipt != null)
            {
                _logger.LogInformation("Document {Id} already has a receipt (ID: {ReceiptId}), skipping processing", 
                    documentId, existingReceipt.Id);
                statusUpdater?.Invoke("Completed", "Already processed - duplicate detected", 
                    new { receiptId = existingReceipt.Id });
                return;
            }

            // Extract text
            statusUpdater?.Invoke("Processing", "Extracting text from receipt image...", null);
            _logger.LogInformation("📄 Extracting text from {FilePath} (Type: {ContentType})", document.FilePath, document.ContentType);
            var text = await textExtraction.ExtractTextAsync(document.FilePath, document.ContentType);
            _logger.LogInformation("✅ Extracted {Length} characters of text", text.Length);
            statusUpdater?.Invoke("Processing", $"OCR complete: {text.Length} characters extracted", new { ocrText = text, itemCount = (int?)null, totalItems = (int?)null, categorizedCount = (int?)null });

            // Parse receipt
            statusUpdater?.Invoke("Processing", "Parsing receipt structure and line items...", new { ocrText = text, itemCount = (int?)null, totalItems = (int?)null, categorizedCount = (int?)null });
            _logger.LogInformation("🔍 Parsing receipt...");
            var (receipt, lineItems) = await receiptParser.ParseReceiptAsync(text);
            _logger.LogInformation("✅ Parsed receipt: Vendor={Vendor}, Total={Total}, Items={Count}", 
                receipt.Vendor, receipt.Total, lineItems.Count);
            receipt.DocumentId = document.Id;
            statusUpdater?.Invoke("Processing", $"Found {lineItems.Count} items from {receipt.Vendor}", 
                new { ocrText = text, itemCount = lineItems.Count, totalItems = lineItems.Count });

            // Categorize line items using batch categorization (1 AI call instead of N calls)
            statusUpdater?.Invoke("Processing", $"Categorizing {lineItems.Count} items with AI...", 
                new { ocrText = text, itemCount = lineItems.Count, totalItems = lineItems.Count, categorizedCount = 0 });
            _logger.LogInformation("🏷️ Batch categorizing {Count} line items", lineItems.Count);
            
            var descriptions = lineItems.Select(i => i.Description).ToList();
            var categories = await categoryService.BatchCategorizeItemsAsync(descriptions);
            
            int categorized = 0;
            foreach (var item in lineItems)
            {
                item.Category = categories.TryGetValue(item.Description, out var category) ? category : "Unknown";
                categorized++;
                if (categorized % 5 == 0 || categorized == lineItems.Count)
                {
                    statusUpdater?.Invoke("Processing", $"Categorizing items: {categorized}/{lineItems.Count}", 
                        new { ocrText = text, itemCount = lineItems.Count, totalItems = lineItems.Count, categorizedCount = categorized });
                }
            }

            // Compute health score
            statusUpdater?.Invoke("Processing", "Computing health score...", 
                new { ocrText = text, itemCount = lineItems.Count, totalItems = lineItems.Count, categorizedCount = lineItems.Count });
            _logger.LogInformation("💯 Computing health score");
            receipt.HealthScore = healthScoreService.ComputeHealthScore(lineItems);

            // Prepare all database changes (batch them into a single transaction)
            statusUpdater?.Invoke("Processing", "Saving receipt to database...", 
                new { ocrText = text, itemCount = lineItems.Count, totalItems = lineItems.Count, categorizedCount = lineItems.Count });
            
            // Add receipt first to get its ID
            context.Receipts.Add(receipt);
            await context.SaveChangesAsync();

            // Now add line items with the receipt ID and compute summary (single SaveChanges)
            foreach (var item in lineItems)
            {
                item.ReceiptId = receipt.Id;
            }
            context.LineItems.AddRange(lineItems);

            // Compute category summary from already-categorized items
            var categorySummary = categoryService.ComputeCategorySummaryFromCategorizedItems(lineItems);
            categorySummary.ReceiptId = receipt.Id;
            context.CategorySummaries.Add(categorySummary);

            // Update document status
            document.Status = "Processed";
            
            // Save all changes in a single database transaction
            await context.SaveChangesAsync();

            statusUpdater?.Invoke("Completed", $"Receipt processed: {lineItems.Count} items categorized", 
                new { ocrText = text, itemCount = lineItems.Count, totalItems = lineItems.Count, categorizedCount = lineItems.Count, receiptId = receipt.Id });
            _logger.LogInformation("Successfully processed document {Id}", documentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing document {Id}", documentId);
            
            statusUpdater?.Invoke("Error", $"Processing failed: {ex.Message}", null);
            
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ReceiptHealthContext>();
            var document = await context.Documents.FindAsync(documentId);
            if (document != null)
            {
                document.Status = "Failed";
                document.ErrorMessage = ex.Message;
                await context.SaveChangesAsync();
            }
        }
    }
}
