import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

const PasswordModal = ({
  open,
  onOpenChange,
  setPasswordMode,
  currentPassword,
  newPassword,
  confirmPassword,
  onSetPasswordModeChange,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}) => {
  const handleClose = () => {
    onOpenChange(false);
    onSetPasswordModeChange(false);
    onCurrentPasswordChange('');
    onNewPasswordChange('');
    onConfirmPasswordChange('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{setPasswordMode ? 'Set New Password' : 'Change Password'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {!setPasswordMode && (
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => onCurrentPasswordChange(e.target.value)}
                placeholder="Enter current password"
                className="mt-1"
              />
              <button
                type="button"
                onClick={() => onSetPasswordModeChange(true)}
                className="text-sm text-indigo-600 hover:text-indigo-500 mt-1"
              >
                Forgot current password? Set a new one instead.
              </button>
            </div>
          )}
          {setPasswordMode && (
            <p className="text-sm text-slate-600">
              You&apos;re logged in. Set a new password below (no current password needed).
            </p>
          )}

          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => onNewPasswordChange(e.target.value)}
              placeholder="Enter new password (min 8 characters)"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              placeholder="Confirm new password"
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            {setPasswordMode && (
              <Button variant="ghost" onClick={() => onSetPasswordModeChange(false)}>Back</Button>
            )}
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={onSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {setPasswordMode ? 'Set Password' : 'Change Password'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordModal;
