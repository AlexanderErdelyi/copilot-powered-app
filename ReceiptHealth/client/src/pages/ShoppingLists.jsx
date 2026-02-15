import { ShoppingCart, Plus, Trash2, Check, X, Leaf } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';

// Common grocery items with categories and icons
const COMMON_ITEMS = [
  // Dairy
  { name: 'Milk', icon: '🥛', category: 'Dairy' },
  { name: 'Cheese', icon: '🧀', category: 'Dairy' },
  { name: 'Yogurt', icon: '🥛', category: 'Dairy' },
  { name: 'Butter', icon: '🧈', category: 'Dairy' },
  { name: 'Cream', icon: '🥛', category: 'Dairy' },
  { name: 'Sour Cream', icon: '🥛', category: 'Dairy' },
  { name: 'Cottage Cheese', icon: '🧀', category: 'Dairy' },
  // Bread & Bakery
  { name: 'Bread', icon: '🍞', category: 'Bakery' },
  { name: 'Bagel', icon: '🥯', category: 'Bakery' },
  { name: 'Toast', icon: '🍞', category: 'Bakery' },
  { name: 'Croissant', icon: '🥐', category: 'Bakery' },
  { name: 'Muffin', icon: '🧁', category: 'Bakery' },
  { name: 'Cake', icon: '🎂', category: 'Bakery' },
  // Protein
  { name: 'Eggs', icon: '🥚', category: 'Protein' },
  { name: 'Chicken', icon: '🍗', category: 'Protein' },
  { name: 'Turkey', icon: '🍗', category: 'Protein' },
  { name: 'Beef', icon: '🥩', category: 'Protein' },
  { name: 'Pork', icon: '🥩', category: 'Protein' },
  { name: 'Fish', icon: '🐟', category: 'Protein' },
  { name: 'Salmon', icon: '🐟', category: 'Protein' },
  { name: 'Tuna', icon: '🐟', category: 'Protein' },
  { name: 'Shrimp', icon: '🦐', category: 'Protein' },
  { name: 'Bacon', icon: '🥓', category: 'Protein' },
  { name: 'Ham', icon: '🥓', category: 'Protein' },
  // Fruits
  { name: 'Apple', icon: '🍎', category: 'Fruit' },
  { name: 'Banana', icon: '🍌', category: 'Fruit' },
  { name: 'Orange', icon: '🍊', category: 'Fruit' },
  { name: 'Grape', icon: '🍇', category: 'Fruit' },
  { name: 'Strawberry', icon: '🍓', category: 'Fruit' },
  { name: 'Blueberry', icon: '🫐', category: 'Fruit' },
  { name: 'Watermelon', icon: '🍉', category: 'Fruit' },
  { name: 'Pineapple', icon: '🍍', category: 'Fruit' },
  { name: 'Mango', icon: '🥭', category: 'Fruit' },
  { name: 'Lemon', icon: '🍋', category: 'Fruit' },
  { name: 'Lime', icon: '🍋', category: 'Fruit' },
  { name: 'Peach', icon: '🍑', category: 'Fruit' },
  { name: 'Pear', icon: '🍐', category: 'Fruit' },
  { name: 'Cherry', icon: '🍒', category: 'Fruit' },
  { name: 'Kiwi', icon: '🥝', category: 'Fruit' },
  { name: 'Avocado', icon: '🥑', category: 'Fruit' },
  // Vegetables
  { name: 'Carrot', icon: '🥕', category: 'Vegetable' },
  { name: 'Broccoli', icon: '🥦', category: 'Vegetable' },
  { name: 'Tomato', icon: '🍅', category: 'Vegetable' },
  { name: 'Lettuce', icon: '🥬', category: 'Vegetable' },
  { name: 'Cucumber', icon: '🥒', category: 'Vegetable' },
  { name: 'Potato', icon: '🥔', category: 'Vegetable' },
  { name: 'Onion', icon: '🧅', category: 'Vegetable' },
  { name: 'Garlic', icon: '🧄', category: 'Vegetable' },
  { name: 'Pepper', icon: '🫑', category: 'Vegetable' },
  { name: 'Spinach', icon: '🥬', category: 'Vegetable' },
  { name: 'Mushroom', icon: '🍄', category: 'Vegetable' },
  { name: 'Corn', icon: '🌽', category: 'Vegetable' },
  { name: 'Eggplant', icon: '🍆', category: 'Vegetable' },
  { name: 'Zucchini', icon: '🥒', category: 'Vegetable' },
  // Pantry
  { name: 'Rice', icon: '🍚', category: 'Pantry' },
  { name: 'Pasta', icon: '🍝', category: 'Pantry' },
  { name: 'Flour', icon: '🌾', category: 'Pantry' },
  { name: 'Sugar', icon: '🍬', category: 'Pantry' },
  { name: 'Salt', icon: '🧂', category: 'Pantry' },
  { name: 'Pepper', icon: '🫑', category: 'Pantry' },
  { name: 'Oil', icon: '🫗', category: 'Pantry' },
  { name: 'Olive Oil', icon: '🫗', category: 'Pantry' },
  { name: 'Vinegar', icon: '🍶', category: 'Pantry' },
  { name: 'Honey', icon: '🍯', category: 'Pantry' },
  { name: 'Peanut Butter', icon: '🥜', category: 'Pantry' },
  { name: 'Jam', icon: '🍓', category: 'Pantry' },
  // Beverages
  { name: 'Water', icon: '💧', category: 'Beverage' },
  { name: 'Juice', icon: '🧃', category: 'Beverage' },
  { name: 'Coffee', icon: '☕', category: 'Beverage' },
  { name: 'Tea', icon: '🍵', category: 'Beverage' },
  { name: 'Soda', icon: '🥤', category: 'Beverage' },
  { name: 'Beer', icon: '🍺', category: 'Beverage' },
  { name: 'Wine', icon: '🍷', category: 'Beverage' },
  // Snacks
  { name: 'Chips', icon: '🥔', category: 'Snack' },
  { name: 'Cookies', icon: '🍪', category: 'Snack' },
  { name: 'Chocolate', icon: '🍫', category: 'Snack' },
  { name: 'Candy', icon: '🍬', category: 'Snack' },
  { name: 'Nuts', icon: '🥜', category: 'Snack' },
  { name: 'Popcorn', icon: '🍿', category: 'Snack' },
  { name: 'Ice Cream', icon: '🍦', category: 'Snack' },
  // Frozen
  { name: 'Frozen Pizza', icon: '🍕', category: 'Frozen' },
  { name: 'Frozen Vegetables', icon: '🥦', category: 'Frozen' },
  { name: 'Ice', icon: '🧊', category: 'Frozen' },
  // Other
  { name: 'Cereal', icon: '🥣', category: 'Other' },
  { name: 'Soup', icon: '🥫', category: 'Other' },
  { name: 'Ketchup', icon: '🍅', category: 'Other' },
  { name: 'Mustard', icon: '🌭', category: 'Other' },
  { name: 'Mayonnaise', icon: '🥫', category: 'Other' },
  { name: 'Soy Sauce', icon: '🍶', category: 'Other' },
].sort((a, b) => a.name.localeCompare(b.name));

