import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  ShoppingCart, 
  UtensilsCrossed, 
  TrendingUp, 
  Trophy, 
  Sparkles,
  Tag,
  Moon,
  Sun,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft
} from 'lucide-react';
import { useState, useEffect } from 'react';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { 
    path: '/receipts', 
    icon: Receipt, 
    label: 'Receipts',
    subItems: [
      { path: '/receipts/categories', icon: Tag, label: 'Categories' }
    ]
  },
  { path: '/shopping-lists', icon: ShoppingCart, label: 'Shopping Lists' },
  { path: '/meal-planner', icon: UtensilsCrossed, label: 'Meal Planner' },
  { path: '/insights', icon: TrendingUp, label: 'Insights' },
  { path: '/achievements', icon: Trophy, label: 'Achievements' },
  { path: '/voice-assistant', icon: Sparkles, label: 'AI Assistant' },
];

function Sidebar({ isOpen, toggleSidebar, isCollapsed, setIsCollapsed }) {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    const storedTheme = localStorage.getItem('darkMode');
    const isDark = storedTheme !== null ? storedTheme === 'true' : true; // Default to dark mode
    setDarkMode(isDark);
    localStorage.setItem('darkMode', isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Auto-expand parent menu if on sub-page
    menuItems.forEach(item => {
      if (item.subItems) {
        const isSubItemActive = item.subItems.some(sub => location.pathname === sub.path);
        if (isSubItemActive) {
          setExpandedItems(prev => ({ ...prev, [item.path]: true }));
        }
      }
    });
  }, [location.pathname]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-xl z-50 
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Header */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-6 border-b border-gray-200 dark:border-gray-700`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/logo.svg" alt="Sanitas Mind" className="w-10 h-10" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                Sanitas Mind
              </h1>
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/logo.svg" alt="Sanitas Mind" className="w-10 h-10" />
            </div>
          )}
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          {/* Desktop collapse button */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedItems[item.path] && !isCollapsed;
            const isSubItemActive = hasSubItems && item.subItems.some(sub => location.pathname === sub.path);
            
            return (
              <div key={item.path}>
                <div className="relative">
                  <Link
                    to={item.path}
                    className={`
                      flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-all duration-200
                      ${isActive || isSubItemActive
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                    onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon className={`w-5 h-5 ${isActive || isSubItemActive ? 'text-white' : ''} ${isCollapsed ? '' : ''}`} />
                    {!isCollapsed && <span className="font-medium flex-1">{item.label}</span>}
                  </Link>
                  {hasSubItems && !isCollapsed && (
                    <button
                      onClick={() => setExpandedItems(prev => ({ ...prev, [item.path]: !prev[item.path] }))}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/20 transition-colors
                        ${isActive || isSubItemActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}
                      `}
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                
                {/* Sub-items */}
                {hasSubItems && isExpanded && !isCollapsed && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.subItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = location.pathname === subItem.path;
                      
                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`
                            flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200
                            ${isSubActive
                              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }
                          `}
                          onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                        >
                          <SubIcon className="w-4 h-4" />
                          <span className="text-sm">{subItem.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer with dark mode toggle */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={toggleDarkMode}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-center space-x-2'} px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200`}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? (
              <>
                <Sun className="w-5 h-5" />
                {!isCollapsed && <span className="font-medium">Light Mode</span>}
              </>
            ) : (
              <>
                <Moon className="w-5 h-5" />
                {!isCollapsed && <span className="font-medium">Dark Mode</span>}
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
