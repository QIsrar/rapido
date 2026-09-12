'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/auth-context';
import {
  getAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
  type AccessRequestRecord,
} from '@/lib/auth-actions';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  MessageSquare,
  Mail,
  Building,
  MapPin,
  Phone,
  RefreshCw,
  Check,
  Lock,
  UserCheck,
} from 'lucide-react';

interface GeneratedCredentials {
  email: string;
  tempPassword: string;
  fullName: string;
  phone: string;
  companyName: string;
}

export default function AdminPortalPage() {
  const { user, isAdmin, isLoading: isAuthLoading, openAuthModal } = useAuth();

  const [requests, setRequests] = useState<AccessRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  // Approval Modal State
  const [approvedCredentials, setApprovedCredentials] = useState<GeneratedCredentials | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await getAccessRequests();
      if (res.success && res.requests) {
        setRequests(res.requests);
      }
    } catch (err) {
      console.error('Error fetching access requests:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchRequests();
    }
  }, [isAdmin, fetchRequests]);

  async function handleApprove(req: AccessRequestRecord) {
    if (!confirm(`Approve contractor ${req.full_name} (${req.company_name}) and generate credentials?`)) {
      return;
    }

    setActionLoadingId(req.id);
    try {
      const res = await approveAccessRequest(req.id);
      if (res.success && res.credentials) {
        setApprovedCredentials(res.credentials);
        await fetchRequests();
      } else {
        alert(res.error || 'Failed to approve contractor.');
      }
    } catch (err) {
      alert('Approval action failed.');
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleReject(req: AccessRequestRecord) {
    if (!confirm(`Reject access request from ${req.full_name}?`)) {
      return;
    }

    setActionLoadingId(req.id);
    try {
      const res = await rejectAccessRequest(req.id);
      if (res.success) {
        await fetchRequests();
      } else {
        alert(res.error || 'Failed to reject request.');
      }
    } catch (err) {
      alert('Reject action failed.');
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  }

  function formatWhatsAppLink(creds: GeneratedCredentials) {
    // Sanitize phone: strip non-digits, replace leading 0 with 92 if in Pakistan
    let phoneNum = creds.phone.replace(/[^0-9]/g, '');
    if (phoneNum.startsWith('0')) {
      phoneNum = '92' + phoneNum.slice(1);
    }

    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://rapido-henna.vercel.app';
    const message = `Assalam-o-Alaikum ${creds.fullName}!\n\nYour contractor access for *Rapido Construction Job-Costing* (${creds.companyName}) has been approved by Qazi Israr.\n\n*Login Credentials:*\n🌐 App: ${appUrl}\n📧 Email: ${creds.email}\n🔑 Temporary Password: ${creds.tempPassword}\n\n*Important:* You will be prompted to set your own permanent password on your first login.\n\nWelcome to Rapido!`;

    return `https://wa.me/${phoneNum}?text=${encodeURIComponent(message)}`;
  }

  function formatEmailLink(creds: GeneratedCredentials) {
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://rapido-henna.vercel.app';
    const subject = `Rapido Contractor Account Approved — ${creds.companyName}`;
    const body = `Dear ${creds.fullName},\n\nYour access request for Rapido Construction Job-Costing has been approved by Qazi Israr.\n\nLogin URL: ${appUrl}\nEmail: ${creds.email}\nTemporary Password: ${creds.tempPassword}\n\nPlease log in and update your temporary password to a secure personal password on first login.\n\nBest regards,\nQazi Israr\nQI Tyrix — Rapido`;

    return `mailto:${creds.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function copyCredentials(creds: GeneratedCredentials) {
    const text = `Rapido Access Credentials\nEmail: ${creds.email}\nTemporary Password: ${creds.tempPassword}\nName: ${creds.fullName}\nCompany: ${creds.companyName}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // If checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  // If not admin
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Admin Portal Access Required</h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The contractor approval portal is restricted to authorized administrative personnel (Qazi Israr). Please sign in with your administrator account.
        </p>
        <div className="pt-2">
          <button
            onClick={() => openAuthModal('signin')}
            className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-xs shadow transition-colors"
          >
            Sign In as Admin
          </button>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const displayedRequests = activeTab === 'pending' ? pendingRequests : requests;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">
              Admin Portal
            </span>
            <span className="text-xs text-muted-foreground">QI Tyrix Systems</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground mt-1">
            Contractor Onboarding & Verification
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Review incoming site builder applications and provision secure access credentials.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pending Approval</p>
            <p className="text-xl font-bold text-foreground">{pendingRequests.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Approved Contractors</p>
            <p className="text-xl font-bold text-foreground">
              {requests.filter((r) => r.status === 'approved').length}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Inquiries</p>
            <p className="text-xl font-bold text-foreground">{requests.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border text-xs font-semibold">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-orange-500 text-orange-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Pending Queue</span>
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-orange-500 text-white text-[10px]">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-4 border-b-2 transition-all ${
            activeTab === 'all'
              ? 'border-orange-500 text-orange-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          All Requests ({requests.length})
        </button>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">
          Loading access requests...
        </div>
      ) : displayedRequests.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-2xl space-y-2">
          <ShieldCheck className="w-8 h-8 mx-auto text-muted-foreground/60" />
          <p className="text-sm font-semibold text-foreground">No requests found</p>
          <p className="text-xs text-muted-foreground">
            {activeTab === 'pending'
              ? 'No contractor applications currently pending review.'
              : 'No access requests have been logged yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {displayedRequests.map((req) => (
            <div
              key={req.id}
              className="p-5 rounded-2xl bg-card border border-border hover:border-border/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">{req.full_name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                      req.status === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : req.status === 'rejected'
                        ? 'bg-destructive/10 text-destructive border border-destructive/20'
                        : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                    }`}
                  >
                    {req.status}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span className="truncate">{req.company_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span className="truncate">{req.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span className="truncate">{req.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>{req.phone}</span>
                </div>
              </div>

              {/* Action Buttons */}
              {req.status === 'pending' ? (
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                  <button
                    onClick={() => handleApprove(req)}
                    disabled={actionLoadingId === req.id}
                    className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {actionLoadingId === req.id ? 'Approving...' : 'Approve & Provision'}
                  </button>

                  <button
                    onClick={() => handleReject(req)}
                    disabled={actionLoadingId === req.id}
                    className="py-2 px-3 bg-muted hover:bg-destructive/10 hover:text-destructive text-muted-foreground text-xs font-medium rounded-xl transition-colors flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <span>Reviewed</span>
                  {req.reviewed_at && (
                    <span>
                      {new Date(req.reviewed_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* APPROVAL CREDENTIALS DIALOG */}
      {approvedCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card border border-emerald-500/40 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Contractor Approved & Credentials Created!
                </h2>
                <p className="text-xs text-muted-foreground">
                  Auth user generated for <span className="font-semibold text-foreground">{approvedCredentials.fullName}</span>
                </p>
              </div>
            </div>

            {/* Warning notice: shown once */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-500 flex items-start gap-2">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Security Notice:</strong> The temporary password below is displayed only once and is never stored in plaintext. Deliver it to the contractor now.
              </span>
            </div>

            {/* Credentials Card */}
            <div className="p-4 bg-muted/50 rounded-xl border border-border space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Contractor Name:</span>
                <span className="font-semibold text-foreground">{approvedCredentials.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Company:</span>
                <span className="font-semibold text-foreground">{approvedCredentials.companyName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Login Email:</span>
                <span className="font-mono text-foreground">{approvedCredentials.email}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-border">
                <span className="text-muted-foreground font-medium">Temporary Password:</span>
                <span className="font-mono text-sm font-bold text-orange-500 px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                  {approvedCredentials.tempPassword}
                </span>
              </div>
            </div>

            {/* Quick Delivery Actions */}
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-foreground">1-Click Dispatch to Contractor:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={formatWhatsAppLink(approvedCredentials)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send via WhatsApp
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>

                <a
                  href={formatEmailLink(approvedCredentials)}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow"
                >
                  <Mail className="w-4 h-4" />
                  Send via Email
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>

              <button
                onClick={() => copyCredentials(approvedCredentials)}
                className="w-full py-2 px-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-xs flex items-center justify-center gap-2 border border-border transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-muted-foreground" />
                    Copy Credentials Text
                  </>
                )}
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setApprovedCredentials(null)}
                className="w-full py-2.5 bg-card hover:bg-muted text-foreground font-semibold text-xs rounded-xl border border-border transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
