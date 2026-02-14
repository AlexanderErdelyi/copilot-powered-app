using Microsoft.EntityFrameworkCore;
using ReceiptHealth.Data;
using ReceiptHealth.Models;

namespace ReceiptHealth.Services;

public interface ICategoryManagementService
{
    Task<List<Category>> GetAllCategoriesAsync();
    Task<List<Category>> GetActiveCategoriesAsync();
    Task<Category?> GetCategoryByIdAsync(int id);
    Task<Category?> GetCategoryByNameAsync(string name);
    Task<Category> CreateCategoryAsync(Category category);
    Task<Category> UpdateCategoryAsync(Category category);
    Task<bool> DeleteCategoryAsync(int id);
    Task<List<string>> SuggestCategoriesAsync(string itemDescription);
    Task EnsureSystemCategoriesExistAsync();
    Task<List<CategorySuggestion>> GetCategorySuggestionsAsync();
}

public class CategoryManagementService : ICategoryManagementService
{
    private readonly ReceiptHealthContext _context;
    private readonly ILogger<CategoryManagementService> _logger;

    public CategoryManagementService(ReceiptHealthContext context, ILogger<CategoryManagementService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<Category>> GetAllCategoriesAsync()
    {
        return await _context.Categories
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<List<Category>> GetActiveCategoriesAsync()
    {
        return await _context.Categories
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<Category?> GetCategoryByIdAsync(int id)
    {
        return await _context.Categories.FindAsync(id);
    }

    public async Task<Category?> GetCategoryByNameAsync(string name)
    {
        return await _context.Categories
            .FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower());
    }

    public async Task<Category> CreateCategoryAsync(Category category)
    {
        // Check if category with same name already exists
        var existing = await GetCategoryByNameAsync(category.Name);
        if (existing != null)
        {
            throw new InvalidOperationException($"Category with name '{category.Name}' already exists.");
        }

        category.CreatedAt = DateTime.UtcNow;
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created new category: {CategoryName} (ID: {CategoryId})", category.Name, category.Id);
        return category;
    }

    public async Task<Category> UpdateCategoryAsync(Category category)
    {
        var existing = await _context.Categories.FindAsync(category.Id);
        if (existing == null)
        {
            throw new InvalidOperationException($"Category with ID {category.Id} not found.");
        }

        // Check if name is being changed to an existing name
        if (existing.Name != category.Name)
        {
            var nameExists = await _context.Categories
                .AnyAsync(c => c.Name.ToLower() == category.Name.ToLower() && c.Id != category.Id);
            if (nameExists)
            {
                throw new InvalidOperationException($"Category with name '{category.Name}' already exists.");
            }
        }

        existing.Name = category.Name;
        existing.Description = category.Description;
        existing.Color = category.Color;
        existing.Icon = category.Icon;
        existing.IsActive = category.IsActive;
        existing.SortOrder = category.SortOrder;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated category: {CategoryName} (ID: {CategoryId})", category.Name, category.Id);
        return existing;
    }

    public async Task<bool> DeleteCategoryAsync(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
        {
            return false;
        }

        // Don't allow deleting system categories
        if (category.IsSystemCategory)
        {
            throw new InvalidOperationException("Cannot delete system categories.");
        }

        // Update all items using this category to "Other"
        var lineItems = await _context.LineItems
            .Where(li => li.Category == category.Name)
            .ToListAsync();
        foreach (var item in lineItems)
        {
            item.Category = "Other";
        }

        var shoppingListItems = await _context.ShoppingListItems
            .Where(sli => sli.Category == category.Name)
            .ToListAsync();
        foreach (var item in shoppingListItems)
        {
            item.Category = "Other";
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted category: {CategoryName} (ID: {CategoryId})", category.Name, category.Id);
        return true;
    }

    public async Task<List<string>> SuggestCategoriesAsync(string itemDescription)
    {
        // Simple rule-based suggestions - can be enhanced with AI later
        var suggestions = new List<string>();
        var description = itemDescription.ToLower();

        // Get all active categories
        var categories = await GetActiveCategoriesAsync();

        // Check for medical-related items
        if (description.Contains("medicine") || description.Contains("pill") || description.Contains("drug") ||
            description.Contains("tablet") || description.Contains("capsule") || description.Contains("prescription") ||
            description.Contains("vitamin") || description.Contains("supplement"))
        {
            suggestions.Add("Medical");
        }

        // Check for internet/tech items
        if (description.Contains("internet") || description.Contains("wifi") || description.Contains("broadband") ||
            description.Contains("subscription") || description.Contains("streaming") || description.Contains("software"))
        {
            suggestions.Add("Internet & Tech");
        }

        // Check for utilities
        if (description.Contains("electric") || description.Contains("water") || description.Contains("gas") ||
            description.Contains("utility") || description.Contains("bill"))
        {
            suggestions.Add("Utilities");
        }

        // Check for healthy items
        if (description.Contains("vegetable") || description.Contains("fruit") || description.Contains("organic") ||
            description.Contains("salad") || description.Contains("whole grain"))
        {
            suggestions.Add("Healthy");
        }

        // Check for junk items
        if (description.Contains("candy") || description.Contains("soda") || description.Contains("chip") ||
            description.Contains("cookie") || description.Contains("cake") || description.Contains("fast food"))
        {
            suggestions.Add("Junk");
        }

        // Return distinct suggestions that exist in the database
        var existingCategories = categories.Select(c => c.Name).ToHashSet();
        return suggestions.Where(s => existingCategories.Contains(s)).Distinct().ToList();
    }

    public async Task EnsureSystemCategoriesExistAsync()
    {
        var systemCategories = new[]
        {
            new Category { Name = "Healthy", Description = "Healthy food items (fruits, vegetables, whole grains)", Color = "#10b981", Icon = "🥗", IsSystemCategory = true, SortOrder = 1, CreatedAt = DateTime.UtcNow },
            new Category { Name = "Junk", Description = "Junk food and unhealthy items (candy, soda, chips)", Color = "#ef4444", Icon = "🍔", IsSystemCategory = true, SortOrder = 2, CreatedAt = DateTime.UtcNow },
            new Category { Name = "Other", Description = "Other food items (bread, pasta, basic staples)", Color = "#6b7280", Icon = "📦", IsSystemCategory = true, SortOrder = 3, CreatedAt = DateTime.UtcNow },
            new Category { Name = "Unknown", Description = "Uncategorized items", Color = "#9ca3af", Icon = "❓", IsSystemCategory = true, SortOrder = 99, CreatedAt = DateTime.UtcNow }
        };

        foreach (var category in systemCategories)
        {
            var existing = await GetCategoryByNameAsync(category.Name);
            if (existing == null)
            {
                _context.Categories.Add(category);
                _logger.LogInformation("Created system category: {CategoryName}", category.Name);
            }
        }

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Get suggested categories that users might want to add
    /// </summary>
    public async Task<List<CategorySuggestion>> GetCategorySuggestionsAsync()
    {
        var suggestions = new List<CategorySuggestion>
        {
            new CategorySuggestion { Name = "Beverages", Description = "Drinks, juices, water, coffee, tea", Icon = "☕", Color = "#8b5cf6" },
            new CategorySuggestion { Name = "Dairy", Description = "Milk, cheese, yogurt, butter", Icon = "🥛", Color = "#f59e0b" },
            new CategorySuggestion { Name = "Meat & Fish", Description = "Fresh meat, poultry, seafood", Icon = "🥩", Color = "#dc2626" },
            new CategorySuggestion { Name = "Bakery", Description = "Bread, pastries, cakes", Icon = "🍞", Color = "#d97706" },
            new CategorySuggestion { Name = "Frozen Foods", Description = "Frozen meals, ice cream, frozen vegetables", Icon = "🧊", Color = "#06b6d4" },
            new CategorySuggestion { Name = "Snacks", Description = "Crackers, nuts, dried fruits", Icon = "🥜", Color = "#84cc16" },
            new CategorySuggestion { Name = "Household", Description = "Cleaning supplies, paper products, toiletries", Icon = "🧹", Color = "#6366f1" },
            new CategorySuggestion { Name = "Personal Care", Description = "Hygiene products, cosmetics, health items", Icon = "🧴", Color = "#ec4899" },
            new CategorySuggestion { Name = "Baby Products", Description = "Diapers, formula, baby food", Icon = "👶", Color = "#f472b6" },
            new CategorySuggestion { Name = "Pet Supplies", Description = "Pet food, treats, accessories", Icon = "🐾", Color = "#a855f7" },
            new CategorySuggestion { Name = "Clothing", Description = "Apparel, shoes, accessories, fashion items", Icon = "👕", Color = "#3b82f6" }
        };

        // Filter out categories that already exist
        var existingCategories = await _context.Categories
            .Select(c => c.Name.ToLower())
            .ToListAsync();

        return suggestions
            .Where(s => !existingCategories.Contains(s.Name.ToLower()))
            .ToList();
    }
}

public class CategorySuggestion
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}
