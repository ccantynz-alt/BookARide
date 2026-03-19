import React, { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Globe,
  Calculator,
  Brain,
  ChevronRight,
  FileText,
  TrendingDown,
  ArrowRight,
  Lightbulb,
  Calendar,
  AlertCircle,
  ChevronDown,
  Loader2,
} from 'lucide-react';

const jurisdictions = [
  {
    code: 'NZ',
    name: 'New Zealand',
    flag: '\u{1F1F3}\u{1F1FF}',
    status: 'compliant',
    taxType: 'GST',
    rate: '15%',
    nextFiling: 'Mar 28, 2026',
    daysLeft: 9,
    lastFiled: 'Jan 28, 2026',
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '\u{1F1E6}\u{1F1FA}',
    status: 'attention',
    taxType: 'GST/BAS',
    rate: '10%',
    nextFiling: 'Apr 28, 2026',
    daysLeft: 40,
    lastFiled: 'Jan 28, 2026',
  },
  {
    code: 'UK',
    name: 'United Kingdom',
    flag: '\u{1F1EC}\u{1F1E7}',
    status: 'compliant',
    taxType: 'VAT',
    rate: '20%',
    nextFiling: 'Apr 7, 2026',
    daysLeft: 19,
    lastFiled: 'Jan 7, 2026',
  },
  {
    code: 'US',
    name: 'United States',
    flag: '\u{1F1FA}\u{1F1F8}',
    status: 'overdue',
    taxType: 'Sales Tax',
    rate: 'Varies',
    nextFiling: 'Mar 15, 2026',
    daysLeft: -4,
    lastFiled: 'Dec 15, 2025',
  },
];

const statusConfig = {
  compliant: { label: 'Compliant', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle2 },
  attention: { label: 'Needs Attention', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle },
  overdue: { label: 'Overdue', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: AlertCircle },
};

const filingTimeline = [
  { date: 'Mar 15, 2026', name: 'US Sales Tax (Q4 2025)', jurisdiction: 'US', status: 'overdue' },
  { date: 'Mar 28, 2026', name: 'NZ GST Return (Period 5)', jurisdiction: 'NZ', status: 'upcoming' },
  { date: 'Apr 7, 2026', name: 'UK VAT Quarterly', jurisdiction: 'UK', status: 'upcoming' },
  { date: 'Apr 15, 2026', name: 'US Estimated Tax (Q1)', jurisdiction: 'US', status: 'upcoming' },
  { date: 'Apr 28, 2026', name: 'AU BAS Quarterly', jurisdiction: 'AU', status: 'upcoming' },
  { date: 'May 28, 2026', name: 'NZ GST Return (Period 6)', jurisdiction: 'NZ', status: 'future' },
];

const treatyAnalysis = [
  {
    treaty: 'NZ-AU DTA',
    income: '$23,400',
    normalWithholding: '$7,020',
    treatyRate: '15%',
    treatyWithholding: '$3,510',
    savings: '$3,510',
  },
  {
    treaty: 'NZ-UK DTA',
    income: '$5,400',
    normalWithholding: '$1,620',
    treatyRate: '10%',
    treatyWithholding: '$540',
    savings: '$1,080',
  },
  {
    treaty: 'NZ-US DTA',
    income: '$8,200',
    normalWithholding: '$2,460',
    treatyRate: '15%',
    treatyWithholding: '$1,230',
    savings: '$1,230',
  },
];

const aiSuggestions = [
  {
    title: 'Reclassify Cross-Border Payments',
    description: '$12,800 in payments to your AU subsidiary could be reclassified as management fees, reducing withholding tax by $1,920 under the NZ-AU DTA.',
    impact: 'Save $1,920/year',
    type: 'savings',
  },
  {
    title: 'US Nexus Risk Detected',
    description: 'Your US revenue ($48,200 YTD) may trigger economic nexus in California and New York. Consider sales tax registration.',
    impact: 'Compliance risk',
    type: 'risk',
  },
  {
    title: 'GST Input Tax Credits',
    description: 'Found $2,340 in unclaimed GST input tax credits from Q4 2025. These can be included in your next GST return.',
    impact: 'Recover $2,340',
    type: 'savings',
  },
];

