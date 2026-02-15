import { 
  Book, 
  Upload, 
  ShoppingCart, 
  Calendar, 
  TrendingUp, 
  Trophy, 
  Mic, 
  Settings,
  Zap,
  Camera,
  List,
  BarChart3,
  Heart,
  MessageSquare,
  Sparkles,
  Terminal
} from 'lucide-react';

function Docs() {
  const quickStart = [
    {
      step: 1,
      title: "Upload Your First Receipt",
      description: "Click on 'Receipts' in the sidebar, then click 'Upload Receipt'. Drag and drop an image or select a file. Our AI will automatically extract all the details.",
      icon: Upload
    },
    {
      step: 2,
      title: "Review & Categorize",
      description: "Check the extracted items, adjust categories if needed, and save. The app will calculate your health score automatically.",
      icon: List
    },
    {
      step: 3,
      title: "Track Your Insights",
      description: "Visit the Dashboard or Insights page to see your spending patterns, health scores, and category breakdowns.",
      icon: TrendingUp
    },
    {
      step: 4,
      title: "Get AI Assistance",
      description: "Use the AI Assistant to get personalized recipe suggestions, meal plans, and health advice based on your purchases.",
      icon: Sparkles
    }
  ];

  const features = [
    {
      icon: Camera,
      title: "Smart Receipt Scanning",
      items: [
        "AI-powered OCR extraction from images",
        "Automatic store and item detection",
        "Price and total calculation verification",
        "Support for multiple receipt formats",
        "Batch upload capability"
      ]
    },
    {
      icon: Heart,
      title: "Health Tracking",
      items: [
        "Real-time health score calculation",
        "Category-based nutritional analysis",
        "Healthy vs. unhealthy balance tracking",
        "Personalized health insights",
        "Trend visualization over time"
      ]
    },
    {
      icon: ShoppingCart,
      title: "Shopping Lists",
      items: [
        "Create and manage multiple lists",
        "Generate lists from meal plans",
        "AI-powered healthy alternatives",
        "Mark items as purchased",
        "Track shopping progress"
      ]
    },
    {
      icon: Calendar,
      title: "Meal Planning",
      items: [
        "Weekly meal planner",
        "Recipe management",
        "Ingredient tracking",
        "Nutritional information",
        "Auto-generate shopping lists"
      ]
    },
    {
      icon: BarChart3,
      title: "Insights & Analytics",
      items: [
        "Spending patterns by category",
        "Monthly expense tracking",
        "Price comparison over time",
        "Budget alerts and recommendations",
        "Export data for analysis"
      ]
    },
    {
      icon: Trophy,
      title: "Achievements & Gamification",
      items: [
        "Unlock badges for milestones",
        "Track feature usage",
        "Level up system",
        "Share achievements",
        "Leaderboard (coming soon)"
      ]
    }
  ];

  const voiceCommands = [
    {
      category: "Receipt Management",
      commands: [
        { phrase: "Upload a receipt", action: "Opens the receipt upload dialog" },
        { phrase: "Show my latest receipts", action: "Displays recent receipts" },
        { phrase: "What did I buy at [store name]?", action: "Filters receipts by store" }
      ]
    },
    {
      category: "Health & Nutrition",
      commands: [
        { phrase: "What's my health score?", action: "Shows current health score" },
        { phrase: "Give me a healthy recipe with [ingredient]", action: "Suggests recipes" },
        { phrase: "How many calories in [item]?", action: "Provides nutritional info" },
        { phrase: "What are healthier alternatives to [item]?", action: "Suggests alternatives" }
      ]
    },
    {
      category: "Shopping & Planning",
      commands: [
        { phrase: "Create a shopping list for [meal/week]", action: "Generates shopping list" },
        { phrase: "What's on my shopping list?", action: "Reads current shopping list" },
        { phrase: "Plan meals for this week", action: "Creates meal plan suggestions" },
        { phrase: "Add [item] to my shopping list", action: "Adds item to list" }
      ]
    },
    {
      category: "Insights & Analysis",
      commands: [
        { phrase: "How much did I spend this month?", action: "Shows monthly spending" },
        { phrase: "What's my biggest expense category?", action: "Displays top category" },
        { phrase: "Show my spending trends", action: "Visualizes spending patterns" },
        { phrase: "Compare prices for [item]", action: "Shows price comparison" }
      ]
    }
  ];

  const advancedFeatures = [
    {
      title: "Custom Categories",
      description: "Create and manage custom categories with colors and icons. Navigate to Receipts > Categories to customize your categorization system.",
      tips: [
        "Use specific categories for better insights",
        "Assign colors for quick visual recognition",
        "Set default categories for common items"
      ]
    },
    {
      title: "Data Export & Import",
      description: "Export all your data (receipts, shopping lists, meal plans) to JSON format. Perfect for backup or sharing with family members.",
      tips: [
        "Export regularly for backup",
        "Use 'Export Full Data' for complete backup",
        "Import data from Settings > Data Management"
      ]
    },
    {
      title: "Voice Wake Word",
      description: "Enable hands-free activation with the wake word 'Hey Sanitas'. Configure in Settings > Voice Assistant.",
      tips: [
        "Works best in quiet environments",
        "Requires microphone permissions",
        "Can be disabled for privacy"
      ]
    },
    {
      title: "Dark Mode",
      description: "Sanitas Mind supports full dark mode. Toggle in Settings > Appearance or use system preferences.",
      tips: [
        "Reduces eye strain in low light",
        "Saves battery on OLED screens",
        "Syncs with system theme"
      ]
    },
    {
      title: "PWA Installation",
      description: "Install Sanitas Mind as a Progressive Web App for a native-like experience on desktop and mobile.",
      tips: [
        "Look for 'Install' prompt in browser",
        "Works offline for most features",
        "Adds app icon to home screen/desktop"
      ]
    }
  ];

  const troubleshooting = [
    {
      problem: "Receipt scan not working properly",
      solutions: [
        "Ensure the image is clear and well-lit",
        "Try cropping to just the receipt area",
        "Check that text is readable in the image",
        "Use JPEG or PNG format (avoid PDF for now)"
      ]
    },
    {
      problem: "Voice Assistant not responding",
      solutions: [
        "Check microphone permissions in browser",
        "Ensure you're connected to the internet",
        "Try refreshing the page",
        "Verify wake word is enabled in Settings"
      ]
    },
    {
      problem: "Health score seems incorrect",
      solutions: [
        "Verify item categories are correct",
        "Check for miscategorized items",
        "Update categories in Custom Categories",
        "Health score recalculates automatically"
      ]
    },
    {
      problem: "Data not syncing",
      solutions: [
        "Most data is stored locally by design",
        "Export data regularly for backup",
        "Check browser storage isn't full",
        "Clear cache if experiencing issues"
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg">
            <Book className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Documentation</h1>
            <p className="text-gray-600 dark:text-gray-400">Complete guide to using Sanitas Mind</p>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="flex flex-wrap gap-2 mt-6">
          {['Getting Started', 'Features', 'Voice Commands', 'Advanced', 'Troubleshooting'].map((section) => (
            <a
              key={section}
              href={`#${section.toLowerCase().replace(' ', '-')}`}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm font-medium"
            >
              {section}
            </a>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <div id="getting-started" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Zap className="w-6 h-6 mr-2 text-primary-500" />
          Getting Started
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Welcome to Sanitas Mind! Follow these steps to get up and running in minutes.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickStart.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="relative">
                <div className="absolute -left-3 -top-3 w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {step.step}
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 h-full">
                  <Icon className="w-8 h-8 text-primary-500 mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Features */}
      <div id="features" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Core Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5">
                <Icon className="w-8 h-8 text-primary-500 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <ul className="space-y-2">
                  {feature.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                      <span className="text-primary-500 mr-2">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Voice Commands */}
      <div id="voice-commands" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
          <Mic className="w-6 h-6 mr-2 text-primary-500" />
          Voice Commands
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Use these voice commands with the AI Assistant for hands-free control.
        </p>
        <div className="space-y-6">
          {voiceCommands.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">{section.category}</h3>
              <div className="space-y-2">
                {section.commands.map((cmd, cmdIndex) => (
                  <div key={cmdIndex} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <Terminal className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      <code className="text-sm font-mono text-gray-900 dark:text-white">"{cmd.phrase}"</code>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{cmd.action}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Features */}
      <div id="advanced" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Advanced Features</h2>
        <div className="space-y-6">
          {advancedFeatures.map((feature, index) => (
            <div key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-6 last:pb-0">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">{feature.description}</p>
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">💡 Pro Tips:</h4>
                <ul className="space-y-1">
                  {feature.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="text-sm text-gray-700 dark:text-gray-300">
                      • {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Troubleshooting */}
      <div id="troubleshooting" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Troubleshooting</h2>
        <div className="space-y-4">
          {troubleshooting.map((item, index) => (
            <details key={index} className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800">
                <span className="font-semibold text-gray-900 dark:text-white pr-4">❌ {item.problem}</span>
                <span className="text-primary-500 group-open:rotate-180 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <div className="mt-2 px-4 pt-4 pb-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">✅ Solutions:</h4>
                <ul className="space-y-2">
                  {item.solutions.map((solution, solIndex) => (
                    <li key={solIndex} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                      <span className="text-green-500 mr-2 flex-shrink-0">•</span>
                      <span>{solution}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* API & Integration (Future) */}
      <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800">
        <div className="flex items-start space-x-3">
          <MessageSquare className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Need More Help?</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Can't find what you're looking for? Check out our Support page for FAQs, video tutorials, and community resources.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/support"
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                Visit Support Center →
              </a>
              <a
                href="https://github.com/AlexanderErdelyi/copilot-powered-app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                View on GitHub →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Docs;
