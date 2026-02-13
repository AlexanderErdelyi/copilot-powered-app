import { Trophy, Star, Award, Target } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await axios.get('/api/achievements');
      const data = response.data || [];
      
      // Map achievements to UI format
      const mapped = data.map(ach => ({
        id: ach.id,
        name: ach.name,
        description: ach.description,
        icon: getIcon(ach.category),
        earned: ach.isUnlocked,
        color: getColor(ach.category)
      }));
      
      setAchievements(mapped);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      // Fallback to default achievements
      setAchievements([
        { id: 1, name: 'First Receipt', description: 'Upload your first receipt', icon: Trophy, earned: true, color: 'text-yellow-500' },
        { id: 2, name: 'Health Warrior', description: '70% healthy items for a month', icon: Star, earned: true, color: 'text-green-500' },
        { id: 3, name: 'Budget Master', description: 'Stay under budget for 3 months', icon: Award, earned: false, color: 'text-blue-500' },
        { id: 4, name: 'Meal Planner', description: 'Create 10 meal plans', icon: Target, earned: false, color: 'text-purple-500' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'first': return Trophy;
      case 'health': return Star;
      case 'budget': return Award;
      case 'meal': return Target;
      default: return Trophy;
    }
  };

  const getColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'first': return 'text-yellow-500';
      case 'health': return 'text-green-500';
      case 'budget': return 'text-blue-500';
      case 'meal': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Achievements</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Track your progress and unlock badges
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map(achievement => {
            const Icon = achievement.icon;
            return (
              <div 
                key={achievement.id} 
                className={`card ${achievement.earned ? '' : 'opacity-50'}`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-4 rounded-lg ${achievement.earned ? 'bg-gradient-to-br from-primary-500 to-secondary-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    <Icon className={`w-8 h-8 ${achievement.earned ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {achievement.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {achievement.description}
                    </p>
                    {achievement.earned && (
                      <span className="inline-block mt-2 text-xs font-semibold text-green-500">
                        ✓ Earned
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Achievements;
