# ReceiptHealth 🩺

> **🎉 New in v2.0: Modern React Frontend!** - The app has been completely redesigned with a beautiful React interface. See [README_REACT.md](README_REACT.md) for the new frontend documentation.

A production-quality .NET 8 web application that helps you track and analyze the healthiness of your grocery shopping receipts. Upload receipts, automatically extract structured data, categorize line items, and visualize spending patterns.

## 🚀 Quick Start

### Run the Modern React App (Recommended)
```bash
# Start both backend and frontend
./start-dev.sh        # Linux/Mac
start-dev.bat         # Windows

# Or manually:
# Terminal 1: dotnet run
# Terminal 2: cd client && npm run dev
# Open http://localhost:5173
```

### Run the Classic HTML Version
```bash
dotnet run
# Open http://localhost:5000
```

---

## Features

### 📤 Receipt Upload & Processing
- **Drag & drop interface** for easy file uploads
- Support for multiple file formats: JPG, PNG, TXT (PDF support requires additional library)
- **AI-Powered OCR** using GitHub Copilot SDK with GPT-4 Vision for image text extraction
- **Intelligent Receipt Parsing** using GPT-4 to understand and structure receipt data
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

### 🤖 AI-Powered Features (GitHub Copilot SDK)

When `UseAI: true` is configured, the application leverages the GitHub Copilot SDK for advanced capabilities:

1. **AI-Powered OCR (Images)**
   - Uses GPT-4 Vision (`gpt-4o`) to extract text from receipt images
   - Supports JPG, PNG formats
   - Maintains original layout and structure
   - Far superior accuracy compared to traditional OCR libraries

2. **PDF Support (Requires Additional Library)**
   - Note: AI vision models work best with images, not PDF binary data
   - For PDF support, install a PDF library such as:
     - `PdfPig` - Open source, actively maintained
     - `iTextSharp` - Commercial, feature-rich
   - Alternative: Convert PDF to images first, then use AI OCR
   - See `AI_INTEGRATION.md` for implementation guidance

3. **Intelligent Receipt Parsing**
   - Uses GPT-4.1 to understand receipt structure
   - Automatically extracts:
     - Vendor/store name
     - Purchase date
     - Line items with descriptions, quantities, and prices
     - Subtotal, tax, and total amounts
   - Returns structured JSON data for easy processing
   - Falls back to regex-based parsing if AI fails

**Implementation Details:**
- Located in `Services/AICopilotTextExtractionService.cs` and `Services/AICopilotReceiptParserService.cs`
- Uses `GitHub.Copilot.SDK` and `Microsoft.Extensions.AI` NuGet packages
- Creates Copilot sessions for each processing request
- Base64-encodes images for GPT-4 Vision analysis
- Structured prompts ensure consistent, parseable output

## Tech Stack

- **.NET 8** - ASP.NET Core minimal APIs
- **Entity Framework Core 8** with **SQLite** (file-based database)
- **GitHub Copilot SDK 0.1.23** for AI-powered OCR and receipt parsing
- **GPT-4 Vision (gpt-4o)** for image analysis and text extraction
- **GPT-4.1** for intelligent receipt structure parsing
- **Microsoft.Extensions.AI** - AI abstractions and utilities
- **Chart.js** for data visualization
- **Vanilla JavaScript** frontend (no framework)
- **Services pattern** with dependency injection
- **Async/await** throughout for performance

## Getting Started

### Prerequisites

