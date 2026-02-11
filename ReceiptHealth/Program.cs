using Microsoft.EntityFrameworkCore;
using ReceiptHealth.Data;
using ReceiptHealth.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure console logging to ensure output is visible
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Information);

// Configure HTTP URL
builder.WebHost.UseUrls("http://localhost:5002");

Console.WriteLine("🚀 Starting ReceiptHealth server...");

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add DbContext
var dbPath = builder.Configuration["ReceiptHealth:DatabasePath"] ?? "./receipts.db";
builder.Services.AddDbContext<ReceiptHealthContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));

// Register application services
builder.Services.AddScoped<IFileStorageService, FileStorageService>();

// Configure AI-powered services (GitHub Copilot SDK integration)
// Set "ReceiptHealth:UseAI" to true in appsettings.json to enable AI-powered OCR and parsing
var useAI = builder.Configuration.GetValue<bool>("ReceiptHealth:UseAI", true); // Default to AI-powered

if (useAI)
{
    builder.Services.AddScoped<ITextExtractionService, AICopilotTextExtractionService>();
    builder.Services.AddScoped<IReceiptParserService, AICopilotReceiptParserService>();
    builder.Services.AddScoped<ICategoryService, AICopilotCategoryService>();
    Console.WriteLine("✨ AI-powered text extraction, receipt parsing, and categorization enabled (GitHub Copilot SDK)");
}
else
{
    builder.Services.AddScoped<ITextExtractionService, TextExtractionService>();
    builder.Services.AddScoped<IReceiptParserService, ReceiptParserService>();
    builder.Services.AddScoped<ICategoryService, RuleBasedCategoryService>();
    Console.WriteLine("📝 Using basic text extraction, receipt parsing, and rule-based categorization");
}
builder.Services.AddScoped<IHealthScoreService, HealthScoreService>();
builder.Services.AddScoped<IReceiptProcessingService, ReceiptProcessingService>();

var app = builder.Build();

// Enable static files (for serving HTML/JS/CSS)
app.UseDefaultFiles();
app.UseStaticFiles();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ReceiptHealthContext>();
    context.Database.EnsureCreated();
    Console.WriteLine($"✅ Database initialized at: {dbPath}");
    app.Logger.LogInformation("Database initialized at: {DbPath}", dbPath);
}

Console.WriteLine("📡 Setting up API endpoints...");

// API Endpoints

// Test endpoint to verify server is working
app.MapGet("/api/test", () =>
{
    Console.WriteLine("🧪 Test endpoint called");
    return Results.Ok(new { status = "OK", message = "Server is running", timestamp = DateTime.UtcNow });
});

// Global processing status tracking with detailed progress
var processingStatus = new System.Collections.Concurrent.ConcurrentDictionary<int, ProcessingStatusDetails>();

// Capture root service provider for background tasks (won't be disposed when request ends)
var rootServiceProvider = app.Services;

// Upload endpoint with background processing
app.MapPost("/api/upload", async (HttpRequest request, IServiceProvider serviceProvider) =>
{
    Console.WriteLine($"📤 Upload endpoint called - Files: {request.Form?.Files?.Count ?? 0}");
    
    if (!request.HasFormContentType || request.Form.Files.Count == 0)
    {
        Console.WriteLine("❌ No files in upload request");
        return Results.BadRequest(new { error = "No files uploaded" });
    }

    var results = new List<object>();
    
    // Process uploads immediately to get document IDs, then process in background
    foreach (var file in request.Form.Files)
    {
        try
        {
            using var scope = serviceProvider.CreateScope();
            var processingService = scope.ServiceProvider.GetRequiredService<IReceiptProcessingService>();
            var context = scope.ServiceProvider.GetRequiredService<ReceiptHealthContext>();
            
            // Quick upload to get document ID
            var document = await processingService.ProcessUploadAsync(file);
            
            // Check if this document already has a receipt (duplicate that's already been processed or is being processed)
            var existingReceipt = await context.Receipts.FirstOrDefaultAsync(r => r.DocumentId == document.Id);
            
            if (existingReceipt != null)
            {
                processingStatus[document.Id] = new ProcessingStatusDetails(
                    "Completed",
                    $"Duplicate file detected - already processed (Receipt ID: {existingReceipt.Id})",
                    DateTime.UtcNow
                );
                
                results.Add(new
                {
                    id = document.Id,
                    fileName = document.FileName,
                    status = "duplicate",
                    message = $"Duplicate file detected - already processed"
                });
                
                continue;
            }
            
            processingStatus[document.Id] = new ProcessingStatusDetails(
                "Processing",
                "Receipt uploaded, starting OCR...",
                DateTime.UtcNow
            );
            
            // Start background processing with status updates
            var documentId = document.Id;
            _ = Task.Run(async () =>
            {
                Console.WriteLine($"🔄 Background processing started for document {documentId}");
                try
                {
                    using var bgScope = rootServiceProvider.CreateScope();
                    var bgProcessingService = bgScope.ServiceProvider.GetRequiredService<IReceiptProcessingService>();
                    
                    await bgProcessingService.ProcessDocumentAsync(documentId, (status, message, data) =>
                    {
                        Console.WriteLine($"📊 Status update for doc {documentId}: {message}");
                        
                        // Safely extract properties from dynamic data object
                        string? ocrText = null;
                        int? itemCount = null;
                        int? categorizedCount = null;
                        int? totalItems = null;
                        
                        if (data != null)
                        {
                            try
                            {
                                var dataType = data.GetType();
                                ocrText = dataType.GetProperty("ocrText")?.GetValue(data) as string;
                                itemCount = dataType.GetProperty("itemCount")?.GetValue(data) as int?;
                                categorizedCount = dataType.GetProperty("categorizedCount")?.GetValue(data) as int?;
                                totalItems = dataType.GetProperty("totalItems")?.GetValue(data) as int?;
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"⚠️ Error extracting properties from status data: {ex.Message}");
                            }
                        }
                        
                        processingStatus[documentId] = new ProcessingStatusDetails(
                            status,
                            message,
                            DateTime.UtcNow,
                            ocrText,
                            itemCount,
                            categorizedCount,
                            totalItems
                        );
                    });
                    Console.WriteLine($"✅ Background processing completed for document {documentId}");
                }
                catch (Exception bgEx)
                {
                    Console.WriteLine($"❌ Background processing error for document {documentId}: {bgEx.Message}");
                    processingStatus[documentId] = new ProcessingStatusDetails(
                        "Error",
                        $"Processing failed: {bgEx.Message}",
                        DateTime.UtcNow
                    );
                }
            });
            
            results.Add(new
            {
                id = document.Id,
                fileName = document.FileName,
                status = "processing",
                message = "Upload successful, processing in background"
            });
        }
        catch (Exception ex)
        {
            results.Add(new
            {
                fileName = file.FileName,
                status = "error",
                error = ex.Message
            });
        }
    }

    return Results.Ok(new { uploads = results });
})
.DisableAntiforgery();

