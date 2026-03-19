import React from 'react';
import { FolderOpen, Upload, FileText, Search } from 'lucide-react';

export default function Documents() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100">
            <FolderOpen className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Documents</h1>
            <p className="text-xs text-gray-500">Upload and manage receipts, invoices, and statements</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors" style={{ backgroundColor: '#14b8a6' }}>
          <Upload className="w-4 h-4" /> Upload
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search documents..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
        />
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white border border-dashed border-gray-300 rounded-xl">
        <FolderOpen className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg font-medium text-gray-500">No documents yet</p>
        <p className="text-sm mt-1">Drag and drop files here, or click Upload</p>
      </div>
    </div>
  );
}
