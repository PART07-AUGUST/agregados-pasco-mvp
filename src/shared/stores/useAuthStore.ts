import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { User } from '../types';

interface AuthStore {
  user: User | null;
  sessionToken: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  sessionToken: null,
  loading: false,
  error: null,
  initialized: false,

  initialize: async () => {
    // Evitar inicializaciones múltiples redundantes
    if (get().initialized) return;

    set({ loading: true });
    try {
      // 1. Obtener sesión inicial activa
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      if (session) {
        // Obtener el perfil público de usuarios enlazado
        const { data: profile, error: profileError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error cargando el perfil público del usuario:', profileError);
          set({ 
            user: null, 
            sessionToken: null, 
            loading: false, 
            initialized: true 
          });
          return;
        }

        set({ 
          user: profile as User, 
          sessionToken: session.access_token, 
          error: null 
        });
      } else {
        set({ user: null, sessionToken: null });
      }

      // 2. Suscribirse a cambios del estado de autenticación (onAuthStateChange)
      supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (event === 'SIGNED_IN' && currentSession) {
          const { data: profile } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();

          set({ 
            user: profile as User, 
            sessionToken: currentSession.access_token,
            error: null
          });
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, sessionToken: null, error: null });
        } else if (event === 'TOKEN_REFRESHED' && currentSession) {
          set({ sessionToken: currentSession.access_token });
        }
      });

    } catch (err: any) {
      console.error('Error durante la inicialización de autenticación:', err);
      set({ error: err.message || 'Error de conexión' });
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!session) {
        throw new Error('No se pudo establecer la sesión.');
      }

      // Descargar el perfil de la tabla usuarios pública
      const { data: profile, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        throw new Error('Error al sincronizar tu perfil de usuario. Inténtalo de nuevo.');
      }

      const loggedUser = profile as User;
      set({ 
        user: loggedUser, 
        sessionToken: session.access_token, 
        error: null 
      });
      
      return loggedUser;
    } catch (err: any) {
      console.error('Error en login:', err);
      set({ error: err.message || 'Credenciales incorrectas' });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, sessionToken: null, error: null });
    } catch (err: any) {
      console.error('Error al cerrar sesión:', err);
      set({ error: err.message || 'Error al cerrar sesión' });
    } finally {
      set({ loading: false });
    }
  },
}));
