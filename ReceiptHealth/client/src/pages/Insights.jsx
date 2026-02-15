import { TrendingUp, TrendingDown, BarChart3, Send, Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useInsights } from '../contexts/InsightsContext';

function Insights() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  
  // Get pre-loaded insights data from context
  const { 
    anomalies, 
    prediction, 
    recommendations,
    stats,
    categoryData,
    loading, 
    refreshing,
    lastFetch,
    refresh 
  } = useInsights();

  // Calculate quick stats from real data
  const getCurrencySymbol = (currencyCode) => {
    const symbols = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'CHF': 'CHF', 'JPY': '¥' };
    return symbols[currencyCode] || currencyCode;
  };

  const calculateAvgWeeklySpend = () => {
    if (!stats || stats.receiptCount === 0) return 0;
    // Get date range from receipts (simplified - using total / estimated weeks)
    // For better accuracy, we'd need receipt dates, but this gives a reasonable estimate
    const estimatedWeeks = Math.max(stats.receiptCount / 2, 1); // Assume ~2 receipts per week minimum
    return stats.totalSpent / estimatedWeeks;
  };

  const getTopCategory = () => {
    if (!categoryData || categoryData.length === 0) {
      return { name: 'N/A', percentage: 0 };
    }
    const sorted = [...categoryData].sort((a, b) => b.value - a.value);
    const top = sorted[0];
    const total = categoryData.reduce((sum, cat) => sum + cat.value, 0);
    const percentage = total > 0 ? (top.value / total * 100) : 0;
    return { name: top.name, percentage };
  };

  const handleRefresh = async () => {
    toast.loading('Recalculating insights...', { id: 'refresh' });
    await refresh();
    toast.success('Insights refreshed!', { id: 'refresh' });
  };

  const askQuery = async () => {
    if (!query.trim()) {
      toast.error('Please enter a question');
      return;
    }

    setAsking(true);
    try {
      const response = await axios.post('/api/insights/query', { query });
      setAnswer(response.data.answer || response.data.response || 'No response received');
    } catch (error) {
      console.error('Error asking query:', error);
      toast.error('Failed to process query');
      setAnswer('Sorry, I could not process your question. Please try again.');
    } finally {
      setAsking(false);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Insights</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
            Analyze your spending patterns and health trends
          </p>
          {lastFetch && !loading && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Last updated: {new Date(lastFetch).toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="btn-primary flex items-center space-x-2 text-sm"
          title="Recalculate insights"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Ask Me Anything */}
      <div className="card">
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white flex items-center">
          💬 Ask Me Anything
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !asking && askQuery()}
            placeholder="e.g., How much did I spend on vegetables last month?"
            className="input flex-1 text-sm sm:text-base"
            disabled={asking}
          />
          <button
            onClick={askQuery}
            disabled={asking}
            className="btn-primary flex items-center justify-center space-x-2 text-sm sm:text-base w-full sm:w-auto"
          >
            {asking ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Ask</span>
              </>
            )}
          </button>
        </div>
        {answer && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm sm:text-base text-gray-900 dark:text-white">{answer}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Anomaly Alerts */}
        <div className="card">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white flex items-center">
            ⚠️ Anomaly Alerts
          </h2>
          {(loading || refreshing) ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-2" />
              <p className="text-sm text-gray-500">{refreshing ? 'Refreshing...' : 'Pre-loading data...'}</p>
            </div>
          ) : anomalies.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {anomalies.map((anomaly, idx) => (
                <div key={idx} className="p-2 sm:p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
                  <div className="text-sm sm:text-base font-semibold text-orange-700 dark:text-orange-300">
                    {anomaly.category || 'Spending Alert'}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {anomaly.message || anomaly.description}
                  </div>
                  {anomaly.amount && (
                    <div className="text-base sm:text-lg font-bold text-orange-600 dark:text-orange-400 mt-2">
                      ${anomaly.amount.toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>✅ No anomalies detected</p>
              <p className="text-sm mt-1">Your spending looks normal!</p>
            </div>
          )}
        </div>

        {/* Budget Prediction */}
        <div className="card">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white flex items-center">
            📊 Budget Prediction
          </h2>
          {(loading || refreshing) ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-2" />
              <p className="text-sm text-gray-500">{refreshing ? 'Refreshing...' : 'Pre-loading data...'}</p>
            </div>
          ) : prediction ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 mb-1">
                  Predicted Spending (Next Month)
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-300">
                  ${prediction.predictedTotal?.toFixed(2) || '0.00'}
                </div>
                <div className="mt-2 space-y-1 text-xs text-blue-600 dark:text-blue-400">
                  <div className="flex justify-between">
                    <span>Current Month:</span>
                    <span className="font-semibold">${prediction.currentMonthSpend?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Monthly:</span>
                    <span className="font-semibold">${prediction.averageMonthlySpend?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
                {prediction.confidence && (
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs font-semibold">
                      {prediction.confidence.toUpperCase()} Confidence
                    </span>
                  </div>
                )}
              </div>
              {prediction.message && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {prediction.message}
                </p>
              )}
              {prediction.trend && (
                <div className="flex items-center space-x-2 text-sm">
                  {prediction.trend === 'increasing' ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-red-500" />
                      <span className="text-red-500">Trending up</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-green-500" />
                      <span className="text-green-500">Trending down</span>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Not enough data for prediction</p>
              <p className="text-sm mt-1">Add more receipts to see predictions</p>
            </div>
          )}
        </div>
      </div>

      {/* Personalized Recommendations */}
      <div className="card">
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white flex items-center">
          💡 Personalized Recommendations
        </h2>
        {(loading || refreshing) ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-2" />
            <p className="text-sm text-gray-500">
              {refreshing ? 'Refreshing...' : 'Pre-loading data...'}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              AI is analyzing your receipts (this may take ~20 seconds)
            </p>
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {recommendations.map((rec, idx) => {
              // Recommendations come as strings with emojis at the start
              const text = typeof rec === 'string' ? rec : (rec.suggestion || rec.recommendation || rec.title || '');
              // Extract emoji if present (first character)   
              const hasEmoji = text && /[\u{1F300}-\u{1F9FF}]/u.test(text[0]);
              const emoji = hasEmoji ? text[0] : '💡';
              const content = hasEmoji ? text.slice(1).trim() : text;
              
              return (
                <div key={idx} className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">{emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>📊 Upload receipts to get recommendations</p>
            <p className="text-sm mt-1">AI will analyze your shopping patterns and suggest healthier alternatives!</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Health Score */}
        <div className="card">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900 rounded-lg flex-shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Health Score</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : stats ? `${stats.healthScore}%` : 'N/A'}
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            {stats && stats.receiptCount > 0 
              ? `Based on ${stats.receiptCount} receipt${stats.receiptCount !== 1 ? 's' : ''}`
              : 'Upload receipts to see score'}
          </p>
        </div>
        
        {/* Average Weekly Spending */}
        <div className="card">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Avg Spending</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : stats 
                  ? `${getCurrencySymbol(stats.currency)}${calculateAvgWeeklySpend().toFixed(0)}` 
                  : 'N/A'}
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            {stats 
              ? `Total: ${getCurrencySymbol(stats.currency)}${stats.totalSpent.toFixed(2)}`
              : 'per week'}
          </p>
        </div>
        
        {/* Top Category */}
        <div className="card">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900 rounded-lg flex-shrink-0">
              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Top Category</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {loading ? '...' : getTopCategory().name}
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            {loading ? 'Loading...' : `${getTopCategory().percentage.toFixed(0)}% of spending`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Insights;
