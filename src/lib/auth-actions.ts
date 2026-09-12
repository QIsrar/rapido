'use server';

import { createClient } from './supabase/server';
import { getAdminClient } from './supabase/admin';
import { revalidatePath } from 'next/cache';

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'contractor';
  companyName: string | null;
  phone: string | null;
  mustResetPassword: boolean;
}

export interface AccessRequestRecord {
  id: string;
  full_name: string;
  phone: string;
  company_name: string;
  location: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
}

/**
 * Generate a strong temporary password (e.g. Rapido#83B2!9174)
 */
function generateStrongTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const specials = '!@#$%&*';
  const nums = '23456789';
  
  let result = 'Rapido#';
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += specials.charAt(Math.floor(Math.random() * specials.length));
  for (let i = 0; i < 4; i++) {
    result += nums.charAt(Math.floor(Math.random() * nums.length));
  }
  return result;
}

/**
 * Get current authenticated user profile or null if guest
 */
export async function getCurrentProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, company_name, phone, must_reset_password')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      // User authenticated in auth.users, profile fallback
      return {
        id: user.id,
        email: user.email || '',
        role: 'contractor',
        companyName: null,
        phone: null,
        mustResetPassword: true,
      };
    }

    return {
      id: user.id,
      email: user.email || '',
      role: (profile.role as 'admin' | 'contractor') || 'contractor',
      companyName: profile.company_name,
      phone: profile.phone,
      mustResetPassword: Boolean(profile.must_reset_password),
    };
  } catch (err) {
    console.error('Error fetching current profile:', err);
    return null;
  }
}

/**
 * Submit Access Request (Public / Anon allowed)
 */
export async function submitAccessRequest(data: {
  fullName: string;
  phone: string;
  companyName: string;
  location: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const fullName = data.fullName.trim();
    const phone = data.phone.trim();
    const companyName = data.companyName.trim();
    const location = data.location.trim();
    const email = data.email.trim().toLowerCase();

    if (!fullName || !phone || !companyName || !location || !email) {
      return { success: false, error: 'All fields are required.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    // Insert access request
    const { error } = await supabase.from('access_requests').insert({
      full_name: fullName,
      phone,
      company_name: companyName,
      location,
      email,
      status: 'pending',
    });

    if (error) {
      console.error('Failed to submit access request:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Sign In using Supabase SSR
 */
export async function signInUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; profile?: UserProfile }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error || !data.user) {
      return { success: false, error: error?.message || 'Invalid email or password.' };
    }

    // Query user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, company_name, phone, must_reset_password')
      .eq('id', data.user.id)
      .maybeSingle();

    const userProfile: UserProfile = {
      id: data.user.id,
      email: data.user.email || '',
      role: (profile?.role as 'admin' | 'contractor') || 'contractor',
      companyName: profile?.company_name || null,
      phone: profile?.phone || null,
      mustResetPassword: profile?.must_reset_password ?? true,
    };

    revalidatePath('/');
    return { success: true, profile: userProfile };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return { success: false, error: message };
  }
}

/**
 * Sign Out
 */
export async function signOutUser(): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    console.error('Sign out error:', err);
    return { success: false };
  }
}

/**
 * Mandatory Password Reset (first-login requirement)
 */
export async function completeMandatoryPasswordReset(
  currentTempPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return { success: false, error: 'Session expired. Please sign in again.' };
    }

    if (newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters.' };
    }

    // Verify current temp password with sign in check
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentTempPassword,
    });

    if (verifyError) {
      return { success: false, error: 'Current temporary password does not match.' };
    }

    // Update password in auth.users
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Mark must_reset_password = false in profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        must_reset_password: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Failed to update profile must_reset_password:', profileError);
    }

    revalidatePath('/');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Password reset failed';
    return { success: false, error: message };
  }
}

/**
 * Fetch All Access Requests (Admin Only)
 */
export async function getAccessRequests(): Promise<{
  success: boolean;
  requests?: AccessRequestRecord[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized. Admin login required.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'admin') {
      return { success: false, error: 'Access denied: Admin role required.' };
    }

    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, requests: data as AccessRequestRecord[] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch requests';
    return { success: false, error: message };
  }
}

/**
 * Approve Access Request (Admin Only)
 * Creates Supabase Auth user via Admin Client, generates temp password, returns credentials once.
 */
export async function approveAccessRequest(requestId: string): Promise<{
  success: boolean;
  error?: string;
  credentials?: {
    email: string;
    tempPassword: string;
    fullName: string;
    phone: string;
    companyName: string;
  };
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized. Admin login required.' };
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (adminProfile?.role !== 'admin') {
      return { success: false, error: 'Access denied: Admin privileges required.' };
    }

    // Fetch the target request
    const { data: req, error: reqErr } = await supabase
      .from('access_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (reqErr || !req) {
      return { success: false, error: 'Access request not found.' };
    }

    const tempPassword = generateStrongTempPassword();
    const adminClient = getAdminClient();

    // Call supabase.auth.admin.createUser using service role key
    const { data: newAuthUser, error: authCreateError } =
      await adminClient.auth.admin.createUser({
        email: req.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          role: 'contractor',
          company_name: req.company_name,
          phone: req.phone,
          must_reset_password: true,
        },
      });

    if (authCreateError) {
      // If user already exists in auth.users, update their password and profile
      if (authCreateError.message.toLowerCase().includes('already registered')) {
        // Find existing user id
        const { data: listData } = await adminClient.auth.admin.listUsers();
        const existing = listData?.users.find((u) => u.email === req.email);

        if (existing) {
          await adminClient.auth.admin.updateUserById(existing.id, {
            password: tempPassword,
            user_metadata: {
              role: 'contractor',
              company_name: req.company_name,
              phone: req.phone,
              must_reset_password: true,
            },
          });

          await adminClient
            .from('profiles')
            .upsert({
              id: existing.id,
              role: 'contractor',
              company_name: req.company_name,
              phone: req.phone,
              must_reset_password: true,
            });
        } else {
          return { success: false, error: authCreateError.message };
        }
      } else {
        return { success: false, error: authCreateError.message };
      }
    }

    // Mark request as approved
    await supabase
      .from('access_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    revalidatePath('/admin');

    return {
      success: true,
      credentials: {
        email: req.email,
        tempPassword,
        fullName: req.full_name,
        phone: req.phone,
        companyName: req.company_name,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Approval failed';
    return { success: false, error: message };
  }
}

/**
 * Reject Access Request (Admin Only)
 */
export async function rejectAccessRequest(requestId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized.' };
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (adminProfile?.role !== 'admin') {
      return { success: false, error: 'Access denied.' };
    }

    const { error } = await supabase
      .from('access_requests')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Rejection failed';
    return { success: false, error: message };
  }
}
