import { createClient } from '@supabase/supabase-js';

const rawUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';

const rawKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

const cleanedUrl = rawUrl.trim().replace(/\/+$/, '');
const cleanedKey = rawKey.trim();

export const isSupabaseConfigured = Boolean(
  cleanedUrl &&
    cleanedKey &&
    !cleanedUrl.includes('placeholder') &&
    cleanedUrl.startsWith('http') &&
    cleanedKey !== 'placeholder-anon-key'
);

const supabaseUrl = isSupabaseConfigured
  ? cleanedUrl
  : 'https://placeholder.supabase.co';

const supabaseAnonKey = isSupabaseConfigured
  ? cleanedKey
  : 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

/**
 * Diagnostic helper to report connection configuration state without exposing secrets.
 */
export function getSupabaseConfigStatus() {
  return {
    isConfigured: isSupabaseConfigured,
    hasUrl: Boolean(rawUrl),
    hasKey: Boolean(rawKey),
    urlSource: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? 'NEXT_PUBLIC_SUPABASE_URL'
      : process.env.SUPABASE_URL
      ? 'SUPABASE_URL'
      : 'missing',
    keySource: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
      : process.env.SUPABASE_ANON_KEY
      ? 'SUPABASE_ANON_KEY'
      : 'missing',
    projectRef: cleanedUrl
      ? cleanedUrl.replace(/^https?:\/\//, '').split('.')[0]
      : 'not-configured',
  };
}
