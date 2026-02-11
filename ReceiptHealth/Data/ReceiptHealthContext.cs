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
    }
}
