import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Bell, Globe, Palette, Download, Upload, Info, Save, Check, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  // Profile settings
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : {
      name: 'User',
      email: 'user@example.com',
      currency: 'USD'
    };
  });

  // Theme settings
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark'; // Default to dark
  });

  // Notification settings
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notificationSettings');
    return saved ? JSON.parse(saved) : {
      receiptUploads: true,
      achievements: true,
      weeklyReports: true,
      priceAlerts: true,
      categoryWarnings: true
    };
  });

  // Language settings
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '中文' }
  ];

  const themes = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' }
  ];

  const handleSaveProfile = () => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
    toast.success('Profile updated successfully');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    toast.success(`Theme changed to ${newTheme}`);
  };

  const handleNotificationChange = (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem('notificationSettings', JSON.stringify(updated));
    toast.success('Notification preferences updated');
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    toast.success('Language preference updated');
  };

  const handleExportData = () => {
    try {
      const data = {
        profile,
        theme,
        notifications,
        language,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sanitasmind-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Settings exported successfully');
    } catch (error) {
      toast.error('Failed to export settings');
    }
  };

  const handleImportData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (data.profile) {
          setProfile(data.profile);
          localStorage.setItem('userProfile', JSON.stringify(data.profile));
        }
        if (data.theme) {
          handleThemeChange(data.theme);
        }
        if (data.notifications) {
          setNotifications(data.notifications);
          localStorage.setItem('notificationSettings', JSON.stringify(data.notifications));
        }
        if (data.language) {
          setLanguage(data.language);
          localStorage.setItem('language', data.language);
        }
        
        toast.success('Settings imported successfully');
      } catch (error) {
        toast.error('Invalid settings file');
      }
    };
    reader.readAsText(file);
  };

  const handleExportAllData = async () => {
    const loadingToast = toast.loading('Exporting all data...');
    try {
      // Fetch all data from backend
      const [receiptsRes, shoppingListsRes, mealPlansRes, achievementsRes] = await Promise.all([
        axios.get('/api/receipts').catch(() => ({ data: [] })),
        axios.get('/api/shopping-lists').catch(() => ({ data: [] })),
        axios.get('/api/meal-plans').catch(() => ({ data: [] })),
        axios.get('/api/achievements').catch(() => ({ data: [] }))
      ]);

      const fullData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        settings: {
          profile,
          theme,
          notifications,
          language
        },
        data: {
          receipts: receiptsRes.data,
          shoppingLists: shoppingListsRes.data,
          mealPlans: mealPlansRes.data,
          achievements: achievementsRes.data
        }
      };

      const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sanitasmind-fulldata-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success('All data exported successfully');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to export data');
      console.error('Export error:', error);
    }
  };

  const handleImportAllData = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('This will replace ALL your existing data. Are you sure you want to continue?')) {
      event.target.value = ''; // Reset file input
      return;
    }

    const loadingToast = toast.loading('Importing all data...');
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const fullData = JSON.parse(e.target.result);
        
        // Import settings first
        if (fullData.settings) {
          if (fullData.settings.profile) {
            setProfile(fullData.settings.profile);
            localStorage.setItem('userProfile', JSON.stringify(fullData.settings.profile));
          }
          if (fullData.settings.theme) {
            handleThemeChange(fullData.settings.theme);
          }
          if (fullData.settings.notifications) {
            setNotifications(fullData.settings.notifications);
            localStorage.setItem('notificationSettings', JSON.stringify(fullData.settings.notifications));
          }
          if (fullData.settings.language) {
            setLanguage(fullData.settings.language);
            localStorage.setItem('language', fullData.settings.language);
          }
        }

        // Import application data
        if (fullData.data) {
          let importedCount = 0;
          
          // Import receipts
          if (fullData.data.receipts && fullData.data.receipts.length > 0) {
            for (const receipt of fullData.data.receipts) {
              try {
                // Remove id to let backend assign new ones
                const { id, ...receiptData } = receipt;
                await axios.post('/api/receipts', receiptData);
                importedCount++;
              } catch (err) {
                console.error('Failed to import receipt:', err);
              }
            }
          }

          // Import shopping lists
          if (fullData.data.shoppingLists && fullData.data.shoppingLists.length > 0) {
            for (const list of fullData.data.shoppingLists) {
              try {
                const { id, ...listData } = list;
                await axios.post('/api/shopping-lists', listData);
                importedCount++;
              } catch (err) {
                console.error('Failed to import shopping list:', err);
              }
            }
          }

          // Import meal plans
          if (fullData.data.mealPlans && fullData.data.mealPlans.length > 0) {
            for (const plan of fullData.data.mealPlans) {
              try {
                const { id, ...planData } = plan;
                await axios.post('/api/meal-plans', planData);
                importedCount++;
              } catch (err) {
                console.error('Failed to import meal plan:', err);
              }
            }
          }

          toast.dismiss(loadingToast);
          toast.success(`Successfully imported ${importedCount} items!`);
          
          // Reload page after 2 seconds to refresh all data
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          toast.dismiss(loadingToast);
          toast.success('Settings imported successfully');
        }
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error('Invalid data file or import failed');
        console.error('Import error:', error);
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'language', label: 'Language & Region', icon: Globe },
    { id: 'data', label: 'Data', icon: Download },
    { id: 'about', label: 'About', icon: Info }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8 text-primary-500" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Manage your preferences and account settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="card space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === tab.id
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="card">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Profile Information
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Update your personal information and preferences
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="input"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="input"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Default Currency
                    </label>
                    <select
                      value={profile.currency}
                      onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                      className="input"
                    >
                      {currencies.map((currency) => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    className="btn-primary flex items-center gap-2"
                  >
                    {saved ? (
                      <>
                        <Check className="w-5 h-5" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Appearance
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Customize how Sanitas Mind looks on your device
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {themes.map((themeOption) => (
                      <button
                        key={themeOption.value}
                        onClick={() => handleThemeChange(themeOption.value)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          theme === themeOption.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                        }`}
                      >
                        <div className="text-3xl mb-2">{themeOption.icon}</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {themeOption.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Notification Preferences
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Choose what notifications you want to receive
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'receiptUploads', label: 'Receipt Uploads', description: 'Get notified when receipts are uploaded and processed' },
                    { key: 'achievements', label: 'Achievements', description: 'Celebrate when you unlock new achievements' },
                    { key: 'weeklyReports', label: 'Weekly Reports', description: 'Receive weekly spending summaries' },
                    { key: 'priceAlerts', label: 'Price Alerts', description: 'Get alerts when prices change significantly' },
                    { key: 'categoryWarnings', label: 'Category Warnings', description: 'Warnings when spending exceeds category goals' }
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {item.label}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {item.description}
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={notifications[item.key]}
                          onChange={() => handleNotificationChange(item.key)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Language & Region Tab */}
            {activeTab === 'language' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Language & Region
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Set your preferred language and regional settings
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Language
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          language === lang.code
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {lang.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {lang.code.toUpperCase()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Data Tab */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Data Management
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Export or import your data and settings
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Full Data Export/Import */}
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Database className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                          Export All Data
                        </h3>
                        <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                          Download ALL your data including receipts, shopping lists, meal plans, and settings. Perfect for sharing with others or creating a complete backup.
                        </p>
                        <button
                          onClick={handleExportAllData}
                          className="btn-primary text-sm flex items-center gap-2"
                        >
                          <Database className="w-4 h-4" />
                          Export All Data
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Upload className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-orange-900 dark:text-orange-100 mb-1">
                          Import All Data
                        </h3>
                        <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">
                          Import a complete data export. This will ADD all receipts, shopping lists, and meal plans to your existing data.
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-3">
                          ⚠️ Warning: This will import all data from the file. You'll be asked to confirm before proceeding.
                        </p>
                        <label className="btn-primary text-sm flex items-center gap-2 cursor-pointer inline-flex">
                          <Upload className="w-4 h-4" />
                          Import All Data
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleImportAllData}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Settings Only Export/Import */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Settings Only (No Data)
                    </h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                              Export Settings
                            </h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                              Download only your preferences (profile, theme, notifications) without any receipts or data.
                            </p>
                            <button
                              onClick={handleExportData}
                              className="btn-secondary text-sm flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Export Settings Only
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Upload className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-medium text-green-900 dark:text-green-100 mb-1">
                              Import Settings
                            </h3>
                            <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                              Import settings from a previously exported file. This will update your preferences only.
                            </p>
                            <label className="btn-secondary text-sm flex items-center gap-2 cursor-pointer inline-flex">
                              <Upload className="w-4 h-4" />
                              Import Settings Only
                              <input
                                type="file"
                                accept=".json"
                                onChange={handleImportData}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    About Sanitas Mind
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="text-center py-8">
                    <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <img src="/logo.svg" alt="Sanitas Mind" className="w-20 h-20" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Sanitas Mind
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">
                      Version 1.0.0
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Track your spending, stay healthy
                    </p>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary-500">2026</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Year</div>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary-500">React</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Built with</div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6 text-sm text-gray-600 dark:text-gray-400">
                    <p className="mb-4">
                      Sanitas Mind helps you track your spending habits and make healthier choices.
                      Upload receipts, analyze your purchases, and get AI-powered insights.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a href="/docs" className="text-primary-500 hover:text-primary-600">Documentation</a>
                      <span>•</span>
                      <a href="/privacy" className="text-primary-500 hover:text-primary-600">Privacy Policy</a>
                      <span>•</span>
                      <a href="/terms" className="text-primary-500 hover:text-primary-600">Terms of Service</a>
                      <span>•</span>
                      <a href="/support" className="text-primary-500 hover:text-primary-600">Support</a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
