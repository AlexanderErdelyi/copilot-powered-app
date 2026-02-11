using Microsoft.EntityFrameworkCore;
using ReceiptHealth.Data;
using ReceiptHealth.Models;

namespace ReceiptHealth.Services;

public interface IReceiptProcessingService
{
    Task<Document> ProcessUploadAsync(IFormFile file);
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

        // Process in background (in a real app, use a background job queue)
        _ = Task.Run(async () => await ProcessDocumentAsync(document.Id));

        return document;
    }

    private async Task ProcessDocumentAsync(int documentId)
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

            // Extract text
            var text = await textExtraction.ExtractTextAsync(document.FilePath, document.ContentType);

            // Parse receipt
            var (receipt, lineItems) = await receiptParser.ParseReceiptAsync(text);
            receipt.DocumentId = document.Id;

            // Categorize line items
            foreach (var item in lineItems)
            {
                item.Category = categoryService.CategorizeItem(item.Description, receipt.Vendor);
            }

            // Compute health score
            receipt.HealthScore = healthScoreService.ComputeHealthScore(lineItems);

            // Add to context
            context.Receipts.Add(receipt);
            await context.SaveChangesAsync();

            // Now add line items with the receipt ID
            foreach (var item in lineItems)
            {
                item.ReceiptId = receipt.Id;
            }
            context.LineItems.AddRange(lineItems);

            // Compute and save category summary
            var categorySummary = categoryService.ComputeCategorySummary(lineItems);
            categorySummary.ReceiptId = receipt.Id;
            context.CategorySummaries.Add(categorySummary);

            // Update document status
            document.Status = "Processed";
            await context.SaveChangesAsync();

            _logger.LogInformation("Successfully processed document {Id}", documentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing document {Id}", documentId);
            
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
