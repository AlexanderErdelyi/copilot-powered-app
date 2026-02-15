import { HelpCircle, Book, MessageCircle, Mail, Github, Bug, Lightbulb, Video } from 'lucide-react';

function Support() {
  const faqs = [
    {
      question: "How do I upload a receipt?",
      answer: "Navigate to the Receipts page and click the 'Upload Receipt' button. You can drag and drop an image or click to browse files. Our AI will automatically extract information from your receipt."
    },
    {
      question: "How is the health score calculated?",
      answer: "Your health score is based on the categories of items in your purchases. Healthy items (fruits, vegetables, whole grains) contribute positively, while junk food items lower your score. The algorithm weighs: Healthy=100%, Other=60%, Junk=0%."
    },
    {
      question: "Can I edit receipt items after upload?",
      answer: "Yes! Click on any receipt to view its details, then you can edit item names, prices, and categories. Changes are saved automatically."
    },
    {
      question: "How do I use the Voice Assistant?",
      answer: "Go to the AI Assistant page. You can either type your questions or use voice input by clicking the microphone button. The assistant can help you with recipes, nutritional advice, and shopping suggestions."
    },
    {
      question: "How do shopping lists work?",
      answer: "Create shopping lists manually or generate them from your meal plans. You can mark items as purchased, and the app will track your shopping progress. Use the 'Generate Healthy List' button for AI-powered healthy alternatives."
    },
    {
      question: "What are achievements?",
      answer: "Achievements are rewards for using various features and reaching milestones. Upload receipts, use the voice assistant, create meal plans, and more to unlock achievements and earn points."
    },
    {
      question: "How do I export my data?",
      answer: "Go to Settings > Data Management and click 'Export Data'. Your data will be downloaded as a JSON file containing all your receipts, shopping lists, and preferences."
    },
    {
      question: "Can I use Sanitas Mind offline?",
      answer: "Most features work offline using locally stored data. However, AI features like the Voice Assistant and receipt text extraction require an internet connection."
    },
    {
      question: "Is my data secure?",
      answer: "Yes! Your data is stored locally on your device. Receipt images are encrypted, and we don't share your personal information with third parties. See our Privacy Policy for more details."
    },
    {
      question: "How do I customize categories?",
      answer: "Navigate to Receipts > Categories to view and manage custom categories. You can create new categories, edit existing ones, and assign custom colors and icons."
    }
  ];

  const resources = [
    {
      icon: Book,
      title: "User Guide",
      description: "Complete documentation on how to use all features",
      link: "/docs"
    },
    {
      icon: Video,
      title: "Video Tutorials",
      description: "Step-by-step video guides for common tasks",
      link: "#tutorials"
    },
    {
      icon: Github,
      title: "GitHub Repository",
      description: "View source code and contribute to the project",
      link: "https://github.com/AlexanderErdelyi/copilot-powered-app"
    },
    {
      icon: Bug,
      title: "Report a Bug",
      description: "Found an issue? Let us know so we can fix it",
      link: "https://github.com/AlexanderErdelyi/copilot-powered-app/issues"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 mb-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Support & Help Center</h1>
            <p className="text-gray-600 dark:text-gray-400">Find answers and get help with Sanitas Mind</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {resources.map((resource, index) => {
            const Icon = resource.icon;
            return (
              <a
                key={index}
                href={resource.link}
                target={resource.link.startsWith('http') ? '_blank' : '_self'}
                rel={resource.link.startsWith('http') ? 'noopener noreferrer' : ''}
                className="flex flex-col items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Icon className="w-8 h-8 text-primary-500 mb-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white text-center mb-1">{resource.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">{resource.description}</p>
              </a>
            );
          })}
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details key={index} className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <span className="font-semibold text-gray-900 dark:text-white pr-4">{faq.question}</span>
                <span className="text-primary-500 group-open:rotate-180 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <div className="px-4 pt-4 pb-2 text-gray-700 dark:text-gray-300">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-primary-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Still Need Help?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@sanitasmind.app"
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:shadow-lg transition-shadow"
            >
              <Mail className="w-5 h-5" />
              <span>Email Support</span>
            </a>
            <a
              href="https://github.com/AlexanderErdelyi/copilot-powered-app/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Community Forum</span>
            </a>
          </div>
        </div>
      </div>

      {/* Feature Requests */}
      <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-6 mt-6 border border-primary-200 dark:border-primary-800">
        <div className="flex items-start space-x-3">
          <Lightbulb className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Have a Feature Request?</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              We're always looking to improve Sanitas Mind. If you have ideas for new features or improvements, 
              we'd love to hear from you!
            </p>
            <a
              href="https://github.com/AlexanderErdelyi/copilot-powered-app/issues/new?labels=enhancement"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              Submit Feature Request →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Support;
