import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  DollarSign,
  Users,
  Link2,
  Bell,
  Key,
  CreditCard,
  Download,
  Save,
  Plus,
  Mail,
  Shield,
  ChevronRight,
  Trash2,
  Edit3,
  Check,
  Loader2,
  Globe,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';

const tabs = [
  { key: 'organization', label: 'Organization', icon: Building2 },
  { key: 'fiscal', label: 'Fiscal Year', icon: Calendar },
  { key: 'currency', label: 'Currency', icon: DollarSign },
  { key: 'users', label: 'Users & Roles', icon: Users },
  { key: 'bank', label: 'Bank Connections', icon: Link2 },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'api', label: 'API Keys', icon: Key },
  { key: 'billing', label: 'Subscription', icon: CreditCard },
  { key: 'export', label: 'Data Export', icon: Download },
];

const teamMembers = [
  { id: 1, name: 'John Smith', email: 'john@company.com', role: 'Owner', status: 'active' },
  { id: 2, name: 'Sarah Johnson', email: 'sarah@company.com', role: 'Admin', status: 'active' },
  { id: 3, name: 'Mike Chen', email: 'mike@company.com', role: 'Accountant', status: 'active' },
  { id: 4, name: 'Lisa Wang', email: 'lisa@company.com', role: 'Viewer', status: 'pending' },
];

