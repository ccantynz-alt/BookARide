import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  CreditCard,
  Brain,
  AlertCircle,
  Calendar,
  Wallet,
  Lightbulb,
  Plus,
  ChevronRight,
  RefreshCw,
  Loader2,
  Building2,
  ExternalLink,
} from 'lucide-react';

const mockCards = [
  {
    title: 'Revenue',
    value: '$124,580',
    change: '+12.5%',
    positive: true,
    icon: TrendingUp,
    color: '#22c55e',
    bgColor: '#f0fdf4',
  },
  {
    title: 'Expenses',
    value: '$67,230',
    change: '+3.2%',
    positive: false,
    icon: TrendingDown,
    color: '#ef4444',
    bgColor: '#fef2f2',
  },
  {
    title: 'Net Profit',
    value: '$57,350',
    change: '+24.1%',
    positive: true,
    icon: DollarSign,
    color: '#14b8a6',
    bgColor: '#f0fdfa',
  },
  {
    title: 'Cash Balance',
    value: '$203,440',
    change: '+8.7%',
    positive: true,
    icon: Wallet,
    color: '#3b82f6',
    bgColor: '#eff6ff',
  },
];

const recentTransactions = [
  { id: 1, description: 'Stripe Payment - Invoice #1042', amount: '+$2,450.00', type: 'income', date: 'Mar 19, 2026', category: 'Sales Revenue', account: 'ANZ Business' },
  { id: 2, description: 'AWS Cloud Services', amount: '-$389.50', type: 'expense', date: 'Mar 18, 2026', category: 'Cloud Hosting', account: 'Westpac' },
  { id: 3, description: 'Office Supplies - Warehouse Stationery', amount: '-$127.80', type: 'expense', date: 'Mar 18, 2026', category: 'Office Expenses', account: 'ANZ Business' },
  { id: 4, description: 'Client Payment - Kiwi Exports Ltd', amount: '+$8,900.00', type: 'income', date: 'Mar 17, 2026', category: 'Consulting Revenue', account: 'ANZ Business' },
  { id: 5, description: 'Xero Subscription', amount: '-$75.00', type: 'expense', date: 'Mar 17, 2026', category: 'Software', account: 'Westpac' },
];

const overdueInvoices = [
  { id: 'INV-1038', contact: 'Pacific Trading Co', amount: '$4,200.00', dueDate: 'Mar 5, 2026', daysOverdue: 14 },
  { id: 'INV-1035', contact: 'Southern Cross Media', amount: '$1,750.00', dueDate: 'Feb 28, 2026', daysOverdue: 19 },
];

const taxDeadlines = [
  { name: 'NZ GST Return (Period 5)', date: 'Mar 28, 2026', daysLeft: 9, jurisdiction: 'NZ' },
  { name: 'AU BAS Quarterly', date: 'Apr 28, 2026', daysLeft: 40, jurisdiction: 'AU' },
  { name: 'US Quarterly Estimated Tax', date: 'Apr 15, 2026', daysLeft: 27, jurisdiction: 'US' },
];

const aiInsights = [
  {
    title: 'Cash Flow Alert',
    message: 'Based on your current burn rate and receivables, cash reserves will drop below $150K by April 15. Consider following up on 3 outstanding invoices totaling $12,450.',
    type: 'warning',
  },
  {
    title: 'Tax Treaty Savings',
    message: 'Your NZ-AU tax treaty applies to $23,400 in cross-border payments this quarter. Estimated withholding tax savings: $2,340.',
    type: 'success',
  },
  {
    title: 'Expense Anomaly',
    message: 'Software subscriptions increased 34% month-over-month. 2 new subscriptions detected: Notion ($15/mo) and Figma ($45/mo). Would you like to categorize them?',
    type: 'info',
  },
];

const bankAccounts = [
  { name: 'ANZ Business Account', balance: '$142,580.00', currency: 'NZD', lastSync: '2 min ago' },
  { name: 'Westpac Savings', balance: '$60,860.00', currency: 'NZD', lastSync: '5 min ago' },
  { name: 'Wise AUD Account', balance: 'A$12,340.00', currency: 'AUD', lastSync: '1 hr ago' },
];

