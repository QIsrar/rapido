'use client';

import React, { useState } from 'react';
import { useAuth } from './auth-context';
import {
  completeMandatoryPasswordReset,
  verifyCurrentTempPassword,
} from '@/lib/auth-actions';
import {
  ShieldAlert,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ArrowRight,
  Loader2,
  Check,
} from 'lucide-react';

export function MandatoryPasswordReset() {
  const { user, mustResetPassword, refreshUser, signOut } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 1: Verification state
  const [isVerifyingCurrent, setIsVerifyingCurrent] = useState(false);
  const [isCurrentVerified, setIsCurrentVerified] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Step 2: Submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If user is not logged in or doesn't need to reset password, do not render
  if (!user || !mustResetPassword) {
    return null;
  }

  // Password rules validation
  const hasMinLength = newPassword.length >= 8;
  const hasMixedCase = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  const isStrong = hasMinLength && hasMixedCase && hasNumber && hasSpecialChar;
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  async function handleVerifyCurrent(e: React.FormEvent) {
    e.preventDefault();
    setVerifyError(null);
    setError(null);

    if (!currentPassword.trim()) {
      setVerifyError('Please enter the temporary password sent via WhatsApp/Email.');
      return;
    }

    setIsVerifyingCurrent(true);
    try {
      const res = await verifyCurrentTempPassword(currentPassword);
      if (!res.success) {
        setVerifyError(res.error || 'Temporary password does not match.');
      } else {
        setIsCurrentVerified(true);
      }
    } catch {
      setVerifyError('Verification connection failed. Please try again.');
    } finally {
      setIsVerifyingCurrent(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isCurrentVerified) {
      setError('Please verify your current temporary password first.');
      return;
    }

    if (!isStrong) {
      setError('New password does not meet all security requirements.');
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
        setError(res.error || 'Failed to update password.');
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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className="w-full max-w-md bg-white border-2 border-orange-500/40 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[95dvh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Banner */}
        <div className="bg-orange-500/10 border-b border-orange-500/20 px-5 py-3.5 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-600 shrink-0 shadow-xs">
            <KeyRound className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span>Mandatory Password Setup</span>
              <ShieldAlert className="w-4 h-4 text-orange-600 shrink-0" />
            </h2>
            <p className="text-[11px] font-semibold text-slate-500 truncate">
              Account: <strong className="text-slate-800">{user.email}</strong>
            </p>
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-slate-900">
          {success ? (
            <div className="text-center py-6 space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 border-4 border-emerald-400 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Password Successfully Activated!
              </h3>
              <p className="text-xs font-semibold text-slate-500 max-w-xs mx-auto">
                Your contractor access is now verified and unlocked. Loading dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                Step 1: Enter your temporary password sent via WhatsApp/Email to verify ownership, then set your private permanent password.
              </p>

              {error && (
                <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* STEP 1: CURRENT TEMPORARY PASSWORD */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <span>1. Temporary Password *</span>
                  </label>
                  {isCurrentVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <Check className="w-3 h-3 text-emerald-600" />
                      Verified
                    </span>
                  )}
                </div>

                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      disabled={isCurrentVerified}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setVerifyError(null);
                      }}
                      placeholder="e.g. Rapido#83B2!9174"
                      className={`w-full pl-9 pr-9 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                        isCurrentVerified
                          ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900 cursor-not-allowed'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {!isCurrentVerified && (
                    <button
                      type="button"
                      disabled={isVerifyingCurrent || !currentPassword.trim()}
                      onClick={handleVerifyCurrent}
                      className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-black shadow-sm transition-all shrink-0 flex items-center gap-1.5 cursor-pointer tap-scale"
                    >
                      {isVerifyingCurrent ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Checking...</span>
                        </>
                      ) : (
                        <span>Verify</span>
                      )}
                    </button>
                  )}
                </div>

                {verifyError && (
                  <p className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {verifyError}
                  </p>
                )}
              </div>

              {/* STEP 2: NEW PASSWORD & CONFIRMATION (LOCKED UNTIL VERIFIED) */}
              <div
                className={`p-3.5 rounded-2xl border-2 transition-all space-y-3 ${
                  isCurrentVerified
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-50/60 border-slate-200/80 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    {isCurrentVerified ? (
                      <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>2. Set New Password</span>
                  </label>
                  {!isCurrentVerified && (
                    <span className="text-[10px] font-bold text-slate-400 italic">
                      Verify temporary password first
                    </span>
                  )}
                </div>

                {/* New Password input */}
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      disabled={!isCurrentVerified}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={
                        isCurrentVerified
                          ? 'Enter strong password'
                          : 'Locked until step 1 verified'
                      }
                      className="w-full pl-9 pr-9 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                    <button
                      type="button"
                      disabled={!isCurrentVerified}
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password input */}
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      disabled={!isCurrentVerified}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={
                        isCurrentVerified
                          ? 'Re-enter your new password'
                          : 'Locked until step 1 verified'
                      }
                      className="w-full pl-9 pr-9 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                    <button
                      type="button"
                      disabled={!isCurrentVerified}
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-[11px] font-bold text-red-600 mt-1">Passwords do not match</p>
                  )}
                </div>

                {/* Password Strength Checklist (Special char included!) */}
                {isCurrentVerified && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px] font-semibold">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700' : 'text-slate-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${hasMinLength ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasMixedCase ? 'text-emerald-700' : 'text-slate-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${hasMixedCase ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                      Upper and lowercase letters (A-Z, a-z)
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700' : 'text-slate-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${hasNumber ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                      At least 1 number (0-9)
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-emerald-700' : 'text-slate-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${hasSpecialChar ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                      At least 1 special character (!@#$%^&*)
                    </div>
                    {confirmPassword && (
                      <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-700' : 'text-red-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${passwordsMatch ? 'bg-emerald-600' : 'bg-red-500'}`} />
                        Passwords match
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit & Sign Out buttons */}
              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading || !isCurrentVerified || !isStrong || !passwordsMatch}
                  className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:hover:bg-orange-600 text-white font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs cursor-pointer tap-scale"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Activating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Save Password & Unlock Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={signOut}
                  className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
