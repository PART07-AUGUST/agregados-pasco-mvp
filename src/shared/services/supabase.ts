import { createClient } from '@supabase/supabase-js';
import { AUTH_STORAGE_KEYS } from '../constants/authConstants';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (o VITE_SUPABASE_PUBLISHABLE_KEY).'
  );
}

export function isSessionPersistent(): boolean {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEYS.REMEMBER_SESSION) === 'true';
  } catch {
    return false;
  }
}

export function setSessionPersistent(persistent: boolean): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEYS.REMEMBER_SESSION, persistent ? 'true' : 'false');
  } catch {
    // Storage unavailable fallback
  }
}

const authStorageAdapter = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      return sessionStorage.getItem(key) || localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window === 'undefined') return;
      if (isSessionPersistent()) {
        localStorage.setItem(key, value);
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, value);
        localStorage.removeItem(key);
      }
    } catch {
      // Storage unavailable fallback
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window === 'undefined') return;
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch {
      // Storage unavailable fallback
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorageAdapter,
    persistSession: true,
    autoRefreshToken: true,
  },
});
