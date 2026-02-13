# Copilot-Powered App

A full-stack receipt management application powered by GitHub Copilot AI, featuring health-conscious shopping assistance and intelligent insights.

## 🏗️ Project Structure

- **ReceiptHealth/** - Main .NET application with React frontend
  - Full-featured receipt scanning and management
  - AI-powered health insights and meal planning
  - Voice assistant integration
  - Shopping list management with health recommendations

## 🚀 Getting Started

### Prerequisites

- .NET 8.0 SDK
- Node.js 18+ and npm
- GitHub Copilot API access

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/AlexanderErdelyi/copilot-powered-app.git
   cd copilot-powered-app
   ```

2. **Open in VS Code**
   ```bash
   code copilot-powered-app.code-workspace
   ```

3. **Start development servers**
   
   See [ReceiptHealth/README.md](ReceiptHealth/README.md) for detailed instructions.

## 📦 Version Control Best Practices

This repository follows industry best practices for version control:

### ✅ What's Tracked in Git

- **Source code** - All application code (.cs, .js, .jsx, .html, .css)
- **Configuration files** - Project files (.csproj, .sln, package.json)
- **Workspace settings** - `copilot-powered-app.code-workspace` for shared team configuration
- **Documentation** - README files and documentation
- **Scripts** - Build and deployment scripts

### ❌ What's NOT Tracked (in .gitignore)

#### Build Artifacts
- `bin/`, `obj/` - .NET build outputs
- `dist/`, `build/` - Frontend build outputs
- `node_modules/` - npm dependencies (install with `npm install`)

#### Local Data & Databases
- `*.db`, `*.sqlite` - Database files (user-specific data)
- `receipts.db` - SQLite database (generated on first run)
- `ReceiptHealth/storage/` - Uploaded files and receipts

#### Python Environment
- `.venv/`, `venv/`, `env/` - Virtual environments (create with `python -m venv .venv`)
- `__pycache__/`, `*.pyc` - Python bytecode
- Should you use Python scripts, create a virtual environment and install dependencies locally

#### Environment & Secrets
- `.env`, `.env.local` - Environment variables and API keys
- Never commit secrets or API keys

#### IDE & OS Files
- `.vscode/` - VS Code user settings (use workspace file for shared settings)
- `.DS_Store` - macOS metadata
- `*.swp`, `*.swo` - Editor swap files

### 🔄 Recreating Local Environment

After cloning the repository:

1. **Restore .NET dependencies**
   ```bash
   cd ReceiptHealth
   dotnet restore
   ```

2. **Install Node.js dependencies**
   ```bash
   cd ReceiptHealth/client
   npm install
   ```

3. **Create Python virtual environment** (if using Python scripts)
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # or .venv\Scripts\activate on Windows
   pip install -r requirements.txt  # if requirements.txt exists
   ```

4. **Configure environment**
   - Copy `.env.example` to `.env` if it exists
   - Add your API keys and configuration

5. **Database will be created automatically** on first run

## 🛠️ Workspace Configuration

The `copilot-powered-app.code-workspace` file contains:
- Recommended VS Code extensions
- Shared editor settings
- Multi-folder workspace configuration

This file IS tracked in git to ensure consistent development environment across the team.

## 📚 Documentation

- [ReceiptHealth README](ReceiptHealth/README.md) - Main application documentation
- [AI Integration Guide](ReceiptHealth/AI_INTEGRATION.md) - GitHub Copilot SDK usage
- [Interactive Features](ReceiptHealth/INTERACTIVE_FEATURES.md) - UI components and interactions
- [Advanced Features](ReceiptHealth/ADVANCED_FEATURES.md) - Gamification, achievements, voice assistant

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Ensure code follows existing patterns
4. Test your changes
5. Submit a pull request

## 📄 License

See LICENSE file for details.
