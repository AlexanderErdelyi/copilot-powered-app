import { FileText, Plus, Bug, Zap, Star, AlertCircle } from 'lucide-react';

function Changelog() {
  const releases = [
    {
      version: "1.0.0",
      date: "February 15, 2026",
      type: "major",
      changes: {
        added: [
          "Complete rebranding from ReceiptHealth to Sanitas Mind",
          "New logo and brand identity",
          "Dark mode as default theme preference",
          "Privacy Policy page with comprehensive data protection information",
          "Terms of Service page with legal disclaimers",
          "Support & Help Center with FAQs",
          "Product Roadmap page for transparency",
          "Changelog page to track all updates",
          "Professional footer with legal links",
          "Enhanced documentation for open source contributors"
        ],
        improved: [
          "Theme system now defaults to dark mode for better user experience",
          "Updated all branding references throughout the application",
          "Improved accessibility in legal pages",
          "Better mobile responsiveness for information pages"
        ],
        fixed: []
      }
    },
    {
      version: "0.9.0",
      date: "February 10, 2026",
      type: "minor",
      changes: {
        added: [
          "Custom category management system",
          "Category creation, editing, and deletion",
          "Custom category colors and icons",
          "System categories (Healthy, Junk, Other) auto-initialized",
          "Category drill-down from dashboard charts"
        ],
        improved: [
          "Receipt categorization with custom categories",
          "Dashboard chart interactions",
          "Category-based health score calculations"
        ],
        fixed: [
          "Category persistence across sessions",
          "Chart rendering with custom colors"
        ]
      }
    },
    {
      version: "0.8.0",
      date: "February 5, 2026",
      type: "minor",
      changes: {
        added: [
          "Achievements and gamification system",
          "25+ unique achievements across all features",
          "Points and leveling system",
          "Leaderboard functionality",
          "Achievement celebration animations with confetti",
          "Feature usage tracking for achievement unlocking"
        ],
        improved: [
          "User engagement through gamification",
          "Visual feedback with animations",
          "Progress tracking across all features"
        ],
        fixed: []
      }
    },
    {
      version: "0.7.0",
      date: "January 30, 2026",
      type: "minor",
      changes: {
        added: [
          "Voice Assistant with AI-powered conversations",
          "Speech recognition for voice input",
          "Text-to-speech for responses",
          "Conversation context and history",
          "Wake word detection (Hey Receipt, Hey Health)",
          "Voice assistant achievements"
        ],
        improved: [
          "AI response quality and accuracy",
          "Voice recognition accuracy",
          "Natural-sounding speech synthesis"
        ],
        fixed: [
          "Voice input cancellation issues",
          "Session persistence problems"
        ]
      }
    },
    {
      version: "0.6.0",
      date: "January 25, 2026",
      type: "minor",
      changes: {
        added: [
          "Meal Planner with AI-powered recipe generation",
          "Dietary preference support (Vegetarian, Vegan, Gluten-Free, etc.)",
          "Recipe cooking mode with step tracking",
          "Add recipe ingredients to shopping lists",
          "Recipe search and filtering",
          "Cooking progress saving in LocalStorage"
        ],
        improved: [
          "Recipe recommendations based on health goals",
          "Meal planning UX and interactions",
          "Recipe card design and readability"
        ],
        fixed: []
      }
    },
    {
      version: "0.5.0",
      date: "January 20, 2026",
      type: "minor",
      changes: {
        added: [
          "Shopping Lists feature with CRUD operations",
          "Generate Healthy List with AI suggestions",
          "Toggle items between To Buy and Purchased",
          "Add from recipe functionality",
          "Tile-based UI with gradient design",
          "Shopping list item editing and deletion"
        ],
        improved: [
          "Shopping list organization and visual design",
          "Item categorization in shopping lists",
          "Mobile-friendly shopping list interface"
        ],
        fixed: [
          "Shopping list item duplication",
          "Purchase status persistence"
        ]
      }
    },
    {
      version: "0.4.0",
      date: "January 15, 2026",
      type: "minor",
      changes: {
        added: [
          "Insights page with AI-powered analytics",
          "Query assistant for data exploration",
          "Anomaly detection in spending patterns",
          "Predictive analytics for future spending",
          "Interactive insights dashboard"
        ],
        improved: [
          "Data visualization quality",
          "Insight accuracy and relevance",
          "Response time for queries"
        ],
        fixed: []
      }
    },
    {
      version: "0.3.0",
      date: "January 10, 2026",
      type: "minor",
      changes: {
        added: [
          "Receipt upload and management",
          "AI-powered text extraction from images",
          "Receipt detail view with modal",
          "Item editing and categorization",
          "Receipt deletion",
          "Image preview in receipt cards"
        ],
        improved: [
          "OCR accuracy for receipt text extraction",
          "Receipt card design and layout",
          "Mobile responsiveness for receipts page"
        ],
        fixed: [
          "Image upload timeout issues",
          "Receipt data parsing errors"
        ]
      }
    },
    {
      version: "0.2.0",
      date: "January 5, 2026",
      type: "minor",
      changes: {
        added: [
          "Dashboard with KPI cards",
          "Health Score calculation and display",
          "Category breakdown chart",
          "Spending trends visualization",
          "Interactive chart tooltips",
          "Clickable KPI cards with navigation"
        ],
        improved: [
          "Chart rendering performance",
          "Dashboard layout and spacing",
          "Health score algorithm accuracy"
        ],
        fixed: []
      }
    },
    {
      version: "0.1.0",
      date: "January 1, 2026",
      type: "minor",
      changes: {
        added: [
          "Initial React application setup",
          "Modern UI with Tailwind CSS",
          "Dark mode support",
          "Responsive sidebar navigation",
          "Basic routing structure",
          "Settings page with theme toggle"
        ],
        improved: [],
        fixed: []
      }
    }
  ];

  const getTypeColor = (type) => {
    switch(type) {
      case 'major': return 'bg-purple-500';
      case 'minor': return 'bg-blue-500';
      case 'patch': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getChangeIcon = (changeType) => {
    switch(changeType) {
      case 'added': return <Plus className="w-4 h-4 text-green-500" />;
      case 'improved': return <Zap className="w-4 h-4 text-blue-500" />;
      case 'fixed': return <Bug className="w-4 h-4 text-red-500" />;
      default: return <Star className="w-4 h-4 text-gray-500" />;
    }
  };

  const getChangeTitle = (changeType) => {
    switch(changeType) {
      case 'added': return 'New Features';
      case 'improved': return 'Improvements';
      case 'fixed': return 'Bug Fixes';
      default: return 'Changes';
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Changelog</h1>
            <p className="text-gray-600 dark:text-gray-400">Track all updates and improvements to Sanitas Mind</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 mt-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Major Release</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Minor Release</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Patch</span>
          </div>
        </div>
      </div>

      {/* Release History */}
      <div className="space-y-6">
        {releases.map((release, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
            {/* Release Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">v{release.version}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getTypeColor(release.type)}`}>
                    {release.type.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{release.date}</p>
              </div>
            </div>

            {/* Changes */}
            <div className="space-y-6">
              {Object.entries(release.changes).map(([changeType, items]) => {
                if (items.length === 0) return null;
                return (
                  <div key={changeType}>
                    <div className="flex items-center space-x-2 mb-3">
                      {getChangeIcon(changeType)}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {getChangeTitle(changeType)}
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start space-x-2 text-gray-700 dark:text-gray-300">
                          <span className="text-gray-400 dark:text-gray-600 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Subscribe to Updates */}
      <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-6 mt-6 border border-primary-200 dark:border-primary-800">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Stay Updated</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Want to be notified about new releases and features? Watch our GitHub repository 
              or join our community discussions.
            </p>
            <a
              href="https://github.com/AlexanderErdelyi/copilot-powered-app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              Follow on GitHub →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Changelog;
