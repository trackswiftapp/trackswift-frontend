import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Plus, Search, Edit, Trash2, Download, FileText, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import api from '../services/api';
import "react-datepicker/dist/react-datepicker.css";

const Invoices = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      date: new Date(),
      paidAmount: 0,
      currency: 'OMR'
    }
  });

  const watchedFields = watch(['billAmount', 'paidAmount']);

  // Fetch vendors for dropdown
  const { data: vendorsData } = useQuery(
    'vendors-all',
    async () => {
      const response = await api.get('/vendors?limit=1000');
      console.log('📋 Vendors loaded:', response.data);
      return response.data;
    },
    { 
      staleTime: 5 * 60 * 1000,
      onError: (error) => {
        console.error('❌ Error fetching vendors:', error);
        toast.error('Failed to load vendors');
      }
    }
  );

  // Fetch invoices
  const { data: invoicesData, isLoading } = useQuery(
    ['invoices', searchTerm, selectedVendor, selectedStatus, currentPage],
    async () => {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });
      if (searchTerm) params.append('search', searchTerm);
      if (selectedVendor) params.append('vendor', selectedVendor);
      if (selectedStatus) params.append('status', selectedStatus);
      
      console.log('🔍 Fetching invoices with params:', params.toString());
      const response = await api.get(`/invoices?${params}`);
      console.log('📋 Invoices loaded:', response.data);
      return response.data;
    },
    { 
      keepPreviousData: true,
      onError: (error) => {
        console.error('❌ Error fetching invoices:', error);
        toast.error('Failed to load invoices');
      }
    }
  );

  // Create invoice mutation
  const createMutation = useMutation(
    async (invoiceData) => {
      console.log('📤 Creating invoice:', invoiceData);
      const response = await api.post('/invoices', invoiceData);
      console.log('✅ Invoice created:', response.data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices');
        queryClient.invalidateQueries('vendors');
        queryClient.invalidateQueries('dashboard');
        toast.success('Invoice created successfully');
        setIsModalOpen(false);
        reset({
          date: new Date(),
          paidAmount: 0,
          currency: 'OMR'
        });
      },
      onError: (error) => {
        console.error('❌ Error creating invoice:', error);
        const errorMessage = error.response?.data?.message || 'Failed to create invoice';
        const validationErrors = error.response?.data?.errors;
        
        if (validationErrors && Array.isArray(validationErrors)) {
          validationErrors.forEach(err => toast.error(err));
        } else {
          toast.error(errorMessage);
        }
      }
    }
  );

  // Update invoice mutation
  const updateMutation = useMutation(
    async ({ id, data }) => {
      console.log('📝 Updating invoice:', id, data);
      const response = await api.put(`/invoices/${id}`, data);
      console.log('✅ Invoice updated:', response.data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices');
        queryClient.invalidateQueries('vendors');
        queryClient.invalidateQueries('dashboard');
        toast.success('Invoice updated successfully');
        setIsModalOpen(false);
        setEditingInvoice(null);
        reset({
          date: new Date(),
          paidAmount: 0,
          currency: 'OMR'
        });
      },
      onError: (error) => {
        console.error('❌ Error updating invoice:', error);
        const errorMessage = error.response?.data?.message || 'Failed to update invoice';
        toast.error(errorMessage);
      }
    }
  );

  // Delete invoice mutation
  const deleteMutation = useMutation(
    async (id) => {
      console.log('🗑️ Deleting invoice:', id);
      const response = await api.delete(`/invoices/${id}`);
      console.log('✅ Invoice deleted:', response.data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices');
        queryClient.invalidateQueries('vendors');
        queryClient.invalidateQueries('dashboard');
        toast.success('Invoice deleted successfully');
      },
      onError: (error) => {
        console.error('❌ Error deleting invoice:', error);
        toast.error(error.response?.data?.message || 'Failed to delete invoice');
      }
    }
  );

  const onSubmit = (data) => {
    console.log('📝 Form submitted with data:', data);

    // Validation
    if (!data.vendor) {
      toast.error('Please select a vendor');
      return;
    }

    if (!data.invoiceNumber) {
      toast.error('Please enter an invoice number');
      return;
    }

    if (!data.billAmount || parseFloat(data.billAmount) <= 0) {
      toast.error('Please enter a valid bill amount');
      return;
    }

    // Format data
    const billAmount = parseFloat(data.billAmount);
    const paidAmount = parseFloat(data.paidAmount || 0);
    const balanceAmount = billAmount - paidAmount;
    const status = balanceAmount <= 0 ? 'paid' : 'pending';

    const formattedData = {
      vendor: data.vendor,
      invoiceNumber: data.invoiceNumber.trim(),
      date: new Date(data.date),
      billAmount,
      paidAmount,
      balanceAmount,
      status,
      description: data.description?.trim() || '',
      currency: 'OMR'
    };

    console.log('📤 Formatted data for submission:', formattedData);
    console.log('📊 Data types check:', {
      vendor: typeof formattedData.vendor,
      invoiceNumber: typeof formattedData.invoiceNumber,
      date: formattedData.date instanceof Date,
      billAmount: typeof formattedData.billAmount,
      paidAmount: typeof formattedData.paidAmount,
      balanceAmount: typeof formattedData.balanceAmount,
      status: typeof formattedData.status
    });

    if (editingInvoice) {
      updateMutation.mutate({ id: editingInvoice._id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const handleEdit = (invoice) => {
    console.log('✏️ Editing invoice:', invoice);
    setEditingInvoice(invoice);
    reset({
      vendor: invoice.vendor?._id || invoice.vendor,
      invoiceNumber: invoice.invoiceNumber,
      date: new Date(invoice.date),
      billAmount: invoice.billAmount,
      paidAmount: invoice.paidAmount,
      description: invoice.description || '',
      currency: invoice.currency || 'OMR'
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteMutation.mutate(id);
    }
  };

  const downloadPDF = async (invoiceId, invoiceNumber) => {
    try {
      console.log('📄 Downloading PDF for invoice:', invoiceId);
      const response = await api.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('❌ PDF download failed:', error);
      toast.error('Failed to download PDF');
    }
  };

  const openModal = () => {
    setEditingInvoice(null);
    reset({
      date: new Date(),
      paidAmount: 0,
      currency: 'OMR'
    });
    setIsModalOpen(true);
  };

  // Calculate balance amount for display
  const billAmountValue = parseFloat(watchedFields[0] || 0);
  const paidAmountValue = parseFloat(watchedFields[1] || 0);
  const balanceAmountDisplay = billAmountValue - paidAmountValue;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const invoices = invoicesData?.invoices || [];
  const vendors = vendorsData?.vendors || [];
  const pagination = invoicesData?.pagination || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
        <button
          onClick={openModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <select
          value={selectedVendor}
          onChange={(e) => setSelectedVendor(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Vendors</option>
          {vendors.map(vendor => (
            <option key={vendor._id} value={vendor._id}>{vendor.name}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount (OMR)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance (OMR)
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
            {invoices.map((invoice) => (
              <tr key={invoice._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {invoice.invoiceNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {invoice.vendor?.name || 'Unknown Vendor'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(invoice.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {invoice.billAmount.toFixed(3)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {invoice.balanceAmount.toFixed(3)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {invoice.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => downloadPDF(invoice._id, invoice.invoiceNumber)}
                      className="text-green-600 hover:text-green-900"
                      title="Download PDF"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(invoice)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit Invoice"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(invoice._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Invoice"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {invoices.length === 0 && (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first invoice.
            </p>
            <div className="mt-6">
              <button
                onClick={openModal}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Invoice
              </button>
            </div>
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
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingInvoice ? 'Edit Invoice' : 'Add New Invoice'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Vendor *</label>
                <select
                  {...register('vendor', { required: 'Please select a vendor' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor._id} value={vendor._id}>{vendor.name}</option>
                  ))}
                </select>
                {errors.vendor && <p className="text-red-500 text-xs mt-1">{errors.vendor.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Invoice Number *</label>
                <input
                  {...register('invoiceNumber', { 
                    required: 'Invoice number is required',
                    minLength: { value: 1, message: 'Invoice number cannot be empty' }
                  })}
                  placeholder="e.g., INV-001"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.invoiceNumber && <p className="text-red-500 text-xs mt-1">{errors.invoiceNumber.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date *</label>
                <DatePicker
                  selected={watch('date')}
                  onChange={(date) => setValue('date', date)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select date"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Bill Amount (OMR) *</label>
                <input
                  {...register('billAmount', { 
                    required: 'Bill amount is required',
                    min: { value: 0.001, message: 'Amount must be greater than 0' }
                  })}
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.billAmount && <p className="text-red-500 text-xs mt-1">{errors.billAmount.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Paid Amount (OMR)</label>
                <input
                  {...register('paidAmount', {
                    min: { value: 0, message: 'Paid amount cannot be negative' },
                    max: { value: billAmountValue, message: 'Paid amount cannot exceed bill amount' }
                  })}
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.paidAmount && <p className="text-red-500 text-xs mt-1">{errors.paidAmount.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Balance Amount (OMR)</label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  <span className={`font-medium ${balanceAmountDisplay > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {balanceAmountDisplay.toFixed(3)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder="Optional description..."
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
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
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : (editingInvoice ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
