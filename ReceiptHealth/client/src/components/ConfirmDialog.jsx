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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-all duration-300">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl rounded-2xl max-w-md w-full shadow-2xl shadow-primary-500/20 transform transition-all border border-gray-200/50 dark:border-gray-700/50">
        <div className={`p-6 ${colors.bg} rounded-t-2xl backdrop-blur-xl`}>
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg`}>
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
              className="flex-1 px-4 py-2 bg-gray-100/80 hover:bg-gray-200/80 dark:bg-gray-700/80 dark:hover:bg-gray-600/80 text-gray-800 dark:text-white font-semibold rounded-xl transition-all duration-300 backdrop-blur-sm hover:scale-105 active:scale-95 border border-gray-200/50 dark:border-gray-600/50"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-2 ${colors.button} text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl`}
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
