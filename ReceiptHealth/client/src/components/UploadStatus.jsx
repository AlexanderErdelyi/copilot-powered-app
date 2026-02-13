import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

const UploadStatus = forwardRef((props, ref) => {
  const [uploads, setUploads] = useState([]);
  const [expandedUpload, setExpandedUpload] = useState(null);

  useEffect(() => {
    // Restore uploads from localStorage
    const savedUploads = JSON.parse(localStorage.getItem('activeUploads') || '[]');
    if (savedUploads.length > 0) {
      restoreActiveUploads(savedUploads);
    }
  }, []);

  // Expose addUpload method to parent component
  useImperativeHandle(ref, () => ({
    addUpload
  }));

  const restoreActiveUploads = async (savedUploads) => {
    const restoredUploads = [];
    
    for (const upload of savedUploads) {
      try {
        const response = await axios.get(`/api/upload/status/${upload.documentId}`);
        if (response.data && (response.data.status === 'processing' || response.data.status === 'pending')) {
          restoredUploads.push(response.data);
        } else {
          // Remove from localStorage if completed or not found
          removeFromLocalStorage(upload.documentId);
        }
      } catch (error) {
        console.error('Error restoring upload:', error);
        removeFromLocalStorage(upload.documentId);
      }
    }
    
    setUploads(restoredUploads);
    
    // Start polling for restored uploads
    restoredUploads.forEach(upload => {
      if (upload.status !== 'completed' && upload.status !== 'failed') {
        pollUploadStatus(upload.documentId);
      }
    });
  };

  const addUpload = (documentId, fileName) => {
    const newUpload = {
      documentId,
      fileName,
      status: 'pending',
      steps: []
    };
    
    setUploads(prev => [...prev, newUpload]);
    saveToLocalStorage(documentId, fileName);
    pollUploadStatus(documentId);
  };

  const pollUploadStatus = async (documentId) => {
    const maxAttempts = 60; // 1 minute max
    let attempts = 0;
    
    const poll = async () => {
      try {
        if (attempts >= maxAttempts) {
          updateUploadStatus(documentId, 'failed', 'Timeout');
          return;
        }
        
        const response = await axios.get(`/api/upload/status/${documentId}`);
        const statusData = response.data;
        
        // Map backend status to our format
        const mappedStatus = {
          documentId: statusData.documentId,
          fileName: uploads.find(u => u.documentId === documentId)?.fileName || 'Processing...',
          status: statusData.status.toLowerCase(),
          message: statusData.message,
          progress: statusData.progress || 0,
          itemCount: statusData.itemCount,
          categorizedCount: statusData.categorizedCount,
          totalItems: statusData.totalItems,
          updatedAt: statusData.updatedAt
        };
        
        setUploads(prev => prev.map(upload => 
          upload.documentId === documentId ? mappedStatus : upload
        ));
        
        if (statusData.status === 'Completed' || statusData.status === 'completed') {
          removeFromLocalStorage(documentId);
          setTimeout(() => {
            removeUpload(documentId);
          }, 3000); // Remove after 3 seconds
        } else if (statusData.status === 'Error' || statusData.status === 'failed') {
          removeFromLocalStorage(documentId);
          setTimeout(() => {
            removeUpload(documentId);
          }, 5000); // Remove after 5 seconds
        } else {
          attempts++;
          setTimeout(poll, 1000); // Poll every second
        }
      } catch (error) {
        console.error('Polling error:', error);
        if (error.response?.status === 404) {
          // Document not found, might have been processed already
          removeUpload(documentId);
        } else {
          updateUploadStatus(documentId, 'failed', 'Connection error');
        }
      }
    };
    
    poll();
  };

  const updateUploadStatus = (documentId, status, error = null) => {
    setUploads(prev => prev.map(upload => 
      upload.documentId === documentId 
        ? { ...upload, status, error } 
        : upload
    ));
  };

  const removeUpload = (documentId) => {
    setUploads(prev => prev.filter(upload => upload.documentId !== documentId));
    removeFromLocalStorage(documentId);
  };

  const saveToLocalStorage = (documentId, fileName) => {
    const savedUploads = JSON.parse(localStorage.getItem('activeUploads') || '[]');
    savedUploads.push({ documentId, fileName });
    localStorage.setItem('activeUploads', JSON.stringify(savedUploads));
  };

  const removeFromLocalStorage = (documentId) => {
    const savedUploads = JSON.parse(localStorage.getItem('activeUploads') || '[]');
    const filtered = savedUploads.filter(u => u.documentId !== documentId);
    localStorage.setItem('activeUploads', JSON.stringify(filtered));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
      default:
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
    }
  };

  if (uploads.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 max-w-full z-40 space-y-2">
      {uploads.map(upload => (
        <div key={upload.documentId} className="card shadow-lg border-2 border-gray-200 dark:border-gray-700">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setExpandedUpload(expandedUpload === upload.documentId ? null : upload.documentId)}
          >
            <div className="flex items-center space-x-3 flex-1">
              {getStatusIcon(upload.status)}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {upload.fileName || 'Untitled'}
                </div>
                <div className={`text-xs px-2 py-1 rounded-full inline-block ${getStatusColor(upload.status)}`}>
                  {upload.status === 'processing' ? 'Processing...' : upload.status}
                </div>
              </div>
            </div>
            {(upload.message || upload.progress > 0) && (
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {expandedUpload === upload.documentId ? 
                  <ChevronUp className="w-5 h-5" /> : 
                  <ChevronDown className="w-5 h-5" />
                }
              </button>
            )}
          </div>

          {expandedUpload === upload.documentId && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              {upload.message && (
                <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {upload.message}
                </div>
              )}
              
              {upload.progress > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Progress</span>
                    <span>{upload.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {upload.totalItems > 0 && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {upload.categorizedCount}/{upload.totalItems} items categorized
                </div>
              )}
            </div>
          )}

          {upload.error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-sm text-red-700 dark:text-red-300">
                Error: {upload.error}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

UploadStatus.displayName = 'UploadStatus';

export default UploadStatus;
