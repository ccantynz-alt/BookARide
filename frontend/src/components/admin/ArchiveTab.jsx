import React from 'react';
import { Archive, RefreshCw, Search, Eye, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const ArchiveTab = ({
  archivedBookings,
  archivedCount,
  loadingArchived,
  archiveSearchTerm,
  archivePage,
  archiveTotalPages,
  runningAutoArchive,
  onSearchTermChange,
  onSearch,
  onClearSearch,
  onRunAutoArchive,
  onFetchPage,
  onViewDetails,
  onUnarchive,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Archive className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Archived Bookings</h3>
                <p className="text-sm text-slate-500">{archivedCount} bookings stored — 7-year retention — Auto-archives daily</p>
              </div>
            </div>
            <Button
              onClick={onRunAutoArchive}
              disabled={runningAutoArchive}
              variant="outline"
              size="sm"
              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              {runningAutoArchive ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Archive className="w-4 h-4 mr-2" />}
              Archive Now
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 pb-0">
          <form onSubmit={onSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, phone, or reference..."
                value={archiveSearchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="pl-10 bg-white border-slate-200 focus:border-indigo-400 focus:ring-indigo-400"
              />
            </div>
            <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Search className="w-4 h-4 mr-2" /> Search
            </Button>
            {archiveSearchTerm && (
              <Button type="button" variant="outline" size="sm" onClick={onClearSearch}>Clear</Button>
            )}
          </form>
        </div>

        {/* Table */}
        <div className="p-6">
          {loadingArchived ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-300" />
              <p className="text-slate-400 mt-3">Loading archived bookings...</p>
            </div>
          ) : archivedBookings.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-100">
              <Archive className="w-12 h-12 mx-auto text-slate-200 mb-3" />
              <p className="text-slate-500 font-medium">No archived bookings found</p>
              <p className="text-sm text-slate-400">
                {archiveSearchTerm ? 'Try a different search term' : 'Completed bookings are archived automatically'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wide">Ref</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wide">Customer</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wide">Date</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wide">Route</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wide">Total</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wide">Archived</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archivedBookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="px-3 py-3 font-medium text-indigo-600">#{booking.referenceNumber}</td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-slate-800">{booking.name}</div>
                          <div className="text-xs text-slate-400">{booking.email}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-slate-700">{formatDate(booking.date)}</div>
                          <div className="text-xs text-slate-400">{booking.time}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-xs text-slate-600 truncate max-w-[200px]">{booking.pickupAddress}</div>
                          <div className="text-xs text-slate-400 truncate max-w-[200px]">{booking.dropoffAddress}</div>
                        </td>
                        <td className="px-3 py-3 font-semibold text-emerald-600">
                          ${(booking.pricing?.totalPrice || booking.totalPrice || 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-400">
                          {booking.archivedAt ? new Date(booking.archivedAt).toLocaleDateString('en-NZ') : 'N/A'}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1">
                            <Button onClick={() => onViewDetails(booking)} variant="ghost" size="sm" title="View Details">
                              <Eye className="w-4 h-4 text-slate-500" />
                            </Button>
                            <Button onClick={() => onUnarchive(booking.id)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                              <RotateCcw className="w-3 h-3 mr-1" /> Restore
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {archiveTotalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <Button onClick={() => onFetchPage(archivePage - 1)} disabled={archivePage <= 1} variant="outline" size="sm">Previous</Button>
                  <span className="text-sm text-slate-500">Page {archivePage} of {archiveTotalPages}</span>
                  <Button onClick={() => onFetchPage(archivePage + 1)} disabled={archivePage >= archiveTotalPages} variant="outline" size="sm">Next</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchiveTab;
