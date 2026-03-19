import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  FileText,
  Send,
  Save,
  Eye,
  Calculator,
  ChevronDown,
  Loader2,
  X,
} from 'lucide-react';

const taxCodes = [
  { code: 'GST', label: 'GST 15%', rate: 0.15 },
  { code: 'GST-FREE', label: 'GST Free', rate: 0 },
  { code: 'EXEMPT', label: 'Exempt', rate: 0 },
  { code: 'EXPORT', label: 'Zero Rated (Export)', rate: 0 },
];

const contacts = [
  { id: 1, name: 'Pacific Trading Co', email: 'accounts@pacifictrading.co.nz' },
  { id: 2, name: 'Kiwi Exports Ltd', email: 'billing@kiwiexports.co.nz' },
  { id: 3, name: 'Southern Cross Media', email: 'finance@southerncross.co.nz' },
  { id: 4, name: 'Auckland Digital Agency', email: 'invoices@akldigi.co.nz' },
  { id: 5, name: 'Melbourne Imports Pty', email: 'ap@melbimports.com.au' },
  { id: 6, name: 'London Bridge Ventures', email: 'accounts@lbventures.co.uk' },
];

const emptyLine = { description: '', quantity: 1, unitPrice: 0, taxCode: 'GST', amount: 0 };

export default function InvoiceCreate() {
  const [invoiceType, setInvoiceType] = useState('sales');
  const [contact, setContact] = useState(null);
  const [contactSearch, setContactSearch] = useState('');
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Payment due within 30 days of invoice date.');
  const [currency] = useState('NZD');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const updateLine = (index, field, value) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      const qty = parseFloat(next[index].quantity) || 0;
      const price = parseFloat(next[index].unitPrice) || 0;
      next[index].amount = qty * price;
      return next;
    });
  };

  const addLine = () => setLines((prev) => [...prev, { ...emptyLine }]);

  const removeLine = (index) => {
    if (lines.length === 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);

  const taxBreakdown = taxCodes
    .map((tc) => {
      const lineTotal = lines
        .filter((l) => l.taxCode === tc.code)
        .reduce((sum, l) => sum + l.amount, 0);
      return { ...tc, lineTotal, taxAmount: lineTotal * tc.rate };
    })
    .filter((tc) => tc.lineTotal > 0);

  const totalTax = taxBreakdown.reduce((sum, tb) => sum + tb.taxAmount, 0);
  const total = subtotal + totalTax;

  const handleSaveDraft = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
  };

  const handleSend = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSaving(false);
  };

  const formatCurrency = (val) =>
    `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/invoices" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
            <p className="text-gray-500 text-sm mt-0.5">INV-1043 (auto-generated)</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>
          <button
            onClick={handleSend}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
            style={{ backgroundColor: '#14b8a6' }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Invoice
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Type Toggle */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-3">Invoice Type</label>
            <div className="flex gap-3">
              {[
                { key: 'sales', label: 'Sales Invoice' },
                { key: 'purchase', label: 'Purchase Invoice' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setInvoiceType(t.key)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    invoiceType === t.key
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact & Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="grid md:grid-cols-2 gap-5">
              {/* Contact Picker */}
              <div className="md:col-span-2 relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {invoiceType === 'sales' ? 'Customer' : 'Supplier'}
                </label>
                {contact ? (
                  <div className="flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                      <p className="text-xs text-gray-500">{contact.email}</p>
                    </div>
                    <button onClick={() => setContact(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(e) => {
                        setContactSearch(e.target.value);
                        setShowContactPicker(true);
                      }}
                      onFocus={() => setShowContactPicker(true)}
                      placeholder="Search contacts..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-gray-900 placeholder-gray-400"
                    />
                    {showContactPicker && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredContacts.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setContact(c);
                              setContactSearch('');
                              setShowContactPicker(false);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                          >
                            <p className="text-sm font-medium text-gray-900">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.email}</p>
                          </button>
                        ))}
                        {filteredContacts.length === 0 && (
                          <p className="px-4 py-3 text-sm text-gray-400">No contacts found</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reference</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="PO number or reference"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-gray-900 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                <input
                  type="text"
                  value={currency}
                  readOnly
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Line Items</h2>

            <div className="space-y-3">
              {/* Header */}
              <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider px-1">
                <div className="col-span-5">Description</div>
                <div className="col-span-1">Qty</div>
                <div className="col-span-2">Unit Price</div>
                <div className="col-span-2">Tax Code</div>
                <div className="col-span-1 text-right">Amount</div>
                <div className="col-span-1" />
              </div>

              {lines.map((line, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-12 md:col-span-5">
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) => updateLine(i, 'description', e.target.value)}
                      placeholder="Item description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <input
                      type="number"
                      value={line.quantity}
                      onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                      min="0"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-gray-900 text-center"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <input
                      type="number"
                      value={line.unitPrice}
                      onChange={(e) => updateLine(i, 'unitPrice', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-gray-900"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <select
                      value={line.taxCode}
                      onChange={(e) => updateLine(i, 'taxCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-gray-700 bg-white"
                    >
                      {taxCodes.map((tc) => (
                        <option key={tc.code} value={tc.code}>
                          {tc.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-10 md:col-span-1 flex items-center justify-end">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(line.amount)}
                    </span>
                  </div>
                  <div className="col-span-2 md:col-span-1 flex items-center justify-center">
                    <button
                      onClick={() => removeLine(i)}
                      disabled={lines.length === 1}
                      className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addLine}
              className="mt-4 flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: '#14b8a6' }}
            >
              <Plus className="w-4 h-4" />
              Add Line Item
            </button>
          </div>

          {/* Notes & Terms */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes visible to the customer"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-gray-900 placeholder-gray-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Terms</label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-gray-900 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Totals & Preview */}
        <div className="space-y-6">
          {/* Totals */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
              </div>

              {taxBreakdown.map((tb) => (
                <div key={tb.code} className="flex justify-between text-sm">
                  <span className="text-gray-500">{tb.label}</span>
                  <span className="text-gray-700">{formatCurrency(tb.taxAmount)}</span>
                </div>
              ))}

              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-semibold text-gray-900">Total ({currency})</span>
                  <span className="text-xl font-bold text-gray-900">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={handleSend}
                disabled={saving || !contact}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#14b8a6' }}
              >
                <Send className="w-4 h-4" />
                Send Invoice
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-gray-700 font-medium text-sm border border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save as Draft
              </button>
            </div>
          </div>

          {/* PDF Preview Placeholder */}
          {showPreview && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">PDF Preview</h3>
              <div className="aspect-[8.5/11] bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center justify-center p-6">
                <FileText className="w-16 h-16 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 text-center">
                  Invoice preview will render here when line items are added
                </p>
                {lines.some((l) => l.description && l.amount > 0) && (
                  <div className="mt-4 w-full text-left space-y-2">
                    <div className="border-b border-gray-200 pb-2">
                      <p className="text-xs font-bold text-gray-700">INVOICE INV-1043</p>
                      {contact && <p className="text-xs text-gray-500">To: {contact.name}</p>}
                      <p className="text-xs text-gray-500">Date: {invoiceDate}</p>
                    </div>
                    {lines
                      .filter((l) => l.description)
                      .map((l, i) => (
                        <div key={i} className="flex justify-between text-xs text-gray-600">
                          <span>{l.description}</span>
                          <span>{formatCurrency(l.amount)}</span>
                        </div>
                      ))}
                    <div className="border-t border-gray-200 pt-2 flex justify-between text-xs font-bold text-gray-800">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
