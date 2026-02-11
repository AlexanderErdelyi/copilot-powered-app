using Microsoft.EntityFrameworkCore;
using ReceiptHealth.Data;
using ReceiptHealth.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure HTTP URL
builder.WebHost.UseUrls("http://localhost:5002");

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add DbContext
var dbPath = builder.Configuration["ReceiptHealth:DatabasePath"] ?? "./receipts.db";
builder.Services.AddDbContext<ReceiptHealthContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));

// Register application services
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<ITextExtractionService, TextExtractionService>();
builder.Services.AddScoped<IReceiptParserService, ReceiptParserService>();
builder.Services.AddScoped<ICategoryService, RuleBasedCategoryService>();
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
    app.Logger.LogInformation("Database initialized at: {DbPath}", dbPath);
}

// API Endpoints

// Upload endpoint
app.MapPost("/api/upload", async (HttpRequest request, IReceiptProcessingService processingService) =>
{
    if (!request.HasFormContentType || request.Form.Files.Count == 0)
    {
        return Results.BadRequest(new { error = "No files uploaded" });
    }

    var results = new List<object>();
    
    foreach (var file in request.Form.Files)
    {
        try
        {
            var document = await processingService.ProcessUploadAsync(file);
            results.Add(new
            {
                id = document.Id,
                fileName = document.FileName,
                status = document.Status,
                sha256Hash = document.Sha256Hash,
                uploadedAt = document.UploadedAt
            });
        }
        catch (Exception ex)
        {
            results.Add(new
            {
                fileName = file.FileName,
                error = ex.Message
            });
        }
    }

    return Results.Ok(new { uploads = results });
})
.DisableAntiforgery();

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

app.Logger.LogInformation("ReceiptHealth API is running on http://localhost:5002");

app.Run();

