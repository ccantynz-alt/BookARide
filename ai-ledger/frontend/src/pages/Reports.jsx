import React, { useState } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  FileText,
  DollarSign,
  Users,
  Calculator,
  Globe,
  Target,
  BookOpen,
  Download,
  Calendar,
  ArrowRight,
  ChevronDown,
  FileSpreadsheet,
  File,
  ToggleLeft,
  ToggleRight,
  Clock,
} from 'lucide-react';

const reports = [
  {
    id: 'pnl',
    name: 'Profit & Loss',
    description: 'Revenue, expenses, and net income over a period',
    icon: TrendingUp,
    color: '#22c55e',
    bgColor: '#f0fdf4',
    category: 'financial',
  },
  {
    id: 'balance-sheet',
    name: 'Balance Sheet',
    description: 'Assets, liabilities, and equity at a point in time',
    icon: BarChart3,
    color: '#3b82f6',
    bgColor: '#eff6ff',
    category: 'financial',
  },
  {
    id: 'cash-flow',
    name: 'Cash Flow Statement',
    description: 'Cash inflows and outflows by operating, investing, and financing',
    icon: DollarSign,
    color: '#14b8a6',
    bgColor: '#f0fdfa',
    category: 'financial',
  },
  {
    id: 'trial-balance',
    name: 'Trial Balance',
    description: 'All account balances to verify debits equal credits',
    icon: Calculator,
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    category: 'financial',
  },
  {
    id: 'general-ledger',
    name: 'General Ledger',
    description: 'Detailed transaction listing for all accounts',
    icon: BookOpen,
    color: '#6366f1',
    bgColor: '#eef2ff',
    category: 'financial',
  },
  {
    id: 'ar-aging',
    name: 'AR Aging',
    description: 'Accounts receivable aging by customer and period',
    icon: Users,
    color: '#f59e0b',
    bgColor: '#fffbeb',
    category: 'receivables',
  },
  {
    id: 'ap-aging',
    name: 'AP Aging',
    description: 'Accounts payable aging by supplier and period',
    icon: FileText,
    color: '#ef4444',
    bgColor: '#fef2f2',
    category: 'payables',
  },
  {
    id: 'tax-summary',
    name: 'Tax Summary',
    description: 'GST/VAT collected and paid for filing returns',
    icon: PieChart,
    color: '#0ea5e9',
    bgColor: '#f0f9ff',
    category: 'tax',
  },
  {
    id: 'treaty-savings',
    name: 'Treaty Savings',
    description: 'Tax treaty benefits and withholding tax savings analysis',
    icon: Globe,
    color: '#14b8a6',
    bgColor: '#f0fdfa',
    category: 'tax',
  },
  {
    id: 'budget-actual',
    name: 'Budget vs Actual',
    description: 'Compare budgeted amounts against actual performance',
    icon: Target,
    color: '#ec4899',
    bgColor: '#fdf2f8',
    category: 'planning',
  },
];

export default function Reports() {
  const [dateRange, setDateRange] = useState({ from: '2026-03-01', to: '2026-03-19' });
  const [compareToggle, setCompareToggle] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Financial reports and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => setCompareToggle(!compareToggle)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700"
        >
          {compareToggle ? (
            <ToggleRight className="w-6 h-6" style={{ color: '#14b8a6' }} />
          ) : (
            <ToggleLeft className="w-6 h-6 text-gray-400" />
          )}
          Compare with prior period
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Export as:</span>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
            <File className="w-4 h-4 text-red-500" />
            PDF
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            Excel
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
            <Download className="w-4 h-4 text-gray-500" />
            CSV
          </button>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <button
            key={report.id}
            onClick={() => setSelectedReport(report.id)}
            className={`text-left bg-white rounded-xl border p-5 hover:shadow-md transition-all group ${
              selectedReport === report.id ? 'border-teal-500 ring-1 ring-teal-500' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ backgroundColor: report.bgColor }}
              >
                <report.icon className="w-5 h-5" style={{ color: report.color }} />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">{report.name}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{report.description}</p>
          </button>
        ))}
      </div>

      {/* Selected Report Preview */}
      {selectedReport && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {reports.find((r) => r.id === selectedReport)?.name}
              </h2>
              <p className="text-sm text-gray-500">
                {dateRange.from} to {dateRange.to}
                {compareToggle && ' (with prior period comparison)'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-all"
                style={{ backgroundColor: '#14b8a6' }}
              >
                View Full Report
              </button>
            </div>
          </div>

          {/* Placeholder Report Content */}
          <div className="border border-gray-200 rounded-lg p-8">
            <div className="space-y-4">
              {selectedReport === 'pnl' && (
                <>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-900">Revenue</span>
                    <span className="text-sm font-semibold text-gray-900">$124,580.00</span>
                  </div>
                  <div className="flex justify-between py-2 pl-4">
                    <span className="text-sm text-gray-600">Sales Revenue</span>
                    <span className="text-sm text-gray-700">$98,200.00</span>
                  </div>
                  <div className="flex justify-between py-2 pl-4">
                    <span className="text-sm text-gray-600">Consulting Revenue</span>
                    <span className="text-sm text-gray-700">$26,380.00</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-900">Expenses</span>
                    <span className="text-sm font-semibold text-red-600">($67,230.00)</span>
                  </div>
                  <div className="flex justify-between py-2 pl-4">
                    <span className="text-sm text-gray-600">Cloud Hosting</span>
                    <span className="text-sm text-gray-700">$4,668.00</span>
                  </div>
                  <div className="flex justify-between py-2 pl-4">
                    <span className="text-sm text-gray-600">Software Subscriptions</span>
                    <span className="text-sm text-gray-700">$2,340.00</span>
                  </div>
                  <div className="flex justify-between py-2 pl-4">
                    <span className="text-sm text-gray-600">Office & Admin</span>
                    <span className="text-sm text-gray-700">$8,120.00</span>
                  </div>
                  <div className="flex justify-between py-2 pl-4">
                    <span className="text-sm text-gray-600">Other Expenses</span>
                    <span className="text-sm text-gray-700">$52,102.00</span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-gray-900 mt-2">
                    <span className="text-base font-bold text-gray-900">Net Profit</span>
                    <span className="text-base font-bold text-green-600">$57,350.00</span>
                  </div>
                </>
              )}
              {selectedReport !== 'pnl' && (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Report loading...</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Click "View Full Report" to generate the complete{' '}
                    {reports.find((r) => r.id === selectedReport)?.name} report
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedReport && (
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Select a report to view</p>
          <p className="text-gray-400 text-sm mt-1">Click on any report card above to see a preview</p>
        </div>
      )}
    </div>
  );
}
