import React, { useState } from 'react';
import {
  Search,
  Filter,
  Upload,
  Download,
  Check,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Loader2,
  CheckCircle2,
  Circle,
  AlertCircle,
  MoreHorizontal,
} from 'lucide-react';

const mockTransactions = [
  {
    id: 1,
    date: '2026-03-19',
    description: 'Stripe Payment - Invoice #1042',
    amount: 2450.0,
    type: 'credit',
    account: 'ANZ Business',
    aiCategory: 'Sales Revenue',
    aiConfidence: 98,
    status: 'matched',
    reference: 'STR-20260319-001',
  },
  {
    id: 2,
    date: '2026-03-18',
    description: 'AWS Cloud Services - Monthly',
    amount: -389.5,
    type: 'debit',
    account: 'Westpac Business',
    aiCategory: 'Cloud Hosting',
    aiConfidence: 95,
    status: 'matched',
    reference: 'AWS-MAR-2026',
  },
  {
    id: 3,
    date: '2026-03-18',
    description: 'UBER EATS AUCKLAND NZ',
    amount: -42.5,
    type: 'debit',
    account: 'ANZ Business',
    aiCategory: 'Meals & Entertainment',
    aiConfidence: 72,
    status: 'unmatched',
    reference: 'UBE-001823',
  },
  {
    id: 4,
    date: '2026-03-17',
    description: 'Kiwi Exports Ltd - Consulting',
    amount: 8900.0,
    type: 'credit',
    account: 'ANZ Business',
    aiCategory: 'Consulting Revenue',
    aiConfidence: 94,
    status: 'reconciled',
    reference: 'KEL-Q1-2026',
  },
  {
    id: 5,
    date: '2026-03-17',
    description: 'XERO SUBSCRIPTION',
    amount: -75.0,
    type: 'debit',
    account: 'Westpac Business',
    aiCategory: 'Software Subscriptions',
    aiConfidence: 99,
    status: 'matched',
    reference: 'XER-MAR-26',
  },
  {
    id: 6,
    date: '2026-03-16',
    description: 'TRANSFER FROM SAVINGS',
    amount: 5000.0,
    type: 'credit',
    account: 'ANZ Business',
    aiCategory: 'Internal Transfer',
    aiConfidence: 88,
    status: 'unmatched',
    reference: 'TRF-INT-001',
  },
  {
    id: 7,
    date: '2026-03-16',
    description: 'COUNTDOWN AUCKLAND CBD',
    amount: -67.3,
    type: 'debit',
    account: 'ANZ Business',
    aiCategory: 'Office Supplies',
    aiConfidence: 45,
    status: 'unmatched',
    reference: 'CDN-334821',
  },
  {
    id: 8,
    date: '2026-03-15',
    description: 'Google Workspace - Annual',
    amount: -216.0,
    type: 'debit',
    account: 'Westpac Business',
    aiCategory: 'Software Subscriptions',
    aiConfidence: 97,
    status: 'reconciled',
    reference: 'GOO-ANN-2026',
  },
  {
    id: 9,
    date: '2026-03-15',
    description: 'Southern Cross Media - Payment',
    amount: 3250.0,
    type: 'credit',
    account: 'ANZ Business',
    aiCategory: 'Sales Revenue',
    aiConfidence: 91,
    status: 'matched',
    reference: 'SCM-INV1039',
  },
  {
    id: 10,
    date: '2026-03-14',
    description: 'VODAFONE NZ - MOBILE PLAN',
    amount: -89.0,
    type: 'debit',
    account: 'Westpac Business',
    aiCategory: 'Telecommunications',
    aiConfidence: 96,
    status: 'reconciled',
    reference: 'VOD-MAR-26',
  },
];

const statusConfig = {
  unmatched: { label: 'Unmatched', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertCircle },
  matched: { label: 'Matched', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: Circle },
  reconciled: { label: 'Reconciled', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle2 },
};

