import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

function Insights() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Insights</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Analyze your spending patterns and health trends
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Health Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">68%</p>
            </div>
          </div>
          <p className="text-sm text-green-500">+5% from last month</p>
        </div>
        
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Spending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">$420</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">per week</p>
        </div>
        
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <TrendingDown className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Top Category</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">Groceries</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">44% of spending</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Spending Recommendations
        </h2>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
            <p className="font-medium text-gray-900 dark:text-white">Switch to store brands</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              You could save ~$45/month by choosing store brand alternatives
            </p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
            <p className="font-medium text-gray-900 dark:text-white">Meal prep more often</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Reduce restaurant spending by 30% with weekly meal prep
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Insights;
