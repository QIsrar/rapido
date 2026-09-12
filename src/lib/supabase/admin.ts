import { createClient } from '@supabase/supabase-js';

export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin user provisioning.');
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
