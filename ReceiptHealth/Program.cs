using Microsoft.EntityFrameworkCore;
using ReceiptHealth.Data;
using ReceiptHealth.Services;
using ReceiptHealth.Models;
using ReceiptHealth; // For DatabaseMigration

var builder = WebApplication.CreateBuilder(args);

// Configure console logging to ensure output is visible
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Information);

// Configure HTTP URL
builder.WebHost.UseUrls("http://localhost:5100");

Console.WriteLine("🚀 Starting ReceiptHealth server...");

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS for React development
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactDevPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:5175")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

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

// Register new feature services
builder.Services.AddScoped<IPriceComparisonService, PriceComparisonService>();
builder.Services.AddScoped<IRecommendationService, RecommendationService>();
builder.Services.AddScoped<IShoppingListService, ShoppingListService>();
builder.Services.AddScoped<IGamificationService, GamificationService>();
builder.Services.AddScoped<IInsightsService, InsightsService>();
builder.Services.AddScoped<INutritionService, NutritionService>();
builder.Services.AddScoped<IMealPlannerService, MealPlannerService>();
builder.Services.AddScoped<VoiceAssistantService>();
builder.Services.AddScoped<ICategoryManagementService, CategoryManagementService>();

// Text-to-Speech service (Piper)
builder.Services.AddSingleton<IPiperTtsService, PiperTtsService>();
Console.WriteLine("🎵 Piper TTS service registered - local neural text-to-speech");

var app = builder.Build();

// Enable CORS
app.UseCors("ReactDevPolicy");

// Enable static files (for serving HTML/JS/CSS)
app.UseDefaultFiles();
app.UseStaticFiles();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Ensure database is created and migrated
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ReceiptHealthContext>();
    
    // Check if database file exists
    bool isNewDatabase = !File.Exists(dbPath);
    
    // Always ensure base schema is created first
    context.Database.EnsureCreated();
    Console.WriteLine($"✅ Database initialized at: {dbPath}");
    app.Logger.LogInformation("Database initialized at: {DbPath}", dbPath);
    
    // Run migrations only if database already existed (to add new columns/tables to existing schema)
    if (!isNewDatabase)
    {
        DatabaseMigration.MigrateDatabase($"Data Source={dbPath}");
    }
    else
    {
        Console.WriteLine("ℹ️  Fresh database created - migrations not needed");
    }
    
    // Initialize system categories
    var categoryService = scope.ServiceProvider.GetRequiredService<ICategoryManagementService>();
    await categoryService.EnsureSystemCategoriesExistAsync();
    Console.WriteLine("✅ System categories initialized");
}

Console.WriteLine("📡 Setting up API endpoints...");

// API Endpoints

// Test endpoint to verify server is working
app.MapGet("/api/test", () =>
{
    Console.WriteLine("🧪 Test endpoint called");
    return Results.Ok(new { status = "OK", message = "Server is running", timestamp = DateTime.UtcNow });
});

// Dashboard stats endpoint
app.MapGet("/api/dashboard/stats", async (ReceiptHealthContext context) =>
{
    var receipts = await context.Receipts.Include(r => r.LineItems).ToListAsync();
    var totalSpent = receipts.Sum(r => r.Total);
    var receiptCount = receipts.Count;
    var avgPerReceipt = receiptCount > 0 ? totalSpent / receiptCount : 0;
    
    // Calculate healthy percentage
    var totalItems = receipts.Sum(r => r.LineItems.Count);
    var healthyItems = receipts.Sum(r => r.LineItems.Count(li => li.Category == "Healthy"));
    var healthyPercentage = totalItems > 0 ? (int)((healthyItems * 100.0) / totalItems) : 0;
    
    return Results.Ok(new
    {
        totalSpent,
        receiptCount,
        healthyPercentage,
        avgPerReceipt
    });
});

// Dashboard category breakdown endpoint  
app.MapGet("/api/dashboard/category-breakdown", async (ReceiptHealthContext context) =>
{
    var lineItems = await context.LineItems.ToListAsync();
    var categoryTotals = lineItems
        .GroupBy(li => li.Category)
        .Select(g => new
        {
            name = g.Key,
            value = g.Sum(li => li.Price * li.Quantity),
            color = g.Key switch
            {
                "Healthy" => "#10b981",
                "Junk" => "#ef4444",
                "Other" => "#6b7280",
                _ => "#9ca3af"
            }
        })
        .Where(c => c.value > 0)
        .ToList();
    
    return Results.Ok(categoryTotals);
});

// Dashboard spending trends endpoint
app.MapGet("/api/dashboard/spending-trends", async (ReceiptHealthContext context) =>
{
    var sixMonthsAgo = DateTime.Now.AddMonths(-6);
    var receipts = await context.Receipts
        .Where(r => r.Date >= sixMonthsAgo)
        .ToListAsync();
    
    var monthlyData = receipts
        .GroupBy(r => new { r.Date.Year, r.Date.Month })
        .Select(g => new
        {
            year = g.Key.Year,
            month = g.Key.Month,
            date = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM"),
            amount = g.Sum(r => r.Total)
        })
        .OrderBy(x => x.year).ThenBy(x => x.month)
        .ToList();
    
    return Results.Ok(monthlyData);
});

// Global processing status tracking with detailed progress
var processingStatus = new System.Collections.Concurrent.ConcurrentDictionary<int, ProcessingStatusDetails>();

// Capture root service provider for background tasks (won't be disposed when request ends)
var rootServiceProvider = app.Services;

