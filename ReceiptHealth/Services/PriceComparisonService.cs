using Microsoft.EntityFrameworkCore;
using ReceiptHealth.Data;
using ReceiptHealth.Models;

namespace ReceiptHealth.Services;

public interface IPriceComparisonService
{
    Task<List<PriceComparisonResult>> CompareItemPricesAsync(string itemName);
    Task<List<PriceTrendResult>> GetPriceTrendsAsync(string itemName, int days = 90);
    Task PopulatePriceComparisonsAsync(Receipt receipt);
}

public class PriceComparisonService : IPriceComparisonService
{
    private readonly ReceiptHealthContext _context;

    public PriceComparisonService(ReceiptHealthContext context)
    {
        _context = context;
    }

    public async Task<List<PriceComparisonResult>> CompareItemPricesAsync(string itemName)
    {
        var normalizedName = NormalizeItemName(itemName);
        
        var comparisons = await _context.PriceComparisons
            .Where(pc => pc.NormalizedName == normalizedName)
            .OrderBy(pc => pc.Price)
            .Select(pc => new PriceComparisonResult
            {
                ItemName = pc.ItemName,
                Vendor = pc.Vendor,
                Price = pc.Price,
                Currency = pc.Currency,
                Date = pc.Date,
                ReceiptId = pc.ReceiptId
            })
            .ToListAsync();

        return comparisons;
    }

    public async Task<List<PriceTrendResult>> GetPriceTrendsAsync(string itemName, int days = 90)
    {
        var normalizedName = NormalizeItemName(itemName);
        var cutoffDate = DateTime.Now.AddDays(-days);
        
        var trends = await _context.PriceComparisons
            .Where(pc => pc.NormalizedName == normalizedName && pc.Date >= cutoffDate)
            .GroupBy(pc => new { pc.Vendor, pc.Date.Year, pc.Date.Month, pc.Date.Day })
            .Select(g => new PriceTrendResult
            {
                Vendor = g.Key.Vendor,
                Date = new DateTime(g.Key.Year, g.Key.Month, g.Key.Day),
                AveragePrice = g.Average(pc => pc.Price),
                MinPrice = g.Min(pc => pc.Price),
                MaxPrice = g.Max(pc => pc.Price),
                Count = g.Count()
            })
            .OrderBy(pt => pt.Date)
            .ToListAsync();

        return trends;
    }

    public async Task PopulatePriceComparisonsAsync(Receipt receipt)
    {
        var lineItems = await _context.LineItems
            .Where(li => li.ReceiptId == receipt.Id)
            .ToListAsync();

        foreach (var item in lineItems)
        {
            var priceComparison = new PriceComparison
            {
                ItemName = item.Description,
                NormalizedName = NormalizeItemName(item.Description),
                Vendor = receipt.Vendor,
                Price = item.Price,
                Date = receipt.Date,
                ReceiptId = receipt.Id,
                LineItemId = item.Id,
                Currency = receipt.Currency
            };

            _context.PriceComparisons.Add(priceComparison);
        }

        await _context.SaveChangesAsync();
    }

    private string NormalizeItemName(string itemName)
    {
        // Normalize for matching: lowercase, remove extra spaces, remove common words
        var normalized = itemName.ToLowerInvariant().Trim();
        
        // Remove common size indicators, packaging info
        var wordsToRemove = new[] { "kg", "g", "ml", "l", "pack", "bottle", "can", "organic", "bio" };
        foreach (var word in wordsToRemove)
        {
            normalized = normalized.Replace(word, " ");
        }
        
        // Remove extra spaces
        normalized = string.Join(" ", normalized.Split(' ', StringSplitOptions.RemoveEmptyEntries));
        
        return normalized;
    }
}

public class PriceComparisonResult
{
    public string ItemName { get; set; } = string.Empty;
    public string Vendor { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Currency { get; set; } = "USD";
    public DateTime Date { get; set; }
    public int? ReceiptId { get; set; }
}

public class PriceTrendResult
{
    public string Vendor { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public decimal AveragePrice { get; set; }
    public decimal MinPrice { get; set; }
    public decimal MaxPrice { get; set; }
    public int Count { get; set; }
}
