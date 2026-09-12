'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getCurrentProfile, signOutUser, type UserProfile } from '@/lib/auth-actions';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  isContractor: boolean;
  mustResetPassword: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'signup' | 'signin';
  openAuthModal: (tab?: 'signup' | 'signin') => void;
  closeAuthModal: () => void;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signup' | 'signin'>('signin');

  const refreshUser = useCallback(async () => {
    try {
      const profile = await getCurrentProfile();
      setUser(profile);
    } catch (err) {
      console.error('Failed to load user profile:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    // Listen to Supabase auth state changes in the browser
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await refreshUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser]);

  const openAuthModal = useCallback((tab: 'signup' | 'signin' = 'signin') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOutUser();
    setUser(null);
  }, []);

  const isGuest = !user;
  const isAdmin = user?.role === 'admin';
  const isContractor = user?.role === 'contractor';
  const mustResetPassword = Boolean(user && user.mustResetPassword);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isGuest,
        isAdmin,
        isContractor,
        mustResetPassword,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        refreshUser,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
