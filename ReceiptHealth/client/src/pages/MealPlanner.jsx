import { Calendar, Plus, ChefHat, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

function MealPlanner() {
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [mealOptions, setMealOptions] = useState({
    dietaryPreference: 'balanced',
    servings: 2,
    includeBreakfast: true,
    includeLunch: true,
    includeDinner: true
  });
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const dietaryPreferences = [
    { value: 'balanced', label: 'Balanced' },
    { value: 'high-protein', label: 'High Protein' },
    { value: 'low-carb', label: 'Low Carb' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'keto', label: 'Keto' },
    { value: 'cheat-day', label: 'Cheat Day' },
  ];
  
  useEffect(() => {
    fetchMealPlans();
  }, []);

  const fetchMealPlans = async () => {
    try {
      const response = await axios.get('/api/meal-plans');
      setMealPlans(response.data || []);
    } catch (error) {
      console.error('Error fetching meal plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMealPlan = async () => {
    setGenerating(true);
    try {
      toast.loading('Generating meal plan with AI...', { id: 'generate' });
      const response = await axios.post('/api/meal-plans/generate', mealOptions);
      toast.success('Meal plan generated!', { id: 'generate' });
      setShowOptionsModal(false);
      fetchMealPlans();
      
      // Track feature usage
      try {
        await axios.post('/api/features/track', { 
          featureName: 'meal_planner',
          details: `Generated ${mealOptions.dietaryPreference} plan for ${mealOptions.servings} servings`
        });
      } catch (trackError) {
        console.error('Feature tracking failed:', trackError);
      }
    } catch (error) {
      console.error('Error generating meal plan:', error);
      toast.error('Failed to generate meal plan', { id: 'generate' });
    } finally {
      setGenerating(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meal Planner</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Plan your meals for the week with AI-generated recipes
          </p>
        </div>
        <button 
          onClick={() => setShowOptionsModal(true)}
          disabled={generating}
          className="btn-primary flex items-center space-x-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              <span>Generate Plan</span>
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : mealPlans.length > 0 ? (
        <div className="space-y-6">
          {mealPlans.map(plan => (
            <div key={plan.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name || 'Weekly Meal Plan'}</h2>
                  <p className="text-sm text-gray-500">
                    {plan.startDate && new Date(plan.startDate).toLocaleDateString()} - {plan.endDate && new Date(plan.endDate).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm font-semibold rounded-full">
                  {plan.dietaryPreference || 'Balanced'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {plan.recipes?.map((recipe, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-primary-500">{recipe.mealType || 'Meal'}</span>
                      <ChefHat className="w-4 h-4 text-gray-400" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{recipe.name}</h4>
                    <p className="text-xs text-gray-500">Day {recipe.dayOfWeek || idx + 1}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
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
      )}

      {/* Meal Plan Options Modal */}
      {showOptionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Meal Plan Options
            </h2>
            
            {/* Dietary Preference */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dietary Preference
              </label>
              <select
                value={mealOptions.dietaryPreference}
                onChange={(e) => setMealOptions({ ...mealOptions, dietaryPreference: e.target.value })}
                className="input"
              >
                {dietaryPreferences.map((pref) => (
                  <option key={pref.value} value={pref.value}>
                    {pref.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Servings */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Servings
              </label>
              <input
                type="number"
                value={mealOptions.servings}
                onChange={(e) => setMealOptions({ ...mealOptions, servings: parseInt(e.target.value) || 1 })}
                min="1"
                max="8"
                className="input"
              />
            </div>

            {/* Meal Types */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Include Meals
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={mealOptions.includeBreakfast}
                    onChange={(e) => setMealOptions({ ...mealOptions, includeBreakfast: e.target.checked })}
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500 mr-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Breakfast</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={mealOptions.includeLunch}
                    onChange={(e) => setMealOptions({ ...mealOptions, includeLunch: e.target.checked })}
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500 mr-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Lunch</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={mealOptions.includeDinner}
                    onChange={(e) => setMealOptions({ ...mealOptions, includeDinner: e.target.checked })}
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500 mr-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Dinner</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={generateMealPlan}
                disabled={generating}
                className="btn-primary flex-1"
              >
                {generating ? 'Generating...' : 'Generate'}
              </button>
              <button
                onClick={() => setShowOptionsModal(false)}
                disabled={generating}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MealPlanner;
