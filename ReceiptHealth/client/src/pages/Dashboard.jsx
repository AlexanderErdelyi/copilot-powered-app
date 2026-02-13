import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Apple,
  AlertCircle,
  Heart
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import axios from 'axios';

function Dashboard() {
  const [stats, setStats] = useState({
    totalSpent: 0,
    receiptCount: 0,
    healthyPercentage: 0,
    avgPerReceipt: 0,
    healthScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [monthlySpendData, setMonthlySpendData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryItems, setCategoryItems] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);

  useEffect(() => {
    initializeDashboard();
  }, []);

  useEffect(() => {
    if (selectedYear !== null) {
      fetchMonthlySpendData();
    }
  }, [selectedYear]);

  const initializeDashboard = async () => {
    // Fetch available years first
    try {
      const response = await axios.get('/api/analytics/available-years');
      const years = response.data;
      setAvailableYears(years);
      
      // Set current year or most recent year as default
      if (years.length > 0) {
        const currentYear = new Date().getFullYear();
        const defaultYear = years.includes(currentYear) ? currentYear : years[0];
        setSelectedYear(defaultYear);
      } else {
        // No years available, use current year
        setSelectedYear(new Date().getFullYear());
      }
    } catch (error) {
      console.error('Error fetching available years:', error);
      // Default to current year if API fails
      setSelectedYear(new Date().getFullYear());
    }

    // Fetch main dashboard data (not year-filtered)
    fetchDashboardData();
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch stats from API (no year filter - shows all data)
      const statsRes = await axios.get('/api/dashboard/stats');
      const statsData = statsRes.data;
      // Calculate health score (0-100 based on healthy percentage)
      statsData.healthScore = statsData.healthyPercentage || 0;
      setStats(statsData);

      // Fetch category breakdown (no year filter)
      const categoryRes = await axios.get('/api/dashboard/category-breakdown');
      setCategoryData(categoryRes.data);

      // Fetch spending trends (last 6 months)
      const trendRes = await axios.get('/api/dashboard/spending-trends');
      setTrendData(trendRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set mock data for demo when backend is not available
      setStats({
        totalSpent: 0,
        receiptCount: 0,
        healthyPercentage: 0,
        avgPerReceipt: 0,
        healthScore: 0
      });
      
      setCategoryData([]);
      setTrendData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlySpendData = async () => {
    if (!selectedYear) return;
    
    try {
      // Fetch monthly spending trends for selected year
      const monthlyRes = await axios.get(`/api/analytics/monthly-spend?year=${selectedYear}`);
      if (monthlyRes.data && monthlyRes.data.data) {
        // Transform data for bar chart
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedData = monthlyRes.data.data.map(item => ({
          month: monthNames[item.Month - 1],
          totalSpend: item.TotalSpend,
          receiptCount: item.ReceiptCount,
          avgHealthScore: item.AverageHealthScore
        }));
        setMonthlySpendData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching monthly spend data:', error);
      setMonthlySpendData([]);
    }
  };

  const handleCategoryClick = async (data) => {
    const category = data.name;
    try {
      const response = await axios.get(`/api/analytics/category-items/${category}`);
      setCategoryItems(response.data);
      setSelectedCategory(category);
      setShowCategoryModal(true);
    } catch (error) {
      console.error('Error fetching category items:', error);
    }
  };

  const KPICard = ({ title, value, icon: Icon, trend, colorClass, prefix = '', suffix = '' }) => (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {title}
          </p>
          <p className={`text-3xl font-bold mt-2 ${colorClass}`}>
            {prefix}{value}{suffix}
          </p>
          {trend && (
            <div className="flex items-center mt-2 text-sm">
              {trend > 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-500">+{trend}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-red-500">{trend}%</span>
                </>
              )}
              <span className="text-gray-500 ml-2">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClass.replace('text-', 'bg-').replace(/\d+/g, '100')} bg-opacity-20`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back! Here's an overview of your spending habits.
          </p>
        </div>
        
        {/* Year Filter */}
        {availableYears.length > 0 && (
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Year:
            </label>
            <select 
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input w-32"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard
          title="Total Spent"
          value={stats.totalSpent.toFixed(2)}
          icon={DollarSign}
          trend={-5.2}
          colorClass="text-primary-500"
          prefix="$"
        />
        <KPICard
          title="Receipts"
          value={stats.receiptCount}
          icon={ShoppingBag}
          trend={12.5}
          colorClass="text-blue-500"
        />
        <KPICard
          title="Healthy Items"
          value={stats.healthyPercentage}
          icon={Apple}
          trend={8.3}
          colorClass="text-green-500"
          suffix="%"
        />
        <KPICard
          title="Avg per Receipt"
          value={stats.avgPerReceipt.toFixed(2)}
          icon={TrendingDown}
          trend={-3.1}
          colorClass="text-orange-500"
          prefix="$"
        />
        {/* Health Score Card */}
        <div className="card relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Health Score</span>
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {stats.healthScore || 0}
            </div>
            <div className="text-xs text-gray-500">out of 100</div>
            {/* Progress Bar */}
            <div className="mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  stats.healthScore >= 70
                    ? 'bg-green-500'
                    : stats.healthScore >= 40
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${stats.healthScore || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Trends */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Spending Trends
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#667eea" 
                strokeWidth={3}
                dot={{ fill: '#667eea', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Category Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                onClick={handleCategoryClick}
                style={{ cursor: 'pointer' }}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Spending Trends */}
      {monthlySpendData.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Monthly Spending Trends ({selectedYear})
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlySpendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value, name) => {
                  if (name === 'totalSpend') return [`$${value.toFixed(2)}`, 'Total Spent'];
                  if (name === 'receiptCount') return [value, 'Receipts'];
                  if (name === 'avgHealthScore') return [value.toFixed(1), 'Avg Health Score'];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="totalSpend" fill="#667eea" name="Total Spent" />
              <Bar dataKey="receiptCount" fill="#764ba2" name="Receipt Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <button className="text-primary-500 hover:text-primary-600 font-medium text-sm">
            View All
          </button>
        </div>
        
        <div className="space-y-3">
          {[
            { icon: ShoppingBag, text: 'Receipt from Whole Foods', amount: '$87.50', time: '2 hours ago' },
            { icon: Apple, text: 'Healthy meal plan generated', amount: '', time: '5 hours ago' },
            { icon: AlertCircle, text: 'Price alert: Organic milk on sale', amount: '$3.99', time: '1 day ago' }
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                  <activity.icon className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{activity.text}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</p>
                </div>
              </div>
              {activity.amount && (
                <span className="font-bold text-gray-900 dark:text-white">{activity.amount}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Category Items Modal */}
      {showCategoryModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedCategory} Items
              </h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              {categoryItems.length > 0 ? (
                <div className="space-y-2">
                  {categoryItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 dark:text-white">{item.description || item.name}</span>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {item.vendor && <span>{item.vendor} • </span>}
                          {item.date && <span>{new Date(item.date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          ${item.price?.toFixed(2) || '0.00'}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No items found in this category
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
