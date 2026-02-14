import { Calendar, Plus, ChefHat, Loader2, X, ShoppingCart, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

function MealPlanner() {
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [expandedPlans, setExpandedPlans] = useState({});
  const [useNaturalLanguage, setUseNaturalLanguage] = useState(false);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [checkedSteps, setCheckedSteps] = useState({});
  const [addingToShoppingList, setAddingToShoppingList] = useState(false);
  const [viewMode, setViewMode] = useState('weekly');
  const [showSingleMealModal, setShowSingleMealModal] = useState(false);
  const [selectedMealSlot, setSelectedMealSlot] = useState({ day: '', mealType: '' });
  const [generatingSingleMeal, setGeneratingSingleMeal] = useState(false);
  const [weeklyMeals, setWeeklyMeals] = useState({});
  const [mealOptions, setMealOptions] = useState({
    dietaryPreference: 'balanced',
    servings: 2,
    days: 7,
    includeBreakfast: true,
    includeLunch: true,
    includeDinner: true
  });
  const [singleMealServings, setSingleMealServings] = useState(2);
  const [useSingleMealNL, setUseSingleMealNL] = useState(false);
  const [singleMealNLInput, setSingleMealNLInput] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, planId: null, planName: '' });
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);
  const [shoppingListAction, setShoppingListAction] = useState({ type: null, data: null });
  const [shoppingLists, setShoppingLists] = useState([]);
  const [loadingShoppingLists, setLoadingShoppingLists] = useState(false);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const dietaryPreferences = [
    { value: 'balanced', label: 'Healthy', icon: '🥗', description: 'Balanced, nutritious meals' },
    { value: 'cheat-day', label: 'Cheat Day', icon: '🍕', description: 'Indulgent comfort food' },
    { value: 'high-protein', label: 'High Protein', icon: '💪', description: 'Protein-packed for workouts' },
    { value: 'low-carb', label: 'Low Carb', icon: '🥑', description: 'Keto-friendly meals' },
    { value: 'vegetarian', label: 'Vegetarian', icon: '🥕', description: 'Plant-based with dairy/eggs' },
    { value: 'vegan', label: 'Vegan', icon: '🌱', description: '100% plant-based' },
    { value: 'keto', label: 'Quick & Easy', icon: '⚡', description: 'Minimal prep time' },
    { value: 'family', label: 'Family Friendly', icon: '👨‍👩‍👧‍👦', description: 'Kid-approved meals' },
  ];
  
  const getDietaryIcon = (preference) => {
    const pref = dietaryPreferences.find(p => p.value === preference?.toLowerCase());
    return pref?.icon || '🍽️';
  };

  // Parse instructions into numbered steps
  const parseInstructions = (instructions) => {
    if (!instructions) return [];
    
    const MIN_STEP_LENGTH = 10; // Minimum characters for a valid step
    
    // Split by common delimiters: newlines, numbered steps, or periods followed by capital letters
    let steps = instructions
      .split(/\n+|\d+\.\s+|(?<=\.)\s+(?=[A-Z])/)
      .map(s => s.trim())
      .filter(s => s.length > MIN_STEP_LENGTH); // Filter out very short fragments
    
    // If no clear steps were found, split by periods as last resort
    if (steps.length <= 1) {
      steps = instructions
        .split(/\.\s+/)
        .map(s => s.trim())
        .filter(s => s.length > MIN_STEP_LENGTH);
    }
    
    return steps;
  };

  // Load cooking progress from localStorage
  useEffect(() => {
    if (selectedRecipe) {
      const savedProgress = localStorage.getItem(`recipe_${selectedRecipe.id}_progress`);
      if (savedProgress) {
        try {
          const { ingredients, steps } = JSON.parse(savedProgress);
          setCheckedIngredients(ingredients || {});
          setCheckedSteps(steps || {});
        } catch (e) {
          console.error('Failed to parse saved progress:', e);
        }
      } else {
        setCheckedIngredients({});
        setCheckedSteps({});
      }
    }
  }, [selectedRecipe]);

  // Delete meal plan
  const deleteMealPlan = (planId, planName) => {
    setDeleteConfirmation({ show: true, planId, planName });
  };

  const confirmDelete = async () => {
    const { planId, planName } = deleteConfirmation;
    setDeleteConfirmation({ show: false, planId: null, planName: '' });
    
    const toastId = toast.loading('Deleting meal plan...');
    
    try {
      await axios.delete(`/api/meal-plans/${planId}`);
      toast.success('Meal plan deleted successfully!', { id: toastId });
      await fetchMealPlans(false);
    } catch (error) {
      console.error('Error deleting meal plan:', error);
      toast.error('Failed to delete meal plan', { id: toastId });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, planId: null, planName: '' });
  };

  // Save cooking progress to localStorage
  const saveCookingProgress = (recipeId, ingredients, steps) => {
    localStorage.setItem(`recipe_${recipeId}_progress`, JSON.stringify({
      ingredients,
      steps,
      lastUpdated: new Date().toISOString()
    }));
  };

  // Toggle ingredient checkbox
  const toggleIngredient = (idx) => {
    const newChecked = { ...checkedIngredients, [idx]: !checkedIngredients[idx] };
    setCheckedIngredients(newChecked);
    saveCookingProgress(selectedRecipe.id, newChecked, checkedSteps);
  };

  // Toggle step checkbox
  const toggleStep = (idx) => {
    const newChecked = { ...checkedSteps, [idx]: !checkedSteps[idx] };
    setCheckedSteps(newChecked);
    saveCookingProgress(selectedRecipe.id, checkedIngredients, newChecked);
  };

  // Fetch shopping lists
  const fetchShoppingLists = async () => {
    try {
      const response = await axios.get('/api/shopping-lists');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching shopping lists:', error);
      return [];
    }
  };

  // Add recipe to shopping list
  const addToShoppingList = async () => {
    if (!selectedRecipe) return;
    
    const toastId = toast.loading('Preparing to add ingredients...');
    
    try {
      const lists = await fetchShoppingLists();
      toast.dismiss(toastId);
      
      if (lists.length > 1) {
        setShoppingLists(lists);
        setShoppingListAction({ type: 'recipe', data: selectedRecipe });
        setShowShoppingListModal(true);
      } else {
        await addRecipeToShoppingList(null, selectedRecipe);
      }
    } catch (error) {
      console.error('Error preparing shopping list:', error);
      toast.error('Failed to prepare shopping list', { id: toastId });
    }
  };
  
  // Add meal plan to shopping list
  const addMealPlanToShoppingList = async (planId, planName) => {
    const toastId = toast.loading('Preparing to create shopping list...');
    
    try {
      const lists = await fetchShoppingLists();
      toast.dismiss(toastId);
      
      if (lists.length > 0) {
        setShoppingLists(lists);
        setShoppingListAction({ type: 'mealPlan', data: { id: planId, name: planName } });
        setShowShoppingListModal(true);
      } else {
        await createShoppingListFromMealPlan(planId, planName, null);
      }
    } catch (error) {
      console.error('Error preparing shopping list:', error);
      toast.error('Failed to prepare shopping list', { id: toastId });
    }
  };
  
  // Execute add recipe to shopping list
  const addRecipeToShoppingList = async (listId, recipe) => {
    const toastId = toast.loading(`Adding ${recipe.name} to shopping list... This may take a moment.`);
    
    try {
      await axios.post('/api/shopping-lists/add-from-recipe', {
        recipeId: recipe.id,
        shoppingListId: listId
      });
      toast.success(`Added ${recipe.name} ingredients to shopping list!`, { id: toastId });
    } catch (error) {
      console.error('Error adding to shopping list:', error);
      toast.error('Failed to add ingredients to shopping list', { id: toastId });
    }
  };
  
  // Execute create shopping list from meal plan
  const createShoppingListFromMealPlan = async (planId, planName, existingListId) => {
    const toastId = toast.loading(`Creating shopping list from ${planName}... This may take some time.`);
    
    try {
      const requestData = existingListId 
        ? { name: planName + ' Shopping List', shoppingListId: existingListId }
        : { name: planName + ' Shopping List' };
      
      await axios.post(`/api/meal-plans/${planId}/shopping-list`, requestData);
      toast.success('Shopping list created successfully!', { id: toastId });
    } catch (error) {
      console.error('Error creating shopping list:', error);
      toast.error('Failed to create shopping list from meal plan', { id: toastId });
    }
  };

  const getRecipeIcon = (recipeName, recipeDescription) => {
    const name = (recipeName + ' ' + (recipeDescription || '')).toLowerCase();
    if (name.includes('chicken') || name.includes('turkey') || name.includes('poultry')) return '🍗';
    if (name.includes('beef') || name.includes('steak') || name.includes('burger')) return '🥩';
    if (name.includes('pork') || name.includes('bacon') || name.includes('ham')) return '🥓';
    if (name.includes('lamb') || name.includes('mutton') || name.includes('kofta')) return '🍖';
    if (name.includes('fish') || name.includes('salmon') || name.includes('tuna') || name.includes('cod') || name.includes('trout')) return '🐟';
    if (name.includes('shrimp') || name.includes('prawn') || name.includes('seafood') || name.includes('lobster')) return '🦐';
    if (name.includes('pasta') || name.includes('spaghetti') || name.includes('noodle')) return '🍝';
    if (name.includes('rice') || name.includes('risotto') || name.includes('paella')) return '🍚';
    if (name.includes('soup') || name.includes('stew') || name.includes('broth')) return '🍲';
    if (name.includes('salad') || name.includes('greens')) return '🥗';
    if (name.includes('burger') || name.includes('sandwich')) return '🍔';
    if (name.includes('taco') || name.includes('burrito') || name.includes('fajita')) return '🌮';
    if (name.includes('pizza')) return '🍕';
    if (name.includes('curry')) return '🍛';
    if (name.includes('egg') || name.includes('omelette')) return '🍳';
    if (name.includes('vegetable') || name.includes('veggie') || name.includes('vegan')) return '🥦';
    return '🍽️';
  };
  
  const togglePlanExpansion = (planId) => {
    setExpandedPlans(prev => ({
      ...prev,
      [planId]: !prev[planId]
    }));
  };
  
  // Fetch meal plans on mount
  useEffect(() => {
    fetchMealPlans();
  }, []);

  const fetchMealPlans = async (autoSwitch = true) => {
    try {
      const response = await axios.get('/api/meal-plans');
      const plans = response.data || [];
      setMealPlans(plans);
      
      // Load meal plan recipes into weekly view
      loadMealPlansIntoWeeklyView(plans);
      
      // Auto-switch to plans view if meal plans exist (only on initial load)
      if (autoSwitch && plans.length > 0) {
        setViewMode('plans');
      }
    } catch (error) {
      console.error('Error fetching meal plans:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadMealPlansIntoWeeklyView = (plans) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mealTypeNames = ['Breakfast', 'Lunch', 'Dinner'];
    
    const updatedWeeklyMeals = {};
    
    // Load all recipes from all meal plans
    plans.forEach(plan => {
      plan.days?.forEach(day => {
        const dayName = dayNames[day.dayOfWeek];
        const mealName = mealTypeNames[day.mealType];
        const mealKey = `${dayName}-${mealName}`;
        
        // Latest meal plan wins if there are duplicates
        updatedWeeklyMeals[mealKey] = {
          ...day.recipe,
          fromMealPlan: true,
          mealPlanId: plan.id,
          mealPlanName: plan.name
        };
      });
    });
    
    setWeeklyMeals(updatedWeeklyMeals);
  };

  const viewRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setShowRecipeModal(true);
  };

  const generateSingleMeal = async (selectedDietaryPref = 'balanced') => {
    setGeneratingSingleMeal(true);
    setShowSingleMealModal(false);
    
    const toastId = toast.loading(`Generating ${selectedMealSlot.mealType} for ${selectedMealSlot.day}... This may take a minute.`);
    
    try {
      const requestData = useSingleMealNL 
        ? {
            dayOfWeek: selectedMealSlot.day,
            mealType: selectedMealSlot.mealType,
            naturalLanguagePrompt: singleMealNLInput,
            servings: singleMealServings
          }
        : {
            dayOfWeek: selectedMealSlot.day,
            mealType: selectedMealSlot.mealType,
            dietaryPreference: selectedDietaryPref,
            servings: singleMealServings
          };
      
      await axios.post('/api/meal-plans/generate-single-meal', requestData);
      
      // Refresh meal plans to show the new meal (don't auto-switch view)
      await fetchMealPlans(false);
      
      // Switch to weekly view to show the generated meal
      setViewMode('weekly');
      
      toast.success(`${selectedMealSlot.mealType} generated!`, { id: toastId });
      
      // Reset single meal states
      setSingleMealServings(2);
      setUseSingleMealNL(false);
      setSingleMealNLInput('');
    } catch (error) {
      console.error('Error generating single meal:', error);
      toast.error('Failed to generate meal', { id: toastId });
    } finally {
      setGeneratingSingleMeal(false);
    }
  };

  const generateMealPlan = async () => {
    setGenerating(true);
    setShowOptionsModal(false); // Close modal immediately
    
    // Show initial toast
    const toastId = toast.loading('Generating meal plan with AI... This may take a minute.');
    
    try {
      let response;
      
      if (useNaturalLanguage && naturalLanguageInput.trim()) {
        // Use natural language generation with day count and meal type settings
        response = await axios.post('/api/meal-plans/generate-nl', {
          userRequest: naturalLanguageInput,
          servings: mealOptions.servings,
          days: mealOptions.days,
          includeBreakfast: mealOptions.includeBreakfast,
          includeLunch: mealOptions.includeLunch,
          includeDinner: mealOptions.includeDinner
        });
      } else {
        // Use predefined dietary preference
        response = await axios.post('/api/meal-plans/generate', mealOptions);
      }
      
      // Success notification
      toast.success((t) => (
        <div className="cursor-pointer" onClick={() => {
          toast.dismiss(t.id);
          fetchMealPlans();
        }}>
          <strong>Meal plan generated!</strong>
          <p className="text-sm">Click to view your new meal plan</p>
        </div>
      ), { id: toastId, duration: 5000 });
      
      // Refresh meal plans (don't auto-switch, already handled above)
      await fetchMealPlans(false);
      
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
      toast.error('Failed to generate meal plan. Please try again.', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Meal Planner</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
            Plan your meals for the week with AI-generated recipes
          </p>
        </div>
        <button 
          onClick={() => setShowOptionsModal(true)}
          disabled={generating}
          className="btn-primary flex items-center justify-center space-x-2 text-sm sm:text-base w-full sm:w-auto"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Generate Plan</span>
            </>
          )}
        </button>
      </div>

      {/* View Mode Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-100 dark:bg-gray-800">
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'weekly'
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Weekly Planner
          </button>
          <button
            onClick={() => setViewMode('plans')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'plans'
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <ChefHat className="w-4 h-4 inline mr-2" />
            Meal Plans
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : viewMode === 'plans' && mealPlans.length > 0 ? (
        <div className="space-y-4 sm:space-y-6">
          {mealPlans.map(plan => {
            const isExpanded = expandedPlans[plan.id];
            const recipeCount = plan.daysCount || plan.days?.length || 0;
            
            return (
              <div key={plan.id} className="card">
                {/* Clickable Header */}
                <div 
                  onClick={() => togglePlanExpansion(plan.id)}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 -m-4 sm:-m-6 p-4 sm:p-6 rounded-t-lg transition-colors mb-4"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      {/* Dietary Icon */}
                      <div className="text-4xl sm:text-5xl flex-shrink-0">
                        {getDietaryIcon(plan.dietaryPreference)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">{plan.name || 'Weekly Meal Plan'}</h2>
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">
                          {plan.startDate && new Date(plan.startDate).toLocaleDateString()} - {plan.endDate && new Date(plan.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {recipeCount} {recipeCount === 1 ? 'recipe' : 'recipes'} • Click to {isExpanded ? 'collapse' : 'expand'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 sm:px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs sm:text-sm font-semibold rounded-full flex-shrink-0">
                        {plan.dietaryPreference || 'Balanced'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addMealPlanToShoppingList(plan.id, plan.name);
                        }}
                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Add to shopping list"
                      >
                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMealPlan(plan.id, plan.name);
                        }}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete meal plan"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <ChefHat className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>
                
                {/* Expandable Recipes Grid */}
                {isExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mt-4">
                {plan.days?.map((day, idx) => {
                  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  const dayName = dayNames[day.dayOfWeek] || dayNames[new Date(day.date).getDay()];
                  const recipeIcon = getRecipeIcon(day.recipe?.name, day.recipe?.description);
                  
                  return (
                  <div 
                    key={day.id || idx} 
                    onClick={async () => {
                      // Fetch full recipe details
                      try {
                        const response = await axios.get(`/api/recipes/${day.recipe.id}`);
                        setSelectedRecipe(response.data);
                        setShowRecipeModal(true);
                      } catch (error) {
                        console.error('Error fetching recipe:', error);
                        toast.error('Failed to load recipe details');
                      }
                    }}
                    className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
                    style={{ boxShadow: '0 0 0 0 rgba(99, 102, 241, 0)' }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 15px 2px rgba(99, 102, 241, 0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 0 0 rgba(99, 102, 241, 0)'}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-primary-500">{dayName}</span>
                      <span className="text-2xl flex-shrink-0">{recipeIcon}</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2" title={day.recipe?.name}>{day.recipe?.name || 'Recipe'}</h4>
                    <p className="text-xs text-gray-500">{new Date(day.date).toLocaleDateString()}</p>
                    <p className="text-xs text-primary-500 mt-2">Click to view recipe</p>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
      ) : viewMode === 'weekly' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {days.map(day => (
            <div key={day} className="card">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">{day}</h3>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                {['Breakfast', 'Lunch', 'Dinner'].map(meal => {
                  const mealKey = `${day}-${meal}`;
                  const hasMeal = weeklyMeals[mealKey];
                  const mealIcon = hasMeal ? getRecipeIcon(hasMeal.name, hasMeal.description) : null;
                  const isFromMealPlan = hasMeal?.fromMealPlan;
                  
                  return (
                  <div 
                    key={meal} 
                    className={`p-2 sm:p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer ${
                      hasMeal 
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-200 dark:border-primary-800' 
                        : 'bg-gray-50 dark:bg-gray-700'
                    }`}
                    onClick={() => {
                      if (hasMeal) {
                        setSelectedRecipe(hasMeal);
                        setShowRecipeModal(true);
                      } else {
                        setSelectedMealSlot({ day, mealType: meal });
                        setShowSingleMealModal(true);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        {hasMeal && mealIcon ? (
                          <span className="text-lg sm:text-xl flex-shrink-0">{mealIcon}</span>
                        ) : (
                          <ChefHat className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <span className={`text-xs sm:text-sm font-medium truncate ${
                          hasMeal ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {hasMeal ? hasMeal.name : meal}
                        </span>
                      </div>
                      {hasMeal ? (
                        <div className="flex items-center gap-1">
                          {isFromMealPlan && (
                            <ChefHat 
                              className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" 
                              title={`From ${hasMeal.mealPlanName || 'Meal Plan'}`}
                            />
                          )}
                          <span className="text-xs text-primary-600 dark:text-primary-400 font-semibold">View</span>
                        </div>
                      ) : (
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Meal Plans Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Generate your first AI-powered meal plan to get started!</p>
          <button 
            onClick={() => setShowOptionsModal(true)}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Generate Plan</span>
          </button>
        </div>
      )}

      {/* Single Meal Generation Modal */}
      {showSingleMealModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSingleMealModal(false);
              setSingleMealServings(2);
              setUseSingleMealNL(false);
              setSingleMealNLInput('');
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Generate {selectedMealSlot.mealType} for {selectedMealSlot.day}
              </h2>
              <button
                onClick={() => {
                  setShowSingleMealModal(false);
                  setSingleMealServings(2);
                  setUseSingleMealNL(false);
                  setSingleMealNLInput('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Servings Selector */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Number of Servings
                </label>
                <div className="flex items-center space-x-3">
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <button
                      key={num}
                      onClick={() => setSingleMealServings(num)}
                      className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                        singleMealServings === num
                          ? 'bg-primary-500 text-white'
                          : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle between Quick Select and AI Powered */}
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <button
                  onClick={() => setUseSingleMealNL(false)}
                  className={`flex-1 px-4 py-2 rounded-md font-semibold transition-colors ${
                    !useSingleMealNL
                      ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  Quick Select
                </button>
                <button
                  onClick={() => setUseSingleMealNL(true)}
                  className={`flex-1 px-4 py-2 rounded-md font-semibold transition-colors ${
                    useSingleMealNL
                      ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  ✨ AI Powered
                </button>
              </div>

              {useSingleMealNL ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Describe what you'd like for {selectedMealSlot.mealType}:
                  </p>
                  <textarea
                    value={singleMealNLInput}
                    onChange={(e) => setSingleMealNLInput(e.target.value)}
                    placeholder={`E.g., "Something quick with chicken and vegetables" or "A hearty ${selectedMealSlot.mealType.toLowerCase()} with pasta"`}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[100px]"
                  />
                  <button
                    onClick={() => generateSingleMeal()}
                    disabled={generatingSingleMeal || !singleMealNLInput.trim()}
                    className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingSingleMeal ? 'Generating...' : `Generate ${selectedMealSlot.mealType}`}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-600 dark:text-gray-400">Choose a dietary preference:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {dietaryPreferences.map(pref => (
                      <button
                        key={pref.value}
                        onClick={() => generateSingleMeal(pref.value)}
                        disabled={generatingSingleMeal}
                        className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="text-3xl mb-2">{pref.icon}</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{pref.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{pref.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Meal Plan Options Modal */}
      {showOptionsModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowOptionsModal(false);
          }}
        >
          <div className="bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 rounded-2xl p-1 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 w-full h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center">
                  <div className="text-3xl sm:text-4xl mr-3">🎯</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {useNaturalLanguage ? 'Describe Your Ideal Meal Plan' : 'Choose Your Dietary Preference'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowOptionsModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Toggle between Quick Select and Natural Language */}
              <div className="flex gap-2 mb-4 sm:mb-6">
                <button
                  onClick={() => setUseNaturalLanguage(false)}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                    !useNaturalLanguage
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Quick Select
                </button>
                <button
                  onClick={() => setUseNaturalLanguage(true)}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                    useNaturalLanguage
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  ✨ AI Powered
                </button>
              </div>

              {useNaturalLanguage ? (
                <div className="mb-6">
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3">
                    Describe what kind of meals you want in natural language:
                  </p>
                  <textarea
                    value={naturalLanguageInput}
                    onChange={(e) => setNaturalLanguageInput(e.target.value)}
                    placeholder="e.g., 'High protein meals with chicken, no dairy, prefer quick Italian recipes' or 'Healthy vegetarian meals with lots of vegetables'"
                    className="w-full p-3 sm:p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    rows="4"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    💡 Tip: Be specific about ingredients, dietary restrictions, cooking style, or cuisine preferences you want.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                    Select a dietary preference to generate a personalized weekly meal plan with recipes under 60 minutes.
                  </p>
              
              {/* Dietary Preference Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
                {dietaryPreferences.map((pref) => (
                  <div
                    key={pref.value}
                    onClick={() => setMealOptions({ ...mealOptions, dietaryPreference: pref.value })}
                    className={`cursor-pointer rounded-xl p-3 sm:p-4 transition-all duration-200 hover:scale-105 ${
                      mealOptions.dietaryPreference === pref.value
                        ? 'bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-xl'
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">{pref.icon}</div>
                      <h3 className={`text-xs sm:text-sm font-bold mb-1 ${
                        mealOptions.dietaryPreference === pref.value
                          ? 'text-white'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {pref.label}
                      </h3>
                      <p className={`text-xs ${
                        mealOptions.dietaryPreference === pref.value
                          ? 'text-white/90'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {pref.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Number of Days */}
              <div className="mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📅 Number of Days
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map(num => (
                    <button
                      key={num}
                      onClick={() => setMealOptions({ ...mealOptions, days: num })}
                      className={`py-2 rounded-lg font-semibold transition-all text-xs sm:text-sm ${
                        mealOptions.days === num
                          ? 'bg-primary-500 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meal Types */}
              <div className="mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🍽️ Meal Types to Include
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'includeBreakfast', label: 'Breakfast', icon: '🌅' },
                    { key: 'includeLunch', label: 'Lunch', icon: '☀️' },
                    { key: 'includeDinner', label: 'Dinner', icon: '🌙' }
                  ].map(meal => (
                    <button
                      key={meal.key}
                      onClick={() => setMealOptions({ ...mealOptions, [meal.key]: !mealOptions[meal.key] })}
                      className={`py-3 px-2 rounded-lg font-semibold transition-all ${
                        mealOptions[meal.key]
                          ? 'bg-primary-500 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="text-xl mb-1">{meal.icon}</div>
                      <div className="text-xs">{meal.label}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  💡 Select at least one meal type
                </p>
              </div>

              {/* Servings */}
              <div className="mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  👥 Number of Servings
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(num => (
                    <button
                      key={num}
                      onClick={() => setMealOptions({ ...mealOptions, servings: num })}
                      className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                        mealOptions.servings === num
                          ? 'bg-primary-500 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {(useNaturalLanguage && naturalLanguageInput.trim()) || (!useNaturalLanguage && (mealOptions.includeBreakfast || mealOptions.includeLunch || mealOptions.includeDinner)) ? (
                <button
                  onClick={generateMealPlan}
                  disabled={generating || (useNaturalLanguage && !naturalLanguageInput.trim()) || (!useNaturalLanguage && !mealOptions.includeBreakfast && !mealOptions.includeLunch && !mealOptions.includeDinner)}
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <span className="mr-2 text-xl">✨</span>
                  {generating ? 'Generating...' : `Generate ${mealOptions.days}-Day Meal Plan`}
                </button>
                ) : (
                <div className="flex-1 text-center text-gray-500 dark:text-gray-400 py-3">
                  Please describe your ideal meal plan above
                </div>
                )}
                {mealPlans.length > 0 && (
                <button
                  onClick={() => setShowOptionsModal(false)}
                  disabled={generating}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  Cancel
                </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Recipe Detail Modal */}
      {showRecipeModal && selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 break-words">
                  {selectedRecipe.name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  {selectedRecipe.servings && (
                    <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full font-semibold">
                      🍽️ {selectedRecipe.servings} servings
                    </span>
                  )}
                  {selectedRecipe.cookingTimeMinutes && (
                    <span className="text-gray-600 dark:text-gray-400">
                      ⏱️ {selectedRecipe.cookingTimeMinutes} min
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRecipeModal(false);
                  setSelectedRecipe(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Description */}
              {selectedRecipe.description && (
                <div>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {selectedRecipe.description}
                  </p>
                </div>
              )}

              {/* Ingredients */}
              {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      🛒 Ingredients
                    </h3>
                    <button
                      onClick={addToShoppingList}
                      className="flex items-center space-x-1 px-2 sm:px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors"
                    >
                      <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Add to List</span>
                    </button>
                  </div>
                  <ul className="space-y-1 sm:space-y-2">
                    {selectedRecipe.ingredients.map((ingredient, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          checked={checkedIngredients[idx] || false}
                          onChange={() => toggleIngredient(idx)}
                          className="mt-1 w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500 cursor-pointer flex-shrink-0"
                        />
                        <span className={`text-sm sm:text-base ${checkedIngredients[idx] ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {typeof ingredient === 'string' ? ingredient : `${ingredient.quantity || ''} ${ingredient.ingredientName}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Instructions */}
              {selectedRecipe.instructions && (
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                    👨‍🍳 Instructions
                  </h3>
                  <ol className="space-y-2 sm:space-y-3">
                    {parseInstructions(selectedRecipe.instructions).map((step, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          checked={checkedSteps[idx] || false}
                          onChange={() => toggleStep(idx)}
                          className="mt-1 w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500 cursor-pointer flex-shrink-0"
                        />
                        <div className="flex-1">
                          <span className="text-xs sm:text-sm font-semibold text-primary-500 mr-2">
                            Step {idx + 1}:
                          </span>
                          <span className={`text-sm sm:text-base ${checkedSteps[idx] ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {step}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Nutrition Info */}
              {(selectedRecipe.calories || selectedRecipe.proteinGrams || selectedRecipe.carbsGrams || selectedRecipe.fatGrams) && (
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                    📊 Nutrition Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {selectedRecipe.calories && (
                      <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                        <div className="text-lg sm:text-2xl font-bold text-primary-500">{selectedRecipe.calories}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Calories</div>
                      </div>
                    )}
                    {selectedRecipe.proteinGrams && (
                      <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                        <div className="text-lg sm:text-2xl font-bold text-primary-500">{selectedRecipe.proteinGrams}g</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Protein</div>
                      </div>
                    )}
                    {selectedRecipe.carbsGrams && (
                      <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                        <div className="text-lg sm:text-2xl font-bold text-primary-500">{selectedRecipe.carbsGrams}g</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Carbs</div>
                      </div>
                    )}
                    {selectedRecipe.fatGrams && (
                      <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                        <div className="text-lg sm:text-2xl font-bold text-primary-500">{selectedRecipe.fatGrams}g</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Fat</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Delete Meal Plan?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-1">
                Are you sure you want to delete
              </p>
              <p className="text-primary-600 dark:text-primary-400 font-semibold text-center mb-4">
                "{deleteConfirmation.planName}"?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 text-center mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shopping List Selection Modal */}
      {showShoppingListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                <ShoppingCart className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Add to Shopping List
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                {shoppingLists.length > 0 
                  ? 'Choose an existing list or create a new one:' 
                  : 'Create a new shopping list:'}
              </p>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4">
                {/* Create New List Option */}
                <button
                  onClick={() => {
                    setShowShoppingListModal(false);
                    if (shoppingListAction.type === 'recipe') {
                      addRecipeToShoppingList(null, shoppingListAction.data);
                    } else if (shoppingListAction.type === 'mealPlan') {
                      createShoppingListFromMealPlan(
                        shoppingListAction.data.id, 
                        shoppingListAction.data.name, 
                        null
                      );
                    }
                  }}
                  className="w-full p-4 border-2 border-dashed border-green-300 dark:border-green-700 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-left"
                >
                  <div className="flex items-center space-x-3">
                    <Plus className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Create New List</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Start a fresh shopping list</div>
                    </div>
                  </div>
                </button>
                
                {/* Existing Lists */}
                {shoppingLists.map(list => (
                  <button
                    key={list.id}
                    onClick={() => {
                      setShowShoppingListModal(false);
                      if (shoppingListAction.type === 'recipe') {
                        addRecipeToShoppingList(list.id, shoppingListAction.data);
                      } else if (shoppingListAction.type === 'mealPlan') {
                        createShoppingListFromMealPlan(
                          shoppingListAction.data.id, 
                          shoppingListAction.data.name, 
                          list.id
                        );
                      }
                    }}
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-white truncate">{list.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {list.itemsCount || 0} items
                          {list.createdAt && ' • ' + new Date(list.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <ChefHat className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                    </div>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowShoppingListModal(false)}
                className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
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