// Upload endpoint with background processing
app.MapPost("/api/upload", async (HttpRequest request, IServiceProvider serviceProvider) =>
{
    Console.WriteLine($"📤 Upload endpoint called - Files: {request.Form?.Files?.Count ?? 0}");
    
    if (!request.HasFormContentType || request.Form?.Files.Count == 0 || request.Form?.Files == null)
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

// Query receipts by date range (for AI Insights)
app.MapGet("/api/receipts/query", async (ReceiptHealthContext context, DateTime? startDate, DateTime? endDate, string? vendor = null) =>
{
    var query = context.Receipts
        .Include(r => r.Document)
        .Include(r => r.LineItems)
        .Include(r => r.CategorySummary)
        .AsQueryable();
    
    if (startDate.HasValue)
    {
        query = query.Where(r => r.Date >= startDate.Value);
    }
    
    if (endDate.HasValue)
    {
        query = query.Where(r => r.Date <= endDate.Value);
    }
    
    if (!string.IsNullOrEmpty(vendor))
    {
        query = query.Where(r => r.Vendor.Contains(vendor));
    }
    
    var receipts = await query
        .OrderByDescending(r => r.Date)
        .Select(r => new
        {
            r.Id,
            r.Vendor,
            r.Date,
            r.Total,
            r.Currency,
            r.HealthScore,
            LineItems = r.LineItems.Select(li => new
            {
                li.Id,
                li.Description,
                li.Quantity,
                li.Price,
                li.Category
            }).ToList(),
            CategorySummary = r.CategorySummary != null ? new
            {
                r.CategorySummary.HealthyTotal,
                r.CategorySummary.JunkTotal,
                r.CategorySummary.OtherTotal,
                r.CategorySummary.UnknownTotal
            } : null
        })
        .ToListAsync();
    
    return Results.Ok(new 
    {
        Count = receipts.Count,
        TotalAmount = receipts.Sum(r => r.Total),
        StartDate = startDate,
        EndDate = endDate,
        Receipts = receipts
    });
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

// Update line item category
app.MapPut("/api/lineitems/{id}/category", async (int id, ReceiptHealthContext context, UpdateLineItemCategoryRequest request) =>
{
    var lineItem = await context.LineItems
        .Include(li => li.Receipt)
            .ThenInclude(r => r.CategorySummary)
        .FirstOrDefaultAsync(li => li.Id == id);

    if (lineItem == null)
    {
        return Results.NotFound(new { error = "Line item not found" });
    }

    // Validate that the category exists
    var category = await context.Categories
        .FirstOrDefaultAsync(c => c.Id == request.CategoryId);

    if (category == null)
    {
        return Results.BadRequest(new { error = "Invalid category" });
    }

    var oldCategory = lineItem.Category;
    lineItem.Category = category.Name;
    lineItem.CategoryId = category.Id;

    // Recalculate category summary for the receipt
    if (lineItem.Receipt != null)
    {
        var allLineItems = await context.LineItems
            .Where(li => li.ReceiptId == lineItem.ReceiptId)
            .ToListAsync();

        var healthyTotal = allLineItems.Where(li => li.Category == "Healthy").Sum(li => li.Price);
        var junkTotal = allLineItems.Where(li => li.Category == "Junk").Sum(li => li.Price);
        var otherTotal = allLineItems.Where(li => li.Category == "Other").Sum(li => li.Price);
        var unknownTotal = allLineItems.Where(li => li.Category == "Unknown" || string.IsNullOrEmpty(li.Category)).Sum(li => li.Price);

        var healthyCount = allLineItems.Count(li => li.Category == "Healthy");
        var junkCount = allLineItems.Count(li => li.Category == "Junk");
        var otherCount = allLineItems.Count(li => li.Category == "Other");
        var unknownCount = allLineItems.Count(li => li.Category == "Unknown" || string.IsNullOrEmpty(li.Category));

        if (lineItem.Receipt.CategorySummary != null)
        {
            lineItem.Receipt.CategorySummary.HealthyTotal = healthyTotal;
            lineItem.Receipt.CategorySummary.JunkTotal = junkTotal;
            lineItem.Receipt.CategorySummary.OtherTotal = otherTotal;
            lineItem.Receipt.CategorySummary.UnknownTotal = unknownTotal;
            lineItem.Receipt.CategorySummary.HealthyCount = healthyCount;
            lineItem.Receipt.CategorySummary.JunkCount = junkCount;
            lineItem.Receipt.CategorySummary.OtherCount = otherCount;
            lineItem.Receipt.CategorySummary.UnknownCount = unknownCount;
        }

        // Recalculate health score
        var total = lineItem.Receipt.Total;
        if (total > 0)
        {
            var healthyPercentage = (healthyTotal / total) * 100;
            lineItem.Receipt.HealthScore = (int)healthyPercentage;
        }
    }

    await context.SaveChangesAsync();

    return Results.Ok(new
    {
        success = true,
        lineItem = new
        {
            lineItem.Id,
            lineItem.Description,
            lineItem.Category,
            lineItem.CategoryId,
            lineItem.Price,
            lineItem.Quantity
        },
        message = $"Category updated from {oldCategory} to {category.Name}"
    });
});

// Analytics: Get available years
app.MapGet("/api/analytics/available-years", async (ReceiptHealthContext context) =>
{
    var years = await context.Receipts
        .Select(r => r.Date.Year)
        .Distinct()
        .OrderByDescending(y => y)
        .ToListAsync();
    
    var currentYear = DateTime.Now.Year;
    if (!years.Contains(currentYear) && years.Count > 0)
    {
        // Add current year if no receipts yet for easier navigation
        years.Insert(0, currentYear);
    }
    else if (years.Count == 0)
    {
        // No receipts at all, just return current year
        years.Add(currentYear);
    }
    
    return Results.Ok(new { years });
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

// Analytics: Get line items by category (for drill-down)
app.MapGet("/api/analytics/category-items/{category}", async (string category, ReceiptHealthContext context) =>
{
    var items = await context.LineItems
        .Include(li => li.Receipt)
        .Where(li => li.Category.ToLower() == category.ToLower())
        .OrderByDescending(li => li.Receipt.Date)
        .Take(100) // Limit to 100 most recent items
        .Select(li => new
        {
            li.Id,
            li.Description,
            li.Price,
            li.Quantity,
            li.Category,
            ReceiptDate = li.Receipt.Date,
            Vendor = li.Receipt.Vendor
        })
        .ToListAsync();

    return Results.Ok(items);
});

// === Price Comparison Endpoints ===

// Compare prices for an item
app.MapGet("/api/price-comparison/{itemName}", async (string itemName, IPriceComparisonService priceComparisonService) =>
{
    var comparisons = await priceComparisonService.CompareItemPricesAsync(itemName);
    return Results.Ok(comparisons);
});

// Get price trends for an item
app.MapGet("/api/price-trends/{itemName}", async (string itemName, int days, IPriceComparisonService priceComparisonService) =>
{
    var trends = await priceComparisonService.GetPriceTrendsAsync(itemName, days);
    return Results.Ok(trends);
});

// === Recommendations Endpoints ===

// Get healthy alternatives for a junk item
app.MapGet("/api/recommendations/alternatives/{itemName}", async (string itemName, IRecommendationService recommendationService) =>
{
    var alternatives = await recommendationService.GetHealthyAlternativesAsync(itemName);
    return Results.Ok(alternatives);
});

// Get personalized category recommendations
app.MapGet("/api/recommendations/category", async (IRecommendationService recommendationService) =>
{
    var recommendations = await recommendationService.GetCategoryRecommendationsAsync();
    return Results.Ok(new { recommendations });
});

// === Shopping List Endpoints ===

// Get all shopping lists
app.MapGet("/api/shopping-lists", async (IShoppingListService shoppingListService) =>
{
    var lists = await shoppingListService.GetAllShoppingListsAsync();
    return Results.Ok(lists.Select(MapShoppingListToDto).ToList());
});

// Get a specific shopping list
app.MapGet("/api/shopping-lists/{id}", async (int id, IShoppingListService shoppingListService) =>
{
    try
    {
        var list = await shoppingListService.GetShoppingListAsync(id);
        return Results.Ok(MapShoppingListToDto(list));
    }
    catch (InvalidOperationException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

// Create a new shopping list
app.MapPost("/api/shopping-lists", async (HttpRequest request, IShoppingListService shoppingListService) =>
{
    var body = await request.ReadFromJsonAsync<CreateShoppingListRequest>();
    if (body == null || string.IsNullOrEmpty(body.Name))
    {
        return Results.BadRequest(new { error = "Name is required" });
    }
    
    var list = await shoppingListService.CreateShoppingListAsync(body.Name);
    return Results.Created($"/api/shopping-lists/{list.Id}", MapShoppingListToDto(list));
});

// Generate shopping list from healthy items
app.MapPost("/api/shopping-lists/generate", async (int? daysBack, string? mode, IShoppingListService shoppingListService) =>
{
    var days = daysBack ?? 30;
    var generationMode = mode ?? "healthy";
    
    var list = generationMode switch
    {
        "analyze" => await shoppingListService.GenerateFromHealthyItemsAsync(days),
        "weekly" => await shoppingListService.GenerateWeeklyEssentialsAsync(),
        "quick" => await shoppingListService.GenerateQuickMealListAsync(),
        _ => await shoppingListService.GenerateFromHealthyItemsAsync(days)
    };
    
    return Results.Created($"/api/shopping-lists/{list.Id}", MapShoppingListToDto(list));
});

// Generate shopping list from freeform text
app.MapPost("/api/shopping-lists/generate-from-text", async (HttpRequest request, IShoppingListService shoppingListService) =>
{
    var body = await request.ReadFromJsonAsync<GenerateFromTextRequest>();
    if (body == null || string.IsNullOrEmpty(body.Text))
    {
        return Results.BadRequest(new { error = "Text is required" });
    }
    
    var list = await shoppingListService.GenerateFromTextAsync(body.Text);
    return Results.Created($"/api/shopping-lists/{list.Id}", MapShoppingListToDto(list));
});

// Add item to shopping list
app.MapPost("/api/shopping-lists/{listId}/items", async (int listId, HttpRequest request, IShoppingListService shoppingListService) =>
{
    var body = await request.ReadFromJsonAsync<AddShoppingListItemRequest>();
    if (body == null || string.IsNullOrEmpty(body.ItemName))
    {
        return Results.BadRequest(new { error = "ItemName is required" });
    }
    
    try
    {
        var item = await shoppingListService.AddItemAsync(listId, body.ItemName, body.Quantity);
        // Project to anonymous object to avoid circular reference
        return Results.Created($"/api/shopping-lists/{listId}/items/{item.Id}", new
        {
            item.Id,
            item.ShoppingListId,
            item.ItemName,
            item.NormalizedName,
            item.Quantity,
            item.IsPurchased,
            item.AddedAt,
            item.LastKnownPrice,
            item.LastKnownVendor,
            item.Category
        });
    }
    catch (InvalidOperationException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

// Mark item as purchased/unpurchased
app.MapPatch("/api/shopping-lists/items/{itemId}", async (int itemId, HttpRequest request, IShoppingListService shoppingListService) =>
{
    var body = await request.ReadFromJsonAsync<UpdateItemStatusRequest>();
    if (body == null)
    {
        return Results.BadRequest(new { error = "Request body required" });
    }
    
    var success = await shoppingListService.MarkItemPurchasedAsync(itemId, body.IsPurchased);
    return success ? Results.Ok(new { success = true }) : Results.NotFound();
});

// Remove item from shopping list
app.MapDelete("/api/shopping-lists/items/{itemId}", async (int itemId, IShoppingListService shoppingListService) =>
{
    var success = await shoppingListService.RemoveItemAsync(itemId);
    return success ? Results.Ok(new { success = true }) : Results.NotFound();
});

// Delete shopping list
app.MapDelete("/api/shopping-lists/{listId}", async (int listId, IShoppingListService shoppingListService) =>
{
    try
    {
        var success = await shoppingListService.DeleteShoppingListAsync(listId);
        return success ? Results.Ok(new { success = true }) : Results.NotFound(new { error = "Shopping list not found" });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error deleting shopping list {listId}: {ex.Message}");
        return Results.Problem(ex.Message);
    }
});

// Get price alerts for shopping list
app.MapGet("/api/shopping-lists/{listId}/price-alerts", async (int listId, IShoppingListService shoppingListService) =>
{
    var alerts = await shoppingListService.GetPriceAlertsAsync(listId);
    return Results.Ok(alerts);
});

// Add recipe ingredients to shopping list
app.MapPost("/api/shopping-lists/add-from-recipe", async (HttpRequest request, IShoppingListService shoppingListService) =>
{
    try
    {
        var body = await request.ReadFromJsonAsync<AddRecipeToShoppingListRequest>();
        if (body == null)
        {
            return Results.BadRequest(new { error = "Invalid request body" });
        }

        var shoppingList = await shoppingListService.AddRecipeIngredientsAsync(body.RecipeId, body.ShoppingListId);
        return Results.Ok(MapShoppingListToDto(shoppingList));
    }
    catch (InvalidOperationException ex)
    {
        Console.WriteLine($"❌ {ex.Message}");
        return Results.BadRequest(new { error = ex.Message });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error adding recipe to shopping list: {ex.Message}");
        return Results.Problem(ex.Message);
    }
});

// === Meal Planner Endpoints ===

// Get all meal plans
app.MapGet("/api/meal-plans", async (IMealPlannerService mealPlannerService) =>
{
    try
    {
        var mealPlans = await mealPlannerService.GetAllMealPlansAsync();
        
        // Project to avoid circular references - return full recipe details for Weekly Planner
        var result = mealPlans.Select(mp => new
        {
            mp.Id,
            mp.Name,
            mp.CreatedAt,
            mp.StartDate,
            mp.EndDate,
            mp.DietaryPreference,
            mp.IsActive,
            DaysCount = mp.Days.Count,
            Days = mp.Days.Select(d => new
            {
                d.Id,
                d.DayOfWeek,
                d.Date,
                d.MealType,
                Recipe = d.Recipe != null ? new
                {
                    d.Recipe.Id,
                    d.Recipe.Name,
                    d.Recipe.Description,
                    d.Recipe.CookingTimeMinutes,
                    d.Recipe.Servings,
                    d.Recipe.Instructions,
                    d.Recipe.ImageUrl,
                    d.Recipe.Calories,
                    d.Recipe.ProteinGrams,
                    d.Recipe.CarbsGrams,
                    d.Recipe.FatGrams,
                    Ingredients = d.Recipe.Ingredients.Select(i => new
                    {
                        i.Id,
                        i.IngredientName,
                        i.Quantity,
                        i.Category
                    }).ToList()
                } : null
            }).ToList()
        }).ToList();
        
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error fetching meal plans: {ex.Message}");
        return Results.Problem(ex.Message);
    }
});

// Get specific meal plan
app.MapGet("/api/meal-plans/{id}", async (int id, IMealPlannerService mealPlannerService) =>
{
    try
    {
        var mealPlan = await mealPlannerService.GetMealPlanAsync(id);
        
        // Project to avoid circular references
        var result = new
        {
            mealPlan.Id,
            mealPlan.Name,
            mealPlan.CreatedAt,
            mealPlan.StartDate,
            mealPlan.EndDate,
            mealPlan.DietaryPreference,
            mealPlan.IsActive,
            Days = mealPlan.Days.Select(d => new
            {
                d.Id,
                d.DayOfWeek,
                d.Date,
                Recipe = new
                {
                    d.Recipe.Id,
                    d.Recipe.Name,
                    d.Recipe.Description,
                    d.Recipe.CookingTimeMinutes,
                    d.Recipe.Servings,
                    d.Recipe.Instructions,
                    d.Recipe.ImageUrl,
                    d.Recipe.Calories,
                    d.Recipe.ProteinGrams,
                    d.Recipe.CarbsGrams,
                    d.Recipe.FatGrams,
                    Ingredients = d.Recipe.Ingredients.Select(i => new
                    {
                        i.Id,
                        i.IngredientName,
                        i.Quantity,
                        i.Category
                    }).ToList()
                }
            }).ToList()
        };
        
        return Results.Ok(result);
    }
    catch (ArgumentException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error fetching meal plan {id}: {ex.Message}");
        return Results.Problem(ex.Message);
    }
});

// Generate AI-powered meal plan
app.MapPost("/api/meal-plans/generate", async (HttpRequest request, IMealPlannerService mealPlannerService) =>
{
    try
    {
        var body = await request.ReadFromJsonAsync<GenerateMealPlanRequest>();
        if (body == null || string.IsNullOrEmpty(body.DietaryPreference))
        {
            return Results.BadRequest(new { error = "Dietary preference is required" });
        }
        
        var startDate = body.StartDate ?? DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek); // Start of current week
        
        // Extract optional parameters with defaults
        int servings = body.Servings ?? 2;
        int days = body.Days ?? 7;
        bool includeBreakfast = body.IncludeBreakfast ?? true;
        bool includeLunch = body.IncludeLunch ?? true;
        bool includeDinner = body.IncludeDinner ?? true;
        
        Console.WriteLine($"🤖 Generating meal plan: {body.DietaryPreference}");
        Console.WriteLine($"📋 Settings: {days} days, {servings} servings, starting {startDate:yyyy-MM-dd}");
        Console.WriteLine($"🍽️ Meal types: Breakfast={includeBreakfast}, Lunch={includeLunch}, Dinner={includeDinner}");
        
        var mealPlan = await mealPlannerService.GenerateWeeklyMealPlanAsync(
            body.DietaryPreference, 
            startDate, 
            servings, 
            days, 
            includeBreakfast, 
            includeLunch, 
            includeDinner
        );
        
        // Project to avoid circular references
        var result = new
        {
            mealPlan.Id,
            mealPlan.Name,
            mealPlan.CreatedAt,
            mealPlan.StartDate,
            mealPlan.EndDate,
            mealPlan.DietaryPreference,
            DaysCount = mealPlan.Days.Count,
            Days = mealPlan.Days.Select(d => new
            {
                d.Id,
                d.DayOfWeek,
                d.Date,
                Recipe = new
                {
                    d.Recipe.Id,
                    d.Recipe.Name,
                    d.Recipe.Description,
                    d.Recipe.CookingTimeMinutes,
                    d.Recipe.ImageUrl
                }
            }).ToList()
        };
        
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error generating meal plan: {ex.Message}");
        Console.WriteLine($"   Stack trace: {ex.StackTrace}");
        if (ex.InnerException != null)
        {
            Console.WriteLine($"   Inner exception: {ex.InnerException.Message}");
            Console.WriteLine($"   Inner stack trace: {ex.InnerException.StackTrace}");
        }
        return Results.Json(new { 
            error = ex.Message,
            details = ex.InnerException?.Message,
            type = ex.GetType().Name
        }, statusCode: 500);
    }
});

// Generate meal plan from natural language
app.MapPost("/api/meal-plans/generate-single-meal", async (HttpRequest request, IMealPlannerService mealPlannerService, ReceiptHealthContext context) =>
{
    try
    {
        var body = await request.ReadFromJsonAsync<GenerateSingleMealRequest>();
        if (body == null)
        {
            return Results.BadRequest(new { error = "Request body is required" });
        }
        
        Recipe recipe;
        
        if (!string.IsNullOrEmpty(body.NaturalLanguagePrompt))
        {
            Console.WriteLine($"🤖 Generating single meal with AI text for {body.DayOfWeek} {body.MealType}: '{body.NaturalLanguagePrompt}'");
            recipe = await mealPlannerService.GenerateSingleRecipeFromNaturalLanguageAsync(
                body.NaturalLanguagePrompt,
                body.MealType ?? "Dinner",
                body.Servings ?? 2
            );
        }
        else
        {
            Console.WriteLine($"🍽️ Generating single meal for {body.DayOfWeek} {body.MealType} - {body.DietaryPreference}");
            recipe = await mealPlannerService.GenerateSingleRecipeAsync(
                body.DietaryPreference ?? "balanced",
                body.MealType ?? "Dinner",
                body.Servings ?? 2
            );
        }
        
        var now = DateTime.UtcNow;
        var dayOfWeek = Enum.Parse<DayOfWeek>(body.DayOfWeek ?? "Monday");
        var mealType = Enum.Parse<MealType>(body.MealType ?? "Dinner");
        
        // Calculate the date for this day of week (current or next occurrence)
        var today = DateTime.Today;
        int daysUntilTarget = ((int)dayOfWeek - (int)today.DayOfWeek + 7) % 7;
        if (daysUntilTarget == 0 && DateTime.Now.Hour >= 18) daysUntilTarget = 7;
        var targetDate = today.AddDays(daysUntilTarget);
        
        // Find or create the shared "My Weekly Meals" plan
        var sharedPlanName = "My Weekly Meals";
        var mealPlan = await context.MealPlans
            .Include(mp => mp.Days)
            .FirstOrDefaultAsync(mp => mp.Name == sharedPlanName && mp.IsActive);
        
        if (mealPlan == null)
        {
            Console.WriteLine($"📝 Creating new shared meal plan: {sharedPlanName}");
            mealPlan = new MealPlan
            {
                Name = sharedPlanName,
                CreatedAt = now,
                StartDate = targetDate,
                EndDate = targetDate,
                DietaryPreference = "Custom",
                IsActive = true
            };
            context.MealPlans.Add(mealPlan);
            await context.SaveChangesAsync();
        }
        else
        {
            Console.WriteLine($"📝 Adding to existing shared meal plan #{mealPlan.Id}");
            
            // Check if a meal already exists for this day/time and remove it
            var existingMeal = mealPlan.Days.FirstOrDefault(d => 
                d.DayOfWeek == dayOfWeek && d.MealType == mealType);
            
            if (existingMeal != null)
            {
                Console.WriteLine($"🔄 Replacing existing {dayOfWeek} {mealType} meal");
                context.MealPlanDays.Remove(existingMeal);
            }
            
            // Update start/end dates to encompass all meals
            if (targetDate < mealPlan.StartDate)
                mealPlan.StartDate = targetDate;
            if (targetDate > mealPlan.EndDate)
                mealPlan.EndDate = targetDate;
        }
        
        var mealPlanDay = new MealPlanDay
        {
            MealPlanId = mealPlan.Id,
            DayOfWeek = dayOfWeek,
            Date = targetDate,
            MealType = mealType,
            RecipeId = recipe.Id
        };
        
        context.MealPlanDays.Add(mealPlanDay);
        await context.SaveChangesAsync();
        
        Console.WriteLine($"✅ Added recipe #{recipe.Id} ({recipe.Name}) to meal plan #{mealPlan.Id} for {body.DayOfWeek} {body.MealType}");
        
        // Reload with full data
        var refreshedPlan = await context.MealPlans
            .Include(mp => mp.Days)
                .ThenInclude(d => d.Recipe)
                    .ThenInclude(r => r.Ingredients)
            .FirstOrDefaultAsync(mp => mp.Id == mealPlan.Id);
        
        if (refreshedPlan == null)
        {
            return Results.Problem("Failed to reload meal plan after creation");
        }
        
        // Return the complete meal plan structure
        return Results.Ok(new
        {
            refreshedPlan.Id,
            refreshedPlan.Name,
            refreshedPlan.CreatedAt,
            refreshedPlan.StartDate,
            refreshedPlan.EndDate,
            Days = refreshedPlan.Days.Select(d => new
            {
                d.Id,
                d.DayOfWeek,
                d.Date,
                d.MealType,
                Recipe = new
                {
                    d.Recipe.Id,
                    d.Recipe.Name,
                    d.Recipe.Description,
                    Ingredients = d.Recipe.Ingredients.Select(i => new
                    {
                        i.Id,
                        i.IngredientName,
                        i.Quantity,
                        i.Category
                    }).ToList(),
                    d.Recipe.Instructions,
                    d.Recipe.CookingTimeMinutes,
                    d.Recipe.Calories,
                    d.Recipe.ProteinGrams,
                    d.Recipe.CarbsGrams,
                    d.Recipe.FatGrams,
                    d.Recipe.ImageUrl,
                    d.Recipe.Servings
                }
            }).ToList()
        });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error generating single meal: {ex.Message}");
        Console.WriteLine($"   Stack trace: {ex.StackTrace}");
        return Results.Problem(ex.Message);
    }
});

app.MapPost("/api/meal-plans/generate-nl", async (HttpRequest request, IMealPlannerService mealPlannerService) =>
{
    try
    {
        var body = await request.ReadFromJsonAsync<GenerateMealPlanNLRequest>();
        if (body == null || string.IsNullOrEmpty(body.UserRequest))
        {
            return Results.BadRequest(new { error = "User request is required" });
        }
        
        var startDate = body.StartDate ?? DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek);
        
        // Extract optional parameters with defaults
        int servings = body.Servings ?? 2;
        int days = body.Days ?? 7;
        bool includeBreakfast = body.IncludeBreakfast ?? true;
        bool includeLunch = body.IncludeLunch ?? true;
        bool includeDinner = body.IncludeDinner ?? true;
        
        Console.WriteLine($"🤖 Generating meal plan from natural language: \"{body.UserRequest}\"");
        Console.WriteLine($"📋 Settings: {days} days, {servings} servings");
        Console.WriteLine($"🍽️ Meal types: Breakfast={includeBreakfast}, Lunch={includeLunch}, Dinner={includeDinner}");
        
        var mealPlan = await mealPlannerService.GenerateWeeklyMealPlanFromNaturalLanguageAsync(
            body.UserRequest, 
            startDate, 
            servings, 
            days, 
            includeBreakfast, 
            includeLunch, 
            includeDinner
        );
        
        // Project to avoid circular references
        var result = new
        {
            mealPlan.Id,
            mealPlan.Name,
            mealPlan.CreatedAt,
            mealPlan.StartDate,
            mealPlan.EndDate,
            mealPlan.DietaryPreference,
            DaysCount = mealPlan.Days.Count,
            Days = mealPlan.Days.Select(d => new
            {
                d.Id,
                d.DayOfWeek,
                d.Date,
                Recipe = new
                {
                    d.Recipe.Id,
                    d.Recipe.Name,
                    d.Recipe.Description,
                    d.Recipe.CookingTimeMinutes,
                    d.Recipe.ImageUrl
                }
            }).ToList()
        };
        
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error generating meal plan from natural language: {ex.Message}");
        Console.WriteLine($"   Stack trace: {ex.StackTrace}");
        if (ex.InnerException != null)
        {
            Console.WriteLine($"   Inner exception: {ex.InnerException.Message}");
            Console.WriteLine($"   Inner stack trace: {ex.InnerException.StackTrace}");
        }
        return Results.Json(new { 
            error = ex.Message,
            details = ex.InnerException?.Message,
            type = ex.GetType().Name
        }, statusCode: 500);
    }
});

// Generate shopping list from meal plan
app.MapPost("/api/meal-plans/{id}/shopping-list", async (int id, HttpRequest request, IMealPlannerService mealPlannerService) =>
{
    try
    {
        var body = await request.ReadFromJsonAsync<CreateShoppingListFromMealPlanRequest>();
        var name = body?.Name ?? "Meal Plan Shopping List";
        
        var shoppingList = await mealPlannerService.GenerateShoppingListFromMealPlanAsync(id, name);
        
        // Project to avoid circular references
        var result = new
        {
            shoppingList.Id,
            shoppingList.Name,
            shoppingList.CreatedAt,
            shoppingList.IsActive,
            Items = shoppingList.Items.Select(i => new
            {
                i.Id,
                i.ItemName,
                i.Quantity,
                i.Category,
                i.IsPurchased,
                i.LastKnownPrice,
                i.LastKnownVendor
            }).ToList()
        };
        
        return Results.Ok(result);
    }
    catch (ArgumentException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error generating shopping list from meal plan {id}: {ex.Message}");
        return Results.Problem(ex.Message);
    }
});

// Delete meal plan
app.MapDelete("/api/meal-plans/{id}", async (int id, IMealPlannerService mealPlannerService) =>
{
    try
    {
        var success = await mealPlannerService.DeleteMealPlanAsync(id);
        return success ? Results.Ok(new { success = true }) : Results.NotFound(new { error = "Meal plan not found" });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error deleting meal plan {id}: {ex.Message}");
        return Results.Problem(ex.Message);
    }
});

// Get recipes (optional - for future use)
app.MapGet("/api/recipes", async (IMealPlannerService mealPlannerService, string? dietaryPreference = null) =>
{
    try
    {
        var recipes = await mealPlannerService.GetRecipesAsync(dietaryPreference);
        
        // Project to avoid circular references
        var result = recipes.Select(r => new
        {
            r.Id,
            r.Name,
            r.Description,
            r.CookingTimeMinutes,
            r.Servings,
            r.ImageUrl,
            r.Calories,
            r.ProteinGrams,
            r.CarbsGrams,
            r.FatGrams,
            r.IsHealthy,
            r.IsHighProtein,
            r.IsLowCarb,
            r.IsVegetarian,
            r.IsVegan,
            r.IsCheatDay,
            IngredientsCount = r.Ingredients.Count
        }).ToList();
        
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error fetching recipes: {ex.Message}");
        return Results.Problem(ex.Message);
    }
});

// Get specific recipe by ID
app.MapGet("/api/recipes/{id}", async (int id, IMealPlannerService mealPlannerService) =>
{
    try
    {
        var recipe = await mealPlannerService.GetRecipeByIdAsync(id);
        
        if (recipe == null)
        {
            return Results.NotFound(new { error = $"Recipe with ID {id} not found" });
        }
        
        // Project to avoid circular references
        var result = new
        {
            recipe.Id,
            recipe.Name,
            recipe.Description,
            recipe.CookingTimeMinutes,
            recipe.Servings,
            recipe.Instructions,
            recipe.ImageUrl,
            recipe.Calories,
            recipe.ProteinGrams,
            recipe.CarbsGrams,
            recipe.FatGrams,
            recipe.IsHealthy,
            recipe.IsHighProtein,
            recipe.IsLowCarb,
            recipe.IsVegetarian,
            recipe.IsVegan,
            recipe.IsCheatDay,
            Ingredients = recipe.Ingredients.Select(i => new
            {
                i.Id,
                i.IngredientName,
                i.Quantity,
                i.Category
            }).ToList()
        };
        
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error fetching recipe {id}: {ex.Message}");
        return Results.Problem(ex.Message);
    }
});

// Add recipe to a specific meal slot
app.MapPost("/api/meal-plans/{mealPlanId}/add-recipe", async (int mealPlanId, HttpRequest request, IMealPlannerService mealPlannerService) =>
{
    try
    {
        var body = await request.ReadFromJsonAsync<AddRecipeToMealSlotRequest>();
        if (body == null)
        {
            return Results.BadRequest(new { error = "Invalid request body" });
        }

        var mealPlanDay = await mealPlannerService.AddRecipeToMealSlotAsync(
            mealPlanId, 
            body.RecipeId, 
            body.DayOfWeek, 
            body.MealType);

        return Results.Ok(new
        {
            mealPlanDay.Id,
            mealPlanDay.MealPlanId,
            mealPlanDay.DayOfWeek,
            mealPlanDay.Date,
            mealPlanDay.MealType,
            mealPlanDay.RecipeId
        });
    }
    catch (ArgumentException ex)
    {
        Console.WriteLine($"❌ {ex.Message}");
        return Results.BadRequest(new { error = ex.Message });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error adding recipe to meal slot: {ex.Message}");
        return Results.Problem(ex.Message);
    }
});

// Remove recipe from meal slot
app.MapDelete("/api/meal-plan-days/{mealPlanDayId}", async (int mealPlanDayId, IMealPlannerService mealPlannerService) =>
{
    try
    {
        var success = await mealPlannerService.RemoveRecipeFromMealSlotAsync(mealPlanDayId);
        return success ? Results.Ok(new { success = true }) : Results.NotFound(new { error = "Meal plan day not found" });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error removing recipe from meal slot: {ex.Message}");
        return Results.Problem(ex.Message);
    }
});

// === Gamification Endpoints ===

// Get all achievements
app.MapGet("/api/achievements", async (IGamificationService gamificationService) =>
{
    var achievements = await gamificationService.GetAchievementsAsync();
    return Results.Ok(achievements);
});

// Get active challenges
app.MapGet("/api/challenges", async (IGamificationService gamificationService) =>
{
    var challenges = await gamificationService.GetActiveChallengesAsync();
    return Results.Ok(challenges);
});

// Create a new challenge
app.MapPost("/api/challenges", async (HttpRequest request, IGamificationService gamificationService) =>
{
    var body = await request.ReadFromJsonAsync<CreateChallengeRequest>();
    if (body == null)
    {
        return Results.BadRequest(new { error = "Invalid request" });
    }
    
    var challenge = await gamificationService.CreateChallengeAsync(
        body.Name, body.Description, body.Type, body.TargetValue, body.DurationDays);
    return Results.Created($"/api/challenges/{challenge.Id}", challenge);
});

// Trigger achievement check (can be called after receipt processing)
app.MapPost("/api/achievements/check", async (IGamificationService gamificationService) =>
{
    await gamificationService.CheckAndUnlockAchievementsAsync();
    await gamificationService.UpdateChallengeProgressAsync();
    return Results.Ok(new { message = "Achievements and challenges updated" });
});

// Get next available achievements (not yet unlocked)
app.MapGet("/api/achievements/next", async (IGamificationService gamificationService) =>
{
    var nextAchievements = await gamificationService.GetNextAvailableAchievementsAsync();
    return Results.Ok(nextAchievements);
});

// Generate AI-powered challenge suggestions
app.MapGet("/api/challenges/generate", async (IGamificationService gamificationService, int count = 3) =>
{
    var suggestions = await gamificationService.GenerateAIChallengesAsync(count);
    return Results.Ok(suggestions);
});

// Track feature usage
app.MapPost("/api/features/track", async (HttpRequest request, IGamificationService gamificationService) =>
{
    var body = await request.ReadFromJsonAsync<TrackFeatureRequest>();
    if (body == null || string.IsNullOrEmpty(body.FeatureName))
    {
        return Results.BadRequest(new { error = "Feature name is required" });
    }
    
    await gamificationService.TrackFeatureUsageAsync(body.FeatureName, body.Details);
    return Results.Ok(new { message = "Feature usage tracked" });
});

// Check if there are new achievements for celebration
app.MapGet("/api/achievements/celebration", async (IGamificationService gamificationService) =>
{
    var shouldCelebrate = await gamificationService.ShowCelebrationForNewAchievements();
    return Results.Ok(new { celebrate = shouldCelebrate });
});

// Leaderboard endpoint (mock data for now - single user system)
app.MapGet("/api/leaderboard", async (ReceiptHealthContext context, IGamificationService gamificationService) =>
{
    try
    {
        // Get current user stats
        var achievements = await gamificationService.GetAchievementsAsync();
        var completedChallenges = await context.Challenges
            .Where(c => c.IsCompleted)
            .CountAsync();
        var totalReceipts = await context.Receipts.CountAsync();
        var avgHealthScore = await context.Receipts
            .Where(r => r.HealthScore > 0)
            .AverageAsync(r => (decimal?)r.HealthScore) ?? 50m;

        var currentUser = new LeaderboardEntry
        {
            Id = 1,
            UserName = "You",
            TotalAchievements = achievements.Count(a => a.IsUnlocked),
            CompletedChallenges = completedChallenges,
            AvgHealthScore = avgHealthScore,
            TotalReceipts = totalReceipts,
            CurrentStreak = 0, // Can be calculated later
            Points = achievements.Count(a => a.IsUnlocked) * 100 + completedChallenges * 50,
            LastActivityDate = DateTime.UtcNow
        };

        // Mock other users for demonstration
        var mockUsers = new List<LeaderboardEntry>
        {
            new() { Id = 2, UserName = "HealthyEater123", TotalAchievements = 15, CompletedChallenges = 8, AvgHealthScore = 85m, TotalReceipts = 45, CurrentStreak = 7, Points = 15 * 100 + 8 * 50, LastActivityDate = DateTime.UtcNow.AddHours(-2) },
            new() { Id = 3, UserName = "BudgetMaster", TotalAchievements = 12, CompletedChallenges = 10, AvgHealthScore = 72m, TotalReceipts = 38, CurrentStreak = 5, Points = 12 * 100 + 10 * 50, LastActivityDate = DateTime.UtcNow.AddHours(-5) },
            new() { Id = 4, UserName = "FitnessGuru", TotalAchievements = 18, CompletedChallenges = 6, AvgHealthScore = 92m, TotalReceipts = 52, CurrentStreak = 12, Points = 18 * 100 + 6 * 50, LastActivityDate = DateTime.UtcNow.AddHours(-1) },
            new() { Id = 5, UserName = "GroceryPro", TotalAchievements = 10, CompletedChallenges = 7, AvgHealthScore = 68m, TotalReceipts = 30, CurrentStreak = 3, Points = 10 * 100 + 7 * 50, LastActivityDate = DateTime.UtcNow.AddHours(-8) }
        };

        // Combine and sort by points
        var leaderboard = new List<LeaderboardEntry> { currentUser };
        leaderboard.AddRange(mockUsers);
        leaderboard = leaderboard.OrderByDescending(u => u.Points).ToList();

        // Add rank
        var rankedLeaderboard = leaderboard.Select((entry, index) => new
        {
            entry.Id,
            entry.UserName,
            Rank = index + 1,
            entry.TotalAchievements,
            entry.CompletedChallenges,
            entry.AvgHealthScore,
            entry.TotalReceipts,
            entry.CurrentStreak,
            entry.Points,
            entry.LastActivityDate,
            IsCurrentUser = entry.Id == 1
        }).ToList();

        return Results.Ok(rankedLeaderboard);
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

// === AI Insights Endpoints ===

// Natural language query
app.MapPost("/api/insights/query", async (HttpRequest request, IInsightsService insightsService) =>
{
    var body = await request.ReadFromJsonAsync<NaturalLanguageQueryRequest>();
    if (body == null || string.IsNullOrEmpty(body.Query))
    {
        return Results.BadRequest(new { error = "Query is required" });
    }
    
    var answer = await insightsService.ProcessNaturalLanguageQueryAsync(body.Query);
    return Results.Ok(new { query = body.Query, answer });
});

// Detect anomalies
app.MapGet("/api/insights/anomalies", async (IInsightsService insightsService) =>
{
    var alerts = await insightsService.DetectAnomaliesAsync();
    return Results.Ok(alerts);
});

// Budget prediction
app.MapGet("/api/insights/budget-prediction", async (IInsightsService insightsService) =>
{
    var prediction = await insightsService.PredictMonthlyBudgetAsync();
    return Results.Ok(prediction);
});

// === Voice Assistant Endpoints ===

// Process voice command with AI
app.MapPost("/api/voice/process-command", async (HttpRequest request, VoiceAssistantService voiceAssistant) =>
{
    var body = await request.ReadFromJsonAsync<VoiceCommandRequest>();
    if (body == null || string.IsNullOrEmpty(body.Transcript))
    {
        return Results.BadRequest(new { error = "Transcript is required" });
    }
    
    Console.WriteLine($"🎤 Voice command received: {body.Transcript}");
    
    var response = await voiceAssistant.ProcessVoiceCommandAsync(
        body.Transcript, 
        body.SessionId, 
        body.ConversationHistory);
    
    return Results.Ok(response);
});

// Get available TTS voices
app.MapGet("/api/voice/available-voices", (IPiperTtsService ttsService) =>
{
    return Results.Ok(ttsService.GetAvailableVoices());
});

// Generate speech from text using Piper TTS
app.MapPost("/api/voice/text-to-speech", async (HttpRequest request, IPiperTtsService ttsService) =>
{
    var body = await request.ReadFromJsonAsync<TtsRequest>();
    if (body == null || string.IsNullOrWhiteSpace(body.Text))
    {
        return Results.BadRequest(new { error = "Text is required" });
    }

    if (!ttsService.IsAvailable())
    {
        return Results.Problem(
            detail: "Piper TTS is not configured. Please download Piper from https://github.com/rhasspy/piper/releases",
            statusCode: 503
        );
    }

    try
    {
        Console.WriteLine($"🎵 Generating speech for: {body.Text.Substring(0, Math.Min(50, body.Text.Length))}... (Voice: {body.Voice ?? "default"})");
        
        var audioData = await ttsService.GenerateSpeechAsync(body.Text, body.Voice);
        
        return Results.File(audioData, "audio/mpeg", "speech.mp3");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ TTS error: {ex.Message}");
        return Results.Problem(
            detail: $"Failed to generate speech: {ex.Message}",
            statusCode: 500
        );
    }
});

// === Nutrition Endpoints ===

// Get daily nutrition summary
app.MapGet("/api/nutrition/daily", async (DateTime date, INutritionService nutritionService) =>
{
    var summary = await nutritionService.GetDailyNutritionAsync(date);
    return Results.Ok(summary);
});

// Get weekly nutrition summary
app.MapGet("/api/nutrition/weekly", async (DateTime weekStart, INutritionService nutritionService) =>
{
    var summary = await nutritionService.GetWeeklyNutritionAsync(weekStart);
    return Results.Ok(summary);
});

// Populate nutrition data for a receipt
app.MapPost("/api/nutrition/populate/{receiptId}", async (int receiptId, ReceiptHealthContext context, INutritionService nutritionService) =>
{
    var receipt = await context.Receipts
        .Include(r => r.LineItems)
        .FirstOrDefaultAsync(r => r.Id == receiptId);
    
    if (receipt == null)
    {
        return Results.NotFound(new { error = "Receipt not found" });
    }
    
    await nutritionService.PopulateNutritionDataAsync(receipt);
    return Results.Ok(new { message = "Nutrition data populated" });
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

// ============= Category Management API Endpoints =============
app.MapGet("/api/categories", async (ICategoryManagementService categoryService) =>
{
    try
    {
        var categories = await categoryService.GetActiveCategoriesAsync();
        return Results.Ok(categories);
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

app.MapGet("/api/categories/all", async (ICategoryManagementService categoryService) =>
{
    try
    {
        var categories = await categoryService.GetAllCategoriesAsync();
        return Results.Ok(categories);
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

app.MapGet("/api/categories/{id}", async (int id, ICategoryManagementService categoryService) =>
{
    try
    {
        var category = await categoryService.GetCategoryByIdAsync(id);
        if (category == null)
        {
            return Results.NotFound(new { message = $"Category with ID {id} not found" });
        }
        return Results.Ok(category);
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

app.MapPost("/api/categories", async (CreateCategoryRequest request, ICategoryManagementService categoryService) =>
{
    try
    {
        var category = new Category
        {
            Name = request.Name,
            Description = request.Description,
            Color = request.Color,
            Icon = request.Icon,
            SortOrder = request.SortOrder
        };

        var created = await categoryService.CreateCategoryAsync(category);
        return Results.Created($"/api/categories/{created.Id}", created);
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

app.MapPut("/api/categories/{id}", async (int id, UpdateCategoryRequest request, ICategoryManagementService categoryService) =>
{
    try
    {
        var category = new Category
        {
            Id = id,
            Name = request.Name,
            Description = request.Description,
            Color = request.Color,
            Icon = request.Icon,
            IsActive = request.IsActive,
            SortOrder = request.SortOrder
        };

        var updated = await categoryService.UpdateCategoryAsync(category);
        return Results.Ok(updated);
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

app.MapDelete("/api/categories/{id}", async (int id, ICategoryManagementService categoryService) =>
{
    try
    {
        var result = await categoryService.DeleteCategoryAsync(id);
        if (!result)
        {
            return Results.NotFound(new { message = $"Category with ID {id} not found" });
        }
        return Results.NoContent();
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

app.MapPost("/api/categories/suggest", async (SuggestCategoriesRequest request, ICategoryManagementService categoryService) =>
{
    try
    {
        var suggestions = await categoryService.SuggestCategoriesAsync(request.ItemDescription);
        return Results.Ok(new { suggestions });
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

app.MapGet("/api/categories/suggestions", async (ICategoryManagementService categoryService) =>
{
    try
    {
        var suggestions = await categoryService.GetCategorySuggestionsAsync();
        return Results.Ok(suggestions);
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

app.MapPut("/api/shopping-lists/{listId}/items/{itemId}/category", async (
    int listId, 
    int itemId, 
    UpdateItemCategoryRequest request, 
    ReceiptHealthContext context) =>
{
    try
    {
        var item = await context.ShoppingListItems
            .FirstOrDefaultAsync(i => i.Id == itemId && i.ShoppingListId == listId);

        if (item == null)
        {
            return Results.NotFound(new { message = "Item not found" });
        }

        item.Category = request.Category;
        await context.SaveChangesAsync();

        return Results.Ok(item);
    }
    catch (Exception ex)
    {
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

// Helper method to project ShoppingList to DTO to avoid circular references
static object MapShoppingListToDto(ShoppingList list)
{
    return new
    {
        list.Id,
        list.Name,
        list.CreatedAt,
        list.LastModifiedAt,
        list.IsActive,
        Items = list.Items.Select(item => new
        {
            item.Id,
            item.ItemName,
            item.Quantity,
            item.IsPurchased,
            item.AddedAt,
            item.LastKnownPrice,
            item.LastKnownVendor,
            item.Category
        }).ToList()
    };
}

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

// Request DTOs for new endpoints
public record CreateShoppingListRequest(string Name);
public record AddShoppingListItemRequest(string ItemName, int Quantity = 1);
public record GenerateFromTextRequest(string Text);
public record UpdateItemStatusRequest(bool IsPurchased);
public record CreateChallengeRequest(string Name, string Description, string Type, decimal TargetValue, int DurationDays);
public record TrackFeatureRequest(string FeatureName, string? Details = null);
public record NaturalLanguageQueryRequest(string Query);
public record VoiceCommandRequest(string Transcript, string? SessionId = null, List<ReceiptHealth.Services.ConversationMessage>? ConversationHistory = null);
public record TtsRequest(string Text, string? Voice = null);
public record GenerateMealPlanRequest(string DietaryPreference, DateTime? StartDate = null, int? Servings = null, int? Days = null, bool? IncludeBreakfast = null, bool? IncludeLunch = null, bool? IncludeDinner = null);
public record GenerateMealPlanNLRequest(string UserRequest, DateTime? StartDate = null, int? Servings = null, int? Days = null, bool? IncludeBreakfast = null, bool? IncludeLunch = null, bool? IncludeDinner = null);
public record GenerateSingleMealRequest(string DayOfWeek, string MealType, string? DietaryPreference, int? Servings, string? NaturalLanguagePrompt);
public record CreateShoppingListFromMealPlanRequest(string? Name = null);
public record AddRecipeToMealSlotRequest(int RecipeId, DayOfWeek DayOfWeek, MealType MealType);
public record AddRecipeToShoppingListRequest(int RecipeId, int? ShoppingListId = null);
public record CreateCategoryRequest(string Name, string? Description = null, string? Color = null, string? Icon = null, int SortOrder = 0);
public record UpdateCategoryRequest(string Name, string? Description = null, string? Color = null, string? Icon = null, bool IsActive = true, int SortOrder = 0);
public record UpdateLineItemCategoryRequest(int CategoryId);
public record SuggestCategoriesRequest(string ItemDescription);
public record UpdateItemCategoryRequest(string Category);

