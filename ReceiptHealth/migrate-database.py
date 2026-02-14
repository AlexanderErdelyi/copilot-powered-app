import sqlite3
import sys

print("🔧 Adding MealType column to MealPlanDays table...")

try:
    # Connect to the database
    conn = sqlite3.connect('receipts.db')
    cursor = conn.cursor()
    
    # Check if column already exists
    cursor.execute("PRAGMA table_info(MealPlanDays)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'MealType' in columns:
        print("✅ MealType column already exists!")
    else:
        # Add the column (2 = Dinner as default)
        cursor.execute("ALTER TABLE MealPlanDays ADD COLUMN MealType INTEGER NOT NULL DEFAULT 2")
        conn.commit()
        print("✅ MealType column added successfully!")
        print("   All existing meals set to Dinner (default)")
    
    # Check how many meal plans exist
    cursor.execute("SELECT COUNT(*) FROM MealPlans")
    plan_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM MealPlanDays")
    day_count = cursor.fetchone()[0]
    
    print()
    print("✅ Database migration complete!")
    print(f"   Found {plan_count} existing meal plans")
    print(f"   Found {day_count} meal plan days")
    print("   Your data has been preserved!")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    print()
    print("If this fails, you can restore from backup:")
    print("   Copy-Item receipts.db.backup receipts.db -Force")
    sys.exit(1)
