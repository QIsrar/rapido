import { supabase } from './supabase';

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
  if (file.size > MAX_SIZE_BYTES) {
    return { url: null, error: 'File too large. Maximum size is 5MB.' };
  }

  if (!file.type.startsWith('image/')) {
    return { url: null, error: 'Only image files are allowed.' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const path = `${expenseId}-${timestamp}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '31536000', // 1 year cache
      upsert: false,
    });

  if (uploadError) {
    console.error('Receipt upload error:', uploadError);
    return { url: null, error: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return { url: publicUrlData.publicUrl, error: null };
}
