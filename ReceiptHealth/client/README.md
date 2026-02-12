# ReceiptHealth - Modern React Frontend

A complete redesign of the ReceiptHealth application using modern web technologies.

## 🎨 New Features

### Modern UI/UX
- ✨ **Sidebar Navigation** - Replaced horizontal menu with a sleek sidebar
- 🌓 **Dark Mode** - Full dark mode support with smooth transitions
- 📱 **Fully Responsive** - Works perfectly on mobile, tablet, and desktop
- 🎭 **Modern Design** - Clean, professional interface with Tailwind CSS
- 🚀 **Fast Performance** - Powered by Vite for lightning-fast development

### Technology Stack
- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router v7
- **Charts**: Recharts (responsive charts)
- **Icons**: Lucide React (modern icon library)
- **Notifications**: React Hot Toast
- **HTTP Client**: Axios
- **Backend**: .NET 8 (ASP.NET Core - unchanged)

## 🚀 Getting Started

### Development Mode

1. **Start the Backend** (Terminal 1):
```bash
cd ReceiptHealth
dotnet run
```

2. **Start the React Dev Server** (Terminal 2):
```bash
cd ReceiptHealth/client
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Production Build

Build the React app for production:
```bash
cd ReceiptHealth/client
npm run build
```

The built files will be in `client/dist` and can be served by the .NET backend.

## 📁 Project Structure

```
ReceiptHealth/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── Layout.jsx   # Main layout wrapper
│   │   │   └── Sidebar.jsx  # Sidebar navigation
│   │   ├── pages/           # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Receipts.jsx
│   │   │   ├── ShoppingLists.jsx
│   │   │   ├── MealPlanner.jsx
│   │   │   ├── Insights.jsx
│   │   │   ├── Achievements.jsx
│   │   │   └── VoiceAssistant.jsx
│   │   ├── App.jsx          # Main app with routing
│   │   └── index.css        # Tailwind styles
│   ├── tailwind.config.js   # Tailwind configuration
│   └── vite.config.js       # Vite configuration
│
└── [Backend files remain unchanged]
```

## 🎨 Design System

### Color Palette
- **Primary**: Purple gradient (#667eea → #764ba2)
- **Success**: Green (#10b981)
- **Warning**: Orange (#f59e0b)
- **Error**: Red (#ef4444)
- **Info**: Blue (#3b82f6)

### Component Library
- **Cards**: `.card` - Pre-styled card component
- **Buttons**: `.btn-primary`, `.btn-secondary`
- **Inputs**: `.input` - Form input styling
- **Dark Mode**: Automatic support with `dark:` classes

## 📱 Features by Page

### Dashboard
- KPI cards with trends
- Interactive spending chart
- Category breakdown pie chart
- Recent activity feed

### Receipts
- Drag & drop file upload
- Searchable receipt table
- Health score indicators
- Delete/view actions

### Shopping Lists
- Create and manage lists
- Progress tracking
- Item count displays

### Meal Planner
- Weekly calendar view
- Breakfast/Lunch/Dinner planning
- AI-powered meal generation

### Insights
- Spending analytics
- Health trends
- Smart recommendations

### Achievements
- Gamification badges
- Progress tracking
- Unlock conditions

### Voice Assistant
- Voice control interface
- Command examples
- Real-time transcription

## 🔧 Configuration

### API Proxy
The Vite dev server proxies `/api/*` requests to `http://localhost:5000` (backend).

### Environment Variables
Create `.env` for custom configuration:
```env
VITE_API_URL=http://localhost:5000
```

## 🌟 Key Improvements

1. **Better Performance**: React's virtual DOM + Vite's HMR = instant updates
2. **Modern Design**: Professional UI that rivals commercial apps
3. **Maintainability**: Component-based architecture, easier to update
4. **Developer Experience**: TypeScript-ready, hot reload, better debugging
5. **Mobile First**: Responsive design that works everywhere
6. **Accessibility**: Semantic HTML, keyboard navigation, ARIA labels

## 🚀 Future Enhancements

- [ ] Progressive Web App (PWA) support
- [ ] Offline mode with service workers
- [ ] Real-time updates with WebSockets
- [ ] Advanced animations with Framer Motion
- [ ] Component Storybook for design system
- [ ] E2E testing with Playwright
- [ ] TypeScript migration for type safety