const cashFlowData = [
  32, 45, 38, 52, 48, 55, 42, 58, 65, 50, 62, 70, 55, 68, 72, 60, 75, 80, 65, 78, 85, 70, 82, 90, 75, 88, 92, 80, 85, 95,
];

export default function Dashboard() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const maxFlow = Math.max(...cashFlowData);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back. Here is your financial overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-all"
            style={{ backgroundColor: '#14b8a6' }}
          >
            <Plus className="w-4 h-4" />
            Quick Action
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockCards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: card.bgColor }}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <div
                className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  card.positive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {card.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {card.change}
              </div>
            </div>
            <p className="text-sm text-gray-500">{card.title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cash Flow Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Cash Flow - Last 30 Days</h2>
              <span className="text-sm text-gray-500">NZD</span>
            </div>
            <div className="flex items-end gap-1 h-32">
              {cashFlowData.map((value, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t transition-all hover:opacity-80"
                  style={{
                    height: `${(value / maxFlow) * 100}%`,
                    backgroundColor: value > 60 ? '#14b8a6' : '#99f6e4',
                  }}
                  title={`Day ${i + 1}: $${(value * 1000).toLocaleString()}`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>Feb 18</span>
              <span>Mar 5</span>
              <span>Mar 19</span>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between p-5 pb-3">
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              <button className="text-sm font-medium flex items-center gap-1" style={{ color: '#14b8a6' }}>
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        tx.type === 'income' ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                      <p className="text-xs text-gray-500">{tx.date} &middot; {tx.category}</p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue Invoices */}
          {overdueInvoices.length > 0 && (
            <div className="bg-white rounded-xl border border-red-200">
              <div className="flex items-center gap-2 p-5 pb-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-semibold text-gray-900">Overdue Invoices</h2>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {overdueInvoices.length}
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {overdueInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.id} - {inv.contact}</p>
                      <p className="text-xs text-red-500">{inv.daysOverdue} days overdue (due {inv.dueDate})</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900">{inv.amount}</span>
                      <button className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all text-gray-700">
                        Send Reminder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: FileText, label: 'New Invoice', color: '#3b82f6' },
                { icon: CreditCard, label: 'Record Payment', color: '#22c55e' },
                { icon: Brain, label: 'AI Assistant', color: '#8b5cf6' },
              ].map((action) => (
                <button
                  key={action.label}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${action.color}10` }}>
                    <action.icon className="w-5 h-5" style={{ color: action.color }} />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5" style={{ color: '#14b8a6' }} />
              <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
            </div>
            <div className="space-y-3">
              {aiInsights.map((insight, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border text-sm ${
                    insight.type === 'warning'
                      ? 'bg-amber-50 border-amber-200'
                      : insight.type === 'success'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <p
                    className={`font-medium text-xs mb-1 ${
                      insight.type === 'warning'
                        ? 'text-amber-700'
                        : insight.type === 'success'
                        ? 'text-green-700'
                        : 'text-blue-700'
                    }`}
                  >
                    {insight.title}
                  </p>
                  <p className="text-gray-600 text-xs leading-relaxed">{insight.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tax Deadlines */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Tax Deadlines</h2>
            </div>
            <div className="space-y-3">
              {taxDeadlines.map((deadline, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{deadline.name}</p>
                    <p className="text-xs text-gray-500">{deadline.date}</p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      deadline.daysLeft <= 10
                        ? 'bg-red-100 text-red-700'
                        : deadline.daysLeft <= 30
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {deadline.daysLeft}d left
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bank Accounts */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Bank Accounts</h2>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {bankAccounts.map((account, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{account.name}</p>
                    <p className="text-xs text-gray-500">Synced {account.lastSync}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{account.balance}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Multi-Currency Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Multi-Currency Balances</h2>
            <div className="space-y-2">
              {[
                { currency: 'NZD', amount: '$203,440.00', flag: '\u{1F1F3}\u{1F1FF}' },
                { currency: 'AUD', amount: 'A$12,340.00', flag: '\u{1F1E6}\u{1F1FA}' },
                { currency: 'USD', amount: '$5,210.00', flag: '\u{1F1FA}\u{1F1F8}' },
              ].map((c) => (
                <div key={c.currency} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {c.flag} {c.currency}
                  </span>
                  <span className="font-medium text-gray-900">{c.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
