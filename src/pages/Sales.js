import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, DollarSign, Calendar, Minus } from 'lucide-react';
import DatePicker from 'react-datepicker';
import api from '../services/api';

const Sales = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      date: new Date(),
      collectedAmount: 0,
      creditAmount: 0,
      currency: 'OMR'
    }
  });

  const watchedFields = watch(['collectedAmount', 'creditAmount']);

  // Fetch today's sales
  const { data: salesData, isLoading } = useQuery(
    ['sales-today', selectedDate],
    () => {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const params = new URLSearchParams({
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
        limit: 100
      });
      
      return api.get(`/sales?${params}`).then(res => res.data);
    },
    { keepPreviousData: true }
  );

  // Fetch today's expenses
  const { data: expensesData } = useQuery(
    ['expenses-today', selectedDate],
    () => {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const params = new URLSearchParams({
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
        limit: 100
      });
      
      return api.get(`/expenses?${params}`).then(res => res.data);
    },
    { keepPreviousData: true }
  );

  // Create sale mutation
  const createMutation = useMutation(
    (saleData) => api.post('/sales', saleData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['sales-today']);
        queryClient.invalidateQueries('dashboard');
        toast.success('Sale added successfully');
        setIsModalOpen(false);
        reset({
          date: new Date(),
          collectedAmount: 0,
          creditAmount: 0,
          currency: 'OMR'
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add sale');
      }
    }
  );

  // Update sale mutation
  const updateMutation = useMutation(
    ({ id, data }) => api.put(`/sales/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['sales-today']);
        queryClient.invalidateQueries('dashboard');
        toast.success('Sale updated successfully');
        setIsModalOpen(false);
        setEditingSale(null);
        reset({
          date: new Date(),
          collectedAmount: 0,
          creditAmount: 0,
          currency: 'OMR'
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update sale');
      }
    }
  );

  // Delete sale mutation
  const deleteMutation = useMutation(
    (id) => api.delete(`/sales/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['sales-today']);
        queryClient.invalidateQueries('dashboard');
        toast.success('Sale deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete sale');
      }
    }
  );

  const onSubmit = (data) => {
    // Validation
    if (!data.collectedAmount || parseFloat(data.collectedAmount) <= 0) {
      toast.error('Please enter a valid collection amount');
      return;
    }

    const collectedAmount = parseFloat(data.collectedAmount);
    const creditAmount = parseFloat(data.creditAmount || 0);
    const totalAmount = collectedAmount + creditAmount;

    // Format data for simple sales entry
    const formattedData = {
      date: new Date(data.date),
      customerName: data.customerName || 'Walk-in Customer',
      totalAmount: totalAmount,
      collectedAmount: collectedAmount,
      creditAmount: creditAmount,
      status: creditAmount > 0 ? 'pending' : 'paid',
      currency: 'OMR',
      // Simple items array for backend compatibility
      items: [{
        product: null,
        quantity: 1,
        unitPrice: totalAmount,
        totalPrice: totalAmount
      }]
    };

    console.log('📤 Submitting sale data:', formattedData);

    if (editingSale) {
      updateMutation.mutate({ id: editingSale._id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const handleEdit = (sale) => {
    setEditingSale(sale);
    reset({
      date: new Date(sale.date),
      customerName: sale.customerName,
      collectedAmount: sale.collectedAmount,
      creditAmount: sale.creditAmount,
      currency: sale.currency || 'OMR'
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      deleteMutation.mutate(id);
    }
  };

  const openModal = () => {
    setEditingSale(null);
    reset({
      date: selectedDate,
      collectedAmount: 0,
      creditAmount: 0,
      currency: 'OMR'
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

  const sales = salesData?.sales || [];
  const expenses = expensesData?.expenses || [];

  // Calculate day's summary
  const dayTotalCollections = sales.reduce((sum, sale) => sum + sale.collectedAmount, 0);
  const dayTotalCredit = sales.reduce((sum, sale) => sum + sale.creditAmount, 0);
  const dayTotalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const dayNetProfit = dayTotalCollections - dayTotalExpenses;

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {isToday ? "Today's Sales" : `Sales for ${selectedDate.toLocaleDateString()}`}
        </h1>
        <button
          onClick={openModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Sale
        </button>
      </div>

      {/* Date Selector */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-4">
          <Calendar className="h-5 w-5 text-gray-500" />
          <label className="block text-sm font-medium text-gray-700">Select Date:</label>
          <DatePicker
            selected={selectedDate}
            onChange={setSelectedDate}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            dateFormat="yyyy-MM-dd"
            maxDate={new Date()}
          />
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Today
          </button>
        </div>
      </div>

      {/* Day Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Collections</p>
              <p className="text-2xl font-bold text-green-600">OMR {dayTotalCollections.toFixed(3)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Credit</p>
              <p className="text-2xl font-bold text-yellow-600">OMR {dayTotalCredit.toFixed(3)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Minus className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">OMR {dayTotalExpenses.toFixed(3)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${dayNetProfit >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
              <DollarSign className={`h-6 w-6 ${dayNetProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className={`text-2xl font-bold ${dayNetProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                OMR {dayNetProfit.toFixed(3)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Sales Transactions ({sales.length})
          </h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Collection (OMR)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance to Get (OMR)
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
            {sales.map((sale) => (
              <tr key={sale._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(sale.createdAt).toLocaleTimeString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {sale.customerName || 'Walk-in Customer'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                  {sale.collectedAmount.toFixed(3)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {sale.creditAmount > 0 ? (
                    <span className="text-red-600 font-medium">{sale.creditAmount.toFixed(3)}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    sale.creditAmount > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {sale.creditAmount > 0 ? 'CREDIT' : 'PAID'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(sale)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sale._id)}
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

        {sales.length === 0 && (
          <div className="text-center py-8">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sales found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isToday ? "Start by adding today's first sale." : "No sales recorded for this date."}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingSale ? 'Edit Sale' : 'Add New Sale'}
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
                <label className="block text-sm font-medium text-gray-700">Date *</label>
                <DatePicker
                  selected={watch('date')}
                  onChange={(date) => setValue('date', date)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  dateFormat="yyyy-MM-dd"
                  maxDate={new Date()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                <input
                  {...register('customerName')}
                  placeholder="Walk-in Customer"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Collection Amount (OMR) *</label>
                <input
                  {...register('collectedAmount', { 
                    required: 'Collection amount is required',
                    min: { value: 0.001, message: 'Amount must be greater than 0' }
                  })}
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.collectedAmount && <p className="text-red-500 text-xs mt-1">{errors.collectedAmount.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Balance to Get Paid (OMR)</label>
                <input
                  {...register('creditAmount', {
                    min: { value: 0, message: 'Balance cannot be negative' }
                  })}
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.creditAmount && <p className="text-red-500 text-xs mt-1">{errors.creditAmount.message}</p>}
                <p className="text-xs text-gray-500 mt-1">Leave empty if fully paid</p>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Collection:</span>
                  <span className="font-medium">OMR {(parseFloat(watchedFields[0] || 0)).toFixed(3)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Balance:</span>
                  <span className="font-medium text-red-600">OMR {(parseFloat(watchedFields[1] || 0)).toFixed(3)}</span>
                </div>
                <hr className="my-1" />
                <div className="flex justify-between text-sm font-bold">
                  <span>Total Sale:</span>
                  <span>OMR {(parseFloat(watchedFields[0] || 0) + parseFloat(watchedFields[1] || 0)).toFixed(3)}</span>
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
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : (editingSale ? 'Update' : 'Add Sale')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
