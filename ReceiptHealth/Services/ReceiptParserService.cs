using System.Globalization;
using System.Text.RegularExpressions;
using ReceiptHealth.Models;

namespace ReceiptHealth.Services;

public interface IReceiptParserService
{
    Task<(Receipt receipt, List<LineItem> lineItems)> ParseReceiptAsync(string text);
}

public class ReceiptParserService : IReceiptParserService
{
    private readonly ILogger<ReceiptParserService> _logger;

    public ReceiptParserService(ILogger<ReceiptParserService> logger)
    {
        _logger = logger;
    }

    public async Task<(Receipt receipt, List<LineItem> lineItems)> ParseReceiptAsync(string text)
    {
        await Task.CompletedTask;
        
        _logger.LogInformation("Parsing receipt text ({Length} chars)", text.Length);

        var receipt = new Receipt
        {
            RawText = text,
            ProcessedAt = DateTime.UtcNow
        };
        
        var lineItems = new List<LineItem>();

        // Extract vendor (first line typically)
        var lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        if (lines.Length > 0)
        {
            receipt.Vendor = lines[0].Trim();
        }

        // Extract date
        var dateMatch = Regex.Match(text, @"Date[:\s]+(\d{4}-\d{2}-\d{2}|\d{1,2}/\d{1,2}/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4})", 
            RegexOptions.IgnoreCase);
        if (dateMatch.Success)
        {
            if (DateTime.TryParse(dateMatch.Groups[1].Value, out var parsedDate))
            {
                receipt.Date = parsedDate;
            }
        }
        
        // If no date found, use today
        if (receipt.Date == default)
        {
            receipt.Date = DateTime.Today;
        }

        // Extract totals
        var totalMatch = Regex.Match(text, @"Total[:\s]+\$?(\d+\.\d{2})", RegexOptions.IgnoreCase);
        if (totalMatch.Success && decimal.TryParse(totalMatch.Groups[1].Value, out var total))
        {
            receipt.Total = total;
        }

        var subtotalMatch = Regex.Match(text, @"Subtotal[:\s]+\$?(\d+\.\d{2})", RegexOptions.IgnoreCase);
        if (subtotalMatch.Success && decimal.TryParse(subtotalMatch.Groups[1].Value, out var subtotal))
        {
            receipt.Subtotal = subtotal;
        }

        var taxMatch = Regex.Match(text, @"Tax[:\s]+\$?(\d+\.\d{2})", RegexOptions.IgnoreCase);
        if (taxMatch.Success && decimal.TryParse(taxMatch.Groups[1].Value, out var tax))
        {
            receipt.Tax = tax;
        }

        // Extract line items (pattern: description followed by price)
        var lineItemPattern = @"^(.+?)\s+\$?(\d+\.\d{2})$";
        foreach (var line in lines)
        {
            var trimmedLine = line.Trim();
            
            // Skip header/footer lines
            if (string.IsNullOrWhiteSpace(trimmedLine) || 
                trimmedLine.Contains("Date:", StringComparison.OrdinalIgnoreCase) ||
                trimmedLine.Contains("Total", StringComparison.OrdinalIgnoreCase) ||
                trimmedLine.Contains("Subtotal", StringComparison.OrdinalIgnoreCase) ||
                trimmedLine.Contains("Tax", StringComparison.OrdinalIgnoreCase) ||
                trimmedLine.Length < 5)
            {
                continue;
            }

            var match = Regex.Match(trimmedLine, lineItemPattern);
            if (match.Success)
            {
                var description = match.Groups[1].Value.Trim();
                if (decimal.TryParse(match.Groups[2].Value, out var price))
                {
                    lineItems.Add(new LineItem
                    {
                        Description = description,
                        Price = price,
                        Quantity = 1,
                        Category = "Unknown" // Will be categorized by category service
                    });
                }
            }
        }

        _logger.LogInformation("Parsed receipt: Vendor={Vendor}, Date={Date}, Total={Total}, Items={Count}", 
            receipt.Vendor, receipt.Date, receipt.Total, lineItems.Count);

        return (receipt, lineItems);
    }
}