// Icon picker options
const ICON_OPTIONS = [
  '🛒', '🛍️', '📦', '🎁', '🏪', '🍽️', '🥘', '🍴', '🥄', '🔪',
  '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑',
  '🥕', '🥦', '🥬', '🥒', '🌽', '🍅', '🥔', '🧅', '🧄', '🫑',
  '🥛', '🧀', '🥚', '🍞', '🥐', '🥨', '🥯', '🥖', '🫓', '🥞',
  '🥩', '🍗', '🍖', '🥓', '🍔', '🌭', '🍕', '🍟', '🌮', '🌯',
  '🐟', '🦐', '🦞', '🦀', '🐙', '🦑', '🍣', '🍤', '🥟', '🍱',
  '🍝', '🍜', '🍲', '🍛', '🍚', '🍙', '🥗', '🥙', '🥪', '🌮',
  '🍰', '🎂', '🧁', '🍪', '🍩', '🍫', '🍬', '🍭', '🍮', '🍯',
  '🥤', '☕', '🍵', '🧃', '🧉', '🥛', '🍷', '🍺', '🧊', '🍾',
  '🌶️', '🧂', '🫙', '🥫', '🍶', '🥢', '🧈', '🧋', '🧇', '🧆'
];

// Smart icon generation based on keywords
const generateIconForItem = (itemName) => {
  const name = itemName.toLowerCase();
  
  // Try to match with existing common items first
  const exactMatch = COMMON_ITEMS.find(item => 
    item.name.toLowerCase() === name
  );
  if (exactMatch) return exactMatch.icon;
  
  // Pattern matching for smart icon selection
  if (name.includes('milk') || name.includes('dairy')) return '🥛';
  if (name.includes('cheese')) return '🧀';
  if (name.includes('egg')) return '🥚';
  if (name.includes('bread') || name.includes('loaf')) return '🍞';
  if (name.includes('meat') || name.includes('beef') || name.includes('steak')) return '🥩';
  if (name.includes('chicken') || name.includes('poultry')) return '🍗';
  if (name.includes('fish') || name.includes('seafood')) return '🐟';
  if (name.includes('shrimp') || name.includes('prawn')) return '🦐';
  if (name.includes('apple')) return '🍎';
  if (name.includes('banana')) return '🍌';
  if (name.includes('orange')) return '🍊';
  if (name.includes('lemon') || name.includes('lime')) return '🍋';
  if (name.includes('grape')) return '🍇';
  if (name.includes('strawberry') || name.includes('berry')) return '🍓';
  if (name.includes('watermelon') || name.includes('melon')) return '🍉';
  if (name.includes('carrot')) return '🥕';
  if (name.includes('broccoli')) return '🥦';
  if (name.includes('tomato')) return '🍅';
  if (name.includes('potato')) return '🥔';
  if (name.includes('onion')) return '🧅';
  if (name.includes('garlic')) return '🧄';
  if (name.includes('pepper') || name.includes('paprika')) return '🫑';
  if (name.includes('corn')) return '🌽';
  if (name.includes('lettuce') || name.includes('salad') || name.includes('greens')) return '🥬';
  if (name.includes('cucumber')) return '🥒';
  if (name.includes('coffee')) return '☕';
  if (name.includes('tea')) return '🍵';
  if (name.includes('juice') || name.includes('drink')) return '🧃';
  if (name.includes('water')) return '💧';
  if (name.includes('soda') || name.includes('cola')) return '🥤';
  if (name.includes('beer')) return '🍺';
  if (name.includes('wine')) return '🍷';
  if (name.includes('rice')) return '🍚';
  if (name.includes('pasta') || name.includes('noodle')) return '🍝';
  if (name.includes('pizza')) return '🍕';
  if (name.includes('burger')) return '🍔';
  if (name.includes('sandwich') || name.includes('sub')) return '🥪';
  if (name.includes('taco') || name.includes('burrito')) return '🌮';
  if (name.includes('soup') || name.includes('stew')) return '🍲';
  if (name.includes('cake')) return '🎂';
  if (name.includes('cookie') || name.includes('biscuit')) return '🍪';
  if (name.includes('chocolate') || name.includes('candy')) return '🍫';
  if (name.includes('ice cream') || name.includes('icecream')) return '🍦';
  if (name.includes('honey')) return '🍯';
  if (name.includes('jam') || name.includes('jelly')) return '🍓';
  if (name.includes('oil')) return '🫙';
  if (name.includes('sauce') || name.includes('ketchup') || name.includes('mustard')) return '🥫';
  if (name.includes('spice') || name.includes('seasoning')) return '🧂';
  if (name.includes('cereal')) return '🥣';
  if (name.includes('yogurt') || name.includes('yoghurt')) return '🥛';
  if (name.includes('butter')) return '🧈';
  if (name.includes('cream')) return '🥛';
  if (name.includes('flour') || name.includes('baking')) return '🌾';
  if (name.includes('sugar') || name.includes('sweet')) return '🍬';
  if (name.includes('salt')) return '🧂';
  if (name.includes('nut') || name.includes('peanut') || name.includes('almond')) return '🥜';
  if (name.includes('chip') || name.includes('crisp')) return '🥔';
  if (name.includes('popcorn')) return '🍿';
  if (name.includes('pretzel')) return '🥨';
  if (name.includes('cracker')) return '🍘';
  
  // Category-based defaults
  if (name.includes('fruit')) return '🍎';
  if (name.includes('vegetable') || name.includes('veggie')) return '🥕';
  if (name.includes('snack')) return '🍿';
  if (name.includes('dessert')) return '🍰';
  if (name.includes('beverage')) return '🥤';
  if (name.includes('frozen')) return '🧊';
  if (name.includes('canned') || name.includes('can')) return '🥫';
  if (name.includes('fresh')) return '✨';
  if (name.includes('organic')) return '🌱';
  
  // Default icon
  return '🛒';
};

