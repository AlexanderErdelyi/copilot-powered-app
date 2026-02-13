import { TrendingUp, TrendingDown, BarChart3, Send, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

function Insights() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [anomalies, setAnomalies] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsightsData();
  }, []);

  const fetchInsightsData = async () => {
    try {
      // Fetch anomalies
      const anomaliesRes = await axios.get('/api/insights/anomalies');
      setAnomalies(anomaliesRes.data || []);

      // Fetch budget prediction
      const predictionRes = await axios.get('/api/insights/budget-prediction');
      setPrediction(predictionRes.data);

      // Fetch recommendations
      const recommendationsRes = await axios.get('/api/recommendations/category');
      setRecommendations(recommendationsRes.data || []);
    } catch (error) {
      console.error('Error fetching insights data:', error);
    } finally {
      setLoading(false);
    }
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Insights</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
          Analyze your spending patterns and health trends
        </p>
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : prediction ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 mb-1">
                  Predicted Spending (Next Month)
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-300">
                  ${prediction.predictedAmount?.toFixed(2) || '0.00'}
                </div>
                {prediction.confidence && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Confidence: {(prediction.confidence * 100).toFixed(0)}%
                  </div>
                )}
              </div>
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
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                <div className="text-sm sm:text-base font-semibold text-green-700 dark:text-green-300 mb-1">
                  {rec.title || rec.category}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {rec.suggestion || rec.recommendation}
                </div>
                {rec.potentialSavings && (
                  <div className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 mt-2">
                    Save up to ${rec.potentialSavings.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No recommendations at this time</p>
            <p className="text-sm mt-1">Keep tracking your spending for personalized tips!</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="card">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900 rounded-lg flex-shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Health Score</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">68%</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-green-500">+5% from last month</p>
        </div>
        
        <div className="card">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Avg Spending</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">$420</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">per week</p>
        </div>
        
        <div className="card">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900 rounded-lg flex-shrink-0">
              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Top Category</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">Groceries</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">44% of spending</p>
        </div>
      </div>
    </div>
  );
}

export default Insights;
