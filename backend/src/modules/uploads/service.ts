import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET } from '../../config/index.js';

let supabaseClient: any = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

const sanitizeSegment = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'file';

export const buildReportPhotoPath = (kodeTiket: string, jenis: 'awal' | 'bukti', index: number, mimeType: string) => {
  const extension = MIME_EXTENSIONS[mimeType.toLowerCase()] ?? 'jpg';
  return `reports/${sanitizeSegment(kodeTiket)}/${jenis}-${index}.${extension}`;
};

export const uploadImageToStorage = async (
  fileBuffer: Buffer,
  storagePath: string,
  mimeType: string,
  upsert = false
): Promise<string> => {
  if (!supabaseClient) {
    // Fallback: return data URI / placeholder if storage not yet configured
    const base64 = fileBuffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  const { data, error } = await supabaseClient.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert,
    });

  if (error) {
    throw new Error(`Upload error: ${error.message}`);
  }

  const { data: publicUrlData } = supabaseClient.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
};
