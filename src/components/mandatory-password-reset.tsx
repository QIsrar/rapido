'use client';

import React, { useState } from 'react';
import { useAuth } from './auth-context';
import { completeMandatoryPasswordReset } from '@/lib/auth-actions';
import {
  ShieldAlert,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ArrowRight,
} from 'lucide-react';

export function MandatoryPasswordReset() {
  const { user, mustResetPassword, refreshUser, signOut } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If user is not logged in or doesn't need to reset password, do not render
  if (!user || !mustResetPassword) {
    return null;
  }

  // Basic password strength checks
  const hasMinLength = newPassword.length >= 8;
  const hasMixedCase = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasNumberOrSymbol = /[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  const isStrong = hasMinLength && hasMixedCase && hasNumberOrSymbol;
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError('Please enter your current temporary password.');
      return;
    }

    if (!hasMinLength) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (!passwordsMatch) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await completeMandatoryPasswordReset(currentPassword, newPassword);
      if (!res.success) {
        setError(res.error || 'Failed to update password. Please check your current password.');
      } else {
        setSuccess(true);
        setTimeout(async () => {
          await refreshUser();
        }, 1500);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className="w-full max-w-md bg-card border border-orange-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Banner */}
        <div className="bg-orange-500/10 border-b border-orange-500/20 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-500 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <span>Mandatory Password Update</span>
              <ShieldAlert className="w-4 h-4 text-orange-500" />
            </h2>
            <p className="text-xs text-muted-foreground">
              First login security setup for <span className="font-semibold text-foreground">{user.email}</span>
            </p>
          </div>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-6 space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Password Successfully Updated!
              </h3>
              <p className="text-xs text-muted-foreground">
                Your contractor access is now fully activated. Unlocking workspace...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                For security, your temporary access credentials must be replaced with a private strong password before logging expenses or editing projects.
              </p>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2.5 text-destructive text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Current temporary password */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Current Temporary Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter credentials sent via WhatsApp/Email"
                    className="w-full pl-9 pr-10 py-2.5 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  New Secure Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-9 pr-10 py-2.5 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Checklist */}
                {newPassword && (
                  <div className="mt-2 p-2 bg-muted/30 rounded-lg space-y-1 text-[11px]">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasMixedCase ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${hasMixedCase ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                      Upper and lowercase letters
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasNumberOrSymbol ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${hasNumberOrSymbol ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                      At least one number or symbol
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full pl-9 pr-3 py-2.5 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-foreground"
                  />
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-[11px] text-destructive mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading || !isStrong || !passwordsMatch}
                  className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-xl shadow transition-colors flex items-center justify-center gap-2 text-xs"
                >
                  {loading ? (
                    'Securing Account...'
                  ) : (
                    <>
                      Update Password & Unlock
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={signOut}
                  className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign Out of Temporary Account
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
