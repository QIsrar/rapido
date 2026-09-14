'use client';

import React, { useState } from 'react';
import { useAuth } from './auth-context';
import { submitAccessRequest, signInUser, checkEmailAndRequestPasswordReset } from '@/lib/auth-actions';
import { withTimeout } from '@/lib/utils';
import {
  X,
  Lock,
  UserPlus,
  Mail,
  Phone,
  Building,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  KeyRound,
} from 'lucide-react';

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    openAuthModal,
    refreshUser,
  } = useAuth();

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Request Access state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Forgot / Reset Password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<{
    fullName: string;
    phone: string;
    companyName: string;
    email: string;
  } | null>(null);

  if (!isAuthModalOpen) return null;

  async function handleSignInSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSignInError(null);
    setSignInLoading(true);

    try {
      const res = await withTimeout(signInUser(signInEmail, signInPassword));
      if (!res.success) {
        setSignInError(res.error || 'Invalid email or password.');
      } else {
        await refreshUser();
        closeAuthModal();
      }
    } catch (err: unknown) {
      setSignInError(
        err instanceof Error
          ? err.message
          : 'Connection is slow or timed out. Please connect to a strong internet connection and try again.'
      );
    } finally {
      setSignInLoading(false);
    }
  }

  async function handleRequestAccessSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRequestError(null);
    setRequestLoading(true);

    try {
      const res = await withTimeout(
        submitAccessRequest({
          fullName,
          phone,
          companyName,
          location,
          email: signUpEmail,
        })
      );

      if (!res.success) {
        setRequestError(res.error || 'Failed to submit access request.');
      } else {
        setRequestSuccess(true);
      }
    } catch (err: unknown) {
      setRequestError(
        err instanceof Error
          ? err.message
          : 'Connection is slow or timed out. Please connect to a strong internet connection and try again.'
      );
    } finally {
      setRequestLoading(false);
    }
  }

  async function handlePasswordResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);
    setResetLoading(true);

    try {
      const res = await withTimeout(checkEmailAndRequestPasswordReset(resetEmail));
      if (!res.success) {
        setResetError(
          res.error || 'No approved contractor account found with this email.'
        );
      } else if (res.contractor) {
        setResetSuccess(res.contractor);
      }
    } catch (err: unknown) {
      setResetError(
        err instanceof Error
          ? err.message
          : 'Connection is slow or timed out. Please connect to a strong internet connection and try again.'
      );
    } finally {
      setResetLoading(false);
    }
  }

  function resetAndClose() {
    setRequestSuccess(false);
    setSignInError(null);
    setRequestError(null);
    setResetError(null);
    setResetSuccess(null);
    closeAuthModal();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md max-h-[92vh] flex flex-col bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-border/60 gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold shrink-0">
              R
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-black text-foreground truncate">
                {requestSuccess
                  ? 'Application Received'
                  : authModalTab === 'signin'
                  ? 'Sign In to Rapido'
                  : authModalTab === 'reset'
                  ? 'Password Recovery'
                  : 'Request Contractor Access'}
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                {requestSuccess
                  ? 'Pending Admin Verification'
                  : authModalTab === 'signin'
                  ? 'Access project editing & expense logging'
                  : authModalTab === 'reset'
                  ? 'Verify account & coordinate reset credentials'
                  : 'Join verified builders & track your sites'}
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers (only if not on celebration or reset screen) */}
        {!requestSuccess && authModalTab !== 'reset' && (
          <div className="flex p-1 mx-4 sm:mx-6 mt-3 bg-muted/60 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => {
                setSignInError(null);
                openAuthModal('signin');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                authModalTab === 'signin'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setRequestError(null);
                openAuthModal('signup');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                authModalTab === 'signup'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Request Access
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* CELEBRATION / SUCCESS SCREEN */}
          {requestSuccess ? (
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-500 animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-foreground">
                  🎉 Application Submitted!
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Your contractor application for <span className="font-semibold text-foreground">{companyName || 'your company'}</span> has been sent to Admin (<span className="text-orange-500 font-medium">Qazi Israr</span>).
                </p>
              </div>

              <div className="p-3 bg-muted/50 rounded-xl text-left text-xs space-y-1.5 border border-border/60">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  What happens next?
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Upon review, your secure temporary password will be sent directly via WhatsApp to <span className="text-foreground font-medium">{phone}</span> and email to <span className="text-foreground font-medium">{signUpEmail}</span>.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow transition-colors text-xs"
                >
                  Continue Browsing Demo
                </button>
              </div>
            </div>
          ) : authModalTab === 'reset' ? (
            /* FORGOT / RESET PASSWORD FORM */
            <div className="space-y-4 animate-in fade-in duration-200">
              {resetSuccess ? (
                <div className="py-2 text-center space-y-3.5 animate-in zoom-in-95 duration-200">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 border-2 border-emerald-400 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/15 animate-bounce">
                    <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-foreground">
                      Account Verified in Database!
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Found active contractor profile for <strong className="text-foreground">{resetSuccess.fullName}</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 bg-muted/60 rounded-2xl border border-border/80 text-left text-xs space-y-2.5">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <KeyRound className="w-4 h-4 text-orange-500 shrink-0" />
                      <span>Next Step: Obtain Temporary Reset Password</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Admin (Qazi Israr) has been notified. For instant 1-minute assistance, click below to message Admin directly on WhatsApp with your verified account details:
                    </p>
                    <a
                      href={`https://wa.me/923165951951?text=${encodeURIComponent(
                        `Assalam-o-Alaikum Admin Qazi Israr,\n\nI requested a password reset for my Rapido contractor account:\n• Name: ${resetSuccess.fullName}\n• Email: ${resetSuccess.email}\n• Phone: ${resetSuccess.phone}\n\nPlease generate and send me a temporary password so I can log in and set my permanent password.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs shadow transition-all cursor-pointer tap-scale"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp Admin for Temporary Password</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSignInEmail(resetSuccess.email);
                      openAuthModal('signin');
                    }}
                    className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-xs transition-colors cursor-pointer tap-scale shadow-sm"
                  >
                    Back to Sign In (Enter Temp Password)
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-foreground">Forgot Password?</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Enter your registered email address. Rapido will verify that your account exists in the database and coordinate a secure temporary reset password.
                    </p>
                  </div>

                  {resetError && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2.5 text-destructive text-xs font-bold">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => {
                          setResetEmail(e.target.value);
                          setResetError(null);
                        }}
                        placeholder="contractor@example.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-foreground placeholder:text-muted-foreground/60 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-black rounded-xl shadow transition-all flex items-center justify-center gap-2 text-xs cursor-pointer tap-scale"
                    >
                      {resetLoading ? (
                        'Checking Database...'
                      ) : (
                        <>
                          Verify &amp; Request Reset
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => openAuthModal('signin')}
                      className="w-full py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : authModalTab === 'signin' ? (
            /* SIGN IN FORM */
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              {signInError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2.5 text-destructive text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{signInError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="contractor@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-foreground placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-muted-foreground">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(signInEmail || '');
                      setResetError(null);
                      setResetSuccess(null);
                      openAuthModal('reset');
                    }}
                    className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-10 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-foreground placeholder:text-muted-foreground/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={signInLoading}
                  className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-xl shadow transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer tap-scale"
                >
                  {signInLoading ? (
                    'Signing In...'
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  Don&apos;t have an approved account?{' '}
                  <button
                    type="button"
                    onClick={() => openAuthModal('signup')}
                    className="text-orange-500 font-semibold hover:underline cursor-pointer"
                  >
                    Request Access
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* REQUEST ACCESS (SIGN UP) FORM */
            <form onSubmit={handleRequestAccessSubmit} className="space-y-3.5">
              {requestError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2.5 text-destructive text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{requestError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Tariq Mahmood"
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-foreground placeholder:text-muted-foreground/60"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Phone Number (WhatsApp)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="w-full pl-8 pr-2.5 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-foreground placeholder:text-muted-foreground/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="tariq@gmail.com"
                      className="w-full pl-8 pr-2.5 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-foreground placeholder:text-muted-foreground/60"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Company / Firm Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Al-Madina Construction Co."
                    className="w-full pl-8 pr-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-foreground placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Site Location / City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Abbottabad / Islamabad"
                    className="w-full pl-8 pr-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-foreground placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={requestLoading}
                  className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-xl shadow transition-colors flex items-center justify-center gap-2 text-xs"
                >
                  {requestLoading ? 'Submitting Application...' : 'Submit Access Request'}
                </button>
              </div>

              <div className="text-center pt-1">
                <p className="text-xs text-muted-foreground">
                  Already approved by admin?{' '}
                  <button
                    type="button"
                    onClick={() => openAuthModal('signin')}
                    className="text-orange-500 font-semibold hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
