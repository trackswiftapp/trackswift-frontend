import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Plus, Search, Edit, Trash2, AlertTriangle, Package } from 'lucide-react';
import api from '../services/api';

const Inventory = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Fetch inventory items
  const { data: inventoryData, isLoading } = useQuery(
    ['inventory', searchTerm, selectedCategory, showLowStock, currentPage],
    () => {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (showLowStock) params.append('lowStock', 'true');
      
      return api.get(`/inventory?${params}`).then(res => res.data);
    },
    { keepPreviousData: true }
  );

  // Create item mutation
  const createMutation = useMutation(
    (itemData) => api.post('/inventory', itemData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('inventory');
        toast.success('Inventory item created successfully');
        setIsModalOpen(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create inventory item');
      }
    }
  );

  // Update item mutation
  const updateMutation = useMutation(
    ({ id, data }) => api.put(`/inventory/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('inventory');
        toast.success('Inventory item updated successfully');
        setIsModalOpen(false);
        setEditingItem(null);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update inventory item');
      }
    }
  );

  // Delete item mutation
  const deleteMutation = useMutation(
    (id) => api.delete(`/inventory/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('inventory');
        toast.success('Inventory item deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete inventory item');
      }
    }
  );

  const onSubmit = (data) => {
    const formattedData = {
      ...data,
      boughtPrice: parseFloat(data.boughtPrice),
      sellingPrice: parseFloat(data.sellingPrice),
      currentStock: parseInt(data.currentStock),
      minimumStock: parseInt(data.minimumStock)
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem._id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    reset(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      deleteMutation.mutate(id);
    }
  };

  const openModal = () => {
    setEditingItem(null);
    reset({
      currency: 'OMR',
      currentStock: 0,
      minimumStock: 1
    });
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const items = inventoryData?.items || [];
  const pagination = inventoryData?.pagination || {};

  // Get unique categories
  const categories = [...new Set(items.map(item => item.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <button
          onClick={openModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showLowStock}
            onChange={(e) => setShowLowStock(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <span className="ml-2 text-sm text-gray-700">Low Stock Only</span>
        </label>
      </div>

      {/* Inventory Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prices (OMR)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Value (OMR)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item._id} className={item.lowStockAlert ? 'bg-red-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.category || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    Current: {item.currentStock}
                  </div>
                  <div className="text-sm text-gray-500">
                    Min: {item.minimumStock}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    Buy: {item.boughtPrice.toFixed(3)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Sell: {item.sellingPrice.toFixed(3)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.stockValue.toFixed(3)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.lowStockAlert ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Low Stock
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      In Stock
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {items.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No inventory items found
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * 10) + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={pagination.page === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">SKU *</label>
                <input
                  {...register('sku', { required: 'SKU is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input
                  {...register('category')}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bought Price (OMR) *</label>
                  <input
                    {...register('boughtPrice', { 
                      required: 'Bought price is required',
                      min: { value: 0, message: 'Price must be positive' }
                    })}
                    type="number"
                    step="0.001"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.boughtPrice && <p className="text-red-500 text-xs mt-1">{errors.boughtPrice.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Selling Price (OMR) *</label>
                  <input
                    {...register('sellingPrice', { 
                      required: 'Selling price is required',
                      min: { value: 0, message: 'Price must be positive' }
                    })}
                    type="number"
                    step="0.001"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.sellingPrice && <p className="text-red-500 text-xs mt-1">{errors.sellingPrice.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Stock *</label>
                  <input
                    {...register('currentStock', { 
                      required: 'Current stock is required',
                      min: { value: 0, message: 'Stock must be non-negative' }
                    })}
                    type="number"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.currentStock && <p className="text-red-500 text-xs mt-1">{errors.currentStock.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Minimum Stock *</label>
                  <input
                    {...register('minimumStock', { 
                      required: 'Minimum stock is required',
                      min: { value: 0, message: 'Stock must be non-negative' }
                    })}
                    type="number"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.minimumStock && <p className="text-red-500 text-xs mt-1">{errors.minimumStock.message}</p>}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
