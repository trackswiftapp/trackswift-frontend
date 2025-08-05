import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import { Download, FileText, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import api from '../services/api';

const Reports = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  });

  const [generatingPDF, setGeneratingPDF] = useState(null);

  // Fetch invoices for the date range
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery(
    ['invoices-report', dateRange],
    () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        limit: 1000
      });
      return api.get(`/invoices?${params}`).then(res => res.data);
    }
  );

  // Fetch sales for the date range
  const { data: salesData, isLoading: salesLoading } = useQuery(
    ['sales-report', dateRange],
    () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        limit: 1000
      });
      return api.get(`/sales?${params}`).then(res => res.data);
    }
  );

  // Generate Invoice PDF Report
  const generateInvoicesPDF = async () => {
    try {
      setGeneratingPDF('invoices');
      
      const invoices = invoicesData?.invoices || [];
      if (invoices.length === 0) {
        toast.error('No invoices found for the selected date range');
        return;
      }

      console.log('📄 Requesting invoice PDF generation...');

      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
      });

      const response = await api.get(`/reports/invoices/pdf?${params}`, {
        responseType: 'blob'
      });

      // Create download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const startDate = dateRange.startDate.toISOString().split('T')[0];
      const endDate = dateRange.endDate.toISOString().split('T')[0];
      const timestamp = Date.now();
      link.download = `TrackSwift-Invoices-${startDate}-to-${endDate}-${timestamp}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Invoice report downloaded successfully');

    } catch (error) {
      console.error('❌ Invoice PDF generation failed:', error);
      toast.error(error.response?.data?.message || 'Failed to generate invoice report');
    } finally {
      setGeneratingPDF(null);
    }
  };

  // Generate Sales PDF Report
  const generateSalesPDF = async () => {
    try {
      setGeneratingPDF('sales');
      
      const sales = salesData?.sales || [];
      if (sales.length === 0) {
        toast.error('No sales found for the selected date range');
        return;
      }

      console.log('📄 Requesting sales PDF generation...');

      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
      });

      const response = await api.get(`/reports/sales/pdf?${params}`, {
        responseType: 'blob'
      });

      // Create download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const startDate = dateRange.startDate.toISOString().split('T')[0];
      const endDate = dateRange.endDate.toISOString().split('T')[0];
      const timestamp = Date.now();
      link.download = `TrackSwift-Sales-${startDate}-to-${endDate}-${timestamp}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Sales report downloaded successfully');

    } catch (error) {
      console.error('❌ Sales PDF generation failed:', error);
      toast.error(error.response?.data?.message || 'Failed to generate sales report');
    } finally {
      setGeneratingPDF(null);
    }
  };

  const formatCurrency = (amount) => `OMR ${amount?.toFixed(3) || '0.000'}`;

  if (invoicesLoading || salesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const invoices = invoicesData?.invoices || [];
  const sales = salesData?.sales || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Date Range</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <DatePicker
              selected={dateRange.startDate}
              onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              dateFormat="yyyy-MM-dd"
              maxDate={new Date()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <DatePicker
              selected={dateRange.endDate}
              onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              dateFormat="yyyy-MM-dd"
              maxDate={new Date()}
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setDateRange({
                startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                endDate: new Date()
              })}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              This Month
            </button>
            <button
              onClick={() => setDateRange({
                startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
                endDate: new Date()
              })}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              Last 7 Days
            </button>
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Invoice Report */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <FileText className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Invoice Report</h3>
              <p className="text-sm text-gray-600">All invoices for the selected period</p>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Invoices:</span>
              <span className="font-medium">{invoices.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Amount:</span>
              <span className="font-medium">{formatCurrency(invoices.reduce((sum, inv) => sum + (inv.billAmount || 0), 0))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Paid Amount:</span>
              <span className="font-medium text-green-600">{formatCurrency(invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Balance Amount:</span>
              <span className="font-medium text-red-600">{formatCurrency(invoices.reduce((sum, inv) => sum + (inv.balanceAmount || 0), 0))}</span>
            </div>
          </div>

          <button
            onClick={generateInvoicesPDF}
            disabled={invoices.length === 0 || generatingPDF === 'invoices'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingPDF === 'invoices' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Download className="h-4 w-4" />
            )}
            {generatingPDF === 'invoices' ? 'Generating...' : 'Download Invoice Report'}
          </button>
        </div>

        {/* Sales Report */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <Calendar className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sales Report</h3>
              <p className="text-sm text-gray-600">All sales for the selected period</p>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Sales:</span>
              <span className="font-medium">{sales.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Collections:</span>
              <span className="font-medium text-green-600">{formatCurrency(sales.reduce((sum, sale) => sum + (sale.collectedAmount || 0), 0))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Credit:</span>
              <span className="font-medium text-yellow-600">{formatCurrency(sales.reduce((sum, sale) => sum + (sale.creditAmount || 0), 0))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Sales Value:</span>
              <span className="font-medium">{formatCurrency(sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0))}</span>
            </div>
          </div>

          <button
            onClick={generateSalesPDF}
            disabled={sales.length === 0 || generatingPDF === 'sales'}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingPDF === 'sales' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Download className="h-4 w-4" />
            )}
            {generatingPDF === 'sales' ? 'Generating...' : 'Download Sales Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
