'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useAuth } from './auth-context';
import {
  User,
  Shield,
  LogOut,
  ShieldCheck,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';

export function UserStatusBadge() {
  const { user, isAdmin, signOut, openAuthModal } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleDropdown = () => {
    if (!dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }
    setDropdownOpen(!dropdownOpen);
  };

  if (!user) {
    return (
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={() => openAuthModal('signin')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-600 border border-orange-500/25 hover:bg-orange-500/20 active:scale-95 transition-all cursor-pointer tap-scale shrink-0 shadow-2xs"
        >
          <User className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Guest</span>
          <span className="text-[10px] text-orange-600 underline font-extrabold">
            Sign In
          </span>
        </button>
      </div>
    );
  }

  const dropdownPortal = dropdownOpen && mounted && typeof document !== 'undefined' ? (
    createPortal(
      <>
        {/* Fullscreen transparent click-away layer */}
        <div
          className="fixed inset-0 z-[99998] bg-black/10"
          onClick={() => setDropdownOpen(false)}
        />
        {/* Dropdown Menu directly on document.body */}
        <div
          style={{
            top: `${coords.top}px`,
            right: `${coords.right}px`,
          }}
          className="fixed z-[99999] w-56 bg-white border-2 border-slate-200/90 rounded-2xl shadow-2xl p-2 text-xs animate-in zoom-in-95 fade-in duration-150 text-slate-900"
        >
          <div className="px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100 mb-1.5">
            <p className="font-black text-slate-900 truncate text-xs">{user.email}</p>
            <div className="flex items-center gap-1 mt-1">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isAdmin ? 'bg-purple-600' : 'bg-emerald-600'
                }`}
              />
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                {isAdmin ? 'Administrator' : user.companyName || 'Verified Contractor'}
              </p>
            </div>
          </div>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-purple-700 hover:bg-purple-50 font-bold rounded-xl transition-colors mb-1 cursor-pointer tap-scale"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Admin Portal</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </Link>
          )}

          <button
            type="button"
            onClick={async () => {
              setDropdownOpen(false);
              await signOut();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 font-bold rounded-xl transition-colors text-left cursor-pointer tap-scale"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </>,
      document.body
    )
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-black border-2 transition-all cursor-pointer tap-scale shrink-0 shadow-xs ${
          isAdmin
            ? 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100'
            : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
        }`}
      >
        {isAdmin ? (
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
        ) : (
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
        )}
        <span className="max-w-[80px] sm:max-w-[120px] truncate">
          {isAdmin ? 'Admin' : user.companyName || user.email.split('@')[0]}
        </span>
        <ChevronDown className="w-3.5 h-3.5 opacity-70" />
      </button>

      {dropdownPortal}
    </>
  );
}
