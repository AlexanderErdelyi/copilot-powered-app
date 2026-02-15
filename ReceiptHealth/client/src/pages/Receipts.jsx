import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Search, Filter, Trash2, Calendar, X, Camera } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import UploadStatus from '../components/UploadStatus';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatCurrency } from '../utils/currency';

function Receipts() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  
  // Category editing state
  const [editingItemId, setEditingItemId] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  // Camera state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Upload status tracking
  const uploadStatusRef = useRef(null);

  useEffect(() => {
    fetchReceipts();
    fetchCategories();
  }, []);

  // Open receipt modal if ID is in URL
  useEffect(() => {
    if (id) {
      viewReceipt(id);
    }
  }, [id]);

  // Close category selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCategorySelector && !event.target.closest('.category-selector-container')) {
        setShowCategorySelector(false);
        setEditingItemId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategorySelector]);

  const fetchReceipts = async () => {
    try {
      const response = await axios.get('/api/receipts');
      setReceipts(response.data);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setAvailableCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const updateLineItemCategory = async (lineItemId, categoryId) => {
    try {
      await axios.put(`/api/lineitems/${lineItemId}/category`, { categoryId });
      toast.success('Category updated!');
      
      // Refresh the receipt details
      if (selectedReceipt) {
        const response = await axios.get(`/api/receipts/${selectedReceipt.id}`);
        setSelectedReceipt(response.data);
      }
      
      // Refresh receipts list
      fetchReceipts();
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    } finally {
      setEditingItemId(null);
      setShowCategorySelector(false);
    }
  };

  const viewReceipt = async (receiptId) => {
    try {
      const response = await axios.get(`/api/receipts/${receiptId}`);
      setSelectedReceipt(response.data);
      setShowReceiptModal(true);
    } catch (error) {
      console.error('Error fetching receipt details:', error);
      toast.error('Failed to load receipt details');
      // If viewing from URL and receipt not found, navigate back to receipts list
      if (id) {
        navigate('/receipts');
      }
    }
  };

  const closeReceiptModal = () => {
    setShowReceiptModal(false);
    // If we came from a URL with ID, navigate back to clean receipts URL
    if (id) {
      navigate('/receipts');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    const formData = new FormData();
    const fileArray = Array.from(files);
    
    fileArray.forEach(file => {
      formData.append('files', file);
    });

    try {
      toast.loading('Uploading receipt...', { id: 'upload' });
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.dismiss('upload');
      
      // Check for duplicates vs new uploads
      const uploads = response.data?.uploads || [];
      const duplicates = uploads.filter(u => u.status === 'duplicate');
      const newUploads = uploads.filter(u => u.status !== 'duplicate');
      
      if (duplicates.length > 0 && newUploads.length === 0) {
        toast('This receipt was already uploaded', { id: 'upload', icon: '⚠️' });
      } else if (duplicates.length > 0) {
        toast.success(`${newUploads.length} new receipt(s) uploaded, ${duplicates.length} duplicate(s) skipped`, { id: 'upload' });
      } else {
        toast.success('Receipt uploaded successfully!', { id: 'upload' });
      }
      
      // Track upload status for each file
      if (response.data && response.data.uploads) {
        response.data.uploads.forEach((upload) => {
          if (uploadStatusRef.current && upload.id && upload.status !== 'duplicate') {
            uploadStatusRef.current.addUpload(upload.id, upload.fileName);
          }
        });
      }
      
      // Wait a bit for processing, then refresh
      setTimeout(() => {
        fetchReceipts();
      }, 2000);
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error('Failed to upload receipt', { id: 'upload' });
    }
  };

  const deleteReceipt = async (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Receipt',
      message: 'Are you sure you want to delete this receipt? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await axios.delete(`/api/receipts/${id}`);
          toast.success('Receipt deleted');
          fetchReceipts();
        } catch (error) {
          toast.error('Failed to delete receipt');
        }
      }
    });
  };

  // Camera handlers
  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setShowCameraModal(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Failed to access camera');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      // Use higher quality JPEG encoding (0.95 quality)
      canvasRef.current.toBlob(async (blob) => {
        setCapturedImage(URL.createObjectURL(blob));
      }, 'image/jpeg', 0.95);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const uploadCapturedPhoto = async () => {
    if (!capturedImage) return;
    
    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
      
      const formData = new FormData();
      formData.append('files', file);
      
      toast.loading('Uploading receipt...', { id: 'upload' });
      const uploadResponse = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Receipt uploaded successfully!', { id: 'upload' });
      
      // Track upload status
      if (uploadResponse.data && uploadResponse.data.uploads) {
        uploadResponse.data.uploads.forEach((upload) => {
          if (uploadStatusRef.current && upload.id && upload.status !== 'duplicate') {
            uploadStatusRef.current.addUpload(upload.id, upload.fileName);
          }
        });
      }
      
      closeCamera();
      setTimeout(() => fetchReceipts(), 2000);
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error('Failed to upload receipt', { id: 'upload' });
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
    setShowCameraModal(false);
  };

  const filteredReceipts = receipts.filter(receipt => 
    receipt.vendor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getHealthScoreColor = (score) => {
    if (score >= 70) return 'text-green-500 bg-green-100 dark:bg-green-900';
    if (score >= 40) return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900';
    return 'text-red-500 bg-red-100 dark:bg-red-900';
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Receipts</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
          Upload and manage your receipts
        </p>
      </div>

      {/* Upload area */}
      <div
        className={`card border-2 border-dashed transition-all duration-200 ${
          dragActive 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
            : 'border-gray-300 dark:border-gray-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center py-3 sm:py-4">
          <Upload className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 ${dragActive ? 'text-primary-500' : 'text-gray-400'}`} />
          <h3 className="text-sm sm:text-base font-semibold mb-1 text-gray-900 dark:text-white">
            {dragActive ? 'Drop your receipt here' : 'Upload Receipt'}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
            Drag and drop your receipt image or PDF, or click to browse
          </p>
          <input
            type="file"
            id="fileInput"
            className="hidden"
            accept="image/*,.pdf"
            multiple
            onChange={handleFileInput}
          />
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
            <label htmlFor="fileInput" className="btn-primary cursor-pointer inline-block text-sm sm:text-base">
              Choose Files
            </label>
            <button onClick={openCamera} className="btn-secondary flex items-center justify-center space-x-2 text-sm sm:text-base">
              <Camera className="w-4 h-4" />
              <span>Take Photo</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            JPG, PNG, PDF (Max 10MB)
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Search by vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-9 sm:pl-10 text-sm sm:text-base"
          />
        </div>
        <button className="btn-secondary flex items-center justify-center space-x-2 text-sm sm:text-base">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Receipts table */}
      {loading ? (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Health Score
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReceipts.map((receipt) => (
                  <tr 
                    key={receipt.id} 
                    onClick={() => viewReceipt(receipt.id)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-none">
                        {receipt.vendor}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="hidden sm:inline">{new Date(receipt.date).toLocaleDateString()}</span>
                        <span className="sm:hidden">{new Date(receipt.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {receipt.lineItemCount || receipt.itemCount || 0} items
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(receipt.total, receipt.currency)}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getHealthScoreColor(receipt.healthScore || 0)}`}>
                        {receipt.healthScore || 0}%
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteReceipt(receipt.id);
                        }}
                        className="text-red-500 hover:text-red-600 transition-colors p-1.5 sm:p-2"
                        title="Delete Receipt"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredReceipts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No receipts found</p>
            </div>
          )}
        </div>
      )}

      {/* Receipt Details Modal */}
      {showReceiptModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex justify-between items-start gap-3 z-10">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 truncate">
                  {selectedReceipt.vendor}
                </h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <span>📅 {new Date(selectedReceipt.date).toLocaleDateString()}</span>
                  <span>💰 {formatCurrency(selectedReceipt.total, selectedReceipt.currency)}</span>
                  <span className={`px-2 py-1 rounded text-xs ${getHealthScoreColor(selectedReceipt.healthScore || 0)}`}>
                    Health: {selectedReceipt.healthScore || 0}%
                  </span>
                </div>
              </div>
              <button
                onClick={closeReceiptModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {/* Line Items */}
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">Line Items</h3>
              <div className="space-y-2">
                {selectedReceipt.lineItems && selectedReceipt.lineItems.length > 0 ? (
                  selectedReceipt.lineItems.map((item, index) => {
                    // Find the category to get its color
                    const category = availableCategories.find(c => c.name === item.category);
                    const categoryColor = category?.color || '#6b7280'; // fallback to gray
                    
                    return (
                    <div key={index} className="flex justify-between items-start p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base block">{item.description}</span>
                        <div className="relative inline-block category-selector-container mt-1">
                          <button
                            onClick={() => {
                              setEditingItemId(item.id);
                              setShowCategorySelector(true);
                            }}
                            className="px-2 py-1 text-xs rounded cursor-pointer hover:opacity-80 transition-opacity text-white font-medium"
                            style={{ backgroundColor: categoryColor }}
                            title="Click to change category"
                          >
                            {item.category} ✏️
                          </button>
                          
                          {/* Category Selector Dropdown */}
                          {showCategorySelector && editingItemId === item.id && (
                            <div className="absolute left-0 top-full mt-1 z-[9999] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg min-w-[150px]">
                              <div className="py-1">
                                {availableCategories.map((category) => (
                                  <button
                                    key={category.id}
                                    onClick={() => updateLineItemCategory(item.id, category.id)}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <span>{category.icon}</span>
                                    <span className="text-gray-900 dark:text-white">{category.name}</span>
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => {
                                  setEditingItemId(null);
                                  setShowCategorySelector(false);
                                }}
                                className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-t border-gray-200 dark:border-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Qty: {item.quantity}</div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{formatCurrency(item.price, selectedReceipt.currency)}</div>
                      </div>
                    </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No line items available</p>
                )}
              </div>

              {/* Category Summary */}
              {selectedReceipt.categorySummary && (
                <div className="mt-4 sm:mt-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">Category Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-xs sm:text-sm text-green-600 dark:text-green-400">Healthy</div>
                      <div className="text-lg sm:text-xl font-bold text-green-700 dark:text-green-300">
                        {formatCurrency(selectedReceipt.categorySummary.healthyTotal, selectedReceipt.currency)}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        {selectedReceipt.categorySummary.healthyCount || 0} items
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-xs sm:text-sm text-red-600 dark:text-red-400">Junk</div>
                      <div className="text-lg sm:text-xl font-bold text-red-700 dark:text-red-300">
                        {formatCurrency(selectedReceipt.categorySummary.junkTotal, selectedReceipt.currency)}
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-400">
                        {selectedReceipt.categorySummary.junkCount || 0} items
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">Other</div>
                      <div className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-300">
                        {formatCurrency(selectedReceipt.categorySummary.otherTotal, selectedReceipt.currency)}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        {selectedReceipt.categorySummary.otherCount || 0} items
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Unknown</div>
                      <div className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300">
                        {formatCurrency(selectedReceipt.categorySummary.unknownTotal, selectedReceipt.currency)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {selectedReceipt.categorySummary.unknownCount || 0} items
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>{formatCurrency(selectedReceipt.total, selectedReceipt.currency)}</span>
                </div>
                {selectedReceipt.subtotal && (
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedReceipt.subtotal, selectedReceipt.currency)}</span>
                  </div>
                )}
                {selectedReceipt.tax && (
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span>Tax</span>
                    <span>{formatCurrency(selectedReceipt.tax, selectedReceipt.currency)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {capturedImage ? 'Preview' : 'Take Photo'}
              </h2>
              <button onClick={closeCamera} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {!capturedImage ? (
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-auto max-h-[60vh]"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              ) : (
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <img
                    src={capturedImage}
                    alt="Captured receipt"
                    className="w-full h-auto max-h-[60vh] object-contain"
                  />
                </div>
              )}

              <div className="flex gap-2 sm:gap-3">
                {!capturedImage ? (
                  <button onClick={capturePhoto} className="btn-primary flex-1 text-sm sm:text-base">
                    Capture
                  </button>
                ) : (
                  <>
                    <button onClick={retakePhoto} className="btn-secondary flex-1 text-sm sm:text-base">
                      Retake
                    </button>
                    <button onClick={uploadCapturedPhoto} className="btn-primary flex-1 text-sm sm:text-base">
                      Upload
                    </button>
                  </>
                )}
                <button onClick={closeCamera} className="btn-secondary text-sm sm:text-base">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <UploadStatus ref={uploadStatusRef} />
      
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

export default Receipts;