- .NET 8 SDK or later
- **GitHub Copilot CLI** installed and authenticated (required for AI features)
  - Install: Follow the [GitHub Copilot CLI installation guide](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli)
  - Verify: Run `copilot --version` to ensure it's working
  - Note: If you set `UseAI: false` in appsettings.json, Copilot CLI is not required
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
    "MaxFileSizeBytes": 15728640,
    "UseAI": true
  }
}
```

**Configuration Options:**
- `StorageRoot`: Directory for uploaded files (default: `./storage`)
- `DatabasePath`: SQLite database file path (default: `./receipts.db`)
- `MaxFileSizeBytes`: Maximum upload size in bytes (default: 15MB)
- **`UseAI`**: Enable AI-powered OCR and parsing using GitHub Copilot SDK (default: `true`)
  - Set to `true` for AI-powered image OCR and intelligent receipt parsing (requires GitHub Copilot CLI authentication)
  - Set to `false` for basic text extraction (no AI, no authentication required)

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

- [x] **OCR Integration**: ✅ Implemented using GitHub Copilot SDK with GPT-4 Vision
- [x] **PDF Text Extraction**: ✅ Implemented using GitHub Copilot SDK
- [x] **Intelligent Receipt Parsing**: ✅ Implemented using GPT-4.1 for structured data extraction
- [x] **Price Comparison**: ✅ Track prices across stores and over time
- [x] **AI-Powered Insights**: ✅ Natural language queries, anomaly detection, budget predictions
- [x] **Shopping Lists**: ✅ Generate lists, track prices, get alerts
- [x] **Gamification**: ✅ Achievements and challenges system
- [x] **Nutritional Analysis**: ✅ AI-powered calorie/nutrient estimation
- [x] **Category Insights**: ✅ Spending trends and healthy recommendations
- [ ] **PDF Support**: Add PdfPig or iTextSharp for PDF text extraction (see AI_INTEGRATION.md)
- [ ] **PDF-to-Image Conversion**: For scanned PDFs, convert to images and use AI OCR
- [ ] **AI-Powered Categorization**: Enhance category detection using AI instead of keywords
- [ ] **Vendor Bias**: Apply vendor-level category adjustments
- [ ] **Weekly/Yearly Analytics**: Expand time-based aggregations
- [ ] **Export to CSV/Excel**: Download receipt data
- [ ] **Background Job Queue**: Use Hangfire or Azure Functions for processing
- [ ] **User Authentication**: Multi-user support
- [ ] **Mobile App**: React Native or Xamarin client with camera integration
- [ ] **Batch Processing**: Process multiple receipts simultaneously with AI
- [ ] **Nutrition Dashboard**: Visual charts for daily/weekly nutrition
- [ ] **Price Alerts Notifications**: Email/push notifications for price drops

## New Features (Advanced)

### 🔍 Receipt Comparison
- **Cross-Store Price Comparison**: Compare prices for the same items across different stores
- **Price Trends**: Track how prices change over time at specific stores
- **Example**: "You bought Pepsi at LIDL for €2.50, but it was €2.00 at Aldi last week"

### 📊 Category Insights & Analytics
- **Spending Trends**: Weekly/monthly trends by category
- **Health Score Trends**: Track your health score over time
- **Personalized Recommendations**: Get suggestions for healthier alternatives
- **Smart Alerts**: "You spent 23% more on junk food this month"

### 🛒 Shopping Lists
- **Smart List Generation**: Auto-generate shopping lists from your healthy purchases
- **Price Tracking**: Track prices for items on your list
- **Price Alerts**: Get notified when items are cheaper than usual
- **Junk Food Warnings**: Alerts when buying too much unhealthy food

### 🤖 AI-Powered Insights
- **Natural Language Queries**: Ask questions like "How much did I spend on vegetables last month?"
- **Anomaly Detection**: Automatically detect unusual spending patterns
- **Predictive Budgeting**: AI predicts your monthly spending based on patterns
- **Smart Recommendations**: Context-aware suggestions based on your shopping history

### 🥗 Nutritional Analysis
- **AI Nutrition Estimation**: Estimate calories and nutrients for purchased items
- **Daily/Weekly Dashboards**: Track your nutrition intake
- **RDI Comparison**: Compare against recommended daily intake values
- **Health Insights**: Understand nutritional impact of your purchases

### 🏆 Gamification
- **Achievement System**: Unlock badges for healthy shopping habits
  - 🌱 Healthy Start (3 healthy trips)
  - 🔥 Week of Health (7 healthy trips)
  - 💪 Two Week Warrior (14 healthy trips)
  - 🏆 Health Champion (30 healthy trips)
- **Challenges**: Set and track personal goals
  - Improve health score by X points
  - Reduce junk food spending by X%
  - Build healthy shopping streaks
- **Progress Tracking**: Visual progress bars and statistics

## API Endpoints (New)

### Price Comparison
- `GET /api/price-comparison/{itemName}` - Compare prices across stores
- `GET /api/price-trends/{itemName}?days={n}` - Get price trends over time

### Recommendations
- `GET /api/recommendations/alternatives/{itemName}` - Get healthy alternatives
- `GET /api/recommendations/category` - Get personalized recommendations

### Shopping Lists
- `GET /api/shopping-lists` - Get all shopping lists
- `POST /api/shopping-lists` - Create a new shopping list
- `GET /api/shopping-lists/{id}` - Get specific list with items
- `POST /api/shopping-lists/generate?daysBack={n}` - Generate list from healthy items
- `POST /api/shopping-lists/{listId}/items` - Add item to list
- `PATCH /api/shopping-lists/items/{itemId}` - Mark item as purchased
- `DELETE /api/shopping-lists/items/{itemId}` - Remove item from list
- `GET /api/shopping-lists/{listId}/price-alerts` - Get price alerts for list items

### Gamification
- `GET /api/achievements` - Get all achievements
- `GET /api/challenges` - Get active challenges
- `POST /api/challenges` - Create a new challenge
- `POST /api/achievements/check` - Trigger achievement check

### AI Insights
- `POST /api/insights/query` - Natural language query
- `GET /api/insights/anomalies` - Detect spending anomalies
- `GET /api/insights/budget-prediction` - Get budget prediction

### Nutrition
- `GET /api/nutrition/daily?date={date}` - Get daily nutrition summary
- `GET /api/nutrition/weekly?weekStart={date}` - Get weekly nutrition summary
- `POST /api/nutrition/populate/{receiptId}` - Populate nutrition data for receipt


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
