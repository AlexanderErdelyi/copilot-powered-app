# ReceiptHealth - Modern React Application

## 🎉 Complete Redesign - Version 2.0

The ReceiptHealth application has been completely redesigned with a modern React frontend while maintaining the powerful .NET 8 backend.

---

## 📸 Preview

### Modern Sidebar Navigation
The app now features a beautiful sidebar navigation instead of the old top menu bar:
- Clean, icon-based navigation
- Active state highlighting
- Dark mode support
- Mobile-responsive with hamburger menu

### Key Features
- ✨ Modern React 19 + Vite frontend
- 🎨 Tailwind CSS styling with custom design system
- 🌓 Full dark mode support
- 📱 Fully responsive (mobile, tablet, desktop)
- ⚡ Fast page transitions (SPA)
- 🎯 Component-based architecture
- 🔄 Drag-and-drop file uploads
- 📊 Interactive charts (Recharts)
- 🔔 Toast notifications

---

## 🚀 Quick Start

### Prerequisites
- .NET 8 SDK
- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/AlexanderErdelyi/copilot-powered-app.git
cd copilot-powered-app/ReceiptHealth
```

2. **Install frontend dependencies**
```bash
cd client
npm install
cd ..
```

3. **Run the application**

**Option A: Development Mode (Recommended)**

Open two terminal windows:

Terminal 1 - Backend:
```bash
cd ReceiptHealth
dotnet run
```

Terminal 2 - Frontend:
```bash
cd ReceiptHealth/client
npm run dev
```

Then open your browser to: **http://localhost:5173**

**Option B: Production Build**
```bash
# Build the React app
cd ReceiptHealth/client
npm run build