// Get processing status
app.MapGet("/api/upload/status/{documentId}", (int documentId, ReceiptHealthContext context) =>
{
    if (processingStatus.TryGetValue(documentId, out var status))
    {
        return Results.Ok(new
        {
            documentId,
            status = status.Status,
            message = status.Message,
            updatedAt = status.UpdatedAt,
            ocrText = status.OcrText != null ? $"{status.OcrText.Length} characters extracted" : null,
            itemCount = status.ItemCount,
            categorizedCount = status.CategorizedCount,
            totalItems = status.TotalItems,
            progress = status.TotalItems.HasValue && status.CategorizedCount.HasValue 
                ? (int)((double)status.CategorizedCount.Value / status.TotalItems.Value * 100)
                : 0
        });
    }
    
    // Check if receipt exists (processing completed)
    var receipt = context.Receipts
        .Include(r => r.LineItems)
        .FirstOrDefault(r => r.DocumentId == documentId);
    if (receipt != null)
    {
        return Results.Ok(new 
        { 
            documentId, 
            status = "Completed", 
            message = "Receipt processed successfully",
            receiptId = receipt.Id,
            updatedAt = receipt.ProcessedAt,
            itemCount = receipt.LineItems.Count,
            totalItems = receipt.LineItems.Count,
            categorizedCount = receipt.LineItems.Count,
            progress = 100
        });
    }
    
    return Results.NotFound(new { error = "Document not found" });
});

// Get all documents
app.MapGet("/api/documents", async (ReceiptHealthContext context) =>
{
    var documents = await context.Documents
        .OrderByDescending(d => d.UploadedAt)
        .Select(d => new
        {
            d.Id,
            d.FileName,
            d.Status,
            d.UploadedAt,
            d.ErrorMessage
        })
        .ToListAsync();

    return Results.Ok(documents);
});

// Get all receipts with details
app.MapGet("/api/receipts", async (ReceiptHealthContext context) =>
{
    var receipts = await context.Receipts
        .Include(r => r.Document)
        .Include(r => r.LineItems)
        .Include(r => r.CategorySummary)
        .OrderByDescending(r => r.Date)
        .Select(r => new
        {
            r.Id,
            r.Vendor,
            r.Date,
            r.Total,
            r.Currency,
            r.HealthScore,
            DocumentId = r.Document.Id,
            DocumentFileName = r.Document.FileName,
            LineItemCount = r.LineItems.Count,
            CategorySummary = r.CategorySummary != null ? new
            {
                r.CategorySummary.HealthyTotal,
                r.CategorySummary.JunkTotal,
                r.CategorySummary.OtherTotal,
                r.CategorySummary.UnknownTotal
            } : null
        })
        .ToListAsync();

    return Results.Ok(receipts);
});