// Load custom items from localStorage
const loadCustomItems = () => {
  try {
    const stored = localStorage.getItem('customShoppingItems');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading custom items:', error);
    return [];
  }
};

// Save custom items to localStorage
const saveCustomItems = (items) => {
  try {
    localStorage.setItem('customShoppingItems', JSON.stringify(items));
  } catch (error) {
    console.error('Error saving custom items:', error);
  }
};

function ShoppingLists() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [selectedItemForCategory, setSelectedItemForCategory] = useState(null);
  const [newListName, setNewListName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemIcon, setNewItemIcon] = useState('');
  const [pendingCustomItem, setPendingCustomItem] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [customItems, setCustomItems] = useState([]);
  const [allItems, setAllItems] = useState(COMMON_ITEMS);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [freeformInput, setFreeformInput] = useState('');
  const [generationMode, setGenerationMode] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchLists();
    fetchCategories();
    // Load custom items from localStorage
    const loaded = loadCustomItems();
    setCustomItems(loaded);
    // Merge with common items
    const merged = [...COMMON_ITEMS, ...loaded].sort((a, b) => a.name.localeCompare(b.name));
    setAllItems(merged);
    setFilteredSuggestions(merged);
  }, []);

  const fetchLists = async () => {
    try {
      const response = await axios.get('/api/shopping-lists');
      setLists(response.data || []);
    } catch (error) {
      console.error('Error fetching shopping lists:', error);
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const viewList = async (id) => {
    try {
      const response = await axios.get(`/api/shopping-lists/${id}`);
      setSelectedList(response.data);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching list details:', error);
      toast.error('Failed to load list details');
    }
  };

  const openGenerateModal = () => {
    setShowGenerateModal(true);
  };

  const generateHealthyList = async (mode = 'healthy', customInput = '') => {
    setGenerating(true);
    setShowGenerateModal(false);
    
    try {
      let loadingMsg = 'Generating shopping list...';
      let successMsg = 'Shopping list generated!';
      let endpoint = '/api/shopping-lists/generate?daysBack=30';
      
      if (mode === 'analyze') {
        loadingMsg = 'Analyzing your purchase history with AI...';
        successMsg = 'AI-powered list created based on your habits!';
        endpoint = '/api/shopping-lists/generate?daysBack=60&mode=analyze';
      } else if (mode === 'weekly') {
        loadingMsg = 'Creating weekly essentials list...';
        successMsg = 'Weekly essentials list created!';
        endpoint = '/api/shopping-lists/generate?mode=weekly';
      } else if (mode === 'quick') {
        loadingMsg = 'Generating quick meal list...';
        successMsg = 'Quick meal shopping list ready!';
        endpoint = '/api/shopping-lists/generate?mode=quick';
      } else if (mode === 'freeform' && customInput) {
        loadingMsg = 'Parsing your list with AI...';
        successMsg = 'Custom list created from your input!';
        endpoint = '/api/shopping-lists/generate-from-text';
      }
      
      toast.loading(loadingMsg, { id: 'generate' });
      
      if (mode === 'freeform' && customInput) {
        await axios.post(endpoint, { text: customInput });
      } else {
        await axios.post(endpoint);
      }
      
      toast.success(successMsg, { id: 'generate' });
      fetchLists();
      
      // Track feature usage
      try {
        await axios.post('/api/features/track', { 
          featureName: 'shopping_list_generator',
          details: `Generated list with mode: ${mode}`
        });
      } catch (trackError) {
        console.error('Feature tracking failed:', trackError);
      }
    } catch (error) {
      console.error('Error generating list:', error);
      toast.error('Failed to generate list', { id: 'generate' });
    } finally {
      setGenerating(false);
      setFreeformInput('');
      setGenerationMode('');
    }
  };

  const createList = async () => {
    if (!newListName.trim()) {
      toast.error('Please enter a list name');
      return;
    }

    try {
      await axios.post('/api/shopping-lists', { name: newListName });
      toast.success('Shopping list created!');
      setNewListName('');
      setShowCreateModal(false);
      fetchLists();
    } catch (error) {
      console.error('Error creating list:', error);
      toast.error('Failed to create list');
    }
  };

  const addItem = async (itemName = newItemName, quantity = newItemQuantity, icon = null) => {
    if (!itemName.trim() || !selectedList || addingItem) {
      if (!itemName.trim()) toast.error('Please enter an item name');
      return;
    }

    const itemToAdd = itemName.trim();
    
    // Check if this is a new custom item (not in common items or custom items)
    const isNewCustomItem = !allItems.some(item => 
      item.name.toLowerCase() === itemToAdd.toLowerCase()
    );
    
    if (isNewCustomItem && !icon) {
      // Show icon picker for new custom items
      const smartIcon = generateIconForItem(itemToAdd);
      setPendingCustomItem({ name: itemToAdd, quantity });
      setNewItemIcon(smartIcon);
      setShowIconPicker(true);
      return;
    }

    // Proceed with adding the item
    proceedWithAddItem(itemToAdd, quantity, icon);
  };

  const proceedWithAddItem = async (itemName, quantity, icon = null) => {
    // Immediate feedback - clear input and show toast
    setNewItemName('');
    setNewItemQuantity(1);
    setFilteredSuggestions(allItems);
    toast.success(`✓ ${itemName} added!`, { duration: 1500 });
    setAddingItem(true);

    // Save as custom item if it's new
    const isNewCustomItem = !COMMON_ITEMS.some(item => 
      item.name.toLowerCase() === itemName.toLowerCase()
    );
    
    if (isNewCustomItem) {
      const finalIcon = icon || generateIconForItem(itemName);
      const newCustomItem = {
        name: itemName,
        icon: finalIcon,
        category: 'Custom',
        addedDate: new Date().toISOString()
      };
      
      // Check if not already in custom items
      const existingCustom = customItems.find(item => 
        item.name.toLowerCase() === itemName.toLowerCase()
      );
      
      if (!existingCustom) {
        const updatedCustomItems = [...customItems, newCustomItem];
        setCustomItems(updatedCustomItems);
        saveCustomItems(updatedCustomItems);
        
        // Update all items list
        const merged = [...COMMON_ITEMS, ...updatedCustomItems].sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        setAllItems(merged);
        setFilteredSuggestions(merged);
      }
    }

    try {
      await axios.post(`/api/shopping-lists/${selectedList.id}/items`, {
        itemName: itemName,
        quantity: quantity
      });
      // Refresh the list in background
      viewList(selectedList.id);
      fetchLists();
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error(`Failed to add ${itemName}`);
    } finally {
      setAddingItem(false);
    }
  };

  const addItemFromSuggestion = (item) => {
    addItem(item.name, 1, item.icon);
  };

  const confirmIconSelection = () => {
    if (pendingCustomItem) {
      setShowIconPicker(false);
      proceedWithAddItem(pendingCustomItem.name, pendingCustomItem.quantity, newItemIcon);
      setPendingCustomItem(null);
      setNewItemIcon('');
    }
  };

  const handleItemNameChange = (value) => {
    setNewItemName(value);
    // Filter suggestions based on input
    if (value.trim() === '') {
      setFilteredSuggestions(allItems);
    } else {
      const searchTerm = value.toLowerCase();
      const filtered = allItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
      );
      setFilteredSuggestions(filtered);
    }
  };

  const deleteList = async (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Shopping List',
      message: 'Are you sure you want to delete this shopping list? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await axios.delete(`/api/shopping-lists/${id}`);
          toast.success('List deleted');
          if (showViewModal) {
            setShowViewModal(false);
            setSelectedList(null);
          }
          fetchLists();
        } catch (error) {
          console.error('Error deleting list:', error);
          toast.error('Failed to delete list');
        }
      }
    });
  };

  const deleteItem = async (itemId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Item',
      message: 'Are you sure you want to remove this item from the list?',
      onConfirm: async () => {
        try {
          await axios.delete(`/api/shopping-lists/items/${itemId}`);
          toast.success('Item removed');
          // Refresh the list
          if (selectedList) {
            viewList(selectedList.id);
            fetchLists();
          }
        } catch (error) {
          console.error('Error deleting item:', error);
          toast.error('Failed to delete item');
        }
      }
    });
  };

  const toggleItemPurchased = async (itemId, currentStatus) => {
    try {
      await axios.patch(`/api/shopping-lists/items/${itemId}`, {
        isPurchased: !currentStatus
      });
      // Refresh the list
      if (selectedList) {
        viewList(selectedList.id);
        fetchLists();
      }
    } catch (error) {
      console.error('Error toggling item:', error);
      toast.error('Failed to update item');
    }
  };

  const openCategoryModal = (item) => {
    setSelectedItemForCategory(item);
    setShowCategoryModal(true);
  };

  const changeItemCategory = async (newCategory) => {
    if (!selectedItemForCategory || !selectedList) return;
    
    try {
      await axios.put(
        `/api/shopping-lists/${selectedList.id}/items/${selectedItemForCategory.id}/category`,
        { category: newCategory }
      );
      toast.success('Category updated!');
      setShowCategoryModal(false);
      setSelectedItemForCategory(null);
      // Refresh the list
      viewList(selectedList.id);
      fetchLists();
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const getCategoryColor = (categoryName) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.color || '#6b7280';
  };

  const getCategoryIcon = (categoryName) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.icon || '📦';
  };

  const getItemIcon = (itemName) => {
    if (!itemName) return '🛒';
    
    const name = itemName.toLowerCase();
    
    // Check custom items first (exact match)
    const customItem = customItems.find(item => 
      item.name.toLowerCase() === name
    );
    if (customItem) return customItem.icon;
    
    // Check common items (exact match)
    const commonItem = COMMON_ITEMS.find(item => 
      item.name.toLowerCase() === name
    );
    if (commonItem) return commonItem.icon;
    
    // Fallback to pattern matching
    // Dairy
    if (name.includes('milk')) return '🥛';
    if (name.includes('cheese')) return '🧀';
    if (name.includes('yogurt') || name.includes('yoghurt')) return '🥛';
    if (name.includes('butter')) return '🧈';
    if (name.includes('cream')) return '🥛';
    // Bread & Bakery
    if (name.includes('bread')) return '🍞';
    if (name.includes('bagel')) return '🥯';
    if (name.includes('toast')) return '🍞';
    if (name.includes('croissant')) return '🥐';
    if (name.includes('muffin') || name.includes('cake')) return '🧁';
    // Protein
    if (name.includes('egg')) return '🥚';
    if (name.includes('chicken') || name.includes('turkey')) return '🍗';
    if (name.includes('beef') || name.includes('steak') || name.includes('meat')) return '🥩';
    if (name.includes('fish') || name.includes('salmon') || name.includes('tuna')) return '🐟';
    if (name.includes('shrimp') || name.includes('prawn')) return '🦐';
    if (name.includes('bacon') || name.includes('ham')) return '🥓';
    // Fruits
    if (name.includes('apple')) return '🍎';
    if (name.includes('banana')) return '🍌';
    if (name.includes('orange')) return '🍊';
    if (name.includes('grape')) return '🍇';
    if (name.includes('strawberr')) return '🍓';
    if (name.includes('watermelon')) return '🍉';
    if (name.includes('lemon') || name.includes('lime')) return '🍋';
    if (name.includes('peach')) return '🍑';
    if (name.includes('pear')) return '🍐';
    if (name.includes('cherry')) return '🍒';
    if (name.includes('fruit')) return '🍎';
    // Vegetables
    if (name.includes('carrot')) return '🥕';
    if (name.includes('tomato')) return '🍅';
    if (name.includes('potato')) return '🥔';
    if (name.includes('lettuce') || name.includes('salad')) return '🥬';
    if (name.includes('broccoli')) return '🥦';
    if (name.includes('cucumber')) return '🥒';
    if (name.includes('pepper') || name.includes('bell')) return '🫑';
    if (name.includes('corn')) return '🌽';
    if (name.includes('onion')) return '🧅';
    if (name.includes('garlic')) return '🧄';
    if (name.includes('mushroom')) return '🍄';
    if (name.includes('vegetable') || name.includes('veggie')) return '🥬';
    // Grains & Pasta
    if (name.includes('pasta') || name.includes('spaghetti') || name.includes('noodle')) return '🍝';
    if (name.includes('rice')) return '🍚';
    if (name.includes('cereal')) return '🥣';
    if (name.includes('oat')) return '🌾';
    // Beverages
    if (name.includes('coffee')) return '☕';
    if (name.includes('tea')) return '🍵';
    if (name.includes('water') || name.includes('bottle')) return '💧';
    if (name.includes('juice')) return '🧃';
    if (name.includes('soda') || name.includes('cola')) return '🥤';
    if (name.includes('beer')) return '🍺';
    if (name.includes('wine')) return '🍷';
    // Snacks
    if (name.includes('chip') || name.includes('crisp')) return '🥔';
    if (name.includes('popcorn')) return '🍿';
    if (name.includes('cookie') || name.includes('biscuit')) return '🍪';
    if (name.includes('chocolate') || name.includes('candy')) return '🍫';
    if (name.includes('ice cream')) return '🍦';
    if (name.includes('snack')) return '🍿';
    // Condiments
    if (name.includes('oil') || name.includes('olive')) return '🫒';
    if (name.includes('sauce') || name.includes('ketchup')) return '🍅';
    if (name.includes('mayo') || name.includes('mustard')) return '🥫';
    if (name.includes('salt') || name.includes('pepper') || name.includes('spice')) return '🧂';
    // Canned/Packaged
    if (name.includes('can') || name.includes('tin')) return '🥫';
    if (name.includes('soup')) return '🍲';
    // Default
    return '🛒';
  };

  const getCompletedCount = (items) => {
    return items?.filter(item => item.isPurchased || item.completed).length || 0;
  };

  const getItemCount = (items) => {
    return items?.length || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Shopping Lists</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
            Create and manage your shopping lists
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button 
            onClick={openGenerateModal}
            disabled={generating}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <Leaf className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{generating ? 'Generating...' : 'Generate Healthy List'}</span>
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>New List</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {lists.map(list => {
            const itemCount = getItemCount(list.items);
            const completed = getCompletedCount(list.items);
            
            return (
              <div 
                key={list.id} 
                onClick={() => viewList(list.id)}
                className="card hover:shadow-2xl hover:scale-102 transition-all duration-200 cursor-pointer group flex flex-col"
                style={{ boxShadow: '0 0 0 0 rgba(99, 102, 241, 0)' }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 20px 2px rgba(99, 102, 241, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 0 0 rgba(99, 102, 241, 0)'}
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    <div className="p-2 sm:p-3 bg-primary-100 dark:bg-primary-900 rounded-lg group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-colors flex-shrink-0">
                      <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">{list.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-500">{itemCount} items</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteList(list.id);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                
                {/* Item Preview */}
                {list.items && list.items.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1 sm:gap-1.5">
                    {list.items.slice(0, 6).map(item => (
                      <div key={item.id} className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs">
                        <span>{getItemIcon(item.name || item.itemName)}</span>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{item.name || item.itemName || 'Item'}</span>
                        {item.quantity > 1 && <span className="text-gray-500 dark:text-gray-400">×{item.quantity}</span>}
                      </div>
                    ))}
                    {list.items.length > 6 && (
                      <div className="flex items-center px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                        +{list.items.length - 6} more
                      </div>
                    )}
                  </div>
                )}
                
                {/* Spacer to push bottom content down */}
                <div className="flex-grow"></div>
                
                <div className="mb-3 sm:mb-4">
                  <div className="flex justify-between text-xs sm:text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {completed}/{itemCount}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${itemCount > 0 ? (completed / itemCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                
                <div className="text-center text-xs sm:text-sm text-primary-500 font-medium group-hover:text-primary-600">
                  Click to view items
                </div>
              </div>
            );
          })}
          
          <div 
            onClick={() => setShowCreateModal(true)}
            className="card border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 transition-colors cursor-pointer flex items-center justify-center min-h-[150px] sm:min-h-[200px]"
          >
            <div className="text-center">
              <Plus className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">Create New List</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">Create New Shopping List</h2>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Enter list name..."
              className="input mb-4"
              onKeyPress={(e) => e.key === 'Enter' && createList()}
            />
            <div className="flex gap-2 sm:gap-3">
              <button onClick={createList} className="btn-primary flex-1 text-sm sm:text-base">
                Create
              </button>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setNewListName('');
                }}
                className="btn-secondary flex-1 text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View List Modal */}
      {showViewModal && selectedList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex justify-between items-start gap-3 z-10">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 truncate">{selectedList.name}</h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {getItemCount(selectedList.items)} items
                </p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="sticky top-[88px] sm:top-[100px] bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 z-10">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Items</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setShowAddItemModal(true)}
                    className="bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center sm:inline-flex"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    <span>Add Item</span>
                  </button>
                  <button
                    onClick={() => deleteList(selectedList.id)}
                    className="bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center sm:inline-flex"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    <span>Delete List</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">

              {selectedList.items && selectedList.items.length > 0 ? (
                <>
                  {/* To Buy Section */}
                  {selectedList.items.filter(item => !item.isPurchased).length > 0 && (
                    <div className="mb-4 sm:mb-6">
                      <h4 className="text-sm sm:text-base font-semibold text-purple-600 dark:text-purple-400 mb-2 sm:mb-3">
                        To Buy ({selectedList.items.filter(item => !item.isPurchased).length})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                        {selectedList.items.filter(item => !item.isPurchased).map((item) => (
                          <div
                            key={item.id}
                            className="relative group bg-gradient-to-br from-purple-500 to-blue-600 text-white rounded-xl p-3 sm:p-4 shadow-lg hover:-translate-y-1 hover:shadow-2xl transition-all duration-200"
                          >
                            {/* Action Buttons */}
                            <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCategoryModal(item);
                                }}
                                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-1.5 transition-colors"
                                title="Change category"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteItem(item.id);
                                }}
                                className="bg-red-500 hover:bg-red-600 rounded-full p-1.5 transition-colors"
                                title="Delete item"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            
                            {/* Item Content */}
                            <div 
                              role="button"
                              tabIndex={0}
                              onClick={() => toggleItemPurchased(item.id, item.isPurchased)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  toggleItemPurchased(item.id, item.isPurchased);
                                }
                              }}
                              className="cursor-pointer"
                              aria-label={`Mark ${item.name || item.itemName} as purchased`}
                            >
                              <div className="text-center">
                                <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">{getItemIcon(item.name || item.itemName)}</div>
                                <div className="font-bold text-xs sm:text-sm mb-1 truncate">{item.name || item.itemName || 'Item'}</div>
                                
                                {/* Category Badge */}
                                {item.category && item.category !== 'Unknown' && (
                                  <div className="inline-flex items-center space-x-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] mb-1">
                                    <span>{getCategoryIcon(item.category)}</span>
                                    <span>{item.category}</span>
                                  </div>
                                )}
                                
                                {(item.quantity > 1 || item.quantity === 1) && (
                                  <div className="text-xs opacity-90">×{item.quantity}</div>
                                )}
                                {item.estimatedPrice && (
                                  <div className="text-xs opacity-90">${item.estimatedPrice.toFixed(2)}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Purchased Section */}
                  {selectedList.items.filter(item => item.isPurchased).length > 0 && (
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
                        Purchased ({selectedList.items.filter(item => item.isPurchased).length})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                        {selectedList.items.filter(item => item.isPurchased).map((item) => (
                          <div
                            key={item.id}
                            className="relative group bg-gradient-to-br from-gray-400 to-gray-500 text-white rounded-xl p-3 sm:p-4 opacity-70 hover:opacity-100 hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
                          >
                            {/* Action Buttons */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteItem(item.id);
                                }}
                                className="bg-red-500 hover:bg-red-600 rounded-full p-1.5 transition-colors"
                                title="Delete item"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            
                            {/* Item Content */}
                            <div 
                              role="button"
                              tabIndex={0}
                              onClick={() => toggleItemPurchased(item.id, item.isPurchased)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  toggleItemPurchased(item.id, item.isPurchased);
                                }
                              }}
                              className="cursor-pointer"
                              aria-label={`Unmark ${item.name || item.itemName} as purchased`}
                            >
                              <div className="text-center">
                                <div className="text-3xl sm:text-4xl mb-1 sm:mb-2 opacity-80 line-through">{getItemIcon(item.name || item.itemName)}</div>
                                <div className="font-bold text-xs sm:text-sm mb-1 truncate line-through">{item.name || item.itemName || 'Item'}</div>
                                
                                {/* Category Badge */}
                                {item.category && item.category !== 'Unknown' && (
                                  <div className="inline-flex items-center space-x-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] mb-1">
                                    <span>{getCategoryIcon(item.category)}</span>
                                    <span>{item.category}</span>
                                  </div>
                                )}
                                
                                {(item.quantity > 1 || item.quantity === 1) && (
                                  <div className="text-xs opacity-90">×{item.quantity}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No items in this list yet. Click "Add Item" to get started!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && selectedList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto my-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                Add to {selectedList.name}
              </h2>
              <button 
                onClick={() => {
                  setShowAddItemModal(false);
                  setNewItemName('');
                  setNewItemQuantity(1);
                  setFilteredSuggestions(allItems);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Search Input */}
            <div className="mb-4">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => handleItemNameChange(e.target.value)}
                placeholder="Search or type item name..."
                className="input text-base sm:text-lg"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newItemName.trim()) {
                    addItem();
                  }
                }}
                autoFocus
              />
            </div>

            {/* Custom Item Section (when typing custom name) */}
            {newItemName.trim() && filteredSuggestions.length === 0 && (
              <div className="mb-4">
                <button
                  onClick={() => addItem()}
                  disabled={addingItem}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 flex items-center justify-between hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">➕</span>
                    <span className="font-medium">Add "{newItemName}"</span>
                  </div>
                  <span className="text-sm opacity-75">Press Enter</span>
                </button>
              </div>
            )}

            {/* Custom Item Button (when user is typing something not in suggestions) */}
            {newItemName.trim() && filteredSuggestions.length > 0 && 
             !filteredSuggestions.some(item => item.name.toLowerCase() === newItemName.toLowerCase()) && (
              <div className="mb-4">
                <button
                  onClick={() => addItem()}
                  disabled={addingItem}
                  className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg p-3 flex items-center gap-3 hover:from-green-600 hover:to-teal-700 transition-all disabled:opacity-50"
                >
                  <span className="text-xl">✨</span>
                  <span className="font-medium">Add custom: "{newItemName}"</span>
                </button>
              </div>
            )}

            {/* Suggestion Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {filteredSuggestions.slice(0, 24).map((item, index) => (
                <button
                  key={index}
                  onClick={() => addItemFromSuggestion(item)}
                  disabled={addingItem}
                  className="bg-gradient-to-br from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-3xl sm:text-4xl">{item.icon}</span>
                  <span className="font-medium text-sm sm:text-base text-center">{item.name}</span>
                </button>
              ))}
            </div>

            {/* No results message */}
            {newItemName.trim() && filteredSuggestions.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
                No suggestions found. Press Enter or click button above to add "{newItemName}"
              </p>
            )}

            {/* Show count when filtering */}
            {newItemName.trim() && filteredSuggestions.length > 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 mt-4 text-sm">
                Showing {Math.min(filteredSuggestions.length, 24)} of {filteredSuggestions.length} items
              </p>
            )}
          </div>
        </div>
      )}

      {/* Icon Picker Modal */}
      {showIconPicker && pendingCustomItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Choose Icon for "{pendingCustomItem.name}"
              </h2>
              <button 
                onClick={() => {
                  setShowIconPicker(false);
                  setPendingCustomItem(null);
                  setNewItemIcon('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Selected Icon Preview */}
            <div className="mb-4 p-4 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-lg text-center">
              <div className="text-6xl mb-2">{newItemIcon}</div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Selected Icon:</strong> {newItemIcon}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                This is a smart suggestion based on "{pendingCustomItem.name}"
              </p>
            </div>

            {/* Icon Grid */}
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-4">
              {ICON_OPTIONS.map((icon, index) => (
                <button
                  key={index}
                  onClick={() => setNewItemIcon(icon)}
                  className={`text-4xl p-3 rounded-lg transition-all transform hover:scale-110 flex items-center justify-center ${
                    newItemIcon === icon
                      ? 'bg-gradient-to-br from-purple-500 to-blue-600 ring-4 ring-purple-300 scale-110'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={confirmIconSelection}
                className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-teal-700 transition-all"
              >
                ✓ Confirm & Add Item
              </button>
              <button
                onClick={() => {
                  setShowIconPicker(false);
                  setPendingCustomItem(null);
                  setNewItemIcon('');
                }}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white py-3 rounded-lg font-semibold hover:bg-gray-400 dark:hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
              💡 Tip: Your custom items will be saved for next time!
            </p>
          </div>
        </div>
      )}

      {/* Generate List Options Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto my-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  🤖 AI-Powered List Generator
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Choose how you want to generate your shopping list
                </p>
              </div>
              <button 
                onClick={() => setShowGenerateModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Generation Options */}
            <div className="space-y-3 mb-6">
              {/* Analyze Past Purchases */}
              <button
                onClick={() => generateHealthyList('analyze')}
                disabled={generating}
                className="w-full text-left p-4 sm:p-5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🧠</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">Smart Analysis (AI Powered)</h3>
                    <p className="text-sm opacity-90 mb-2">
                      Analyzes your purchase history from receipts and suggests items you typically buy. 
                      Uses GitHub Copilot AI to understand your shopping patterns.
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-white bg-opacity-20 px-2 py-1 rounded">AI Analysis</span>
                      <span className="bg-white bg-opacity-20 px-2 py-1 rounded">Purchase History</span>
                      <span className="bg-white bg-opacity-20 px-2 py-1 rounded">Personalized</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Healthy Essentials */}
              <button
                onClick={() => generateHealthyList('healthy')}
                disabled={generating}
                className="w-full text-left p-4 sm:p-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🥗</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">Healthy Essentials</h3>
                    <p className="text-sm opacity-90 mb-2">
                      Curated list of nutritious foods based on your recent healthy purchases. 
                      Perfect for maintaining a balanced diet.
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-white bg-opacity-20 px-2 py-1 rounded">Nutritious</span>
                      <span className="bg-white bg-opacity-20 px-2 py-1 rounded">Balanced</span>
                      <span className="bg-white bg-opacity-20 px-2 py-1 rounded">30 Days</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Weekly Essentials */}
              <button
                onClick={() => generateHealthyList('weekly')}
                disabled={generating}
                className="w-full text-left p-4 sm:p-5 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">📅</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">Weekly Essentials</h3>
                    <p className="text-sm opacity-90 mb-2">
                      Standard weekly grocery list with milk, bread, eggs, fruits, vegetables, and household staples.
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-white bg-opacity-20 px-2 py-1 rounded">Quick</span>
                      <span className="bg-white bg-opacity-20 px-2 py-1 rounded">Standard Items</span>
                      <span className="bg-white bg-opacity-20 px-2 py-1 rounded">7 Days</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Quick Meal List */}
              <button
                onClick={() => generateHealthyList('quick')}
                disabled={generating}
                className="w-full text-left p-4 sm:p-5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">⚡</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">Quick Meal Ingredients</h3>
                    <p className="text-sm opacity-90 mb-2">
                      Fast and easy meal items for busy weekdays. Includes ready-to-cook and convenient options.
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-white bg-opacity-20 px-2 py-1 rounded">Fast</span>
                      <span className="bg-white bg-opacity-20 px-2 py-1 rounded">Convenient</span>
                      <span className="bg-white bg-opacity-20 px-2 py-1 rounded">Easy Cook</span>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Natural Language Input */}
            <div className="border-t border-gray-300 dark:border-gray-600 pt-6">
              <div className="mb-3">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="text-2xl">✍️</span>
                  Or Type Your Own List
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Type items naturally like: "2 apples, 3 bananas, 1 kefir, bread, 500g chicken"
                </p>
              </div>
              
              <textarea
                value={freeformInput}
                onChange={(e) => setFreeformInput(e.target.value)}
                placeholder="Example: apple, 2 bananas, 3 kefir, milk, bread, 500g chicken breast, tomatoes..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows="4"
              />
              
              <button
                onClick={() => generateHealthyList('freeform', freeformInput)}
                disabled={generating || !freeformInput.trim()}
                className="w-full mt-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="text-xl">🤖</span>
                <span>Parse with AI & Generate List</span>
              </button>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                AI will intelligently parse quantities, units, and item names
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Category Change Modal */}
      {showCategoryModal && selectedItemForCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Change Category
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Select a category for {selectedItemForCategory.name || selectedItemForCategory.itemName}
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => changeItemCategory(category.name)}
                    className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                      selectedItemForCategory.category === category.name
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">
                      {category.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setSelectedItemForCategory(null);
                }}
                className="w-full btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type="danger"
      />
    </div>
  );
}

export default ShoppingLists;