export default function TaxCenter() {
  const [activeCountry, setActiveCountry] = useState('NZ');
  const [preparing, setPreparing] = useState(false);

  const gstCalculation = {
    salesGST: 18687.0,
    purchasesGST: 10084.5,
    netGST: 8602.5,
    period: 'Jan 1 - Feb 28, 2026',
  };

  const handlePrepareReturn = () => {
    setPreparing(true);
    setTimeout(() => setPreparing(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tax Center</h1>
          <p className="text-gray-500 text-sm mt-1">Multi-jurisdiction tax compliance and optimization</p>
        </div>
        <button
          onClick={handlePrepareReturn}
          disabled={preparing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
          style={{ backgroundColor: '#14b8a6' }}
        >
          {preparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Prepare Return
        </button>
      </div>

      {/* Compliance Status Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {jurisdictions.map((j) => {
          const sc = statusConfig[j.status];
          return (
            <button
              key={j.code}
              onClick={() => setActiveCountry(j.code)}
              className={`text-left bg-white rounded-xl border p-4 transition-all hover:shadow-md ${
                activeCountry === j.code ? 'border-teal-500 ring-1 ring-teal-500' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{j.flag}</span>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${sc.bg} ${sc.color} border ${sc.border}`}>
                  <sc.icon className="w-3 h-3" />
                  {sc.label}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{j.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{j.taxType} ({j.rate})</p>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">Next filing</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{j.nextFiling}</p>
                  <span
                    className={`text-xs font-medium ${
                      j.daysLeft < 0 ? 'text-red-600' : j.daysLeft <= 10 ? 'text-amber-600' : 'text-green-600'
                    }`}
                  >
                    {j.daysLeft < 0 ? `${Math.abs(j.daysLeft)}d overdue` : `${j.daysLeft}d left`}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filing Deadlines Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filing Deadlines</h2>
            </div>
            <div className="space-y-3">
              {filingTimeline.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 p-3 rounded-lg border ${
                    item.status === 'overdue'
                      ? 'bg-red-50 border-red-200'
                      : item.status === 'upcoming'
                      ? 'bg-white border-gray-200'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    item.status === 'overdue' ? 'bg-red-500' : item.status === 'upcoming' ? 'bg-amber-400' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.date}</p>
                  </div>
                  {item.status === 'overdue' && (
                    <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">Overdue</span>
                  )}
                  <button className="text-gray-400 hover:text-gray-600">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Country-Specific Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {activeCountry === 'NZ' && 'NZ GST Return Calculator'}
              {activeCountry === 'AU' && 'AU BAS Calculator'}
              {activeCountry === 'UK' && 'UK VAT Return Calculator'}
              {activeCountry === 'US' && 'US Sales Tax Summary'}
            </h2>

            {activeCountry === 'NZ' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Period: {gstCalculation.period}</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-600 font-medium">GST on Sales</p>
                    <p className="text-xl font-bold text-green-700">${gstCalculation.salesGST.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium">GST on Purchases</p>
                    <p className="text-xl font-bold text-blue-700">${gstCalculation.purchasesGST.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-600 font-medium">Net GST Payable</p>
                    <p className="text-xl font-bold text-amber-700">${gstCalculation.netGST.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <button
                  onClick={handlePrepareReturn}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90"
                  style={{ backgroundColor: '#14b8a6' }}
                >
                  <FileText className="w-4 h-4" />
                  Prepare GST Return for Filing
                </button>
              </div>
            )}

            {activeCountry === 'AU' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Quarter: Jan - Mar 2026</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-600 font-medium">GST on Sales (1A)</p>
                    <p className="text-xl font-bold text-green-700">A$4,280.00</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium">GST on Purchases (1B)</p>
                    <p className="text-xl font-bold text-blue-700">A$1,890.00</p>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-700">
                    Your ATO registration details need verification. 2 transactions have missing ABN references.
                  </p>
                </div>
              </div>
            )}

            {activeCountry === 'UK' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">VAT Period: Jan - Mar 2026</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-600 font-medium">Output VAT</p>
                    <p className="text-xl font-bold text-green-700">\u00a31,080.00</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium">Input VAT</p>
                    <p className="text-xl font-bold text-blue-700">\u00a3420.00</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-600 font-medium">Net VAT Due</p>
                    <p className="text-xl font-bold text-amber-700">\u00a3660.00</p>
                  </div>
                </div>
              </div>
            )}

            {activeCountry === 'US' && (
              <div className="space-y-4">
                <div className="p-3 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">
                    Q4 2025 sales tax return is 4 days overdue. File immediately to avoid penalties.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium">Total US Revenue (YTD)</p>
                    <p className="text-xl font-bold text-gray-900">$48,200.00</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium">Sales Tax Collected</p>
                    <p className="text-xl font-bold text-gray-900">$3,856.00</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Treaty Analysis */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5" style={{ color: '#14b8a6' }} />
              <h2 className="text-lg font-semibold text-gray-900">Tax Treaty Analysis</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Treaty</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Income</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Normal WHT</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Treaty Rate</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Treaty WHT</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {treatyAnalysis.map((row) => (
                    <tr key={row.treaty} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-sm font-medium text-gray-900">{row.treaty}</td>
                      <td className="px-3 py-3 text-sm text-gray-700 text-right">{row.income}</td>
                      <td className="px-3 py-3 text-sm text-red-600 text-right">{row.normalWithholding}</td>
                      <td className="px-3 py-3 text-sm text-gray-700 text-center">{row.treatyRate}</td>
                      <td className="px-3 py-3 text-sm text-gray-700 text-right">{row.treatyWithholding}</td>
                      <td className="px-3 py-3 text-sm font-semibold text-green-600 text-right">{row.savings}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200">
                    <td colSpan={5} className="px-3 py-3 text-sm font-bold text-gray-900">Total Treaty Savings</td>
                    <td className="px-3 py-3 text-sm font-bold text-green-600 text-right">$5,820</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Withholding Tax Calculator */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Withholding Tax Calculator</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">From Country</label>
                <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-teal-500 outline-none">
                  <option>New Zealand</option>
                  <option>Australia</option>
                  <option>United Kingdom</option>
                  <option>United States</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">To Country</label>
                <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-teal-500 outline-none">
                  <option>Australia</option>
                  <option>New Zealand</option>
                  <option>United Kingdom</option>
                  <option>United States</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Amount</label>
                <input
                  type="number"
                  placeholder="$0.00"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-teal-500 outline-none placeholder-gray-400"
                />
              </div>
            </div>
            <button
              className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-all"
              style={{ backgroundColor: '#14b8a6' }}
            >
              <Calculator className="w-4 h-4" />
              Calculate WHT
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* AI Tax Optimization */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5" style={{ color: '#14b8a6' }} />
              <h2 className="text-lg font-semibold text-gray-900">AI Suggestions</h2>
            </div>
            <div className="space-y-3">
              {aiSuggestions.map((suggestion, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    suggestion.type === 'savings'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Lightbulb className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      suggestion.type === 'savings' ? 'text-green-600' : 'text-amber-600'
                    }`} />
                    <div>
                      <p className={`text-xs font-semibold mb-1 ${
                        suggestion.type === 'savings' ? 'text-green-700' : 'text-amber-700'
                      }`}>
                        {suggestion.title}
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">{suggestion.description}</p>
                      <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                        suggestion.type === 'savings' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {suggestion.impact}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tax Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">This Quarter</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax Collected</span>
                <span className="font-medium text-gray-900">$22,823.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax Paid on Purchases</span>
                <span className="font-medium text-gray-900">$12,394.50</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Treaty Savings</span>
                <span className="font-medium text-green-600">$5,820.00</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
                <span className="font-semibold text-gray-900">Net Tax Liability</span>
                <span className="font-bold text-gray-900">$10,428.50</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
