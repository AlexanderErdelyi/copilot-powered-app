import { Shield, Lock, Eye, Database, FileText, Mail } from 'lucide-react';

function Privacy() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: February 15, 2026</p>
          </div>
        </div>

        {/* Introduction */}
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            At <strong>Sanitas Mind</strong> (from Latin: Health - physical and mental well-being), 
            we take your privacy seriously. This Privacy Policy explains how we collect, use, and 
            protect your personal information when you use our receipt management and health tracking application.
          </p>

          {/* Data Collection */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Database className="w-6 h-6 text-primary-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Information We Collect</h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Receipt Data</h3>
                <p>We process receipt images and extract information including store names, item names, prices, and purchase dates to provide our services.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Health & Nutrition Information</h3>
                <p>We analyze your purchase patterns to provide health scores and nutritional insights. This data is stored locally on your device.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Usage Information</h3>
                <p>We collect information about how you use the app to improve our services, including feature usage and interaction patterns.</p>
              </div>
            </div>
          </div>

          {/* Data Storage */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Lock className="w-6 h-6 text-primary-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How We Store Your Data</h2>
            </div>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>Your data security is our priority:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Local Storage:</strong> Most data is stored locally on your device using browser storage and SQLite database</li>
                <li><strong>Encryption:</strong> Receipt images and sensitive data are encrypted at rest</li>
                <li><strong>No Third-Party Sharing:</strong> We do not sell or share your personal data with third parties</li>
                <li><strong>Secure Processing:</strong> AI processing is performed using GitHub Copilot APIs with enterprise-grade security</li>
              </ul>
            </div>
          </div>

          {/* Data Usage */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Eye className="w-6 h-6 text-primary-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How We Use Your Data</h2>
            </div>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>We use your information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Process and categorize your receipts</li>
                <li>Calculate health scores and provide nutritional insights</li>
                <li>Generate shopping lists and meal plans</li>
                <li>Track spending patterns and provide financial insights</li>
                <li>Provide AI-powered assistance through our Voice Assistant</li>
                <li>Award achievements and gamification features</li>
              </ul>
            </div>
          </div>

          {/* Your Rights */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-6 h-6 text-primary-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Rights</h2>
            </div>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Delete:</strong> Delete your data at any time through the Settings page</li>
                <li><strong>Export:</strong> Export your data in a portable format</li>
                <li><strong>Opt-Out:</strong> Disable specific features or data collection</li>
              </ul>
            </div>
          </div>

          {/* Contact */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Mail className="w-6 h-6 text-primary-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Us</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              If you have any questions about this Privacy Policy or our data practices, please contact us at{' '}
              <a href="mailto:privacy@sanitasmind.app" className="text-primary-500 hover:text-primary-600">
                privacy@sanitasmind.app
              </a>
            </p>
          </div>

          {/* Updates */}
          <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Policy Updates</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Privacy;
