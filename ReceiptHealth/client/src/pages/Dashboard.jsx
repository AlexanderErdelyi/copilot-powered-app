import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Apple,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
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
    avgPerReceipt: 0
  });
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState([]);
  const [trendData, setTrendData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats from API
      const statsRes = await axios.get('/api/dashboard/stats');
      setStats(statsRes.data);

      // Fetch category breakdown
      const categoryRes = await axios.get('/api/dashboard/category-breakdown');
      setCategoryData(categoryRes.data);

      // Fetch spending trends
      const trendRes = await axios.get('/api/dashboard/spending-trends');
      setTrendData(trendRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set mock data for demo
      setStats({
        totalSpent: 2847.50,
        receiptCount: 42,
        healthyPercentage: 68,
        avgPerReceipt: 67.80
      });
      
      setCategoryData([
        { name: 'Groceries', value: 1250, color: '#10b981' },
        { name: 'Restaurants', value: 680, color: '#f59e0b' },
        { name: 'Entertainment', value: 420, color: '#8b5cf6' },
        { name: 'Health', value: 297, color: '#3b82f6' },
        { name: 'Other', value: 200, color: '#6b7280' }
      ]);
      
      setTrendData([
        { date: 'Jan', amount: 245 },
        { date: 'Feb', amount: 312 },
        { date: 'Mar', amount: 278 },
        { date: 'Apr', amount: 390 },
        { date: 'May', amount: 420 },
        { date: 'Jun', amount: 385 }
      ]);
    } finally {
      setLoading(false);
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back! Here's an overview of your spending habits.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
    </div>
  );
}

export default Dashboard;
