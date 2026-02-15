import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Apple,
  AlertCircle,
  Heart,
  HelpCircle
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
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSpent: 0,
    receiptCount: 0,
    healthyPercentage: 0,
    avgPerReceipt: 0,
    healthScore: 0,
    currency: 'USD'
  });
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState([]);
  const [filteredCategoryData, setFilteredCategoryData] = useState([]);
  const [hiddenCategories, setHiddenCategories] = useState(new Set());
  const [trendData, setTrendData] = useState([]);
  const [weeklyTrendData, setWeeklyTrendData] = useState([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState([]);
  const [categoryTrendData, setCategoryTrendData] = useState([]);
  const [hiddenTrendLines, setHiddenTrendLines] = useState(new Set());
  const [monthlySpendData, setMonthlySpendData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryItems, setCategoryItems] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [showHealthScoreInfo, setShowHealthScoreInfo] = useState(false);
  const [showSpendingBreakdown, setShowSpendingBreakdown] = useState(false);
  const [showHealthyItemsModal, setShowHealthyItemsModal] = useState(false);
  const [healthyItems, setHealthyItems] = useState([]);
  // Period selection states
  const [trendsPeriod, setTrendsPeriod] = useState('weekly');
  const [categoryPeriod, setCategoryPeriod] = useState('all');
  const [monthlyChartPeriod, setMonthlyChartPeriod] = useState('monthly');
  // Activity states for Recent Activity section only
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    initializeDashboard();
    fetchActivities();
  }, []);

  useEffect(() => {
    if (selectedYear !== null) {
      fetchMonthlySpendData();
    }
  }, [selectedYear]);

  useEffect(() => {
    // Refetch data when period changes
    if (!loading) {
      fetchDashboardData();
    }
  }, [trendsPeriod, categoryPeriod]);

  useEffect(() => {
    // Filter category data based on hidden categories
    const filtered = categoryData.filter(cat => !hiddenCategories.has(cat.name));
    setFilteredCategoryData(filtered);
  }, [categoryData, hiddenCategories]);

  const toggleCategoryFilter = (categoryName) => {
    setHiddenCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const toggleTrendLine = (lineName) => {
    setHiddenTrendLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lineName)) {
        newSet.delete(lineName);
      } else {
        newSet.add(lineName);
      }
      return newSet;
    });
  };

  const getCurrencySymbol = (currencyCode) => {
    const symbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CHF': 'CHF',
      'JPY': '¥'
    };
    return symbols[currencyCode] || currencyCode;
  };

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

      // Fetch category breakdown with period filter
      const categoryRes = await axios.get(`/api/dashboard/category-breakdown?period=${categoryPeriod}`);
      setCategoryData(categoryRes.data);

      // Fetch enhanced spending trends with period filter
      const trendRes = await axios.get(`/api/dashboard/spending-trends?period=${trendsPeriod}`);
      const trends = trendRes.data;
      setWeeklyTrendData(trends.weekly || []);
      setMonthlyTrendData(trends.monthly || []);
      setCategoryTrendData(trends.categoryTrends || []);
      setTrendData(trends.monthly || []); // Keep for backward compatibility
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set mock data for demo when backend is not available
      setStats({
        totalSpent: 0,
        receiptCount: 0,
        healthyPercentage: 0,
        avgPerReceipt: 0,
        healthScore: 0,
        currency: 'USD'
      });
      
      setCategoryData([]);
      setTrendData([]);
      setWeeklyTrendData([]);
      setMonthlyTrendData([]);
      setCategoryTrendData([]);
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

  const fetchActivities = async () => {
    try {
      const response = await axios.get('/api/activities?limit=5');
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    }
  };

  const handleActivityClick = (activity) => {
    // Navigate based on activity type and URL
    if (activity.navigateUrl) {
      navigate(activity.navigateUrl);
    }
  };

  const handleTotalSpentClick = () => {
    setShowSpendingBreakdown(true);
  };

  const handleReceiptsClick = () => {
    navigate('/receipts');
  };

  const handleHealthyItemsClick = async () => {
    try {
      const response = await axios.get('/api/analytics/category-items/Healthy');
      setHealthyItems(response.data);
      setShowHealthyItemsModal(true);
    } catch (error) {
      console.error('Error fetching healthy items:', error);
    }
  };

  const KPICard = ({ title, value, icon: Icon, trend, colorClass, prefix = '', suffix = '', onClick }) => (
    <div 
      className={`card ${onClick ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide truncate">
            {title}
          </p>
          <p className={`text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 ${colorClass} break-words`}>
            {prefix}{value}{suffix}
          </p>
          {trend && (
            <div className="flex items-center mt-1 sm:mt-2 text-xs sm:text-sm">
              {trend > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1" />
                  <span className="text-green-500">+{trend}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 mr-1" />
                  <span className="text-red-500">{trend}%</span>
                </>
              )}
              <span className="text-gray-500 ml-1 sm:ml-2 text-xs sm:text-sm">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-lg ${colorClass.replace('text-', 'bg-').replace(/\d+/g, '100')} bg-opacity-20 flex-shrink-0`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colorClass}`} />
        </div>
      </div>
    </div>
  );

  const PeriodSelector = ({ value, onChange, options = ['daily', 'weekly', 'monthly', 'yearly'], includeAll = false }) => {
    const displayOptions = includeAll ? ['all', ...options] : options;
    
    return (
      <div className="flex flex-wrap gap-2">
        {displayOptions.map(period => (
          <button
            key={period}
            onClick={() => onChange(period)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
              value === period
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>
    );
  };

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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
            Welcome back! Here's an overview of your spending habits.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Year Filter */}
          {availableYears.length > 0 && (
            <div className="flex items-center space-x-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                Year:
              </label>
              <select 
                value={selectedYear || ''}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="input w-full sm:w-32 text-sm"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
        <KPICard
          title="Total Spent"
          value={stats.totalSpent.toFixed(2)}
          icon={DollarSign}
          trend={-5.2}
          colorClass="text-primary-500"
          prefix={getCurrencySymbol(stats.currency)}
          onClick={handleTotalSpentClick}
        />
        <KPICard
          title="Receipts"
          value={stats.receiptCount}
          icon={ShoppingBag}
          trend={12.5}
          colorClass="text-blue-500"
          onClick={handleReceiptsClick}
        />
        <KPICard
          title="Healthy Items"
          value={stats.healthyPercentage}
          icon={Apple}
          trend={8.3}
          colorClass="text-green-500"
          suffix="%"
          onClick={handleHealthyItemsClick}
        />
        <KPICard
          title="Avg per Receipt"
          value={stats.avgPerReceipt.toFixed(2)}
          icon={TrendingDown}
          trend={-3.1}
          colorClass="text-orange-500"
          prefix={getCurrencySymbol(stats.currency)}
        />
        {/* Health Score Card with Tooltip */}
        <div className="card relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Health Score</span>
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-500" />
                <button
                  onClick={() => setShowHealthScoreInfo(!showHealthScoreInfo)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
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
          
          {/* Tooltip */}
          {showHealthScoreInfo && (
            <div className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 shadow-xl z-20">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">Health Score Calculation</h4>
                <button
                  onClick={() => setShowHealthScoreInfo(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Your Health Score is calculated based on the percentage of healthy items in your purchases:
              </p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                <li>• 70-100: Excellent healthy choices</li>
                <li>• 40-69: Moderate healthy choices</li>
                <li>• 0-39: Room for improvement</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Spending Trends */}
        <div className="card">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">
            Spending Trends
          </h2>
          <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px]">
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Category Breakdown
            </h2>
            <PeriodSelector
              value={categoryPeriod}
              onChange={setCategoryPeriod}
              options={['daily', 'weekly', 'monthly', 'yearly']}
              includeAll={true}
            />
          </div>
          <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px]">
            <PieChart>
              <Pie
                data={filteredCategoryData}
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
                {filteredCategoryData.map((entry, index) => (
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
          
          {/* Clickable Category Legend */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {categoryData.map((category) => (
              <button
                key={category.name}
                onClick={() => toggleCategoryFilter(category.name)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  hiddenCategories.has(category.name)
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 opacity-50'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm hover:shadow-md'
                }`}
                title={hiddenCategories.has(category.name) ? 'Click to show' : 'Click to hide'}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                ></span>
                <span>{category.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {getCurrencySymbol(stats.currency)}{category.value.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Spending Trends - Weekly, Monthly, and Category Lines */}
      {(weeklyTrendData.length > 0 || monthlyTrendData.length > 0 || categoryTrendData.length > 0) && (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Spending Trends
            </h2>
            <PeriodSelector
              value={trendsPeriod}
              onChange={setTrendsPeriod}
              options={['daily', 'weekly', 'monthly', 'yearly']}
            />
          </div>
         
          {/* Prepare combined data for line chart */}
          {(() => {
            // Create a unified timeline from weekly data
            const weeklyTimelineData = weeklyTrendData.map(w => ({
              period: w.period,
              weeklyTotal: w.total,
              ...Object.fromEntries(
                Object.entries(w.categoryBreakdown || {}).map(([cat, amt]) => [`weekly_${cat}`, amt])
              )
            }));

            // Get all unique categories from category trends
            const allCategories = categoryTrendData.map(ct => ({
              name: ct.category,
              color: ct.color
            }));

            // Filter out hidden trend lines
            const visibleCategories = allCategories.filter(cat => !hiddenTrendLines.has(cat.name));

            return (
              <>
                <ResponsiveContainer width="100%" height={300} className="sm:!h-[350px]">
                  <LineChart data={weeklyTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="period" 
                      stroke="#9ca3af"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value, name) => {
                        if (name === 'weeklyTotal') return [`${getCurrencySymbol(stats.currency)}${value.toFixed(2)}`, 'Weekly Total'];
                        if (name.startsWith('weekly_')) {
                          const catName = name.replace('weekly_', '');
                          return [`${getCurrencySymbol(stats.currency)}${value.toFixed(2)}`, catName];
                        }
                        return [`${getCurrencySymbol(stats.currency)}${value.toFixed(2)}`, name];
                      }}
                    />
                    <Legend />
                    
                    {/* Weekly Total Line */}
                    {!hiddenTrendLines.has('Weekly Total') && (
                      <Line
                        type="monotone"
                        dataKey="weeklyTotal"
                        stroke="#667eea"
                        strokeWidth={3}
                        name="Weekly Total"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    )}
                    
                    {/* Category Lines */}
                    {visibleCategories.map((cat, idx) => (
                      <Line
                        key={cat.name}
                        type="monotone"
                        dataKey={`weekly_${cat.name}`}
                        stroke={cat.color}
                        strokeWidth={2}
                        name={cat.name}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>

                {/* Interactive Legend for Trends */}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {/* Weekly Total Button */}
                  <button
                    onClick={() => toggleTrendLine('Weekly Total')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      hiddenTrendLines.has('Weekly Total')
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 opacity-50'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm hover:shadow-md'
                    }`}
                    title={hiddenTrendLines.has('Weekly Total') ? 'Click to show' : 'Click to hide'}
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: '#667eea' }}
                    ></span>
                    <span>Weekly Total</span>
                  </button>

                  {/* Category Buttons */}
                  {allCategories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => toggleTrendLine(cat.name)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        hiddenTrendLines.has(cat.name)
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 opacity-50'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm hover:shadow-md'
                      }`}
                      title={hiddenTrendLines.has(cat.name) ? 'Click to show' : 'Click to hide'}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      ></span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Monthly Spending Trends */}
      {monthlySpendData.length > 0 && (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Spending Over Time ({selectedYear})
            </h2>
            <PeriodSelector
              value={monthlyChartPeriod}
              onChange={setMonthlyChartPeriod}
              options={['daily', 'weekly', 'monthly', 'yearly']}
            />
          </div>
          <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px]">
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
                  if (name === 'totalSpend') return [`${getCurrencySymbol(stats.currency)}${value.toFixed(2)}`, 'Total Spent'];
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
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <button 
            onClick={() => navigate('/receipts')}
            className="text-primary-500 hover:text-primary-600 font-medium text-xs sm:text-sm"
          >
            View All
          </button>
        </div>
        
        <div className="space-y-2 sm:space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm">No recent activities</p>
              <p className="text-xs mt-1">Upload a receipt to get started!</p>
            </div>
          ) : (
            activities.slice(0, 5).map((activity) => (
              <div 
                key={activity.id} 
                onClick={() => handleActivityClick(activity)}
                className={`flex items-center justify-between p-3 sm:p-4 rounded-lg transition-colors cursor-pointer ${
                  activity.isRead 
                    ? 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600' 
                    : 'bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800'
                } ${!activity.isSuccess ? 'border-l-4 border-red-500' : ''}`}
              >
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div className={`text-2xl flex-shrink-0`}>
                    {activity.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium text-sm sm:text-base truncate ${
                      activity.isRead ? 'text-gray-900 dark:text-white' : 'text-blue-900 dark:text-blue-100 font-semibold'
                    }`}>
                      {activity.description}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                    {!activity.isSuccess && activity.errorMessage && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {activity.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
                {!activity.isRead && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Spending Breakdown Modal */}
      {showSpendingBreakdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Spending Breakdown
              </h2>
              <button
                onClick={() => setShowSpendingBreakdown(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Total Spent</span>
                  <span className="text-xl sm:text-2xl font-bold text-primary-500">{getCurrencySymbol(stats.currency)}{stats.totalSpent.toFixed(2)}</span>
                </div>
                
                {categoryData.length > 0 && (
                  <>
                    <h3 className="font-semibold text-gray-900 dark:text-white mt-4 sm:mt-6 mb-2 sm:mb-3 text-sm sm:text-base">By Category</h3>
                    <div className="space-y-2">
                      {categoryData.map((cat, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                            <div
                              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{cat.name}</span>
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base flex-shrink-0 ml-2">
                            {getCurrencySymbol(stats.currency)}{cat.value?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Healthy Items Modal */}
      {showHealthyItemsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Healthy Items
              </h2>
              <button
                onClick={() => setShowHealthyItemsModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              {healthyItems.length > 0 ? (
                <div className="space-y-2">
                  {healthyItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base block truncate">{item.description || item.name}</span>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          {item.vendor && <span>{item.vendor} • </span>}
                          {item.date && <span>{new Date(item.date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                          ${item.price?.toFixed(2) || '0.00'}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-xs sm:text-sm text-gray-500">Qty: {item.quantity}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No healthy items found
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Items Modal */}
      {showCategoryModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {selectedCategory} Items
              </h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl sm:text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4 sm:p-6">
              {categoryItems.length > 0 ? (
                <div className="space-y-2">
                  {categoryItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base block truncate">{item.description || item.name}</span>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          {item.vendor && <span>{item.vendor} • </span>}
                          {item.date && <span>{new Date(item.date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                          ${item.price?.toFixed(2) || '0.00'}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-xs sm:text-sm text-gray-500">Qty: {item.quantity}</div>
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
