import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET } from '../../config/index.js';

let supabaseClient: any = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

export const uploadImageToStorage = async (fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> => {
  if (!supabaseClient) {
    // Fallback: return data URI / placeholder if storage not yet configured
    const base64 = fileBuffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  const { data, error } = await supabaseClient.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(`reports/${Date.now()}-${fileName}`, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload error: ${error.message}`);
  }

  const { data: publicUrlData } = supabaseClient.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
};
