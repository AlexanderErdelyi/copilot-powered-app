# Contributing to Sanitas Mind

First off, thank you for considering contributing to Sanitas Mind! 🎉

We welcome contributions from everyone, whether you're fixing a typo, reporting a bug, suggesting a feature, or implementing a major enhancement. This document provides guidelines to help make the contribution process smooth and effective for everyone involved.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Guidelines](#coding-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [conduct@sanitasmind.app](mailto:conduct@sanitasmind.app).

## 🤝 How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/AlexanderErdelyi/copilot-powered-app/issues) to avoid duplicates.

**When filing a bug report, please include:**

- **Clear title** - Concise and descriptive
- **Description** - Detailed explanation of the issue
- **Steps to reproduce** - Numbered steps to reproduce the behavior
- **Expected behavior** - What you expected to happen
- **Actual behavior** - What actually happened
- **Screenshots** - If applicable
- **Environment details:**
  - OS (Windows 11, macOS Sonoma, Ubuntu 22.04, etc.)
  - Browser (Chrome 119, Firefox 120, Safari 17, etc.)
  - Sanitas Mind version
- **Additional context** - Any other relevant information

**Example:**
```markdown
## Bug: Health score not updating after receipt upload

**Steps to reproduce:**
1. Go to Receipts page
2. Upload a receipt with healthy items
3. Check health score on Dashboard
4. Score shows 0% instead of expected value

**Expected:** Health score should update to reflect new receipt data
**Actual:** Score remains at 0%

**Environment:**
- OS: Windows 11
- Browser: Chrome 119
- Version: 1.0.0

**Additional context:** Issue started after updating to latest version
```

### 💡 Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- **Clear title** - Concise feature description
- **Use case** - Why you need this feature
- **Detailed description** - How it should work
- **Mockups/examples** - Visual aids if applicable
- **Alternative solutions** - Other ways you've considered

### 🔧 Contributing Code

We love code contributions! Here's how to get started:

1. **Find an issue** - Look for issues labeled `good first issue` or `help wanted`
2. **Comment on the issue** - Let others know you're working on it
3. **Fork & clone** - Get the code on your machine
4. **Create a branch** - Name it descriptively (e.g., `feature/meal-plan-sharing`)
5. **Make changes** - Follow our coding guidelines
6. **Test thoroughly** - Ensure everything works
7. **Submit a PR** - Reference the issue number

## 🚀 Getting Started

