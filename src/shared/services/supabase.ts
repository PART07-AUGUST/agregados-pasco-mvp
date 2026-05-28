import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || supabaseUrl === 'https://placeholder-url.supabase.co') {
  console.warn(
    'Supabase URL placeholder detected. Please update VITE_SUPABASE_URL in your .env.local file.'
  );
}

if (!supabaseAnonKey || supabaseAnonKey === 'placeholder-anon-key-123456') {
  console.warn(
    'Supabase Anon Key placeholder detected. Please update VITE_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key-123456'
);
