# ReceiptHealth 🩺

A production-quality .NET 8 web application that helps you track and analyze the healthiness of your grocery shopping receipts. Upload receipts, automatically extract structured data, categorize line items, and visualize spending patterns.

## Features

### 📤 Receipt Upload & Processing
- **Drag & drop interface** for easy file uploads
- Support for multiple file formats: JPG, PNG, PDF, TXT
- **Automatic text extraction** using OCR (images) and text parsing
- **Duplicate detection** via SHA256 hashing  - uploads are idempotent
- Real-time processing status (Processing → Processed/Failed)

### 🏷️ Smart Categorization
- **Rule-based categorization** of line items into:
  - 🥗 **Healthy**: Salad, vegetables, fruits, oats, yogurt, organic items
  - 🍟 **Junk**: Chips, soda, candy, cookies, ice cream
  - 🥛 **Other**: Water, milk, bread, rice, pasta
  - ❓ **Unknown**: Items that don't match any rules
- Configurable keyword mappings (see `Services/CategoryService.cs`)

### 📊 Health Scoring Algorithm
- Computes receipt-level **HealthScore** (0-100) using weighted average:
  - Healthy items: +1 weight per currency unit
  - Junk items: -1 weight per currency unit
  - Other/Unknown: 0 weight (neutral)
- Default score of 50 for empty or unknown receipts
- Higher scores = healthier purchases

### 📈 Analytics & Visualizations
- **Dashboard** with KPI cards:
  - Total Spend
  - Healthy % vs Junk %
  - Average Health Score
- **Monthly Spend Chart**: Line chart showing spending trends
- **Category Breakdown**: Donut chart of spending by category
- **Receipts List**: Searchable, sortable table with:
  - Vendor, date, total, health score
  - Clickable rows to view full receipt details
  - Modal with line items and categorization

## Tech Stack

- **.NET 8** - ASP.NET Core minimal APIs
- **Entity Framework Core 8** with **SQLite** (file-based database)
- **GitHub Copilot SDK** for AI capabilities
- **Chart.js** for data visualization
- **Vanilla JavaScript** frontend (no framework)
- **Services pattern** with dependency injection
- **Async/await** throughout for performance

## Getting Started

### Prerequisites

- .NET 8 SDK or later
- (Optional) Node.js for future enhancements

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AlexanderErdelyi/copilot-powered-app.git
   cd copilot-powered-app/ReceiptHealth
   ```

2. Restore dependencies:
   ```bash
   dotnet restore
   ```

3. Build the project:
   ```bash
   dotnet build
   ```

4. Run the application:
   ```bash
   dotnet run
   ```

5. Open your browser to: **http://localhost:5002**

### Configuration

Edit `appsettings.json` to customize:

```json
{
  "ReceiptHealth": {
    "StorageRoot": "./storage",
    "DatabasePath": "./receipts.db",
    "MaxFileSizeBytes": 15728640
  }
}
```

## Usage

### 1. Upload a Receipt

- Visit the **Dashboard** (http://localhost:5002)
- Drag & drop receipt files or click the upload zone
- Supported formats: JPG, PNG, PDF, TXT (max 15MB)
- Files are processed in the background

### 2. View Receipts

- Click **Receipts** in the navigation
- Browse all processed receipts
- Use the search bar to filter by vendor, date, or amount
- Click any receipt row to see full details

### 3. Analyze Trends

- View KPI cards on the dashboard
- Check monthly spending patterns
- See category breakdown (Healthy vs Junk vs Other)

## Architecture

### Project Structure

```
ReceiptHealth/
├── Models/
│   ├── Document.cs          # File metadata
│   ├── Receipt.cs           # Parsed receipt data
│   ├── LineItem.cs          # Individual items
│   └── CategorySummary.cs   # Aggregated category totals
├── Services/
│   ├── FileStorageService.cs          # File I/O & SHA256 hashing
│   ├── TextExtractionService.cs       # OCR & text parsing
│   ├── ReceiptParserService.cs        # Receipt structure extraction
│   ├── CategoryService.cs             # Rule-based categorization
│   ├── HealthScoreService.cs          # Health score computation
│   └── ReceiptProcessingService.cs    # Orchestrates processing pipeline
├── Data/
│   └── ReceiptHealthContext.cs        # EF Core DbContext
├── wwwroot/
│   ├── index.html           # Dashboard UI
│   └── receipts.html        # Receipts list UI
├── storage/                 # Uploaded files (gitignored)
├── receipts.db              # SQLite database (gitignored)
├── Program.cs               # API endpoints & startup
└── appsettings.json         # Configuration

```

### Data Flow

1. **Upload** → `FileStorageService` saves file & computes SHA256 hash
2. **Extract** → `TextExtractionService` extracts text (OCR for images)
3. **Parse** → `ReceiptParserService` extracts vendor, date, totals, line items
4. **Categorize** → `CategoryService` applies keyword rules to each item
5. **Score** → `HealthScoreService` computes receipt health score
6. **Aggregate** → `CategorySummary` computed and saved
7. **Store** → All data persisted to SQLite via EF Core

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload receipt files |
| `/api/documents` | GET | List all uploaded documents |
| `/api/receipts` | GET | List all processed receipts |
| `/api/receipts/{id}` | GET | Get receipt details by ID |
| `/api/analytics/monthly-spend` | GET | Monthly spending aggregates |
| `/api/analytics/category-breakdown` | GET | Total spend by category |

## Customization

### Adding New Food Categories

Edit `Services/CategoryService.cs`:

```csharp
private readonly Dictionary<string, string> _keywordCategories = new(StringComparer.OrdinalIgnoreCase)
{
    // Add your keywords here
    ["tofu"] = "Healthy",
    ["energy drink"] = "Junk",
    // ...
};
```

### Adjusting Health Score Weights

Edit `Services/HealthScoreService.cs`:

```csharp
decimal weight = item.Category switch
{
    "Healthy" => 1m,   // Change weights here
    "Junk" => -1m,
    // ...
};
```

## Future Enhancements

- [ ] **OCR Integration**: Add Tesseract.NET for image processing
- [ ] **PDF Text Extraction**: Implement PDF parsing
- [ ] **Vendor Bias**: Apply vendor-level category adjustments
- [ ] **Weekly/Yearly Analytics**: Expand time-based aggregations
- [ ] **Price Inflation Tracking**: Monitor unit price changes over time
- [ ] **Export to CSV/Excel**: Download receipt data
- [ ] **Background Job Queue**: Use Hangfire or Azure Functions for processing
- [ ] **User Authentication**: Multi-user support
- [ ] **Mobile App**: React Native or Xamarin client

## Development

### Building

```bash
dotnet build
```

### Running Tests

```bash
dotnet test
```

### Database Migrations

Database is automatically created on first run (`EnsureCreated()`). For production, use migrations:

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues or questions, please open a GitHub issue or contact the maintainer.

---

Built with ❤️ using **.NET 8** and **GitHub Copilot**