// Get receipt details by ID
app.MapGet("/api/receipts/{id}", async (int id, ReceiptHealthContext context) =>
{
    var receipt = await context.Receipts
        .Include(r => r.Document)
        .Include(r => r.LineItems)
        .Include(r => r.CategorySummary)
        .FirstOrDefaultAsync(r => r.Id == id);

    if (receipt == null)
    {
        return Results.NotFound();
    }

    return Results.Ok(new
    {
        receipt.Id,
        receipt.Vendor,
        receipt.Date,
        receipt.Total,
        receipt.Subtotal,
        receipt.Tax,
        receipt.Currency,
        receipt.HealthScore,
        receipt.ProcessedAt,
        Document = new
        {
            receipt.Document.Id,
            receipt.Document.FileName,
            receipt.Document.FilePath
        },
        LineItems = receipt.LineItems.Select(li => new
        {
            li.Id,
            li.Description,
            li.Price,
            li.Quantity,
            li.Category
        }),
        CategorySummary = receipt.CategorySummary != null ? new
        {
            receipt.CategorySummary.HealthyTotal,
            receipt.CategorySummary.JunkTotal,
            receipt.CategorySummary.OtherTotal,
            receipt.CategorySummary.UnknownTotal,
            receipt.CategorySummary.HealthyCount,
            receipt.CategorySummary.JunkCount,
            receipt.CategorySummary.OtherCount,
            receipt.CategorySummary.UnknownCount
        } : null
    });
});

// Analytics: Monthly spend
app.MapGet("/api/analytics/monthly-spend", async (ReceiptHealthContext context, int? year) =>
{
    var targetYear = year ?? DateTime.Now.Year;
    
    var receipts = await context.Receipts
        .Where(r => r.Date.Year == targetYear)
        .ToListAsync();
    
    var monthlyData = receipts
        .GroupBy(r => r.Date.Month)
        .Select(g => new
        {
            Month = g.Key,
            TotalSpend = g.Sum(r => r.Total),
            ReceiptCount = g.Count(),
            AverageHealthScore = g.Average(r => r.HealthScore)
        })
        .OrderBy(x => x.Month)
        .ToList();

    return Results.Ok(new
    {
        year = targetYear,
        data = monthlyData
    });
});

// Analytics: Category breakdown
app.MapGet("/api/analytics/category-breakdown", async (ReceiptHealthContext context) =>
{
    var summaries = await context.CategorySummaries.ToListAsync();
    
    var breakdown = new
    {
        HealthyTotal = summaries.Sum(s => s.HealthyTotal),
        JunkTotal = summaries.Sum(s => s.JunkTotal),
        OtherTotal = summaries.Sum(s => s.OtherTotal),
        UnknownTotal = summaries.Sum(s => s.UnknownTotal),
        HealthyCount = summaries.Sum(s => s.HealthyCount),
        JunkCount = summaries.Sum(s => s.JunkCount),
        OtherCount = summaries.Sum(s => s.OtherCount),
        UnknownCount = summaries.Sum(s => s.UnknownCount)
    };

    return Results.Ok(breakdown);
});

// Delete receipt
app.MapDelete("/api/receipts/{id}", async (int id, ReceiptHealthContext context, IFileStorageService fileStorage) =>
{
    var receipt = await context.Receipts
        .Include(r => r.Document)
        .Include(r => r.LineItems)
        .Include(r => r.CategorySummary)
        .FirstOrDefaultAsync(r => r.Id == id);

    if (receipt == null)
    {
        return Results.NotFound(new { error = "Receipt not found" });
    }

    try
    {
        // Delete associated data
        if (receipt.LineItems != null)
        {
            context.LineItems.RemoveRange(receipt.LineItems);
        }
        
        if (receipt.CategorySummary != null)
        {
            context.CategorySummaries.Remove(receipt.CategorySummary);
        }
        
        // Delete the receipt
        context.Receipts.Remove(receipt);
        
        // Delete the document and file
        var document = receipt.Document;
        if (document != null)
        {
            // Delete physical file
            if (!string.IsNullOrEmpty(document.FilePath) && File.Exists(document.FilePath))
            {
                File.Delete(document.FilePath);
                Console.WriteLine($"🗑️ Deleted file: {document.FilePath}");
            }
            
            context.Documents.Remove(document);
        }
        
        await context.SaveChangesAsync();
        
        Console.WriteLine($"✅ Deleted receipt {id} and all associated data");
        
        return Results.Ok(new { message = "Receipt deleted successfully", id });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error deleting receipt {id}: {ex.Message}");
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

Console.WriteLine("✅ All endpoints configured");
Console.WriteLine("🌐 ReceiptHealth API is running on http://localhost:5002");
Console.WriteLine("📊 Dashboard: http://localhost:5002");
Console.WriteLine("📄 Receipts: http://localhost:5002/receipts.html");
Console.WriteLine("🧪 Test endpoint: http://localhost:5002/api/test");
Console.WriteLine(string.Empty);
Console.WriteLine("Waiting for requests...");
Console.WriteLine(string.Empty);

app.Logger.LogInformation("ReceiptHealth API is running on http://localhost:5002");

app.Run();

// Record types must be defined after top-level statements
public record ProcessingStatusDetails(
    string Status,
    string Message,
    DateTime UpdatedAt,
    string? OcrText = null,
    int? ItemCount = null,
    int? CategorizedCount = null,
    int? TotalItems = null
);

