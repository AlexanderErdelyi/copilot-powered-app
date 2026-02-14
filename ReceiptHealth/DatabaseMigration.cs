using Microsoft.Data.Sqlite;
using System;

namespace ReceiptHealth;

public class DatabaseMigration
{
    public static void MigrateDatabase(string connectionString)
    {
        Console.WriteLine("🔄 Checking for database migrations...");
        
        using var connection = new SqliteConnection(connectionString);
        connection.Open();

        // Check if Categories table exists
        var checkTableCmd = connection.CreateCommand();
        checkTableCmd.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name='Categories'";
        var categoriesExists = checkTableCmd.ExecuteScalar() != null;

        if (!categoriesExists)
        {
            Console.WriteLine("⚠️  Categories table not found. Running migration...");
            RunCategoriesMigration(connection);
        }
        else
        {
            Console.WriteLine("✅ Categories table exists.");
        }

        // Check if LineItems table exists first
        var checkLineItemsTableCmd = connection.CreateCommand();
        checkLineItemsTableCmd.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name='LineItems'";
        var lineItemsExists = checkLineItemsTableCmd.ExecuteScalar() != null;

        if (lineItemsExists)
        {
            // Check if CategoryId column exists in LineItems
            var checkColumnCmd = connection.CreateCommand();
            checkColumnCmd.CommandText = "PRAGMA table_info(LineItems)";
            var reader = checkColumnCmd.ExecuteReader();
            var hasCategoryId = false;
            while (reader.Read())
            {
                if (reader.GetString(1) == "CategoryId")
                {
                    hasCategoryId = true;
                    break;
                }
            }
            reader.Close();

            if (!hasCategoryId)
            {
                Console.WriteLine("⚠️  CategoryId column not found in LineItems. Adding...");
                RunLineItemCategoryIdMigration(connection);
            }
            else
            {
                Console.WriteLine("✅ LineItems.CategoryId exists.");
            }
        }
        else
        {
            Console.WriteLine("ℹ️  LineItems table doesn't exist yet - will be created by EnsureCreated()");
        }

        connection.Close();
        Console.WriteLine("✅ Database migration completed successfully!");
    }

    private static void RunCategoriesMigration(SqliteConnection connection)
    {
        var cmd = connection.CreateCommand();
        cmd.CommandText = @"
            CREATE TABLE Categories (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Name TEXT NOT NULL,
                Description TEXT,
                Color TEXT,
                Icon TEXT,
                IsSystemCategory INTEGER NOT NULL DEFAULT 0,
                IsActive INTEGER NOT NULL DEFAULT 1,
                CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
                SortOrder INTEGER NOT NULL DEFAULT 0
            );

            CREATE UNIQUE INDEX IX_Categories_Name ON Categories (Name);
            CREATE INDEX IX_Categories_IsSystemCategory ON Categories (IsSystemCategory);
            CREATE INDEX IX_Categories_SortOrder ON Categories (SortOrder);

            INSERT INTO Categories (Name, Description, Color, Icon, IsSystemCategory, IsActive, SortOrder) VALUES
            ('Healthy', 'Healthy food items (fruits, vegetables, whole grains)', '#10b981', '🥗', 1, 1, 1),
            ('Junk', 'Junk food and unhealthy items (candy, soda, chips)', '#ef4444', '🍔', 1, 1, 2),
            ('Other', 'Other food items (bread, pasta, basic staples)', '#6b7280', '📦', 1, 1, 3),
            ('Unknown', 'Uncategorized items', '#9ca3af', '❓', 1, 1, 99);
        ";
        cmd.ExecuteNonQuery();
        Console.WriteLine("   ✅ Categories table created with 4 system categories");
    }

    private static void RunLineItemCategoryIdMigration(SqliteConnection connection)
    {
        var cmd = connection.CreateCommand();
        cmd.CommandText = @"
            ALTER TABLE LineItems ADD COLUMN CategoryId INTEGER;

            -- Map existing Category strings to CategoryId
            UPDATE LineItems 
            SET CategoryId = (SELECT Id FROM Categories WHERE LOWER(Categories.Name) = LOWER(LineItems.Category)) 
            WHERE Category IS NOT NULL;
        ";
        cmd.ExecuteNonQuery();
        Console.WriteLine("   ✅ CategoryId column added to LineItems and mapped from existing data");
    }
}