### Prerequisites

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/) and npm
- [Git](https://git-scm.com/)
- A code editor ([VS Code](https://code.visualstudio.com/) recommended)
- [GitHub Copilot](https://github.com/features/copilot) (optional but helpful)

### Local Setup

1. **Fork the repository**
   
   Click the "Fork" button at the top right of the repository page.

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/copilot-powered-app.git
   cd copilot-powered-app
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/AlexanderErdelyi/copilot-powered-app.git
   ```

4. **Install dependencies**
   
   **Backend:**
   ```bash
   cd ReceiptHealth
   dotnet restore
   ```
   
   **Frontend:**
   ```bash
   cd ReceiptHealth/client
   npm install
   ```

5. **Configure environment**
   
   Create `appsettings.json` in `ReceiptHealth/`:
   ```json
   {
     "GitHubCopilot": {
       "Token": "your_github_token",
       "ApiUrl": "https://api.githubcopilot.com"
     }
   }
   ```

6. **Run the application**
   
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

7. **Verify everything works**
   
   Open `http://localhost:5173` in your browser.

## 🔄 Development Workflow

### Keeping Your Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Merge upstream changes into your main branch
git checkout main
git merge upstream/main

# Push to your fork
git push origin main
```

### Creating a Feature Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

**Branch naming conventions:**
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Adding or updating tests

### Making Changes

1. **Write code** - Follow our coding guidelines (see below)
2. **Test locally** - Ensure everything works as expected
3. **Test dark mode** - Verify appearance in dark theme
4. **Test responsive design** - Check mobile/tablet views
5. **Run linter** - `npm run lint` in the client directory
6. **Check for errors** - No console errors or warnings

## 📝 Coding Guidelines

### General Principles

- **DRY (Don't Repeat Yourself)** - Reuse code when possible
- **KISS (Keep It Simple, Stupid)** - Prefer simple solutions
- **YAGNI (You Aren't Gonna Need It)** - Don't add unnecessary features
- **Single Responsibility** - Each function/component should do one thing well

### JavaScript/React Guidelines

#### Component Structure

```jsx
// 1. Imports (libraries first, then local)
import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import CustomComponent from '../components/CustomComponent';

// 2. Component definition
function MyComponent({ prop1, prop2 }) {
  // 3. State declarations
  const [state, setState] = useState(initialValue);
  
  // 4. Hooks
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // 5. Event handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // 6. Helper functions
  const calculateValue = () => {
    // Calculation logic
  };
  
  // 7. Render
  return (
    <div className="container">
      {/* JSX */}
    </div>
  );
}

// 8. Export
export default MyComponent;
```

#### Naming Conventions

- **Components:** PascalCase - `MyComponent`
- **Functions:** camelCase - `handleSubmit`, `calculateTotal`
- **Variables:** camelCase - `userName`, `totalPrice`
- **Constants:** UPPER_SNAKE_CASE - `MAX_ITEMS`, `API_URL`
- **CSS classes:** kebab-case or Tailwind utilities

#### Best Practices

```jsx
// ✅ Good
const [isLoading, setIsLoading] = useState(false);
const handleSave = async () => { /* ... */ };

// ❌ Avoid
const [loading, setLoading] = useState(false); // Not descriptive
const save = async () => { /* ... */ }; // Missing "handle" prefix
```

**Component Size:**
- Keep components under 300 lines
- Extract reusable logic into custom hooks
- Split large components into smaller ones

**Props:**
- Use destructuring for props
- Provide PropTypes or TypeScript types
- Use default values when appropriate

```jsx
// ✅ Good
function Button({ text, onClick, disabled = false }) {
  return <button onClick={onClick} disabled={disabled}>{text}</button>;
}

// ❌ Avoid
function Button(props) {
  return <button onClick={props.onClick}>{props.text}</button>;
}
```

### C# Backend Guidelines

#### Naming Conventions

- **Classes:** PascalCase - `ReceiptService`
- **Methods:** PascalCase - `GetReceiptById`
- **Variables:** camelCase - `receiptData`
- **Private fields:** _camelCase - `_dbContext`
- **Constants:** PascalCase - `MaxImageSize`

#### Code Structure

```csharp
// 1. Usings (organized, remove unused)
using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;

// 2. Namespace
namespace ReceiptHealth.Services
{
    // 3. Class with XML documentation
    /// <summary>
    /// Service for managing receipt operations
    /// </summary>
    public class ReceiptService
    {
        // 4. Private fields
        private readonly ReceiptHealthContext _context;
        
        // 5. Constructor
        public ReceiptService(ReceiptHealthContext context)
        {
            _context = context;
        }
        
        // 6. Public methods
        public async Task<Receipt> GetReceiptByIdAsync(int id)
        {
            return await _context.Receipts
                .Include(r => r.LineItems)
                .FirstOrDefaultAsync(r => r.Id == id);
        }
        
        // 7. Private helper methods
        private void ValidateReceipt(Receipt receipt)
        {
            // Validation logic
        }
    }
}
```

#### Best Practices

- Use `async/await` for I/O operations
- Handle exceptions appropriately
- Use LINQ for data queries
- Follow RESTful conventions for API endpoints
- Use dependency injection

### CSS/Styling Guidelines

We use **Tailwind CSS**. Follow these practices:

```jsx
// ✅ Good - Organized utility classes
<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">

// ❌ Avoid - Unorganized, hard to read
<div className="shadow-md flex hover:shadow-lg bg-white p-4 rounded-lg transition-shadow dark:bg-gray-800 items-center justify-between">
```

**Class organization order:**
1. Display/position
2. Sizing
3. Spacing
4. Typography
5. Colors/backgrounds
6. Borders/shadows
7. Transitions/animations
8. Dark mode variants
9. Responsive variants

**Dark mode:**
Always provide dark mode variants using the `dark:` prefix.

```jsx
// ✅ Good
<p className="text-gray-900 dark:text-white">Text</p>

// ❌ Avoid
<p className="text-gray-900">Text</p> // No dark mode support
```

## 💬 Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code style changes (formatting, no logic change)
- **refactor:** Code refactoring
- **test:** Adding or updating tests
- **chore:** Maintenance tasks

### Examples

```bash
# Simple commit
git commit -m "feat(receipts): add bulk upload functionality"

# With scope and body
git commit -m "fix(health-score): correct calculation for mixed items

Updated the health score algorithm to properly weight items when
a receipt contains a mix of healthy, neutral, and junk food items.

Fixes #123"

# Breaking change
git commit -m "feat(api): redesign receipt endpoint

BREAKING CHANGE: Receipt API now returns nested line items instead
of flat array. Update clients accordingly."
```

### Best Practices

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor" not "moves cursor")
- Keep subject line under 72 characters
- Reference issues and PRs when applicable
- Explain **what** and **why**, not **how**

## 🔀 Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] Changes have been tested locally
- [ ] Dark mode appearance verified
- [ ] Responsive design checked (mobile, tablet, desktop)
- [ ] No console errors or warnings
- [ ] Linter passes (`npm run lint`)
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow guidelines

### Submitting a PR

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request** on GitHub

3. **Fill out the PR template** with:
   - Description of changes
   - Related issue numbers (e.g., "Closes #123")
   - Type of change (feature, fix, docs, etc.)
   - Screenshots/videos (if UI changes)
   - Testing done

4. **Request review** from maintainers

### PR Title Format

Follow commit message format:
```
feat(component): add new feature
fix(service): resolve bug in calculation
docs(readme): update installation instructions
```

### Review Process

- Maintainers will review your PR within 2-3 days
- Address any feedback or requested changes
- Once approved, a maintainer will merge your PR
- Your contribution will be credited in the changelog

### After Merge

- Delete your feature branch
- Update your local main branch
- Celebrate! 🎉 You've contributed to Sanitas Mind!

## 🧪 Testing

### Manual Testing

Before submitting a PR, test these areas:

**Core Functionality:**
- [ ] Receipt upload and OCR extraction
- [ ] Health score calculation
- [ ] Shopping list creation
- [ ] Meal planner functionality
- [ ] Insights and analytics display
- [ ] Voice assistant interaction
- [ ] Achievement tracking

**UI/UX:**
- [ ] Light mode appearance
- [ ] Dark mode appearance (default)
- [ ] Mobile responsive design (< 768px)
- [ ] Tablet responsive design (768px - 1024px)
- [ ] Desktop appearance (> 1024px)
- [ ] Loading states
- [ ] Error handling
- [ ] Empty states

**Data:**
- [ ] Data persists after page reload
- [ ] Export data works correctly
- [ ] Import data restores properly

### Browser Testing

Test in at least two modern browsers:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (if on macOS)

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [.NET Documentation](https://docs.microsoft.com/en-us/dotnet/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)

## 💡 Tips for New Contributors

1. **Start small** - Pick a "good first issue" to get familiar with the codebase
2. **Ask questions** - Use GitHub Discussions if you're unsure about anything
3. **Read existing code** - Understand patterns before making changes
4. **Test thoroughly** - Manual testing catches many issues
5. **Be patient** - Reviews take time, but feedback helps everyone improve

## 🙏 Thank You!

Every contribution, no matter how small, makes Sanitas Mind better. We appreciate your time and effort in helping build a healthier future through better shopping choices.

Happy coding! 🚀

---

**Questions?** Open a [Discussion](https://github.com/AlexanderErdelyi/copilot-powered-app/discussions) or email [hello@sanitasmind.app](mailto:hello@sanitasmind.app)