export default function Transactions() {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    account: 'all',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
  });
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTransactions = transactions.filter((tx) => {
    if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.status !== 'all' && tx.status !== filters.status) return false;
    if (filters.account !== 'all' && tx.account !== filters.account) return false;
    return true;
  });

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((tx) => tx.id)));
    }
  };

  const handleAcceptAI = (id) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, status: 'matched' } : tx))
    );
  };

  const handleRejectAI = (id) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, aiCategory: '', aiConfidence: 0 } : tx))
    );
  };

  const confidenceColor = (pct) => {
    if (pct >= 90) return '#22c55e';
    if (pct >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const unmatchedCount = transactions.filter((t) => t.status === 'unmatched').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm mt-1">
            {unmatchedCount > 0
              ? `${unmatchedCount} transaction${unmatchedCount > 1 ? 's' : ''} need${unmatchedCount === 1 ? 's' : ''} review`
              : 'All transactions are categorized'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-all"
            style={{ backgroundColor: '#14b8a6' }}
          >
            <Upload className="w-4 h-4" />
            Import CSV/OFX
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-gray-900 placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="unmatched">Unmatched</option>
              <option value="matched">Matched</option>
              <option value="reconciled">Reconciled</option>
            </select>
            <select
              value={filters.account}
              onChange={(e) => setFilters((p) => ({ ...p, account: e.target.value }))}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
            >
              <option value="all">All Accounts</option>
              <option value="ANZ Business">ANZ Business</option>
              <option value="Westpac Business">Westpac Business</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg text-sm font-medium transition-all ${
                showFilters ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date from</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date to</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Min amount</label>
              <input
                type="number"
                value={filters.amountMin}
                onChange={(e) => setFilters((p) => ({ ...p, amountMin: e.target.value }))}
                placeholder="$0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Max amount</label>
              <input
                type="number"
                value={filters.amountMax}
                onChange={(e) => setFilters((p) => ({ ...p, amountMax: e.target.value }))}
                placeholder="$999,999"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm text-blue-700 font-medium">
            {selectedIds.size} transaction{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-all">
              Bulk Categorize
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-all">
              Accept AI Suggestions
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.map((tx) => {
                const sc = statusConfig[tx.status];
                return (
                  <tr
                    key={tx.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedIds.has(tx.id) ? 'bg-teal-50/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(tx.id)}
                        onChange={() => toggleSelect(tx.id)}
                        className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{tx.date}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                      <p className="text-xs text-gray-500">{tx.account} &middot; {tx.reference}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-sm font-semibold flex items-center gap-1 ${
                          tx.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {tx.amount >= 0 ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                        ${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {tx.aiCategory ? (
                        <div className="flex items-center gap-2">
                          <Brain className="w-3.5 h-3.5" style={{ color: '#14b8a6' }} />
                          <span className="text-sm text-gray-700">{tx.aiCategory}</span>
                          <span
                            className="text-xs font-medium px-1.5 py-0.5 rounded"
                            style={{
                              color: confidenceColor(tx.aiConfidence),
                              backgroundColor: `${confidenceColor(tx.aiConfidence)}15`,
                            }}
                          >
                            {tx.aiConfidence}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">No suggestion</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${sc.bg} ${sc.color} border ${sc.border}`}>
                        <sc.icon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {tx.status === 'unmatched' && tx.aiCategory && (
                          <>
                            <button
                              onClick={() => handleAcceptAI(tx.id)}
                              className="p-1.5 rounded-md hover:bg-green-50 text-green-600 transition-colors"
                              title="Accept AI suggestion"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectAI(tx.id)}
                              className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
                              title="Reject AI suggestion"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 transition-colors">
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

        {filteredTransactions.length === 0 && (
          <div className="py-16 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No transactions found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-500">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg border border-gray-300 hover:bg-white text-gray-500 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-700 font-medium px-3">Page 1</span>
            <button className="p-2 rounded-lg border border-gray-300 hover:bg-white text-gray-500 disabled:opacity-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
