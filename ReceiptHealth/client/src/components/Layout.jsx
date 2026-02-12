import { useState } from 'react';
import { Menu, Bell, Search, User, X, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

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

  const notifications = [
    { id: 1, text: 'New receipt processed', time: '5m ago', unread: true },
    { id: 2, text: 'Health score improved by 5%', time: '1h ago', unread: true },
    { id: 3, text: 'Weekly meal plan ready', time: '2h ago', unread: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main content */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-4">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* Search bar */}
              <form onSubmit={handleSearch} className="hidden md:flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 w-96">
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
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                  className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Bell className="w-6 h-6" />
                  {notifications.some(n => n.unread) && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                            notif.unread ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <p className="text-sm text-gray-900 dark:text-white">{notif.text}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notif.time}</p>
                        </div>
                      ))}
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
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <span className="hidden md:block font-medium">User</span>
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-semibold text-gray-900 dark:text-white">User Account</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">user@example.com</p>
                    </div>
                    <div className="py-2">
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
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

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 px-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <p>© 2026 ReceiptHealth - Track your spending, stay healthy</p>
            <div className="flex space-x-4 mt-2 md:mt-0">
              <a href="#" className="hover:text-primary-500 transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary-500 transition-colors">Terms</a>
              <a href="#" className="hover:text-primary-500 transition-colors">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Layout;
