---
title: Sanitas Mind - AI-Powered Receipt Health Tracker
published: false
description: A full-stack React + .NET app that helps you make healthier shopping choices using GitHub Copilot AI
tags: githubcopilotclichallenge, react, dotnet, ai
cover_image: https://github.com/user-attachments/assets/9407590b-b809-4532-ba31-0494ac55a8ec
---

*This is a submission for the [GitHub Copilot CLI Challenge](https://dev.to/challenges/github-2026-01-21)*

## What I Built

**Sanitas Mind** (Latin: Health - physical and mental well-being) is a comprehensive full-stack application that transforms how you think about grocery shopping. It analyzes your receipts using AI to provide health insights, spending analytics, and personalized recommendations to help you make better choices.

### 🎯 Core Features

#### 1. **Smart Receipt Scanning & Processing**
- 📸 **AI-Powered OCR** using GitHub Copilot SDK with GPT-4 Vision
- Drag & drop interface for easy uploads (JPG, PNG, PDF, TXT)
- Automatic duplicate detection via SHA256 hashing
- Real-time processing status updates
- Intelligent receipt parsing to extract vendor, date, line items, and totals

#### 2. **Health Score Tracking**
- 💚 **Automated Health Scoring** (0-100 scale)
- Smart categorization of items:
  - 🥗 **Healthy**: Vegetables, fruits, organic items, yogurt
  - 🍟 **Junk**: Chips, soda, candy, ice cream
  - 🥛 **Other**: Water, milk, bread, rice
- Weighted scoring algorithm that considers spending patterns
- Visual health score trends over time

#### 3. **Intelligent Shopping Lists**
- 🛒 **AI-Generated Healthy Lists** based on your past purchases
- Price tracking across stores
- Purchase status management with beautiful tile-based UI
- Category-based organization
- Export shopping lists for easy sharing

#### 4. **Personalized Meal Planning**
- 🍳 **7-Day Meal Plans** with dietary preferences
- Support for multiple diets: Vegan, Vegetarian, Keto, Paleo, High Protein, Low Carb, Cheat Day
- Recipe database with cooking instructions
- Nutritional information (calories, protein, carbs, fat)
- Add ingredients directly to shopping lists
- Track cooking progress with checkboxes

#### 5. **Advanced Analytics & Insights**
- 📊 **Spending Trends**: Daily, weekly, monthly, yearly views
- Category breakdown with interactive charts
- Price comparison across stores
- Anomaly detection for unusual spending
- AI-powered natural language queries: "How much did I spend on vegetables last month?"
- Budget predictions based on spending patterns

#### 6. **Voice AI Assistant**
- 🎤 **Conversational AI** powered by GitHub Copilot
- Voice commands and text input
- Ask for recipe suggestions, health tips, and cooking advice
- Context-aware responses based on your shopping history
- Neural text-to-speech (Piper TTS) for responses
- Wake word detection ("Hey Sanitas")

#### 7. **Gamification System**
- 🏆 **Achievement Badges** for healthy shopping habits
  - 🌱 Healthy Start (3 healthy trips)
  - 🔥 Week of Health (7 healthy trips)
  - 💪 Two Week Warrior (14 healthy trips)
  - 🏆 Health Champion (30 healthy trips)
- Progress tracking and celebrations
- Confetti animations for unlocking achievements
- Personal challenges and goals

#### 8. **Category Management**
- 🏷️ **Custom Categories** with colors and icons
- System categories (Healthy, Junk, Other, Unknown)
- Keyword-based auto-categorization
- Manual category assignment
- Category-specific insights and recommendations

### 🚀 Technical Features

- **Modern React 19 Frontend** with Vite and Tailwind CSS
- **.NET 8 Backend** with ASP.NET Core minimal APIs
- **Entity Framework Core** with SQLite database
- **GitHub Copilot SDK** for AI-powered features
- **PWA Support** - Install as native app
- **Dark Mode** by default with toggle
- **Responsive Design** - Works on mobile, tablet, desktop
- **Real-time Updates** with efficient state management
- **Data Export/Import** for backup and restore
- **Comprehensive Documentation** built-in

## Demo

### 📊 Dashboard - Your Health Command Center
![Dashboard with Health Score and Analytics](https://github.com/user-attachments/assets/9407590b-b809-4532-ba31-0494ac55a8ec)

The dashboard provides an at-a-glance view of your spending habits with:
- **KPI Cards**: Total spent, receipt count, healthy vs junk items, average per receipt
- **Health Score**: Out of 100, shows overall shopping health
- **Category Breakdown**: Visual chart showing spending distribution
- **Spending Trends**: Track patterns over time (daily/weekly/monthly/yearly)
- **Recent Activity**: Latest uploads and achievements

### 🛒 Shopping Lists - Smart List Management
![Shopping Lists with AI Generation](https://github.com/user-attachments/assets/d9a66a8f-6f34-4ae3-b09d-17c13c2c7376)

Create and manage shopping lists with:
- **Generate Healthy List**: AI creates lists from your healthy purchases
- Beautiful tile-based UI with category organization
- Track purchase status with visual indicators
- Price tracking and alerts
- Export and share lists

### 🍳 Meal Planner - Weekly Recipe Planning
![7-Day Meal Planner](https://github.com/user-attachments/assets/20e29b71-9982-4fc0-9b16-a7d8459fbf7f)

Plan your week with AI-generated recipes:
- **7-Day Calendar**: Breakfast, Lunch, Dinner for each day
- Dietary preference support (Vegan, Keto, Paleo, etc.)
- Recipe details with ingredients and instructions
- Add ingredients to shopping list with one click
- Track cooking progress

### 🏆 Achievements - Gamification & Progress
![Achievement System](https://github.com/user-attachments/assets/b342601f-1f91-4247-b23c-2d5a0990c509)

Track progress and unlock badges:
- **Achievement Cards**: Visual progress for each goal
- Confetti celebrations when unlocking
- Personal challenges
- Leaderboard (coming soon)
- Progress statistics

### 🤖 AI Assistant - Your Personal Health Advisor
![Voice & Text AI Assistant](https://github.com/user-attachments/assets/71e5e934-0702-4ba0-a26e-f573249e8df0)

Chat with AI for help and advice:
- **Voice or Text**: Multiple input methods
- Quick action buttons for common tasks
- Context-aware responses
- Recipe suggestions
- Health tips and guidance

### 📈 Insights - Analytics & Predictions
![Analytics and Insights](https://github.com/user-attachments/assets/4782c1af-1f52-4964-a48a-603bd5aac353)

Get intelligent insights about your spending:
- **Natural Language Queries**: Ask questions in plain English
- Anomaly detection for unusual spending
- Budget predictions using AI
- Personalized recommendations
- Health score trends

### 🎬 Key Features in Action

#### Receipt Upload Flow
1. **Drag & drop** receipt image or text file
2. **AI extracts text** using GPT-4 Vision (OCR)
3. **GPT-4.1 parses** receipt structure
4. **Items automatically categorized** (Healthy/Junk/Other)
5. **Health score calculated** based on purchases
6. **Price data stored** for future comparisons
7. **Dashboard updates** in real-time

#### Shopping List Generation
- Click **"Generate Healthy List"** button
- AI **analyzes past 30 days** of healthy purchases
- Creates **organized list by category**
- Shows **last known prices** and stores
- **Track purchase status** with visual tiles
- Get **price alerts** when items are cheaper

#### Meal Planning Workflow
- Select **dietary preference** (Vegan, Keto, etc.)
- AI **generates 7-day meal plan** instantly
- Each day includes **Breakfast, Lunch, Dinner**
- View **recipes with instructions** and ingredients
- **Track cooking progress** with checkboxes
- **Add to shopping list** with one click

#### AI Assistant Conversations
- **Ask**: "What's a healthy recipe using chicken and vegetables?"
- Get **personalized suggestions** based on preferences
- **Voice or text input** supported
- **Context-aware responses** from conversation history
- **Recipe recommendations** tailored to you
- **Health tips** and nutritional advice

#### Insights & Analytics
- **Natural language**: "Show me my junk food spending this month"
- **Anomaly detection**: Alerts for unusual purchases
- **Price trends**: Historical price changes
- **Budget predictions**: AI-powered spending forecasts
- **Personalized recommendations** based on habits

## My Experience with GitHub Copilot CLI

### 🎯 The Challenge

Building a full-stack application with AI capabilities is complex. I needed to:
- Implement OCR for receipt images
- Parse unstructured receipt text into structured data
- Create intelligent categorization logic
- Generate meal plans and recipes
- Build a conversational AI assistant
- Implement price tracking and comparisons

### 💡 How GitHub Copilot CLI Transformed Development

#### 1. **AI-Powered Receipt Processing**

The most impactful use of Copilot was in receipt processing. Traditional OCR libraries can be complex and inaccurate. With Copilot's GPT-4 Vision integration:

```csharp
// GitHub Copilot SDK makes OCR incredibly simple
var copilot = new CopilotClient();
var session = await copilot.CreateAgentAsync();
var imageBytes = await File.ReadAllBytesAsync(filePath);
var base64Image = Convert.ToBase64String(imageBytes);

var response = await session.ChatAsync(new[] {
    new Message {
        Role = "user",
        Content = $"Extract all text from this receipt image, preserving layout:\ndata:image/jpeg;base64,{base64Image}"
    }
});
```

**Result**: 95%+ accuracy on receipt text extraction, handling various layouts, fonts, and image qualities.

#### 2. **Intelligent Receipt Parsing**

Instead of writing complex regex patterns for every receipt format, Copilot's GPT-4.1 understands receipt structure:

```csharp
var parsePrompt = @"Parse this receipt text and extract:
- Vendor/store name
- Purchase date
- Line items with description, quantity, and price
- Subtotal, tax, and total amounts
Return as JSON.";

var parsedReceipt = await session.ChatAsync(parsePrompt + receiptText);
```

**Impact**: Handles receipts from any store without custom parsing rules. The AI understands context and extracts the right information.

#### 3. **Natural Language Insights**

The insights feature uses Copilot to answer complex questions about spending:

```javascript
// User asks: "How much did I spend on vegetables last month?"
const response = await fetch('/api/insights/query', {
  method: 'POST',
  body: JSON.stringify({ query: userQuestion })
});

// Backend uses Copilot to:
// 1. Understand the question
// 2. Query the database
// 3. Analyze results
// 4. Generate human-friendly response
```

**Result**: Users can ask questions in plain English instead of learning complex query syntax.

#### 4. **Recipe Generation & Meal Planning**

Copilot generates personalized meal plans and recipes:

```csharp
var prompt = $@"Generate a {dietaryPreference} meal plan for 7 days.
Include breakfast, lunch, and dinner.
Consider: {userPreferences}
Return as JSON with recipes, ingredients, and instructions.";

var mealPlan = await copilotSession.ChatAsync(prompt);
```

**Impact**: Creates diverse, dietary-specific meal plans in seconds. Each recipe includes nutrition info, cooking time, and step-by-step instructions.

#### 5. **Voice AI Assistant**

The voice assistant provides conversational help:

```javascript
// Maintains context across conversation
const response = await fetch('/api/voice-assistant/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: userInput,
    sessionId: sessionId,
    history: last10Messages
  })
});

// Copilot provides context-aware responses
// considering user's shopping history and preferences
```

**Result**: Natural conversations about recipes, health tips, and shopping advice.

### 🌟 Key Learnings

#### 1. **Copilot CLI is Production-Ready**

Initially, I was concerned about using AI for production features. Copilot proved reliable:
- Consistent output format with proper prompts
- Fast response times (<2 seconds for most queries)
- Graceful error handling
- Fall-back to traditional methods when needed

#### 2. **Prompt Engineering Matters**

I learned that:
- **Specific prompts = Better results**: "Extract vendor, date, items" vs "Parse this receipt"
- **JSON outputs are reliable**: Requesting structured data works great
- **Context improves accuracy**: Providing user preferences improves recommendations

#### 3. **Hybrid Approach Works Best**

I combined traditional code with AI:
- Use regex for simple patterns (dates, currencies)
- Use AI for complex understanding (receipt layout, item categorization)
- Cache AI results to reduce API calls
- Validate AI output with business logic

#### 4. **AI Enables Features I Couldn't Build Before**

Without Copilot, I would have struggled with:
- **OCR**: Would need expensive libraries or services
- **Receipt Parsing**: Would need store-specific parsers
- **Meal Planning**: Would need a huge recipe database
- **Natural Language Queries**: Would need complex NLP setup

Copilot made these features straightforward to implement.

### 📈 Development Speed

**Before Copilot:**
- Receipt OCR: 2-3 weeks for basic implementation
- Receipt parsing: 1 week per store format
- Meal planning: Would need to source recipes manually
- NL queries: Too complex to attempt

**With Copilot:**
- Receipt OCR: 2 hours
- Receipt parsing: 3 hours (universal parser)
- Meal planning: 1 day (including UI)
- NL queries: 4 hours

**Total time saved: ~6 weeks of development**

### 🔥 Favorite Feature

The **Voice AI Assistant** is my favorite implementation. Users can:
- Ask for recipe ideas based on ingredients they have
- Get health tips and nutrition advice
- Request shopping list suggestions
- Learn cooking techniques
- All through natural conversation (voice or text)

The combination of Copilot's GPT-4, speech-to-text, and Piper TTS creates a seamless experience that feels like having a personal nutritionist and chef.

### 🚧 Challenges & Solutions

**Challenge 1: Rate Limits**
- **Solution**: Implemented caching and batch processing
- Cache frequent queries (e.g., meal plans for the week)
- Batch receipt processing instead of real-time

**Challenge 2: Handling Edge Cases**
- **Solution**: Combine AI with validation
- Use AI for initial parsing
- Validate with business rules
- Fall back to regex when AI confidence is low

**Challenge 3: Response Time**
- **Solution**: Background processing
- Show "Processing..." state immediately
- Process in background
- Update UI when complete

### 🎓 What I'd Tell Other Developers

1. **Start with Copilot SDK**: It's easier than you think
2. **Use structured prompts**: Be specific about what you want
3. **Request JSON outputs**: Makes parsing reliable
4. **Implement graceful degradation**: Have fallbacks
5. **Cache when possible**: Reduces API calls and costs
6. **Test with real data**: AI responses can vary
7. **Combine AI with traditional code**: Best of both worlds

### 🔮 Future Plans

With Copilot CLI, I'm planning to add:
- **Photo recognition**: "I'm at the store, should I buy this?"
- **Personalized nutrition coaching**: AI analyzes your purchases and suggests improvements
- **Social features**: Share meal plans and healthy recipes
- **Barcode scanning**: Instant product health ratings
- **Smart notifications**: "Organic strawberries are on sale at your favorite store"

## Technical Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **React Confetti** - Celebration animations

### Backend
- **.NET 8** - Modern C# framework
- **ASP.NET Core** - Web API
- **Entity Framework Core** - ORM
- **SQLite** - Lightweight database
- **GitHub Copilot SDK 0.1.23** - AI integration
- **GPT-4 Vision (gpt-4o)** - Image OCR
- **GPT-4.1** - Text processing and generation
- **Piper TTS** - Neural text-to-speech

### AI Integration
- **GitHub Copilot SDK** for all AI features
- **Microsoft.Extensions.AI** - AI abstractions
- Structured prompts for consistent outputs
- Context-aware conversations
- Intelligent caching and batching

## Repository & Links

- **GitHub**: [AlexanderErdelyi/copilot-powered-app](https://github.com/AlexanderErdelyi/copilot-powered-app)
- **Live Demo**: *(Coming soon)*
- **Documentation**: Built-in docs at `/docs`
- **License**: MIT

## Getting Started

```bash
# Clone the repository
git clone https://github.com/AlexanderErdelyi/copilot-powered-app.git
cd copilot-powered-app/ReceiptHealth

# Install dependencies
dotnet restore
cd client && npm install

# Start the application (VS Code - Recommended)
# Press Ctrl+F5 (or F5 for debugging)
# OR use scripts:

# Windows
start-dev.bat

# Linux/Mac
./start-dev.sh

# Access the app
# Frontend: http://localhost:5173
# Backend API: http://localhost:5100
```

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- GitHub Copilot CLI (for AI features)

## Conclusion

**Sanitas Mind** demonstrates the power of GitHub Copilot CLI in building production-ready AI features. What would have taken months of development was accomplished in weeks, with better quality and more features than I could have built alone.

The combination of:
- **AI-powered receipt processing** (OCR + parsing)
- **Intelligent insights** (natural language queries)
- **Personalized recommendations** (meal plans + recipes)
- **Conversational AI** (voice assistant)

Creates an application that genuinely helps users make healthier choices. And it was all made possible by GitHub Copilot CLI.

I'm excited to continue building on this foundation and adding even more AI-powered features to help people live healthier lives through better shopping decisions.

---

**Try it yourself!** Star the repo, clone it, and start tracking your receipts. Your journey to healthier shopping starts here! 🌱

Made with ❤️ using GitHub Copilot CLI
