import { ShoppingCart, Plus, Trash2, Check } from 'lucide-react';
import { useState } from 'react';

function ShoppingLists() {
  const [lists, setLists] = useState([
    { id: 1, name: 'Weekly Groceries', itemCount: 12, completed: 8 },
    { id: 2, name: 'Meal Prep Sunday', itemCount: 8, completed: 0 },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shopping Lists</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage your shopping lists
          </p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>New List</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lists.map(list => (
          <div key={list.id} className="card hover:shadow-2xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{list.name}</h3>
                  <p className="text-sm text-gray-500">{list.itemCount} items</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-red-500">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {list.completed}/{list.itemCount}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(list.completed / list.itemCount) * 100}%` }}
                />
              </div>
            </div>
            
            <button className="w-full btn-secondary text-sm">
              View Items
            </button>
          </div>
        ))}
        
        <div className="card border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 transition-colors cursor-pointer flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <Plus className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">Create New List</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShoppingLists;
