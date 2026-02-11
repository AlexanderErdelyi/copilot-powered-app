using Microsoft.EntityFrameworkCore;
using ReceiptHealth.Models;

namespace ReceiptHealth.Data;

public class ReceiptHealthContext : DbContext
{
    public ReceiptHealthContext(DbContextOptions<ReceiptHealthContext> options)
        : base(options)
    {
    }

    public DbSet<Document> Documents { get; set; }
    public DbSet<Receipt> Receipts { get; set; }
    public DbSet<LineItem> LineItems { get; set; }
    public DbSet<CategorySummary> CategorySummaries { get; set; }
    public DbSet<PriceComparison> PriceComparisons { get; set; }
    public DbSet<ShoppingList> ShoppingLists { get; set; }
    public DbSet<ShoppingListItem> ShoppingListItems { get; set; }
    public DbSet<Achievement> Achievements { get; set; }
    public DbSet<Challenge> Challenges { get; set; }
    public DbSet<NutritionInfo> NutritionInfos { get; set; }
    public DbSet<MealPlan> MealPlans { get; set; }
    public DbSet<MealPlanDay> MealPlanDays { get; set; }
    public DbSet<Recipe> Recipes { get; set; }
    public DbSet<RecipeIngredient> RecipeIngredients { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Document configuration
        modelBuilder.Entity<Document>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Sha256Hash).IsUnique();
            entity.Property(e => e.FileName).IsRequired();
            entity.Property(e => e.FilePath).IsRequired();
            entity.Property(e => e.Status).IsRequired();
        });

        // Receipt configuration
        modelBuilder.Entity<Receipt>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Document)
                  .WithOne(d => d.Receipt)
                  .HasForeignKey<Receipt>(e => e.DocumentId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.Total).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Subtotal).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Tax).HasColumnType("decimal(18,2)");
            entity.Property(e => e.HealthScore).HasColumnType("decimal(5,2)");
            entity.Property(e => e.Currency).HasMaxLength(10).HasDefaultValue("USD");
        });

        // LineItem configuration
        modelBuilder.Entity<LineItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Receipt)
                  .WithMany(r => r.LineItems)
                  .HasForeignKey(e => e.ReceiptId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Category).IsRequired();
        });

        // CategorySummary configuration
        modelBuilder.Entity<CategorySummary>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Receipt)
                  .WithOne(r => r.CategorySummary)
                  .HasForeignKey<CategorySummary>(e => e.ReceiptId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.HealthyTotal).HasColumnType("decimal(18,2)");
            entity.Property(e => e.JunkTotal).HasColumnType("decimal(18,2)");
            entity.Property(e => e.OtherTotal).HasColumnType("decimal(18,2)");
            entity.Property(e => e.UnknownTotal).HasColumnType("decimal(18,2)");
        });

        // PriceComparison configuration
        modelBuilder.Entity<PriceComparison>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Receipt)
                  .WithMany()
                  .HasForeignKey(e => e.ReceiptId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.LineItem)
                  .WithMany()
                  .HasForeignKey(e => e.LineItemId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
            entity.HasIndex(e => e.NormalizedName);
            entity.HasIndex(e => e.Date);
        });

        // ShoppingList configuration
        modelBuilder.Entity<ShoppingList>(entity =>
        {
            entity.HasKey(e => e.Id);
        });

        // ShoppingListItem configuration
        modelBuilder.Entity<ShoppingListItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.ShoppingList)
                  .WithMany(sl => sl.Items)
                  .HasForeignKey(e => e.ShoppingListId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.LastKnownPrice).HasColumnType("decimal(18,2)");
            entity.HasIndex(e => e.NormalizedName);
        });

        // Achievement configuration
        modelBuilder.Entity<Achievement>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Type);
        });

        // Challenge configuration
        modelBuilder.Entity<Challenge>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TargetValue).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CurrentValue).HasColumnType("decimal(18,2)");
            entity.HasIndex(e => e.IsCompleted);
            entity.HasIndex(e => e.EndDate);
        });

        // NutritionInfo configuration
        modelBuilder.Entity<NutritionInfo>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.LineItem)
                  .WithMany()
                  .HasForeignKey(e => e.LineItemId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.Protein).HasColumnType("decimal(10,2)");
            entity.Property(e => e.Carbohydrates).HasColumnType("decimal(10,2)");
            entity.Property(e => e.Fat).HasColumnType("decimal(10,2)");
            entity.Property(e => e.Fiber).HasColumnType("decimal(10,2)");
            entity.Property(e => e.Sugar).HasColumnType("decimal(10,2)");
            entity.Property(e => e.Sodium).HasColumnType("decimal(10,2)");
        });

        // MealPlan configuration
        modelBuilder.Entity<MealPlan>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
        });

        // MealPlanDay configuration
        modelBuilder.Entity<MealPlanDay>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.MealPlan)
                  .WithMany(mp => mp.Days)
                  .HasForeignKey(e => e.MealPlanId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Recipe)
                  .WithMany(r => r.MealPlanDays)
                  .HasForeignKey(e => e.RecipeId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Recipe configuration
        modelBuilder.Entity<Recipe>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
        });

        // RecipeIngredient configuration
        modelBuilder.Entity<RecipeIngredient>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Recipe)
                  .WithMany(r => r.Ingredients)
                  .HasForeignKey(e => e.RecipeId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.IngredientName).IsRequired().HasMaxLength(200);
        });
    }
}
