import { ShoppingCart, Plus, Trash2, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

function ShoppingLists() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const response = await axios.get('/api/shopping-lists');
      setLists(response.data || []);
    } catch (error) {
      console.error('Error fetching shopping lists:', error);
      // Mock data for demo
      setLists([
        { id: 1, name: 'Weekly Groceries', items: Array(12).fill({}).map((_, i) => ({ id: i, completed: i < 8 })) },
        { id: 2, name: 'Meal Prep Sunday', items: Array(8).fill({}).map((_, i) => ({ id: i, completed: false })) },
      ]);
    } finally {
      setLoading(false);
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

  const deleteList = async (id) => {
    if (!confirm('Are you sure you want to delete this list?')) return;

    try {
      await axios.delete(`/api/shopping-lists/${id}`);
      toast.success('List deleted');
      fetchLists();
    } catch (error) {
      console.error('Error deleting list:', error);
      toast.error('Failed to delete list');
    }
  };

  const getCompletedCount = (items) => {
    return items?.filter(item => item.completed || item.isPurchased).length || 0;
  };

  const getItemCount = (items) => {
    return items?.length || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shopping Lists</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage your shopping lists
          </p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New List</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map(list => {
            const itemCount = getItemCount(list.items);
            const completed = getCompletedCount(list.items);
            
            return (
              <div key={list.id} className="card hover:shadow-2xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
                      <ShoppingCart className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{list.name}</h3>
                      <p className="text-sm text-gray-500">{itemCount} items</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteList(list.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
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
                
                <button className="w-full btn-secondary text-sm">
                  View Items
                </button>
              </div>
            );
          })}
          
          <div 
            onClick={() => setShowCreateModal(true)}
            className="card border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 transition-colors cursor-pointer flex items-center justify-center min-h-[200px]"
          >
            <div className="text-center">
              <Plus className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">Create New List</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create New Shopping List</h2>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Enter list name..."
              className="input mb-4"
              onKeyPress={(e) => e.key === 'Enter' && createList()}
            />
            <div className="flex space-x-3">
              <button onClick={createList} className="btn-primary flex-1">
                Create
              </button>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setNewListName('');
                }}
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

export default ShoppingLists;
