import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

function Activities() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'success', 'error'

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/activities?limit=100');
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityClick = (activity) => {
    if (activity.navigateUrl) {
      navigate(activity.navigateUrl);
    }
  };

  const handleDeleteActivity = async (activityId, event) => {
    event.stopPropagation();
    try {
      await axios.delete(`/api/activities/${activityId}`);
      setActivities(activities.filter(a => a.id !== activityId));
      toast.success('Activity deleted');
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Failed to delete activity');
    }
  };

  const handleDeleteAllActivities = async () => {
    if (!confirm('Are you sure you want to delete all activities? This action cannot be undone.')) {
      return;
    }
    try {
      await axios.delete('/api/activities');
      setActivities([]);
      toast.success('All activities deleted');
    } catch (error) {
      console.error('Error deleting all activities:', error);
      toast.error('Failed to delete all activities');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('/api/activities/read-all');
      setActivities(activities.map(a => ({ ...a, isRead: true })));
      toast.success('All activities marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const getFilteredActivities = () => {
    switch (filter) {
      case 'unread':
        return activities.filter(a => !a.isRead);
      case 'success':
        return activities.filter(a => a.isSuccess);
      case 'error':
        return activities.filter(a => !a.isSuccess);
      default:
        return activities;
    }
  };

  const filteredActivities = getFilteredActivities();
  const unreadCount = activities.filter(a => !a.isRead).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary-500" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                All Activities
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                Track all your receipt uploads, analyses, and system events
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              Mark All as Read
            </button>
          )}
          {activities.length > 0 && (
            <button
              onClick={handleDeleteAllActivities}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Delete All
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {activities.length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400">Unread</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">{unreadCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400">Success</p>
          <p className="text-2xl font-bold text-green-500 mt-1">
            {activities.filter(a => a.isSuccess).length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400">Errors</p>
          <p className="text-2xl font-bold text-red-500 mt-1">
            {activities.filter(a => !a.isSuccess).length}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'unread', 'success', 'error'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              filter === filterOption
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            {filterOption === 'unread' && unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-white text-primary-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Activities List */}
      <div className="card">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Bell className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No activities found</p>
            <p className="text-sm mt-2">
              {filter !== 'all'
                ? `No ${filter} activities to display`
                : 'Upload a receipt to get started!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group ${
                  !activity.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                } ${!activity.isSuccess ? 'border-l-4 border-red-500' : ''}`}
                onClick={() => handleActivityClick(activity)}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Activity Content */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Icon */}
                    <div className="text-2xl flex-shrink-0 mt-1">
                      {activity.icon}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm sm:text-base font-medium ${
                            activity.isRead
                              ? 'text-gray-900 dark:text-white'
                              : 'text-blue-900 dark:text-blue-100 font-semibold'
                          }`}
                        >
                          {activity.description}
                        </p>
                        {!activity.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        <span>{new Date(activity.timestamp).toLocaleString()}</span>
                        {activity.isSuccess ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>

                      {!activity.isSuccess && activity.errorMessage && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                          {activity.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteActivity(activity.id, e)}
                    className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    title="Delete activity"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Activities;
