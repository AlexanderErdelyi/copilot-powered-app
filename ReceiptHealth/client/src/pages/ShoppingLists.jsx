import { ShoppingCart, Plus, Trash2, Check, X, Leaf } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';

function ShoppingLists() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [newListName, setNewListName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchLists();
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

  const generateHealthyList = async () => {
    setGenerating(true);
    try {
      toast.loading('Generating healthy shopping list...', { id: 'generate' });
      await axios.post('/api/shopping-lists/generate?daysBack=30');
      toast.success('Healthy shopping list generated!', { id: 'generate' });
      fetchLists();
      
      // Track feature usage
      try {
        await axios.post('/api/features/track', { 
          featureName: 'shopping_list_generator',
          details: 'Generated healthy shopping list'
        });
      } catch (trackError) {
        console.error('Feature tracking failed:', trackError);
      }
    } catch (error) {
      console.error('Error generating list:', error);
      toast.error('Failed to generate list', { id: 'generate' });
    } finally {
      setGenerating(false);
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

  const addItem = async () => {
    if (!newItemName.trim() || !selectedList) {
      toast.error('Please enter an item name');
      return;
    }

    try {
      await axios.post(`/api/shopping-lists/${selectedList.id}/items`, {
        itemName: newItemName,
        quantity: newItemQuantity
      });
      toast.success('Item added!');
      setNewItemName('');
      setNewItemQuantity(1);
      setShowAddItemModal(false);
      // Refresh the list
      viewList(selectedList.id);
      fetchLists();
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
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

  const getItemIcon = (itemName) => {
    const name = itemName?.toLowerCase() || '';
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
            onClick={generateHealthyList}
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
                className="card hover:shadow-2xl hover:scale-102 transition-all duration-200 cursor-pointer group"
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
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex justify-between items-start gap-3">
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

            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4">
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
                            onClick={() => toggleItemPurchased(item.id, item.isPurchased)}
                            className="relative group cursor-pointer bg-gradient-to-br from-purple-500 to-blue-600 text-white rounded-lg p-3 sm:p-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteItem(item.id);
                              }}
                              className="absolute top-1 right-1 sm:top-2 sm:right-2 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 rounded-full p-1 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <div className="text-center">
                              <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">{getItemIcon(item.name)}</div>
                              <div className="font-bold text-xs sm:text-sm mb-1 truncate">{item.name}</div>
                              {item.quantity > 1 && (
                                <div className="text-xs opacity-90">Qty: {item.quantity}</div>
                              )}
                              {item.estimatedPrice && (
                                <div className="text-xs opacity-90">${item.estimatedPrice.toFixed(2)}</div>
                              )}
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
                            onClick={() => toggleItemPurchased(item.id, item.isPurchased)}
                            className="relative group cursor-pointer bg-gradient-to-br from-gray-400 to-gray-500 text-white rounded-lg p-3 sm:p-4 opacity-70 hover:opacity-100 hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteItem(item.id);
                              }}
                              className="absolute top-1 right-1 sm:top-2 sm:right-2 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 rounded-full p-1 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <div className="text-center">
                              <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">{getItemIcon(item.name)}</div>
                              <div className="font-bold text-xs sm:text-sm mb-1 line-through truncate">{item.name}</div>
                              {item.quantity > 1 && (
                                <div className="text-xs opacity-90">Qty: {item.quantity}</div>
                              )}
                              {item.estimatedPrice && (
                                <div className="text-xs opacity-90">${item.estimatedPrice.toFixed(2)}</div>
                              )}
                              <div className="text-xs mt-1">✓ Purchased</div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white truncate">
              Add Item to {selectedList.name}
            </h2>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Item name..."
              className="input mb-3"
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
            />
            <input
              type="number"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
              placeholder="Quantity..."
              min="1"
              className="input mb-4"
            />
            <div className="flex gap-2 sm:gap-3">
              <button onClick={addItem} className="btn-primary flex-1 text-sm sm:text-base">
                Add
              </button>
              <button 
                onClick={() => {
                  setShowAddItemModal(false);
                  setNewItemName('');
                  setNewItemQuantity(1);
                }}
                className="btn-secondary flex-1 text-sm sm:text-base"
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