# The built files will be in client/dist/
# You can serve them with the .NET backend or any static file server
```

---

## 📁 Project Structure

```
ReceiptHealth/
├── client/                      # 🆕 React Frontend
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   ├── Layout.jsx     # Main layout wrapper
│   │   │   └── Sidebar.jsx    # Navigation sidebar
│   │   ├── pages/             # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Receipts.jsx
│   │   │   ├── ShoppingLists.jsx
│   │   │   ├── MealPlanner.jsx
│   │   │   ├── Insights.jsx
│   │   │   ├── Achievements.jsx
│   │   │   └── VoiceAssistant.jsx
│   │   ├── App.jsx            # Router setup
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Tailwind styles
│   ├── public/                # Static assets
│   ├── package.json           # Dependencies
│   ├── vite.config.js         # Vite config + API proxy
│   ├── tailwind.config.js     # Tailwind config
│   └── README.md              # Frontend docs
│
├── Services/                   # Backend services
├── Models/                     # Data models
├── Data/                       # EF Core DbContext
├── Program.cs                  # 🔄 Updated with CORS
├── wwwroot/                    # Old HTML files (reference)
└── ReceiptHealth.csproj       # .NET project file
```

---

## 🎨 Pages Overview

### 1. Dashboard
**Route:** `/`
- KPI cards with trends (Total Spent, Receipts, Healthy Items, Avg per Receipt)
- Spending trends line chart
- Category breakdown pie chart
- Recent activity feed

### 2. Receipts
**Route:** `/receipts`
- Drag-and-drop file upload area
- Searchable receipts table
- Health score indicators
- View/delete actions

### 3. Shopping Lists
**Route:** `/shopping-lists`
- Card-based list view
- Progress indicators
- Create new list functionality

### 4. Meal Planner
**Route:** `/meal-planner`
- Weekly calendar grid
- Breakfast/Lunch/Dinner slots
- AI-powered meal generation

### 5. Insights
**Route:** `/insights`
- Health score analytics
- Average spending metrics
- Top category breakdown
- Smart recommendations

### 6. Achievements
**Route:** `/achievements`
- Gamification badges
- Earned/unearned status
- Progress tracking

### 7. Voice Assistant
**Route:** `/voice-assistant`
- Voice control interface
- Microphone button with listening indicator
- Example voice commands

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2 | UI framework |
| Vite | 7.3 | Build tool & dev server |
| React Router | 7.13 | Client-side routing |
| Tailwind CSS | 3.4 | Utility-first CSS |
| Recharts | 3.7 | Chart library |
| Lucide React | 0.563 | Icon library |
| Axios | 1.13 | HTTP client |
| React Hot Toast | 2.6 | Notifications |

### Backend
| Technology | Purpose |
|------------|---------|
| .NET 8 | Backend framework |
| Entity Framework Core | ORM |
| SQLite | Database |
| GitHub Copilot SDK | AI integration |
| Swagger/OpenAPI | API documentation |

---

## 🔧 Configuration

### Backend Configuration (Program.cs)
- Changed port from 5002 to **5000** (standard REST API convention)
- Added CORS policy for React dev server (localhost:5173)
- No other backend changes - fully backward compatible

### Frontend Configuration (vite.config.js)
- API proxy: `/api/*` → `http://localhost:5000`
- Fast refresh enabled
- Optimized build output

### Environment Variables
Create a `.env` file in `client/` for custom configuration:
```env
VITE_API_URL=http://localhost:5000
```

---

## 🎨 Design System

### Color Palette
```css
Primary: #667eea → #764ba2 (Purple gradient)
Success: #10b981 (Green)
Warning: #f59e0b (Orange)
Error: #ef4444 (Red)
Info: #3b82f6 (Blue)
```

### Custom Tailwind Classes
- `.btn-primary` - Primary button with gradient
- `.btn-secondary` - Secondary button
- `.card` - Card component with shadow
- `.input` - Form input styling

### Dark Mode
- Implemented with Tailwind's `dark:` prefix
- Persisted in localStorage
- Toggle button in sidebar footer

---

## 📝 Development Guide

### Adding a New Page
1. Create a new component in `client/src/pages/`
2. Add the route in `client/src/App.jsx`
3. Add menu item in `client/src/components/Sidebar.jsx`

Example:
```jsx
// pages/NewPage.jsx
function NewPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Page</h1>
      <p>Content here...</p>
    </div>
  );
}
export default NewPage;

// App.jsx
<Route path="/new-page" element={<NewPage />} />

// Sidebar.jsx
{ path: '/new-page', icon: IconName, label: 'New Page' }
```

### Calling Backend APIs
```jsx
import axios from 'axios';

// GET request
const response = await axios.get('/api/receipts');
setReceipts(response.data);

// POST request
await axios.post('/api/receipts', formData);

// DELETE request
await axios.delete(`/api/receipts/${id}`);
```

### Adding Tailwind Styles
```jsx
// Use Tailwind utility classes
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
    Title
  </h2>
</div>
```

---

## 🧪 Testing

### Backend Tests
```bash
cd ReceiptHealth
dotnet test
```

### Frontend Tests (to be added)
```bash
cd client
npm test
```

---

## 📦 Deployment

### Production Build
```bash
# Build React app
cd client
npm run build

# Output will be in client/dist/

# Option 1: Serve with .NET
# Configure Program.cs to serve static files from client/dist

# Option 2: Deploy separately
# Deploy client/dist to CDN/static hosting
# Deploy backend to cloud service
```

### Docker Deployment (future)
```dockerfile
# Multi-stage build
FROM node:18 AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-build
WORKDIR /app
COPY *.csproj ./
RUN dotnet restore
COPY . ./
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=backend-build /app/out .
COPY --from=frontend-build /app/client/dist ./wwwroot
ENTRYPOINT ["dotnet", "ReceiptHealth.dll"]
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### CORS Errors
Make sure the backend is running on port 5000 and CORS is configured:
```csharp
// Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactDevPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

app.UseCors("ReactDevPolicy");
```

### npm Install Fails
```bash
# Clear cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Router Documentation](https://reactrouter.com/)
- [Recharts Documentation](https://recharts.org/)
- [.NET Documentation](https://learn.microsoft.com/en-us/dotnet/)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Alexander Erdelyi**
- GitHub: [@AlexanderErdelyi](https://github.com/AlexanderErdelyi)

---

## 🎉 Acknowledgments

- GitHub Copilot SDK for AI-powered features
- React team for an amazing framework
- Tailwind CSS team for the utility-first CSS framework
- All open-source contributors

---

**Enjoy the new modern ReceiptHealth experience!** 🚀
