# PowerShell script to add MealType column to existing database
Write-Host "🔧 Adding MealType column to MealPlanDays table..." -ForegroundColor Cyan

try {
    # Load SQLite assembly
    Add-Type -Path "bin\Debug\net8.0\Microsoft.Data.Sqlite.dll"
    
    $connectionString = "Data Source=receipts.db"
    $connection = New-Object Microsoft.Data.Sqlite.SqliteConnection($connectionString)
    $connection.Open()
    
    # Check if column already exists
    $checkCmd = $connection.CreateCommand()
    $checkCmd.CommandText = "PRAGMA table_info(MealPlanDays)"
    $reader = $checkCmd.ExecuteReader()
    
    $columnExists = $false
    while ($reader.Read()) {
        if ($reader["name"] -eq "MealType") {
            $columnExists = $true
            break
        }
    }
    $reader.Close()
    
    if ($columnExists) {
        Write-Host "✅ MealType column already exists!" -ForegroundColor Green
    } else {
        # Add the column
        $cmd = $connection.CreateCommand()
        $cmd.CommandText = "ALTER TABLE MealPlanDays ADD COLUMN MealType INTEGER NOT NULL DEFAULT 2"
        $cmd.ExecuteNonQuery()
        
        Write-Host "✅ MealType column added successfully!" -ForegroundColor Green
        Write-Host "   All existing meals set to Dinner (default)" -ForegroundColor Gray
    }
    
    $connection.Close()
    
    Write-Host "" 
    Write-Host "✅ Database migration complete!" -ForegroundColor Green
    Write-Host "   Your existing meal plans have been preserved." -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "If this fails, you can restore from backup:" -ForegroundColor Yellow
    Write-Host "   Copy-Item receipts.db.backup receipts.db -Force" -ForegroundColor Gray
    exit 1
}
