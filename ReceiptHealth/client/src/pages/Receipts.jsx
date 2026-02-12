import { useState, useEffect } from 'react';
import { Upload, Search, Filter, Trash2, Eye, Calendar } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const response = await axios.get('/api/receipts');
      setReceipts(response.data);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      // Mock data for demo
      setReceipts([
        { id: 1, vendor: 'Whole Foods', date: '2026-02-10', total: 87.50, itemCount: 12, healthScore: 85 },
        { id: 2, vendor: 'Trader Joe\'s', date: '2026-02-08', total: 54.30, itemCount: 8, healthScore: 78 },
        { id: 3, vendor: 'Target', date: '2026-02-05', total: 142.99, itemCount: 15, healthScore: 45 },
        { id: 4, vendor: 'Costco', date: '2026-02-03', total: 215.40, itemCount: 24, healthScore: 62 }
      ]);
    } finally {
      setLoading(false);
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
                        <button className="text-primary-500 hover:text-primary-600 transition-colors p-2">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => deleteReceipt(receipt.id)}
                          className="text-red-500 hover:text-red-600 transition-colors p-2"
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
    </div>
  );
}

export default Receipts;
