# Sanitas Mind

*From Latin: Sanitas - Health, both physical and mental well-being*

A full-stack receipt management application powered by GitHub Copilot AI, featuring health-conscious shopping assistance and intelligent insights. Open source and built with modern technologies.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://reactjs.org/)
[![.NET](https://img.shields.io/badge/.NET-8.0-purple.svg)](https://dotnet.microsoft.com/)

## ✨ Features

- 📸 **Receipt Scanning** - AI-powered text extraction from receipt images
- 💚 **Health Tracking** - Calculate health scores based on your purchases
- 🛒 **Smart Shopping Lists** - AI-generated healthy alternatives
- 🍳 **Meal Planning** - Personalized meal plans with dietary preferences
- 🎤 **Voice Assistant** - AI-powered conversational assistant
- 📊 **Insights & Analytics** - Spending trends and anomaly detection
- 🏆 **Achievements** - Gamification to encourage healthy choices
- 🌓 **Dark Mode** - Beautiful dark theme by default
- 📱 **Responsive Design** - Works seamlessly on all devices

## 🏗️ Project Structure

```
copilot-powered-app/
├── ReceiptHealth/              # Main application
│   ├── client/                 # React frontend (Vite + Tailwind CSS)
│   │   ├── src/
│   │   │   ├── components/     # Reusable React components
│   │   │   ├── pages/          # Page components
│   │   │   ├── contexts/       # React contexts
│   │   │   └── main.jsx        # Entry point
│   │   └── package.json
│   ├── Services/               # Backend services (C#)
│   ├── Models/                 # Data models
│   ├── Data/                   # Database context
│   ├── Program.cs              # Backend entry point
│   └── ReceiptHealth.csproj
├── README.md                   # This file
└── .gitignore
```

## 🚀 Quick Start

### Prerequisites

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/) and npm
- [GitHub Copilot API access](https://docs.github.com/en/copilot)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AlexanderErdelyi/copilot-powered-app.git
   cd copilot-powered-app
   ```

2. **Backend Setup**
   ```bash
   cd ReceiptHealth
   dotnet restore
   ```

3. **Frontend Setup**
   ```bash
   cd client
   npm install
   ```

4. **Environment Configuration**
   
   Create `appsettings.json` in the `ReceiptHealth` directory (if not present):
   ```json
   {
     "GitHubCopilot": {
       "Token": "your_github_token",
       "ApiUrl": "https://api.githubcopilot.com"
     }
   }
   ```

### Running the Application

#### Development Mode (Recommended)

**Windows:**
```bash
cd ReceiptHealth
.\start-dev.bat
```

**Linux/Mac:**
```bash
cd ReceiptHealth
./start-dev.sh
```

This will start:
- Backend API on `http://localhost:5162`
- React dev server on `http://localhost:5173`

#### Manual Start

**Terminal 1 - Backend:**
```bash
cd ReceiptHealth
dotnet run
```

**Terminal 2 - Frontend:**
```bash
cd ReceiptHealth/client
npm run dev
```

Then open your browser to `http://localhost:5173`

## 🛠️ Development

### Building for Production

**Frontend:**
```bash
cd ReceiptHealth/client
npm run build
```

**Backend:**
```bash
cd ReceiptHealth
dotnet publish -c Release
```

### Code Quality

**Linting:**
```bash
cd ReceiptHealth/client
npm run lint
```

### Project Commands

- `npm run dev` - Start frontend dev server
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build
- `dotnet run` - Start backend server
- `dotnet test` - Run backend tests

## 📚 Technology Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Lucide React** - Icon library

### Backend
- **.NET 8** - Backend framework
- **ASP.NET Core** - Web API
- **Entity Framework Core** - ORM
- **SQLite** - Database
- **GitHub Copilot API** - AI features

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow existing code style and patterns
   - Write clear commit messages
   - Test your changes thoroughly
4. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
5. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Development Guidelines

- Follow existing coding patterns and conventions
- Use meaningful variable and function names
- Write comments for complex logic
- Keep components small and focused
- Ensure responsive design for mobile devices
- Test dark mode compatibility
- Update documentation for new features

## 📖 Documentation

- [Privacy Policy](ReceiptHealth/client/src/pages/Privacy.jsx)
- [Terms of Service](ReceiptHealth/client/src/pages/Terms.jsx)
- [Support & FAQ](ReceiptHealth/client/src/pages/Support.jsx)
- [Roadmap](ReceiptHealth/client/src/pages/Roadmap.jsx)
- [Changelog](ReceiptHealth/client/src/pages/Changelog.jsx)

## 📄 Version Control Best Practices

### ✅ What's Tracked in Git

- Source code (`.cs`, `.js`, `.jsx`, `.html`, `.css`)
- Configuration files (`.csproj`, `.sln`, `package.json`)
- Workspace settings (`copilot-powered-app.code-workspace`)
- Documentation and scripts

### ❌ What's NOT Tracked

- `bin/`, `obj/` - .NET build outputs
- `node_modules/` - npm dependencies
- `dist/`, `build/` - Frontend builds
- `*.db`, `*.sqlite` - Database files
- `.env` files - Environment variables and secrets
- `storage/` - Uploaded files

See [`.gitignore`](.gitignore) for complete list.

## 🐛 Bug Reports

Found a bug? Please [open an issue](https://github.com/AlexanderErdelyi/copilot-powered-app/issues/new) with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (OS, browser, versions)

## 💡 Feature Requests

Have an idea? We'd love to hear it! [Open a feature request](https://github.com/AlexanderErdelyi/copilot-powered-app/issues/new?labels=enhancement) or join our [discussions](https://github.com/AlexanderErdelyi/copilot-powered-app/discussions).

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [GitHub Copilot](https://github.com/features/copilot)
- Icons from [Lucide](https://lucide.dev/)
- UI components inspired by modern design principles

## 📧 Contact

- **Website:** [sanitasmind.app](https://sanitasmind.app)
- **Email:** hello@sanitasmind.app
- **GitHub:** [@AlexanderErdelyi](https://github.com/AlexanderErdelyi)

---

Made with ❤️ using GitHub Copilot
