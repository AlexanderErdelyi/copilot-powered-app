import { Trophy, Star, Award, Target } from 'lucide-react';

function Achievements() {
  const achievements = [
    { id: 1, name: 'First Receipt', description: 'Upload your first receipt', icon: Trophy, earned: true, color: 'text-yellow-500' },
    { id: 2, name: 'Health Warrior', description: '70% healthy items for a month', icon: Star, earned: true, color: 'text-green-500' },
    { id: 3, name: 'Budget Master', description: 'Stay under budget for 3 months', icon: Award, earned: false, color: 'text-blue-500' },
    { id: 4, name: 'Meal Planner', description: 'Create 10 meal plans', icon: Target, earned: false, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Achievements</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Track your progress and unlock badges
        </p>
      </div>

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
    </div>
  );
}

export default Achievements;
