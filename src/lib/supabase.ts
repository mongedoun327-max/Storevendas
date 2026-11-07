import { createClient } from '@supabase/supabase-js';

// Safe environment variable resolution supporting Vite (import.meta.env) and CRA/Webpack (process.env)
const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as Record<string, any>).env : undefined;
const procEnv = typeof process !== 'undefined' ? process.env : undefined;

const envUrl = 
  metaEnv?.VITE_SUPABASE_URL ||
  metaEnv?.REACT_APP_SUPABASE_URL ||
  procEnv?.REACT_APP_SUPABASE_URL ||
  procEnv?.VITE_SUPABASE_URL ||
  'https://eiahioropjetgzzhvsgo.supabase.co';

const rawUrl = envUrl || 'https://eiahioropjetgzzhvsgo.supabase.co';
// Normalize URL to remove trailing /rest/v1/ if passed, as @supabase/supabase-js appends it internally
const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '');

const SUPABASE_ANON_KEY = 
  metaEnv?.VITE_SUPABASE_ANON_KEY ||
  metaEnv?.REACT_APP_SUPABASE_ANON_KEY ||
  procEnv?.REACT_APP_SUPABASE_ANON_KEY ||
  procEnv?.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_vVhSnPt13-ZSYqZC6SEEkQ_71RPcEIg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabase;
