import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Apple,
  AlertCircle,
  Heart,
  HelpCircle,
  X
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
import toast from 'react-hot-toast';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSpent: 0,
    receiptCount: 0,
    healthyPercentage: 0,
    avgPerReceipt: 0,
    healthScore: 0,
    currency: 'USD',
    healthyItemCount: 0,
    junkItemCount: 0,
    healthyItemCountLastMonth: 0,
    junkItemCountLastMonth: 0,
    healthyTrend: 0,
    junkTrend: 0
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
  const [showJunkItemsModal, setShowJunkItemsModal] = useState(false);
  const [junkItems, setJunkItems] = useState([]);
  const [allPurchasedItems, setAllPurchasedItems] = useState([]);
  // Category editing state
  const [editingItemId, setEditingItemId] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  // Period selection states
  const [trendsPeriod, setTrendsPeriod] = useState('weekly');
  const [categoryPeriod, setCategoryPeriod] = useState('all');
  const [monthlyChartPeriod, setMonthlyChartPeriod] = useState('monthly');
  // Activity states for Recent Activity section only
  const [activities, setActivities] = useState([]);

  // Define fetchMonthlySpendData before useEffect hooks
  const fetchMonthlySpendData = useCallback(async () => {
    if (!selectedYear) {
      console.log('⚠️ No selectedYear, skipping fetch');
      return;
    }
    
    console.log('📊 Fetching monthly spend data for year:', selectedYear);
    
    try {
      const monthlyRes = await axios.get(`/api/analytics/monthly-spend?year=${selectedYear}`);
      console.log('✅ API Response:', monthlyRes.data);
      
      if (monthlyRes.data && monthlyRes.data.data) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedData = monthlyRes.data.data.map(item => ({
          month: monthNames[item.month - 1],
          monthNumber: item.month,
          totalSpend: item.totalSpend,
          receiptCount: item.receiptCount,
          avgHealthScore: item.averageHealthScore
        }));
        console.log('📈 Formatted data:', formattedData);
        setMonthlySpendData(formattedData);
        console.log('✅ State updated with', formattedData.length, 'months');
      } else {
        console.log('⚠️ No data in API response');
      }
    } catch (error) {
      console.error('❌ Error fetching monthly spend data:', error);
      setMonthlySpendData([]);
    }
  }, [selectedYear]);

  // Transform data based on selected period
  const getChartDataByPeriod = useCallback(() => {
    if (!monthlySpendData.length) return [];

    switch (monthlyChartPeriod) {
      case 'yearly':
        // Aggregate all months into a single year entry
        const yearTotal = monthlySpendData.reduce((acc, item) => ({
          period: selectedYear?.toString() || 'Year',
          totalSpend: acc.totalSpend + item.totalSpend,
          receiptCount: acc.receiptCount + item.receiptCount,
          avgHealthScore: acc.avgHealthScore + item.avgHealthScore
        }), { period: '', totalSpend: 0, receiptCount: 0, avgHealthScore: 0 });
        
        yearTotal.avgHealthScore = yearTotal.avgHealthScore / monthlySpendData.length;
        return [yearTotal];

      case 'weekly':
        // Group by weeks (approximate: 4 weeks per month)
        const weeklyData = [];
        monthlySpendData.forEach(item => {
          // Split each month into ~4 weeks
          const weeksInMonth = 4;
          const weeklySpend = item.totalSpend / weeksInMonth;
          const weeklyReceipts = Math.ceil(item.receiptCount / weeksInMonth);
          
          for (let w = 1; w <= weeksInMonth; w++) {
            weeklyData.push({
              period: `${item.month} W${w}`,
              totalSpend: weeklySpend,
              receiptCount: w === 1 ? item.receiptCount - (weeklyReceipts * 3) : weeklyReceipts,
              avgHealthScore: item.avgHealthScore
            });
          }
        });
        return weeklyData;

      case 'daily':
        // Show message that daily view requires more granular data
        return [];

      case 'monthly':
      default:
        // Return monthly data with 'period' key for consistent chart rendering
        return monthlySpendData.map(item => ({
          period: item.month,
          totalSpend: item.totalSpend,
          receiptCount: item.receiptCount,
          avgHealthScore: item.avgHealthScore
        }));
    }
  }, [monthlySpendData, monthlyChartPeriod, selectedYear]);

  useEffect(() => {
    initializeDashboard();
    fetchActivities();
  }, []);

  useEffect(() => {
    if (selectedYear !== null) {
      fetchMonthlySpendData();
    }
  }, [selectedYear, fetchMonthlySpendData]);

  useEffect(() => {
    console.log('📊 monthlySpendData state updated:', monthlySpendData);
  }, [monthlySpendData]);

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

  // Close category selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCategorySelector && !event.target.closest('.category-selector-container')) {
        setShowCategorySelector(false);
        setEditingItemId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategorySelector]);

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

  const getCategoryStyles = (category) => {
    const categoryName = category?.toLowerCase() || 'unknown';
    
    const styles = {
      'healthy': {
        bg: 'bg-green-50/80 dark:bg-green-900/20',
        border: 'border-green-200/50 dark:border-green-700/50',
        badge: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
        glow: 'hover:shadow-green-500/20'
      },
      'junk': {
        bg: 'bg-red-50/80 dark:bg-red-900/20',
        border: 'border-red-200/50 dark:border-red-700/50',
        badge: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
        glow: 'hover:shadow-red-500/20'
      },
      'other': {
        bg: 'bg-gray-50/80 dark:bg-gray-700/80',
        border: 'border-gray-200/50 dark:border-gray-600/50',
        badge: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
        glow: 'hover:shadow-gray-500/20'
      },
      'unknown': {
        bg: 'bg-gray-50/80 dark:bg-gray-700/80',
        border: 'border-gray-200/50 dark:border-gray-600/50',
        badge: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
        glow: 'hover:shadow-gray-500/20'
      }
    };
    
    return styles[categoryName] || styles['unknown'];
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setAvailableCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const updateLineItemCategory = async (lineItemId, categoryId) => {
    try {
      await axios.put(`/api/lineitems/${lineItemId}/category`, { categoryId });
      toast.success('Category updated!');
      
      // Refresh the current modal data
      if (showSpendingBreakdown) {
        await handleTotalSpentClick();
      } else if (showHealthyItemsModal) {
        await handleHealthyItemsClick();
      } else if (showJunkItemsModal) {
        const response = await axios.get('/api/analytics/category-items/Junk');
        setJunkItems(response.data);
      } else if (showCategoryModal && selectedCategory) {
        const response = await axios.get(`/api/analytics/category-items/${selectedCategory}`);
        setCategoryItems(response.data);
      }
      
      // Refresh dashboard stats
      initializeDashboard();
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    } finally {
      setEditingItemId(null);
      setShowCategorySelector(false);
    }
  };

  const initializeDashboard = async () => {
    console.log('🚀 Initializing dashboard...');
    // Fetch categories
    fetchCategories();
    // Fetch available years first
    try {
      const response = await axios.get('/api/analytics/available-years');
      console.log('📅 Available years response:', response.data);
      const years = response.data.years || [];
      console.log('📅 Available years:', years);
      setAvailableYears(years);
      
      // Set current year or most recent year as default
      if (years.length > 0) {
        const currentYear = new Date().getFullYear();
        const defaultYear = years.includes(currentYear) ? currentYear : years[0];
        console.log('✅ Setting selectedYear to:', defaultYear);
        setSelectedYear(defaultYear);
      } else {
        // No years available, use current year
        console.log('⚠️ No years available, using current year:', new Date().getFullYear());
        setSelectedYear(new Date().getFullYear());
      }
    } catch (error) {
      console.error('❌ Error fetching available years:', error);
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
        currency: 'USD',
        healthyItemCount: 0,
        junkItemCount: 0,
        healthyItemCountLastMonth: 0,
        junkItemCountLastMonth: 0,
        healthyTrend: 0,
        junkTrend: 0
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

  const handleTotalSpentClick = async () => {
    try {
      const response = await axios.get('/api/receipts');
      // Extract all items from all receipts with prices
      const items = [];
      response.data.forEach(receipt => {
        if (receipt.lineItems && receipt.lineItems.length > 0) {
          receipt.lineItems.forEach(item => {
            items.push({
              ...item,
              vendor: receipt.vendor,
              date: receipt.date,
              receiptId: receipt.id
            });
          });
        }
      });
      setAllPurchasedItems(items);
      setShowSpendingBreakdown(true);
    } catch (error) {
      console.error('Error fetching all items:', error);
      setShowSpendingBreakdown(true);
    }
  };

  const handleReceiptsClick = () => {
    navigate('/receipts');
  };

  const handleHealthyItemsClick = async (e) => {
    e.stopPropagation();
    try {
      const response = await axios.get('/api/analytics/category-items/Healthy');
      setHealthyItems(response.data);
      setShowHealthyItemsModal(true);
    } catch (error) {
      console.error('Error fetching healthy items:', error);
    }
  };

  const handleJunkItemsClick = async (e) => {
    e.stopPropagation();
    try {
      const response = await axios.get('/api/analytics/category-items/Junk');
      setJunkItems(response.data);
      setShowJunkItemsModal(true);
    } catch (error) {
      console.error('Error fetching junk items:', error);
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
        
        {/* Custom Healthy Items Card with Count Display */}
        <div 
          className="card transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide truncate">
                Healthy Items
              </p>
              <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 break-words">
                <span 
                  onClick={handleHealthyItemsClick}
                  className="text-green-500 cursor-pointer hover:text-green-600 hover:underline transition-all"
                >
                  {stats.healthyItemCount}
                </span>
                <span className="text-gray-400 dark:text-gray-500 mx-1">/</span>
                <span 
                  onClick={handleJunkItemsClick}
                  className="text-red-500 cursor-pointer hover:text-red-600 hover:underline transition-all"
                >
                  {stats.junkItemCount}
                </span>
              </p>
              <div className="mt-1 sm:mt-2 space-y-0.5">
                {/* Healthy Trend */}
                <div className="flex items-center text-xs sm:text-sm">
                  {stats.healthyTrend > 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1" />
                      <span className="text-green-500">+{stats.healthyTrend}</span>
                    </>
                  ) : stats.healthyTrend < 0 ? (
                    <>
                      <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 mr-1" />
                      <span className="text-red-500">{stats.healthyTrend}</span>
                    </>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                  <span className="text-gray-500 ml-1 text-xs">healthy</span>
                  
                  {/* Junk Trend */}
                  <span className="mx-2 text-gray-400">|</span>
                  {stats.junkTrend > 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 mr-1" />
                      <span className="text-red-500">+{stats.junkTrend}</span>
                    </>
                  ) : stats.junkTrend < 0 ? (
                    <>
                      <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1" />
                      <span className="text-green-500">{stats.junkTrend}</span>
                    </>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                  <span className="text-gray-500 ml-1 text-xs">junk</span>
                </div>
                <span className="text-gray-500 text-xs block">vs last month</span>
              </div>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-green-100 bg-opacity-20 flex-shrink-0">
              <Apple className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
            </div>
          </div>
        </div>
        
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
                    <LineChart 
                      data={weeklyTimelineData}
                      margin={{ top: 30, right: 10, left: 0, bottom: -20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e1f20" />
                      <XAxis 
                        dataKey="period" 
                        stroke="#9ca3af"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="#9ca3af" domain={[0, 'auto']} />
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
          <ResponsiveContainer width="100%" height={300} className="sm:!h-[350px]">
            <PieChart>
              <Pie
                data={filteredCategoryData}
                cx="50%"
                cy="55%"
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

      {/* Monthly Spending Trends */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            Spending Over Time
          </h2>
          <div className="flex items-center gap-3">
            {/* Year Selector */}
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
            <PeriodSelector
              value={monthlyChartPeriod}
              onChange={setMonthlyChartPeriod}
              options={['daily', 'weekly', 'monthly', 'yearly']}
            />
          </div>
        </div>
        {(() => {
          const chartData = getChartDataByPeriod();
          console.log('📊 Rendering chart section. Period:', monthlyChartPeriod, 'Data length:', chartData.length);
          
          // Special handling for daily view
          if (monthlyChartPeriod === 'daily') {
            return (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p className="font-semibold">Daily view requires more detailed data</p>
                <p className="text-sm mt-2">Please select weekly, monthly, or yearly view</p>
              </div>
            );
          }
          
          return chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px]">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="period" 
                stroke="#9ca3af"
                angle={monthlyChartPeriod === 'weekly' ? -45 : 0}
                textAnchor={monthlyChartPeriod === 'weekly' ? 'end' : 'middle'}
                height={monthlyChartPeriod === 'weekly' ? 80 : 30}
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
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No spending data available for {selectedYear || 'selected year'}</p>
            <p className="text-sm mt-2">Upload receipts to see your spending trends</p>
          </div>
        );
        })()}
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <button 
            onClick={() => navigate('/activities')}
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

      {/* Spending Breakdown Modal - All Purchased Items */}
      {showSpendingBreakdown && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl shadow-primary-500/20 border border-gray-200/50 dark:border-gray-700/50">
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl border-b border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 flex justify-between items-center z-10">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  All Purchased Items
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Total: {getCurrencySymbol(stats.currency)}{stats.totalSpent.toFixed(2)} • {allPurchasedItems.length} items
                </p>
              </div>
              <button
                onClick={() => setShowSpendingBreakdown(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {allPurchasedItems.length > 0 ? (
                <div className="space-y-2 overflow-visible">
                  {allPurchasedItems.map((item, index) => {
                    const categoryStyle = getCategoryStyles(item.category);
                    return (
                      <div key={index} className={`flex justify-between items-center p-2 sm:p-3 ${categoryStyle.bg} backdrop-blur-sm rounded-xl gap-2 hover:shadow-md ${categoryStyle.glow} transition-all border ${categoryStyle.border} ${showCategorySelector && editingItemId === item.id ? 'relative z-[100000]' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base block truncate">{item.description || item.name}</span>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                            {item.vendor && <span className="font-medium">{item.vendor}</span>}
                            {item.date && <span>•</span>}
                            {item.date && <span>{new Date(item.date).toLocaleDateString()}</span>}
                            {item.category && <span>•</span>}
                            {item.category && (
                              <div className="relative inline-block category-selector-container">
                                <button
                                  onClick={() => {
                                    setEditingItemId(item.id);
                                    setShowCategorySelector(true);
                                  }}
                                  className={`px-2 py-0.5 ${categoryStyle.badge} rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity`}
                                  title="Click to change category"
                                >
                                  {item.category} ✏️
                                </button>
                                
                                {/* Category Selector Dropdown */}
                                {showCategorySelector && editingItemId === item.id && (
                                  <div className="absolute left-0 top-full mt-1 z-[99999] bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-300/50 dark:border-gray-600/50 rounded-xl shadow-2xl shadow-primary-500/20 min-w-[150px]">
                                    <div className="py-1">
                                      {availableCategories.map((category) => (
                                        <button
                                          key={category.id}
                                          onClick={() => updateLineItemCategory(item.id, category.id)}
                                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                        >
                                          <span>{category.icon}</span>
                                          <span className="text-gray-900 dark:text-white">{category.name}</span>
                                        </button>
                                      ))}
                                    </div>
                                    <button
                                      onClick={() => {
                                        setEditingItemId(null);
                                        setShowCategorySelector(false);
                                      }}
                                      className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-t border-gray-200 dark:border-gray-600"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                            {getCurrencySymbol(stats.currency)}{item.price?.toFixed(2) || '0.00'}
                          </div>
                          {item.quantity && item.quantity > 1 && (
                            <div className="text-xs sm:text-sm text-gray-500">Qty: {item.quantity}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No items found. Upload receipts to see your purchases.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Healthy Items Modal */}
      {showHealthyItemsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl shadow-green-500/20 border border-gray-200/50 dark:border-gray-700/50">
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl border-b border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 flex justify-between items-center z-10 flex-shrink-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  🥗 Healthy Items
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {healthyItems.length} healthy purchases
                </p>
              </div>
              <button
                onClick={() => setShowHealthyItemsModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {healthyItems.length > 0 ? (
                <div className="space-y-2 overflow-visible">
                  {healthyItems.map((item, index) => {
                    const categoryStyle = getCategoryStyles(item.category);
                    return (
                    <div key={index} className={`flex justify-between items-center p-2 sm:p-3 ${categoryStyle.bg} backdrop-blur-sm rounded-xl gap-2 hover:shadow-md ${categoryStyle.glow} transition-all border ${categoryStyle.border} ${showCategorySelector && editingItemId === item.id ? 'relative z-[100000]' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base block truncate">{item.description || item.name}</span>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                          {item.vendor && <span className="font-medium">{item.vendor}</span>}
                          {item.date && <span>•</span>}
                          {item.date && <span>{new Date(item.date).toLocaleDateString()}</span>}
                          {item.category && <span>•</span>}
                          {item.category && (
                            <div className="relative inline-block category-selector-container">
                              <button
                                onClick={() => {
                                  setEditingItemId(item.id);
                                  setShowCategorySelector(true);
                                }}
                                className={`px-2 py-0.5 ${categoryStyle.badge} rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity`}
                                title="Click to change category"
                              >
                                {item.category} ✏️
                              </button>
                              
                              {/* Category Selector Dropdown */}
                              {showCategorySelector && editingItemId === item.id && (
                                <div className="absolute left-0 top-full mt-1 z-[99999] bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-300/50 dark:border-gray-600/50 rounded-xl shadow-2xl shadow-primary-500/20 min-w-[150px]">
                                  <div className="py-1">
                                    {availableCategories.map((category) => (
                                      <button
                                        key={category.id}
                                        onClick={() => updateLineItemCategory(item.id, category.id)}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                      >
                                        <span>{category.icon}</span>
                                        <span className="text-gray-900 dark:text-white">{category.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setEditingItemId(null);
                                      setShowCategorySelector(false);
                                    }}
                                    className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-t border-gray-200 dark:border-gray-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
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
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No healthy items found. Keep making great choices! 💪
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Junk Items Modal */}
      {showJunkItemsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl shadow-red-500/20 border border-gray-200/50 dark:border-gray-700/50">
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl border-b border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 flex justify-between items-center z-10 flex-shrink-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                  🍔 Junk Items
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {junkItems.length} unhealthy purchases
                </p>
              </div>
              <button
                onClick={() => setShowJunkItemsModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {junkItems.length > 0 ? (
                <div className="space-y-2 overflow-visible">
                  {junkItems.map((item, index) => {
                    const categoryStyle = getCategoryStyles(item.category);
                    return (
                    <div key={index} className={`flex justify-between items-center p-2 sm:p-3 ${categoryStyle.bg} backdrop-blur-sm rounded-xl gap-2 hover:shadow-md ${categoryStyle.glow} transition-all border ${categoryStyle.border} ${showCategorySelector && editingItemId === item.id ? 'relative z-[100000]' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base block truncate">{item.description || item.name}</span>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                          {item.vendor && <span className="font-medium">{item.vendor}</span>}
                          {item.date && <span>•</span>}
                          {item.date && <span>{new Date(item.date).toLocaleDateString()}</span>}
                          {item.category && <span>•</span>}
                          {item.category && (
                            <div className="relative inline-block category-selector-container">
                              <button
                                onClick={() => {
                                  setEditingItemId(item.id);
                                  setShowCategorySelector(true);
                                }}
                                className={`px-2 py-0.5 ${categoryStyle.badge} rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity`}
                                title="Click to change category"
                              >
                                {item.category} ✏️
                              </button>
                              
                              {/* Category Selector Dropdown */}
                              {showCategorySelector && editingItemId === item.id && (
                                <div className="absolute left-0 top-full mt-1 z-[99999] bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-300/50 dark:border-gray-600/50 rounded-xl shadow-2xl shadow-primary-500/20 min-w-[150px]">
                                  <div className="py-1">
                                    {availableCategories.map((category) => (
                                      <button
                                        key={category.id}
                                        onClick={() => updateLineItemCategory(item.id, category.id)}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                      >
                                        <span>{category.icon}</span>
                                        <span className="text-gray-900 dark:text-white">{category.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setEditingItemId(null);
                                      setShowCategorySelector(false);
                                    }}
                                    className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-t border-gray-200 dark:border-gray-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
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
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No junk items found. Excellent healthy choices! 🎉
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Items Modal */}
      {showCategoryModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl shadow-primary-500/20 border border-gray-200/50 dark:border-gray-700/50">
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl border-b border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 flex justify-between items-center z-10 flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {selectedCategory} Items
              </h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {categoryItems.length > 0 ? (
                <div className="space-y-2 overflow-visible">
                  {categoryItems.map((item, index) => {
                    const categoryStyle = getCategoryStyles(item.category);
                    return (
                      <div key={index} className={`flex justify-between items-center p-2 sm:p-3 ${categoryStyle.bg} backdrop-blur-sm rounded-xl gap-2 hover:shadow-md ${categoryStyle.glow} transition-all border ${categoryStyle.border} ${showCategorySelector && editingItemId === item.id ? 'relative z-[100000]' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base block truncate">{item.description || item.name}</span>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                            {item.vendor && <span className="font-medium">{item.vendor}</span>}
                            {item.date && <span>•</span>}
                            {item.date && <span>{new Date(item.date).toLocaleDateString()}</span>}
                            {item.category && <span>•</span>}
                            {item.category && (
                              <div className="relative inline-block category-selector-container">
                                <button
                                  onClick={() => {
                                    setEditingItemId(item.id);
                                    setShowCategorySelector(true);
                                  }}
                                  className={`px-2 py-0.5 ${categoryStyle.badge} rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity`}
                                  title="Click to change category"
                                >
                                  {item.category} ✏️
                                </button>
                                
                                {/* Category Selector Dropdown */}
                                {showCategorySelector && editingItemId === item.id && (
                                  <div className="absolute left-0 top-full mt-1 z-[99999] bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-300/50 dark:border-gray-600/50 rounded-xl shadow-2xl shadow-primary-500/20 min-w-[150px]">
                                    <div className="py-1">
                                      {availableCategories.map((category) => (
                                        <button
                                          key={category.id}
                                          onClick={() => updateLineItemCategory(item.id, category.id)}
                                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                        >
                                          <span>{category.icon}</span>
                                          <span className="text-gray-900 dark:text-white">{category.name}</span>
                                        </button>
                                      ))}
                                    </div>
                                    <button
                                      onClick={() => {
                                        setEditingItemId(null);
                                        setShowCategorySelector(false);
                                      }}
                                      className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-t border-gray-200 dark:border-gray-600"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
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
                    );
                  })}
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
