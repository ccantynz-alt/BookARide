import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Send,
  CreditCard,
  Ban,
  MoreHorizontal,
  FileText,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Download,
} from 'lucide-react';

const mockInvoices = [
  { id: 'INV-1042', contact: 'Pacific Trading Co', date: '2026-03-15', dueDate: '2026-04-14', amount: 4200.0, currency: 'NZD', status: 'sent' },
  { id: 'INV-1041', contact: 'Kiwi Exports Ltd', date: '2026-03-12', dueDate: '2026-04-11', amount: 8900.0, currency: 'NZD', status: 'paid' },
  { id: 'INV-1040', contact: 'Southern Cross Media', date: '2026-03-10', dueDate: '2026-03-25', amount: 1750.0, currency: 'NZD', status: 'overdue' },
  { id: 'INV-1039', contact: 'Auckland Digital Agency', date: '2026-03-08', dueDate: '2026-04-07', amount: 3250.0, currency: 'NZD', status: 'paid' },
  { id: 'INV-1038', contact: 'Pacific Trading Co', date: '2026-03-05', dueDate: '2026-03-05', amount: 4200.0, currency: 'NZD', status: 'overdue' },
  { id: 'INV-1037', contact: 'TechStart NZ', date: '2026-03-01', dueDate: '2026-03-31', amount: 12500.0, currency: 'NZD', status: 'sent' },
  { id: 'INV-1036', contact: 'Melbourne Imports Pty', date: '2026-02-28', dueDate: '2026-03-28', amount: 6800.0, currency: 'AUD', status: 'sent' },
  { id: 'INV-1035', contact: 'Wellington Consulting', date: '2026-02-25', dueDate: '2026-03-25', amount: 2100.0, currency: 'NZD', status: 'draft' },
  { id: 'INV-1034', contact: 'Christchurch Motors', date: '2026-02-20', dueDate: '2026-03-20', amount: 950.0, currency: 'NZD', status: 'paid' },
  { id: 'INV-1033', contact: 'London Bridge Ventures', date: '2026-02-15', dueDate: '2026-03-15', amount: 5400.0, currency: 'GBP', status: 'overdue' },
];

const statusConfig = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700', icon: Edit3 },
  sent: { label: 'Sent', bg: 'bg-blue-50', text: 'text-blue-700', icon: Send },
  paid: { label: 'Paid', bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle2 },
  overdue: { label: 'Overdue', bg: 'bg-red-50', text: 'text-red-700', icon: AlertCircle },
};

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
];

export default function Invoices() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = mockInvoices.filter((inv) => {
    if (activeTab !== 'all' && inv.status !== activeTab) return false;
    if (search && !inv.contact.toLowerCase().includes(search.toLowerCase()) && !inv.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: mockInvoices.length,
    draft: mockInvoices.filter((i) => i.status === 'draft').length,
    sent: mockInvoices.filter((i) => i.status === 'sent').length,
    paid: mockInvoices.filter((i) => i.status === 'paid').length,
    overdue: mockInvoices.filter((i) => i.status === 'overdue').length,
  };

  const overdueTotal = mockInvoices
    .filter((i) => i.status === 'overdue')
    .reduce((sum, i) => sum + i.amount, 0);

  const agingSummary = [
    { range: '1-15 days', count: 1, amount: 1750 },
    { range: '16-30 days', count: 1, amount: 4200 },
    { range: '31-60 days', count: 1, amount: 5400 },
    { range: '60+ days', count: 0, amount: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track your invoices</p>
        </div>
        <Link
          to="/invoices/new"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-all"
          style={{ backgroundColor: '#14b8a6' }}
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </Link>
      </div>

      {/* Overdue Aging Summary */}
      {counts.overdue > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-red-800">
              Overdue: ${overdueTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {agingSummary.map((a) => (
              <div key={a.range} className="bg-white rounded-lg p-3 border border-red-100">
                <p className="text-xs text-gray-500">{a.range}</p>
                <p className="text-lg font-bold text-gray-900">
                  ${a.amount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">{a.count} invoice{a.count !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.key
                    ? 'border-teal-500 text-teal-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((inv) => {
                const sc = statusConfig[inv.status];
                return (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium" style={{ color: '#14b8a6' }}>
                        {inv.id}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-900">{inv.contact}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{inv.date}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{inv.dueDate}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">
                      {inv.currency === 'NZD' ? '$' : inv.currency === 'AUD' ? 'A$' : '\u00a3'}
                      {inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      {inv.currency !== 'NZD' && (
                        <span className="text-xs text-gray-400 ml-1">{inv.currency}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                        <sc.icon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        {inv.status === 'draft' && (
                          <button className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition-colors" title="Send">
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {(inv.status === 'sent' || inv.status === 'overdue') && (
                          <button className="p-1.5 rounded-md hover:bg-green-50 text-green-600 transition-colors" title="Record payment">
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 transition-colors" title="Download PDF">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 transition-colors" title="More">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No invoices found</p>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab !== 'all' ? 'Try a different filter' : 'Create your first invoice to get started'}
            </p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-500">
            Showing {filtered.length} of {mockInvoices.length} invoices
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg border border-gray-300 hover:bg-white text-gray-500">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-700 font-medium px-3">Page 1</span>
            <button className="p-2 rounded-lg border border-gray-300 hover:bg-white text-gray-500">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
