import React, { useRef } from 'react';
import { Trash2, Download, Upload, Shield, RotateCcw, RefreshCw, Archive, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { formatDate, formatTimestampDate } from '../../utils/dateFormat';

const DeletedTab = ({
  deletedBookings,
  loadingDeleted,
  downloadingBackup,
  restoringFromFile,
  restoringFromServerBackup,
  restoringAll,
  backupRestoreResult,
  autoBackups,
  loadingAutoBackups,
  triggeringBackup,
  restoringAutoBackup,
  onDownloadBackup,
  onRestoreFromBackupFile,
  onRestoreFromServerBackup,
  onRestoreAllBookings,
  onTriggerBackup,
  onRestoreAutoBackup,
  onRestoreBooking,
  onPermanentDelete,
}) => {
  const backupFileInputRef = useRef(null);

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Deleted Bookings</h3>
                <p className="text-sm text-slate-500">{deletedBookings.length} booking{deletedBookings.length !== 1 ? 's' : ''} in trash</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={onDownloadBackup}
                disabled={downloadingBackup}
                variant="outline"
                size="sm"
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                {downloadingBackup ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Download Backup
              </Button>
              <input ref={backupFileInputRef} type="file" accept=".json" className="hidden" onChange={onRestoreFromBackupFile} />
              <Button
                onClick={() => backupFileInputRef.current?.click()}
                disabled={restoringFromFile}
                variant="outline"
                size="sm"
                className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
              >
                {restoringFromFile ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Restore from File
              </Button>
              <Button
                onClick={onRestoreFromServerBackup}
                disabled={restoringFromServerBackup}
                size="sm"
                className="bg-slate-700 hover:bg-slate-800 text-white"
              >
                {restoringFromServerBackup ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                Server Backup
              </Button>
              {deletedBookings.length > 0 && (
                <Button
                  onClick={onRestoreAllBookings}
                  disabled={restoringAll}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {restoringAll ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                  Restore All ({deletedBookings.length})
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Restore Result */}
        {backupRestoreResult && (
          <div className={`mx-6 mt-4 p-3 rounded-lg text-sm ${backupRestoreResult.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            {backupRestoreResult.error ? (
              <span>Error: {backupRestoreResult.error}</span>
            ) : (
              <span>
                Restored <strong>{backupRestoreResult.imported_count}</strong> bookings.
                Skipped <strong>{backupRestoreResult.skipped_count}</strong> duplicates.
                {backupRestoreResult.error_count > 0 && <span className="text-red-600 ml-1">{backupRestoreResult.error_count} errors.</span>}
              </span>
            )}
          </div>
        )}

        {/* Auto Backups */}
        <div className="m-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">Automatic Daily Backups</h4>
              <p className="text-xs text-slate-500 mt-0.5">Saved nightly at 1 AM — 7 days rolling</p>
            </div>
            <Button
              onClick={onTriggerBackup}
              disabled={triggeringBackup}
              size="sm"
              variant="outline"
              className="border-slate-300 text-slate-600 hover:bg-slate-100 text-xs"
            >
              {triggeringBackup ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Archive className="w-3 h-3 mr-1" />}
              Backup Now
            </Button>
          </div>
          {loadingAutoBackups ? (
            <p className="text-xs text-slate-500">Loading backups...</p>
          ) : autoBackups.length === 0 ? (
            <p className="text-xs text-slate-500">No automatic backups yet.</p>
          ) : (
            <div className="space-y-1">
              {autoBackups.map(b => (
                <div key={b.label} className="flex items-center justify-between bg-white rounded px-3 py-2 border border-slate-100 text-xs">
                  <div>
                    <span className="font-medium text-slate-700">{b.label}</span>
                    <span className="text-slate-400 ml-2">{b.activeCount} active / {b.deletedCount} deleted</span>
                  </div>
                  <Button
                    onClick={() => onRestoreAutoBackup(b.label)}
                    disabled={restoringAutoBackup === b.label}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1 h-7"
                  >
                    {restoringAutoBackup === b.label ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Restore'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deleted Bookings List */}
        <div className="p-6 pt-0">
          {loadingDeleted ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-300" />
              <p className="text-slate-400 mt-3">Loading deleted bookings...</p>
            </div>
          ) : deletedBookings.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-100">
              <Trash2 className="w-12 h-12 mx-auto text-slate-200 mb-3" />
              <p className="text-slate-500 font-medium">No deleted bookings</p>
              <p className="text-sm text-slate-400">Deleted bookings appear here for recovery</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deletedBookings.map((booking) => (
                <div key={booking.id} className="bg-white p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-slate-800">{booking.customerName || booking.name}</h4>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">DELETED</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-slate-600">
                        <div><span className="text-slate-400">Date:</span> {formatDate(booking.date)} {booking.time}</div>
                        <div><span className="text-slate-400">Phone:</span> {booking.phone}</div>
                        <div><span className="text-slate-400">Total:</span> ${booking.totalPrice || booking.total_price}</div>
                        <div><span className="text-slate-400">Deleted:</span> {formatTimestampDate(booking.deletedAt)}</div>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="text-slate-400">From:</span> <span className="text-slate-600">{booking.pickup || booking.pickupAddress}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-400">To:</span> <span className="text-slate-600">{booking.dropoff || booking.dropoffAddress}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button onClick={() => onRestoreBooking(booking.id)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <RotateCcw className="w-4 h-4 mr-1" /> Restore
                      </Button>
                      <Button onClick={() => onPermanentDelete(booking.id)} variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-1" /> Delete Forever
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeletedTab;
