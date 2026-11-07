import { createClient, SupabaseClient } from '@supabase/supabase-js';

const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as Record<string, any>).env : undefined;
const procEnv = typeof process !== 'undefined' ? process.env : undefined;

const envUrl =
  procEnv?.SUPABASE_URL ||
  procEnv?.VITE_SUPABASE_URL ||
  metaEnv?.VITE_SUPABASE_URL ||
  'https://eiahioropjetgzzhvsgo.supabase.co';

const SUPABASE_URL = envUrl.replace(/\/rest\/v1\/?$/, '');

const SUPABASE_SERVICE_ROLE_KEY =
  procEnv?.SUPABASE_SERVICE_ROLE_KEY ||
  procEnv?.SUPABASE_SERVICE_KEY ||
  metaEnv?.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  metaEnv?.VITE_SUPABASE_ANON_KEY ||
  procEnv?.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_vVhSnPt13-ZSYqZC6SEEkQ_71RPcEIg';

export const supabaseAdmin: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default supabaseAdmin;
