# Sanitas Mind

<div align="center">

![Sanitas Mind Logo](ReceiptHealth/client/public/logo.svg)

*From Latin: Sanitas - Health, both physical and mental well-being*

**A full-stack receipt management application powered by GitHub Copilot AI, featuring health-conscious shopping assistance and intelligent insights.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://reactjs.org/)
[![.NET](https://img.shields.io/badge/.NET-8.0-purple.svg)](https://dotnet.microsoft.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![GitHub Issues](https://img.shields.io/github/issues/AlexanderErdelyi/copilot-powered-app)](https://github.com/AlexanderErdelyi/copilot-powered-app/issues)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing) • [License](#-license)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎯 Core Features
- 📸 **Smart Receipt Scanning** - AI-powered OCR text extraction
- 💚 **Health Score Tracking** - Monitor shopping health impact
- 🛒 **Intelligent Shopping Lists** - AI-generated healthy alternatives
- 🍳 **Meal Planning** - Personalized plans with dietary preferences
- 📊 **Insights & Analytics** - Spending trends and anomaly detection

</td>
<td width="50%">

### 🚀 Advanced Features
- 🎤 **Voice Assistant** - Conversational AI for recipes & advice
- 🏆 **Gamification** - Achievements and progress tracking
- 🔄 **Data Export/Import** - Full backup and restore
- 🌓 **Dark Mode** - Beautiful dark theme by default
- 📱 **PWA Ready** - Install as native app

</td>
</tr>
</table>

### 🎬 Demo

> **Try it yourself!** Upload a receipt, ask the AI assistant for recipe suggestions, and watch your health score improve with better shopping choices.

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

#### Quick Start with VS Code (Easiest!) ⚡

If you're using VS Code:

1. Open the project in VS Code
2. **Choose your start mode:**
   - **`Ctrl+F5`** - Run without debugging ⚡ **Recommended for development!**
   - **`F5`** - Run with debugging (only when you need C# breakpoints)
3. Wait for both backend and frontend to start
4. Your browser will automatically open to `http://localhost:5173`

> **💡 Pro Tip:** Use `Ctrl+F5` for normal development - Vite's hot module replacement is much faster without the debugger!

This will:
- ✅ Build the .NET backend
- ✅ Start the React dev server (Vite)
- ✅ Launch the API on port 5100
- ✅ Open the React app on port 5173
- ✅ Enable fast hot reload for instant code changes

> **Note:** The launch configuration is named "Sanitas Mind Full Stack (React + API)" and is set as the default.

#### Development Mode (Scripts)

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
- Backend API on `http://localhost:5100`
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

We welcome contributions from everyone! Whether you're fixing bugs, adding features, improving documentation, or sharing ideas, your help is appreciated.

**Quick Start for Contributors:**

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💻 Make your changes and test thoroughly
4. ✍️ Commit with clear messages (`git commit -m "Add amazing feature"`)
5. 📤 Push to your branch (`git push origin feature/amazing-feature`)
6. 🎉 Open a Pull Request

**Please read our [Contributing Guidelines](CONTRIBUTING.md) for detailed information.**

### 🎯 Good First Issues

Looking for a place to start? Check out our [good first issues](https://github.com/AlexanderErdelyi/copilot-powered-app/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) - they're perfect for newcomers!

### 💬 Join the Community

- 💡 [Discussions](https://github.com/AlexanderErdelyi/copilot-powered-app/discussions) - Share ideas and get help
- 🐛 [Issues](https://github.com/AlexanderErdelyi/copilot-powered-app/issues) - Report bugs or request features
- 📧 [Email](mailto:hello@sanitasmind.app) - Direct contact

## 📖 Documentation

- 📘 [**User Documentation**](ReceiptHealth/client/src/pages/Docs.jsx) - Complete feature guide, voice commands, troubleshooting
- 🔒 [**Privacy Policy**](ReceiptHealth/client/src/pages/Privacy.jsx) - How we handle your data
- ⚖️ [**Terms of Service**](ReceiptHealth/client/src/pages/Terms.jsx) - Usage terms and conditions
- ❓ [**Support & FAQ**](ReceiptHealth/client/src/pages/Support.jsx) - Common questions and help resources
- 🗺️ [**Roadmap**](ReceiptHealth/client/src/pages/Roadmap.jsx) - Upcoming features and plans
- 📝 [**Changelog**](ReceiptHealth/client/src/pages/Changelog.jsx) - Version history and updates

### 🛡️ Security & Guidelines

- 🔐 [**Security Policy**](SECURITY.md) - Report vulnerabilities responsibly
- 🤝 [**Contributing Guide**](CONTRIBUTING.md) - Detailed contribution instructions
- 📜 [**Code of Conduct**](CODE_OF_CONDUCT.md) - Community standards

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

## 🐛 Bug Reports & 💡 Feature Requests

### Found a Bug?

Please [open an issue](https://github.com/AlexanderErdelyi/copilot-powered-app/issues/new?labels=bug) with:
- ✅ Clear description of the bug
- 🔄 Steps to reproduce
- 📊 Expected vs actual behavior
- 📸 Screenshots if applicable
- 💻 Your environment (OS, browser, versions)

### Have an Idea?

We'd love to hear it! [Open a feature request](https://github.com/AlexanderErdelyi/copilot-powered-app/issues/new?labels=enhancement) or join our [discussions](https://github.com/AlexanderErdelyi/copilot-powered-app/discussions).

### 🔒 Security Issues

**Do NOT open public issues for security vulnerabilities.** Please follow our [Security Policy](SECURITY.md) to report them responsibly.

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
