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
      
      {/* Sidebar with futuristic glassmorphism */}
      <aside 
        className={`
          fixed top-0 left-0 h-full z-50 
          bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl
          border-r border-gray-200/50 dark:border-primary-500/20
          shadow-2xl shadow-primary-500/5
          transition-all duration-500 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
        style={{
          boxShadow: isCollapsed 
            ? 'inset -2px 0 8px rgba(124, 58, 237, 0.1)'
            : 'inset -4px 0 16px rgba(124, 58, 237, 0.1), 4px 0 24px rgba(124, 58, 237, 0.05)'
        }}
      >
        {/* Glowing accent line on the right edge */}
        <div className="absolute right-0 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-primary-500/30 to-transparent" />
        
        {/* Header - Clickable brand to toggle collapse */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-6 border-b border-gray-200/30 dark:border-gray-700/30`}>
          {/* Clickable brand section */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              group flex items-center space-x-3 
              hover:scale-105 active:scale-95
              transition-all duration-300 ease-out
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <div className="relative w-10 h-10 flex items-center justify-center">
              {/* Glowing effect behind logo */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
              <img 
                src="/logo.svg" 
                alt="Sanitas Mind" 
                className="w-10 h-10 relative z-10 drop-shadow-lg group-hover:drop-shadow-2xl transition-all duration-300 group-hover:rotate-12" 
              />
            </div>
            {!isCollapsed && (
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-600 bg-clip-text text-transparent group-hover:from-primary-400 group-hover:to-secondary-400 transition-all duration-300">
                Sanitas Mind
              </h1>
            )}
          </button>
          
          {/* Mobile close button */}
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg backdrop-blur-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation with custom scrollbar */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-500/30 scrollbar-track-transparent hover:scrollbar-thumb-primary-500/50">
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
                      relative flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl transition-all duration-300
                      ${isActive || isSubItemActive
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/30' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100/50 hover:to-gray-50/50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/50 backdrop-blur-sm'
                      }
                      group
                    `}
                    onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                    title={isCollapsed ? item.label : ''}
                  >
                    {/* Glowing effect for active item */}
                    {(isActive || isSubItemActive) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl blur-xl opacity-20 -z-10 animate-pulse" />
                    )}
                    <Icon className={`w-5 h-5 ${isActive || isSubItemActive ? 'text-white' : ''} transition-transform duration-300 group-hover:scale-110`} />
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

        {/* Footer with dark mode toggle - futuristic style */}
        <div className="p-4 border-t border-gray-200/30 dark:border-gray-700/30">
          <button
            onClick={toggleDarkMode}
            className={`
              relative group w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-center space-x-2'} 
              px-4 py-3 rounded-xl 
              bg-gradient-to-r from-gray-100/80 to-gray-200/80 dark:from-gray-800/80 dark:to-gray-700/80
              hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600
              backdrop-blur-sm
              transition-all duration-300
              shadow-md hover:shadow-lg
              overflow-hidden
            `}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {/* Animated background gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/10 to-primary-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            
            {darkMode ? (
              <>
                <Sun className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-180 group-hover:scale-110" />
                {!isCollapsed && <span className="font-medium relative z-10">Light Mode</span>}
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
                {!isCollapsed && <span className="font-medium relative z-10">Dark Mode</span>}
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
