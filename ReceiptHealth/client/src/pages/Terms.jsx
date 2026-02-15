import { FileText, CheckCircle, AlertCircle, Scale, UserCheck, Ban } from 'lucide-react';

function Terms() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms of Service</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: February 15, 2026</p>
          </div>
        </div>

        {/* Introduction */}
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Welcome to <strong>Sanitas Mind</strong>. By using our application, you agree to these Terms of Service. 
            Please read them carefully.
          </p>

          {/* Acceptance */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <UserCheck className="w-6 h-6 text-primary-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Acceptance of Terms</h2>
            </div>
            <div className="text-gray-700 dark:text-gray-300 space-y-3">
              <p>
                By accessing or using Sanitas Mind, you agree to be bound by these Terms of Service and all 
                applicable laws and regulations. If you do not agree with any of these terms, you are prohibited 
                from using or accessing this application.
              </p>
            </div>
          </div>

          {/* Use License */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="w-6 h-6 text-primary-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Use License</h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>Permission is granted to use Sanitas Mind for personal, non-commercial purposes to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Upload and manage your grocery receipts</li>
                <li>Track your spending and health scores</li>
                <li>Generate shopping lists and meal plans</li>
                <li>Access AI-powered insights and assistance</li>
                <li>Participate in gamification features</li>
              </ul>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm"><strong>This license shall automatically terminate</strong> if you violate any of these restrictions.</p>
              </div>
            </div>
          </div>

          {/* User Responsibilities */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-6 h-6 text-primary-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Responsibilities</h2>
            </div>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>You agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate information when using the application</li>
                <li>Keep your account credentials secure</li>
                <li>Not use the service for any illegal purposes</li>
                <li>Not attempt to bypass security measures</li>
                <li>Not reverse engineer or decompile the application</li>
                <li>Not upload malicious content or viruses</li>
                <li>Respect intellectual property rights</li>
              </ul>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="w-6 h-6 text-primary-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Disclaimer</h2>
            </div>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <p className="text-sm">
                  The materials and features in Sanitas Mind are provided on an 'as is' basis. We make no warranties, 
                  expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, 
                  implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement 
                  of intellectual property or other violation of rights.
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <h3 className="font-semibold mb-2">Health Information Disclaimer</h3>
                <p className="text-sm">
                  Sanitas Mind provides general health and nutritional information for informational purposes only. 
                  This information is not intended to be a substitute for professional medical advice, diagnosis, or treatment. 
                  Always seek the advice of your physician or other qualified health provider with any questions you may have 
                  regarding your health or nutrition.
                </p>
              </div>
            </div>
          </div>

          {/* Limitations */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Ban className="w-6 h-6 text-primary-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Limitations</h2>
            </div>
            <div className="text-gray-700 dark:text-gray-300 space-y-3">
              <p>
                In no event shall Sanitas Mind or its developers be liable for any damages (including, without limitation, 
                damages for loss of data or profit, or due to business interruption) arising out of the use or inability 
                to use the application.
              </p>
            </div>
          </div>

          {/* Modifications */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-6 h-6 text-primary-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Modifications to Terms</h2>
            </div>
            <div className="text-gray-700 dark:text-gray-300 space-y-3">
              <p>
                We reserve the right to revise these Terms of Service at any time without notice. By using this application, 
                you are agreeing to be bound by the current version of these Terms of Service.
              </p>
            </div>
          </div>

          {/* Open Source */}
          <div className="mb-8">
            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Open Source</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Sanitas Mind is an open-source project. The source code is available on GitHub and is subject to 
                the license terms specified in the repository. Contributions are welcome and subject to our contribution 
                guidelines.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Questions?</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              If you have any questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:legal@sanitasmind.app" className="text-primary-500 hover:text-primary-600">
                legal@sanitasmind.app
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Terms;
