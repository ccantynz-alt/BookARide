import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  Users,
  Mail,
  Phone,
  Globe,
  DollarSign,
  ChevronRight,
  X,
  User,
  Building2,
  MoreHorizontal,
  Edit3,
  Trash2,
  FileText,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';

const mockContacts = [
  {
    id: 1,
    name: 'Pacific Trading Co',
    email: 'accounts@pacifictrading.co.nz',
    phone: '+64 9 555 0123',
    country: 'NZ',
    type: 'customer',
    outstanding: 4200.0,
    currency: 'NZD',
    recentInvoices: ['INV-1042', 'INV-1038'],
    totalRevenue: 28400,
  },
  {
    id: 2,
    name: 'Kiwi Exports Ltd',
    email: 'billing@kiwiexports.co.nz',
    phone: '+64 9 555 0456',
    country: 'NZ',
    type: 'customer',
    outstanding: 0,
    currency: 'NZD',
    recentInvoices: ['INV-1041'],
    totalRevenue: 42800,
  },
  {
    id: 3,
    name: 'Southern Cross Media',
    email: 'finance@southerncross.co.nz',
    phone: '+64 4 555 0789',
    country: 'NZ',
    type: 'customer',
    outstanding: 1750.0,
    currency: 'NZD',
    recentInvoices: ['INV-1040'],
    totalRevenue: 15200,
  },
  {
    id: 4,
    name: 'AWS',
    email: 'billing@aws.amazon.com',
    phone: '',
    country: 'US',
    type: 'supplier',
    outstanding: -389.5,
    currency: 'USD',
    recentInvoices: [],
    totalRevenue: 0,
  },
  {
    id: 5,
    name: 'Melbourne Imports Pty',
    email: 'ap@melbimports.com.au',
    phone: '+61 3 9555 0123',
    country: 'AU',
    type: 'customer',
    outstanding: 6800.0,
    currency: 'AUD',
    recentInvoices: ['INV-1036'],
    totalRevenue: 18600,
  },
  {
    id: 6,
    name: 'London Bridge Ventures',
    email: 'accounts@lbventures.co.uk',
    phone: '+44 20 7946 0958',
    country: 'UK',
    type: 'customer',
    outstanding: 5400.0,
    currency: 'GBP',
    recentInvoices: ['INV-1033'],
    totalRevenue: 12400,
  },
  {
    id: 7,
    name: 'Xero Ltd',
    email: 'billing@xero.com',
    phone: '',
    country: 'NZ',
    type: 'supplier',
    outstanding: -75.0,
    currency: 'NZD',
    recentInvoices: [],
    totalRevenue: 0,
  },
  {
    id: 8,
    name: 'Auckland Digital Agency',
    email: 'invoices@akldigi.co.nz',
    phone: '+64 9 555 0234',
    country: 'NZ',
    type: 'both',
    outstanding: 0,
    currency: 'NZD',
    recentInvoices: ['INV-1039'],
    totalRevenue: 9800,
  },
];

const flags = { NZ: '\u{1F1F3}\u{1F1FF}', AU: '\u{1F1E6}\u{1F1FA}', UK: '\u{1F1EC}\u{1F1E7}', US: '\u{1F1FA}\u{1F1F8}' };

export default function Contacts() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedContact, setSelectedContact] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const filtered = mockContacts.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== 'all' && c.type !== filterType && !(filterType === 'customer' && c.type === 'both') && !(filterType === 'supplier' && c.type === 'both')) return false;
    return true;
  });

  const typeLabel = (type) => {
    if (type === 'customer') return { text: 'Customer', bg: 'bg-blue-50', color: 'text-blue-700' };
    if (type === 'supplier') return { text: 'Supplier', bg: 'bg-purple-50', color: 'text-purple-700' };
    return { text: 'Both', bg: 'bg-teal-50', color: 'text-teal-700' };
  };

  const openCreateModal = () => {
    setEditingContact({ name: '', email: '', phone: '', country: 'NZ', type: 'customer' });
    setShowModal(true);
  };

  const openEditModal = (contact) => {
    setEditingContact({ ...contact });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-500 text-sm mt-1">{mockContacts.length} contacts</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-all"
          style={{ backgroundColor: '#14b8a6' }}
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts by name or email..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-gray-900 placeholder-gray-400"
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'customer', label: 'Customers' },
              { key: 'supplier', label: 'Suppliers' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  filterType === f.key
                    ? 'bg-teal-50 text-teal-700 border border-teal-300'
                    : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Contact List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {filtered.map((contact) => {
              const tl = typeLabel(contact.type);
              return (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    selectedContact?.id === contact.id ? 'bg-teal-50/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">
                        {contact.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${tl.bg} ${tl.color}`}>
                            {tl.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {contact.email}
                          </span>
                          <span className="text-xs text-gray-400">
                            {flags[contact.country]} {contact.country}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      {contact.outstanding !== 0 && (
                        <span className={`text-sm font-semibold ${contact.outstanding > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                          {contact.outstanding > 0 ? `$${contact.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })} owing` : 'Paid'}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No contacts found</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick View Panel */}
        <div>
          {selectedContact ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-base">
                    {selectedContact.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedContact.name}</p>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${typeLabel(selectedContact.type).bg} ${typeLabel(selectedContact.type).color}`}>
                      {typeLabel(selectedContact.type).text}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(selectedContact)}
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{selectedContact.email}</span>
                </div>
                {selectedContact.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{selectedContact.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{flags[selectedContact.country]} {selectedContact.country}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Outstanding</span>
                  <span className={`font-semibold ${selectedContact.outstanding > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                    ${Math.abs(selectedContact.outstanding).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    {selectedContact.outstanding < 0 ? ' (credit)' : ''}
                  </span>
                </div>
                {selectedContact.totalRevenue > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Revenue</span>
                    <span className="font-medium text-gray-900">${selectedContact.totalRevenue.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {selectedContact.recentInvoices.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Recent Invoices</h3>
                  <div className="space-y-2">
                    {selectedContact.recentInvoices.map((inv) => (
                      <div key={inv} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium" style={{ color: '#14b8a6' }}>{inv}</span>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: '#14b8a6' }}
              >
                <FileText className="w-4 h-4" />
                Create Invoice
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Select a contact</p>
              <p className="text-gray-400 text-sm mt-1">Click on a contact to see details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {editingContact?.id ? 'Edit Contact' : 'New Contact'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={editingContact?.name || ''}
                  onChange={(e) => setEditingContact((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Contact or company name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-gray-900 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={editingContact?.email || ''}
                  onChange={(e) => setEditingContact((p) => ({ ...p, email: e.target.value }))}
                  placeholder="email@company.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-gray-900 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={editingContact?.phone || ''}
                  onChange={(e) => setEditingContact((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+64 9 555 0123"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-gray-900 placeholder-gray-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                  <select
                    value={editingContact?.country || 'NZ'}
                    onChange={(e) => setEditingContact((p) => ({ ...p, country: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm text-gray-700 bg-white"
                  >
                    <option value="NZ">New Zealand</option>
                    <option value="AU">Australia</option>
                    <option value="UK">United Kingdom</option>
                    <option value="US">United States</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                  <select
                    value={editingContact?.type || 'customer'}
                    onChange={(e) => setEditingContact((p) => ({ ...p, type: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm text-gray-700 bg-white"
                  >
                    <option value="customer">Customer</option>
                    <option value="supplier">Supplier</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg text-gray-700 font-medium text-sm border border-gray-300 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: '#14b8a6' }}
              >
                {editingContact?.id ? 'Save Changes' : 'Create Contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
