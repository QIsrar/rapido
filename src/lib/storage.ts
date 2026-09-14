import { isSupabaseConfigured } from './supabase';
import { createClient } from './supabase/client';
import { withTimeout } from './utils';

const BUCKET = 'receipts';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Upload a receipt image to the pre-configured Supabase Storage bucket.
 * The bucket was created manually with server-side constraints (5MB, images only).
 * Returns the public URL on success.
 */
export async function uploadReceipt(
  file: File,
  expenseId: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { url: null, error: 'Supabase storage is not configured.' };
    }

    if (!file || !expenseId) {
      return { url: null, error: 'File and expense ID are required.' };
    }

    if (file.size > MAX_SIZE_BYTES) {
      return { url: null, error: 'File too large. Maximum size is 5MB.' };
    }

    if (!file.type.startsWith('image/')) {
      return { url: null, error: 'Only image files are allowed.' };
    }

    // Sanitize extension and expenseId to prevent path traversal
    const rawExt = file.name.split('.').pop() || 'jpg';
    const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const timestamp = Date.now();
    const sanitizedExpenseId = expenseId.replace(/[^a-zA-Z0-9_-]/g, '');
    const path = `${sanitizedExpenseId}-${timestamp}.${ext}`;

    const supabase = createClient();
    const { error: uploadError } = await withTimeout(
      supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '31536000', // 1 year cache
        upsert: false,
      }),
      45000,
      'Receipt upload timed out over weak network.'
    );

    if (uploadError) {
      console.error('Receipt upload error:', uploadError);
      return { url: null, error: uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: unknown) {
    console.error('Receipt upload exception:', err);
    return {
      url: null,
      error: err instanceof Error ? err.message : 'Upload failed',
    };
  }
}
