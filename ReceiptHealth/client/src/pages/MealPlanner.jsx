import { Calendar, Plus, ChefHat } from 'lucide-react';

function MealPlanner() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meal Planner</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Plan your meals for the week
          </p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Generate Plan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {days.map(day => (
          <div key={day} className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{day}</h3>
            </div>
            
            <div className="space-y-3">
              {['Breakfast', 'Lunch', 'Dinner'].map(meal => (
                <div key={meal} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ChefHat className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{meal}</span>
                    </div>
                    <Plus className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MealPlanner;
