'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from './auth-context';
import {
  User,
  Shield,
  LogOut,
  LogIn,
  UserPlus,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

export function UserStatusBadge() {
  const { user, isGuest, isAdmin, signOut, openAuthModal } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => openAuthModal('signin')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-600 border border-orange-500/20 hover:bg-orange-500/20 transition-all cursor-pointer tap-scale"
        >
          <User className="w-3.5 h-3.5" />
          <span>Guest Mode</span>
          <span className="text-[10px] text-orange-500 underline font-normal ml-0.5">
            Sign In
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer tap-scale ${
          isAdmin
            ? 'bg-purple-500/10 text-purple-600 border-purple-500/25 hover:bg-purple-500/20'
            : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 hover:bg-emerald-500/20'
        }`}
      >
        {isAdmin ? (
          <ShieldCheck className="w-3.5 h-3.5" />
        ) : (
          <Shield className="w-3.5 h-3.5" />
        )}
        <span className="max-w-[100px] truncate">
          {isAdmin ? 'Admin' : user.companyName || user.email.split('@')[0]}
        </span>
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
          <div className="px-2.5 py-2 border-b border-border/60 mb-1">
            <p className="font-bold text-foreground truncate">{user.email}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">
              {isAdmin ? 'Administrator' : 'Verified Contractor'}
            </p>
          </div>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2 px-2.5 py-1.5 text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Admin Portal</span>
            </Link>
          )}

          <button
            onClick={async () => {
              setDropdownOpen(false);
              await signOut();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