const bankConnections = [
  { id: 1, name: 'ANZ Business Account', type: 'Transaction', lastSync: '2 min ago', status: 'connected' },
  { id: 2, name: 'Westpac Business', type: 'Transaction', lastSync: '5 min ago', status: 'connected' },
  { id: 3, name: 'Wise AUD Account', type: 'Multi-currency', lastSync: '1 hr ago', status: 'connected' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('organization');
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [org, setOrg] = useState({
    name: 'Acme Global Ltd',
    taxId: '123-456-789',
    address: '123 Queen Street',
    city: 'Auckland',
    country: 'NZ',
    phone: '+64 9 555 0100',
    email: 'accounts@acmeglobal.co.nz',
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your organization and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-56 flex-shrink-0">
          <nav className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-teal-50 text-teal-700 border-l-2 border-teal-500'
                    : 'text-gray-600 hover:bg-gray-50 border-l-2 border-transparent'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Organization */}
          {activeTab === 'organization' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Organization Details</h2>
              <div className="space-y-5 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Name</label>
                  <input type="text" value={org.name} onChange={(e) => setOrg((p) => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-gray-900" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tax ID / IRD Number</label>
                    <input type="text" value={org.taxId} onChange={(e) => setOrg((p) => ({ ...p, taxId: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                    <select value={org.country} onChange={(e) => setOrg((p) => ({ ...p, country: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm text-gray-700 bg-white">
                      <option value="NZ">New Zealand</option>
                      <option value="AU">Australia</option>
                      <option value="UK">United Kingdom</option>
                      <option value="US">United States</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                  <input type="text" value={org.address} onChange={(e) => setOrg((p) => ({ ...p, address: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-gray-900" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                    <input type="tel" value={org.phone} onChange={(e) => setOrg((p) => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input type="email" value={org.email} onChange={(e) => setOrg((p) => ({ ...p, email: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-gray-900" />
                  </div>
                </div>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#14b8a6' }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Fiscal Year */}
          {activeTab === 'fiscal' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Fiscal Year Configuration</h2>
              <div className="space-y-5 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fiscal Year Starts</label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm text-gray-700 bg-white">
                    <option>April 1 (NZ Standard)</option>
                    <option>January 1</option>
                    <option>July 1 (AU Standard)</option>
                    <option>October 1</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">GST Filing Frequency</label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm text-gray-700 bg-white">
                    <option>Monthly</option>
                    <option>Two-monthly</option>
                    <option>Six-monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Accounting Basis</label>
                  <div className="flex gap-3">
                    <button className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-teal-500 bg-teal-50 text-teal-700">Accrual</button>
                    <button className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-500 hover:bg-gray-50">Cash</button>
                  </div>
                </div>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90" style={{ backgroundColor: '#14b8a6' }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Currency */}
          {activeTab === 'currency' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Currency Settings</h2>
              <div className="space-y-5 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Base Currency</label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm text-gray-700 bg-white">
                    <option>NZD - New Zealand Dollar</option>
                    <option>AUD - Australian Dollar</option>
                    <option>GBP - British Pound</option>
                    <option>USD - US Dollar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Enabled Currencies</label>
                  <div className="space-y-2">
                    {['NZD', 'AUD', 'USD', 'GBP', 'EUR'].map((c) => (
                      <label key={c} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <input type="checkbox" defaultChecked={['NZD', 'AUD', 'USD', 'GBP'].includes(c)} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                        <span className="text-sm text-gray-700">{c}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Exchange Rate Source</label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm text-gray-700 bg-white">
                    <option>Automatic (RBNZ rates)</option>
                    <option>Manual entry</option>
                  </select>
                </div>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90" style={{ backgroundColor: '#14b8a6' }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Users & Roles */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Users & Roles</h2>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-all" style={{ backgroundColor: '#14b8a6' }}>
                  <Plus className="w-4 h-4" />
                  Invite User
                </button>
              </div>
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm">
                        {member.name.split(' ').map((w) => w[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          {member.status === 'pending' && (
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">Pending</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select defaultValue={member.role} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-teal-500 outline-none">
                        <option>Owner</option>
                        <option>Admin</option>
                        <option>Accountant</option>
                        <option>Viewer</option>
                      </select>
                      {member.role !== 'Owner' && (
                        <button className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bank Connections */}
          {activeTab === 'bank' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Bank Connections</h2>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-all" style={{ backgroundColor: '#14b8a6' }}>
                  <Plus className="w-4 h-4" />
                  Connect Bank
                </button>
              </div>
              <div className="space-y-3">
                {bankConnections.map((bank) => (
                  <div key={bank.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                        <Link2 className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{bank.name}</p>
                        <p className="text-xs text-gray-500">{bank.type} &middot; Last synced {bank.lastSync}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-700">
                        <Check className="w-3 h-3" />
                        Connected
                      </span>
                      <button className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400 transition-colors">
                        <SettingsIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Email Notifications</h2>
              <div className="space-y-4 max-w-xl">
                {[
                  { label: 'Invoice paid', description: 'Get notified when a customer pays an invoice', defaultOn: true },
                  { label: 'Invoice overdue', description: 'Receive alerts for overdue invoices', defaultOn: true },
                  { label: 'Tax deadline reminders', description: 'Reminders 7 days before filing deadlines', defaultOn: true },
                  { label: 'Bank sync errors', description: 'Alert when bank feed connection fails', defaultOn: true },
                  { label: 'AI insights digest', description: 'Weekly AI-generated financial insights', defaultOn: false },
                  { label: 'Monthly financial summary', description: 'Monthly P&L and cash flow overview', defaultOn: true },
                ].map((n) => (
                  <label key={n.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{n.label}</p>
                      <p className="text-xs text-gray-500">{n.description}</p>
                    </div>
                    <input type="checkbox" defaultChecked={n.defaultOn} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  </label>
                ))}
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90" style={{ backgroundColor: '#14b8a6' }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* API Keys */}
          {activeTab === 'api' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-all" style={{ backgroundColor: '#14b8a6' }}>
                  <Plus className="w-4 h-4" />
                  Generate Key
                </button>
              </div>
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Production API Key</p>
                      <p className="text-xs text-gray-500">Created Mar 1, 2026</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowApiKey(!showApiKey)} className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400 transition-colors">
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400 transition-colors">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <code className="text-xs bg-gray-100 px-3 py-1.5 rounded font-mono text-gray-600 block">
                    {showApiKey ? 'sk_live_ai1dg3r_k8j2m9p4q7w5x1y3z6' : 'sk_live_ai1dg3r_\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                  </code>
                </div>
              </div>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">
                  <strong>Security:</strong> API keys grant full access to your organization data. Never share keys publicly or commit them to source control.
                </p>
              </div>
            </div>
          )}

          {/* Subscription */}
          {activeTab === 'billing' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Subscription & Billing</h2>
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-teal-800">Professional Plan</p>
                    <p className="text-xs text-teal-600 mt-0.5">$79/month &middot; Next billing: Apr 1, 2026</p>
                  </div>
                  <button className="px-3 py-1.5 text-sm font-medium text-teal-700 bg-white border border-teal-300 rounded-lg hover:bg-teal-50 transition-all">
                    Change Plan
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Usage This Period</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Transactions</span>
                      <span className="text-gray-900">847 / Unlimited</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Bank Connections</span>
                      <span className="text-gray-900">3 / Unlimited</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Jurisdictions</span>
                      <span className="text-gray-900">4 / 4</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">AI Assistant Queries</span>
                      <span className="text-gray-900">124 / Unlimited</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Method</h3>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-700">Visa ending in 4242</span>
                    <button className="ml-auto text-sm font-medium" style={{ color: '#14b8a6' }}>Update</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Export */}
          {activeTab === 'export' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Data Export</h2>
              <div className="space-y-4 max-w-xl">
                <p className="text-sm text-gray-600">Export your organization data for backup or migration purposes.</p>
                <div className="space-y-3">
                  {[
                    { label: 'Transactions', description: 'All bank transactions and categorizations', format: 'CSV' },
                    { label: 'Invoices', description: 'All invoices with line items and payments', format: 'CSV' },
                    { label: 'Contacts', description: 'Customer and supplier directory', format: 'CSV' },
                    { label: 'Chart of Accounts', description: 'Account structure and balances', format: 'CSV' },
                    { label: 'Full Backup', description: 'Complete data export including all records', format: 'ZIP' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                      <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-white transition-all">
                        <Download className="w-4 h-4" />
                        {item.format}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
