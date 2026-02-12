import { Calendar, Plus, ChefHat, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

function MealPlanner() {
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
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
      const response = await axios.post('/api/meal-plans/generate', {
        dietaryPreference: 'balanced',
        servings: 2,
        includeBreakfast: true,
        includeLunch: true,
        includeDinner: true
      });
      toast.success('Meal plan generated!', { id: 'generate' });
      fetchMealPlans();
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
          onClick={generateMealPlan}
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
                    {plan.startDate && new Date(plan.startDate).toLocaleDateString()} - 
                    {plan.endDate && new Date(plan.endDate).toLocaleDateString()}
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
    </div>
  );
}

export default MealPlanner;
