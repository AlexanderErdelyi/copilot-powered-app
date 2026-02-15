import { useState, useEffect } from 'react';
import { Menu, Bell, Search, User, X, Settings, LogOut, Mic, MicOff, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import Sidebar from './Sidebar';
import Footer from './Footer';
import GlobalVoiceAssistant from './GlobalVoiceAssistant';
import WakeWordListener from './WakeWordListener';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [listeningMode, setListeningMode] = useState(() => {
    // Always start disabled on page load/refresh
    return 'disabled';
  });
  const [activities, setActivities] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : { name: 'User', email: 'user@example.com' };
  });
  const navigate = useNavigate();

  // Reset to disabled on mount (page load/refresh)
  useEffect(() => {
    localStorage.setItem('listeningMode', 'disabled');
    console.log('🔄 Page loaded - All listening disabled');
    fetchActivities();
    fetchUnreadCount();
  }, []); // Empty dependency array = runs once on mount

  // Persist listening mode state
  useEffect(() => {
    localStorage.setItem('listeningMode', listeningMode);
    const modeLabels = {
      disabled: 'DISABLED',
      wakeWord: 'WAKE WORD (Yellow)',
      aiAssistant: 'AI ASSISTANT (Green)'
    };
    console.log('🔊 Listening mode:', modeLabels[listeningMode]);
  }, [listeningMode]);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notifications-dropdown') && !event.target.closest('.notification-bell')) {
        setShowNotifications(false);
      }
      if (showUserMenu && !event.target.closest('.user-menu-dropdown') && !event.target.closest('.user-menu-button')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showUserMenu]);

  // Refresh activities when notifications dropdown is opened
  useEffect(() => {
    if (showNotifications) {
      fetchActivities();
      fetchUnreadCount();
    }
  }, [showNotifications]);

  // Poll for new activities every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Listen for profile changes from Settings page
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('userProfile');
      if (saved) {
        setUserProfile(JSON.parse(saved));
      }
    };

    // Listen for storage events (changes from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);

    // Also check localStorage periodically in case same-tab changes don't trigger storage event
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const cycleListeningMode = () => {
    setListeningMode(prev => {
      if (prev === 'disabled') {
        toast.success('Wake word listening enabled', { icon: '🟡' });
        return 'wakeWord';
      }
      if (prev === 'wakeWord') {
        toast.success('Global AI Assistant activated!', { icon: '🟢', duration: 3000 });
        return 'aiAssistant';
      }
      // aiAssistant → disabled
      toast('All listening disabled', { icon: '⚪' });
      return 'disabled';
    });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to receipts with search query
      navigate(`/receipts?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await axios.get('/api/activities?limit=20');
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/api/activities/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  };

  const handleActivityClick = (activity) => {
    if (activity.navigateUrl) {
      markActivityAsRead(activity.id);
      navigate(activity.navigateUrl);
      setShowNotifications(false);
    }
  };

  const markActivityAsRead = async (activityId) => {
    try {
      await axios.put(`/api/activities/${activityId}/read`);
      await fetchActivities();
      await fetchUnreadCount();
    } catch (error) {
      console.error('Error marking activity as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/activities/read-all');
      await fetchActivities();
      await fetchUnreadCount();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleDeleteActivity = async (activityId, event) => {
    event.stopPropagation();
    try {
      await axios.delete(`/api/activities/${activityId}`);
      await fetchActivities();
      await fetchUnreadCount();
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleDeleteAllActivities = async () => {
    try {
      await axios.delete('/api/activities');
      await fetchActivities();
      await fetchUnreadCount();
      setShowNotifications(false);
      toast.success('All notifications deleted');
    } catch (error) {
      console.error('Error deleting all activities:', error);
      toast.error('Failed to delete all notifications');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />
      
      {/* Main content with futuristic effects */}
      <div className={`${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} min-h-screen flex flex-col transition-all duration-500 ease-out relative`}>
        {/* Subtle gradient overlay for depth */}
        <div className="fixed inset-0 pointer-events-none bg-gradient-to-br from-primary-500/[0.02] via-transparent to-secondary-500/[0.02] dark:from-primary-500/[0.03] dark:to-secondary-500/[0.03]" />
        
        {/* Top bar with glassmorphism */}
        <header className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 sticky top-0 z-30 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between px-2 sm:px-4 py-3 sm:py-4">
            {/* Left side */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* Search bar with glow effect */}
              <form onSubmit={handleSearch} className="hidden sm:flex items-center bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl px-3 py-2 flex-1 max-w-md border border-gray-200/50 dark:border-gray-600/50 focus-within:border-primary-500/50 focus-within:shadow-lg focus-within:shadow-primary-500/10 transition-all duration-300">
                <Search className="w-5 h-5 text-gray-400 mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search receipts, items, categories..."
                  className="bg-transparent border-none outline-none w-full text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
              {/* Listening Mode Toggle (3 states) */}
              <div className="relative">
                <button 
                  onClick={cycleListeningMode}
                  className={`relative p-1.5 sm:p-2 rounded-lg transition-all ${
                    listeningMode === 'aiAssistant'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                      : listeningMode === 'wakeWord'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title={
                    listeningMode === 'aiAssistant'
                      ? 'AI Assistant Active (Green) - Hands-free mode across all pages - Click to disable'
                      : listeningMode === 'wakeWord'
                      ? 'Wake Word Listening (Yellow) - Say "Hey Sanitas Mind" to activate - Click to enable AI Assistant'
                      : 'All Listening Disabled (Gray) - Click to enable wake word mode'
                  }
                >
                  {listeningMode === 'disabled' ? (
                    <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <>
                      <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className={`absolute top-0 right-0 w-2 h-2 rounded-full animate-pulse ${
                        listeningMode === 'aiAssistant' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                  className="notification-bell relative p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="notifications-dropdown absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h3>
                      <div className="flex gap-2 items-center">
                        {activities.length > 0 && (
                          <>
                            <button
                              onClick={markAllAsRead}
                              className={`text-xs font-medium px-3 py-1 rounded ${
                                unreadCount > 0 
                                  ? 'text-primary-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20' 
                                  : 'text-gray-400 cursor-default'
                              }`}
                              disabled={unreadCount === 0}
                            >
                              Mark all read
                            </button>
                            <button
                              onClick={handleDeleteAllActivities}
                              className="text-xs font-medium px-3 py-1 rounded text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Delete all notifications"
                            >
                              Delete all
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-2">
                      {activities.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {activities.map((activity) => (
                            <div
                              key={activity.id}
                              onClick={() => handleActivityClick(activity)}
                              className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                                activity.isRead
                                  ? 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                                  : 'bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800'
                              } ${!activity.isSuccess ? 'border-l-4 border-red-500' : ''}`}
                            >
                              <div className="flex items-start gap-2">
                                <div className="text-xl flex-shrink-0 mt-0.5">{activity.icon}</div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${
                                    activity.isRead ? 'text-gray-900 dark:text-white' : 'text-blue-900 dark:text-blue-100 font-semibold'
                                  }`}>
                                    {activity.description}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {new Date(activity.timestamp).toLocaleString()}
                                  </p>
                                  {!activity.isSuccess && activity.errorMessage && (
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                      {activity.errorMessage}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {!activity.isRead && (
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                  )}
                                  <button
                                    onClick={(e) => handleDeleteActivity(activity.id, e)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-opacity p-1"
                                    title="Delete notification"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* User menu */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  className="user-menu-button flex items-center space-x-1 sm:space-x-2 p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <span className="hidden lg:block font-medium text-sm">{userProfile.name}</span>
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div className="user-menu-dropdown absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-semibold text-gray-900 dark:text-white truncate" title={userProfile.name}>{userProfile.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={userProfile.email}>{userProfile.email}</p>
                    </div>
                    <div className="py-2">
                      <button 
                        onClick={() => {
                          navigate('/settings');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content with futuristic container */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 relative z-10">
          <div className="max-w-[1920px] mx-auto">
            {children}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
      
      {/* Global Voice Components */}
      <WakeWordListener />
      <GlobalVoiceAssistant />
    </div>
  );
}

export default Layout;
