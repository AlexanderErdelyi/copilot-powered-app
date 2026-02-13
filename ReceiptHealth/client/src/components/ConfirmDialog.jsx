import { AlertCircle } from 'lucide-react';

function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', cancelText = 'Cancel', type = 'danger' }) {
  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          button: 'bg-red-500 hover:bg-red-600',
          icon: 'text-red-500',
          bg: 'bg-red-50 dark:bg-red-900/20'
        };
      case 'warning':
        return {
          button: 'bg-yellow-500 hover:bg-yellow-600',
          icon: 'text-yellow-500',
          bg: 'bg-yellow-50 dark:bg-yellow-900/20'
        };
      case 'info':
        return {
          button: 'bg-blue-500 hover:bg-blue-600',
          icon: 'text-blue-500',
          bg: 'bg-blue-50 dark:bg-blue-900/20'
        };
      default:
        return {
          button: 'bg-primary-500 hover:bg-primary-600',
          icon: 'text-primary-500',
          bg: 'bg-primary-50 dark:bg-primary-900/20'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-2xl transform transition-all">
        <div className={`p-6 ${colors.bg} rounded-t-lg`}>
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full bg-white dark:bg-gray-800`}>
              <AlertCircle className={`w-6 h-6 ${colors.icon}`} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {message}
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-2 ${colors.button} text-white font-semibold rounded-lg transition-colors`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
