import { Rocket, Calendar, CheckCircle, Clock, Sparkles, Zap } from 'lucide-react';

function Roadmap() {
  const releases = [
    {
      version: "1.0.0",
      date: "February 2026",
      status: "released",
      title: "Launch Release - Sanitas Mind",
      features: [
        "Complete rebranding from ReceiptHealth to Sanitas Mind",
        "Dark mode as default theme",
        "Receipt upload and AI-powered text extraction",
        "Health score calculation and tracking",
        "Shopping list management with healthy alternatives",
        "AI-powered meal planner with dietary preferences",
        "Voice Assistant with text and voice input",
        "Achievements and gamification system",
        "Insights and spending analytics",
        "Custom category management",
        "Data export/import functionality"
      ]
    },
    {
      version: "1.1.0",
      date: "March 2026",
      status: "in-progress",
      title: "Enhanced Intelligence",
      features: [
        "Smart price tracking across stores",
        "Price comparison and savings alerts",
        "Predictive shopping suggestions based on history",
        "Recipe recommendations from pantry items",
        "Nutrition database integration",
        "Barcode scanning for quick item entry",
        "Multi-language support expansion"
      ]
    },
    {
      version: "1.2.0",
      date: "April 2026",
      status: "planned",
      title: "Social & Sharing",
      features: [
        "Family/household account sharing",
        "Shared shopping lists with real-time sync",
        "Recipe sharing with friends",
        "Community recipe database",
        "Social achievements and leaderboards",
        "Group challenges (e.g., healthy eating month)",
        "Share meal plans on social media"
      ]
    },
    {
      version: "1.3.0",
      date: "May 2026",
      status: "planned",
      title: "Mobile Experience",
      features: [
        "Progressive Web App (PWA) optimization",
        "Native mobile app for iOS",
        "Native mobile app for Android",
        "Camera integration for instant receipt capture",
        "Push notifications for shopping reminders",
        "Offline-first architecture",
        "Mobile-optimized voice assistant"
      ]
    },
    {
      version: "2.0.0",
      date: "Q3 2026",
      status: "planned",
      title: "Advanced Features",
      features: [
        "Integration with grocery store APIs",
        "Online shopping list export to retailers",
        "Budget planning and forecasting",
        "Sustainability score tracking",
        "Carbon footprint calculation",
        "Personalized AI health coaching",
        "Integration with fitness trackers",
        "Smart appliance integration (smart fridges, etc.)",
        "Voice wake word customization"
      ]
    }
  ];

  const upcomingBugfixes = [
    { id: 1, title: "Improve receipt OCR accuracy for handwritten receipts", priority: "high" },
    { id: 2, title: "Fix dark mode inconsistencies in charts", priority: "medium" },
    { id: 3, title: "Optimize image upload for large files", priority: "medium" },
    { id: 4, title: "Enhance voice recognition accuracy", priority: "high" },
    { id: 5, title: "Improve mobile responsive layout for meal planner", priority: "low" }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'released': return 'bg-green-500';
      case 'in-progress': return 'bg-yellow-500';
      case 'planned': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'released': return <CheckCircle className="w-5 h-5" />;
      case 'in-progress': return <Zap className="w-5 h-5" />;
      case 'planned': return <Clock className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Product Roadmap</h1>
            <p className="text-gray-600 dark:text-gray-400">See what's coming next for Sanitas Mind</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 mt-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Released</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">In Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Planned</span>
          </div>
        </div>
      </div>

      {/* Releases Timeline */}
      <div className="space-y-6 mb-6">
        {releases.map((release, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
              <div className="flex items-start space-x-3 mb-3 sm:mb-0">
                <div className={`p-2 ${getStatusColor(release.status)} text-white rounded-lg`}>
                  {getStatusIcon(release.status)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {release.version} - {release.title}
                  </h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{release.date}</span>
                  </div>
                </div>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(release.status)}`}>
                {release.status.replace('-', ' ').toUpperCase()}
              </span>
            </div>
            
            <ul className="space-y-2 mt-4">
              {release.features.map((feature, fIndex) => (
                <li key={fIndex} className="flex items-start space-x-2 text-gray-700 dark:text-gray-300">
                  {release.status === 'released' ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : release.status === 'in-progress' ? (
                    <Sparkles className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Upcoming Bug Fixes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Upcoming Bug Fixes</h2>
        <div className="space-y-3">
          {upcomingBugfixes.map((bug) => (
            <div key={bug.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300 flex-1">{bug.title}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(bug.priority)}`}>
                {bug.priority.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Section */}
      <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-6 mt-6 border border-primary-200 dark:border-primary-800">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-primary-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Have Suggestions?</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            We value your feedback! Help us prioritize features and improvements by sharing your ideas.
          </p>
          <a
            href="https://github.com/AlexanderErdelyi/copilot-powered-app/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:shadow-lg transition-shadow"
          >
            Share Your Ideas
          </a>
        </div>
      </div>
    </div>
  );
}

export default Roadmap;
