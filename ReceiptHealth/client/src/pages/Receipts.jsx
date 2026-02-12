import { useState, useEffect } from 'react';
import { Upload, Search, Filter, Trash2, Eye, Calendar, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    fetchReceipts();
  }, []);

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

  const viewReceipt = async (id) => {
    try {
      const response = await axios.get(`/api/receipts/${id}`);
      setSelectedReceipt(response.data);
      setShowReceiptModal(true);
    } catch (error) {
      console.error('Error fetching receipt details:', error);
      toast.error('Failed to load receipt details');
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
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      toast.loading('Uploading receipt...', { id: 'upload' });
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Receipt uploaded successfully!', { id: 'upload' });
      
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
    if (!confirm('Are you sure you want to delete this receipt?')) return;
    
    try {
      await axios.delete(`/api/receipts/${id}`);
      toast.success('Receipt deleted');
      fetchReceipts();
    } catch (error) {
      toast.error('Failed to delete receipt');
    }
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Receipts</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
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
        <div className="text-center py-12">
          <Upload className={`w-16 h-16 mx-auto mb-4 ${dragActive ? 'text-primary-500' : 'text-gray-400'}`} />
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            {dragActive ? 'Drop your receipt here' : 'Upload Receipt'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
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
          <label htmlFor="fileInput" className="btn-primary cursor-pointer inline-block">
            Choose Files
          </label>
          <p className="text-sm text-gray-500 mt-4">
            Supports: JPG, PNG, PDF (Max 10MB)
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <button className="btn-secondary flex items-center space-x-2">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Health Score
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {receipt.vendor}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(receipt.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {receipt.lineItemCount || receipt.itemCount || 0} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        ${receipt.total?.toFixed(2) || '0.00'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getHealthScoreColor(receipt.healthScore || 0)}`}>
                        {receipt.healthScore || 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => viewReceipt(receipt.id)}
                          className="text-primary-500 hover:text-primary-600 transition-colors p-2"
                          title="View Receipt Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => deleteReceipt(receipt.id)}
                          className="text-red-500 hover:text-red-600 transition-colors p-2"
                          title="Delete Receipt"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedReceipt.vendor}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>📅 {new Date(selectedReceipt.date).toLocaleDateString()}</span>
                  <span>💰 ${selectedReceipt.total?.toFixed(2)}</span>
                  <span className={`px-2 py-1 rounded ${getHealthScoreColor(selectedReceipt.healthScore || 0)}`}>
                    Health: {selectedReceipt.healthScore || 0}%
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Line Items */}
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Line Items</h3>
              <div className="space-y-2">
                {selectedReceipt.lineItems && selectedReceipt.lineItems.length > 0 ? (
                  selectedReceipt.lineItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 dark:text-white">{item.description}</span>
                        <span className={`ml-2 px-2 py-1 text-xs rounded ${
                          item.category === 'Healthy' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                          item.category === 'Junk' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                          'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                        }`}>
                          {item.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-600 dark:text-gray-400 text-sm">Qty: {item.quantity}</div>
                        <div className="font-semibold text-gray-900 dark:text-white">${item.price?.toFixed(2)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No line items available</p>
                )}
              </div>

              {/* Category Summary */}
              {selectedReceipt.categorySummary && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Category Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-sm text-green-600 dark:text-green-400">Healthy</div>
                      <div className="text-xl font-bold text-green-700 dark:text-green-300">
                        ${selectedReceipt.categorySummary.healthyTotal?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        {selectedReceipt.categorySummary.healthyCount || 0} items
                      </div>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-sm text-red-600 dark:text-red-400">Junk</div>
                      <div className="text-xl font-bold text-red-700 dark:text-red-300">
                        ${selectedReceipt.categorySummary.junkTotal?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-400">
                        {selectedReceipt.categorySummary.junkCount || 0} items
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-sm text-blue-600 dark:text-blue-400">Other</div>
                      <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                        ${selectedReceipt.categorySummary.otherTotal?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        {selectedReceipt.categorySummary.otherCount || 0} items
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Unknown</div>
                      <div className="text-xl font-bold text-gray-700 dark:text-gray-300">
                        ${selectedReceipt.categorySummary.unknownTotal?.toFixed(2) || '0.00'}
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
                  <span>${selectedReceipt.total?.toFixed(2)}</span>
                </div>
                {selectedReceipt.subtotal && (
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <span>Subtotal</span>
                    <span>${selectedReceipt.subtotal?.toFixed(2)}</span>
                  </div>
                )}
                {selectedReceipt.tax && (
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span>Tax</span>
                    <span>${selectedReceipt.tax?.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Receipts;
