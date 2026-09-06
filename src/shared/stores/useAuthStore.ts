import type { AuthChangeEvent, Session, Subscription } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { User } from '../types';
import { getErrorMessage } from '../utils/errors';

interface UserProfileRow {
  id: string;
  email?: string | null;
  nombre: string;
  rol: User['rol'];
  celular?: string | null;
  dni?: string | null;
  ruc?: string | null;
  requiere_cambio_password?: boolean | null;
  created_at: string;
}

interface AuthStore {
  user: User | null;
  sessionToken: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  completePasswordChange: (newPassword: string) => Promise<void>;
}

let authSubscription: Subscription | null = null;
let initializationPromise: Promise<void> | null = null;

function mapProfileToUser(profile: UserProfileRow, session: Session | null): User {
  return {
    id: profile.id,
    email: profile.email ?? session?.user.email ?? '',
    nombre: profile.nombre,
    rol: profile.rol,
    celular: profile.celular ?? undefined,
    dni: profile.dni ?? undefined,
    ruc: profile.ruc ?? undefined,
    requiereCambioPassword: profile.requiere_cambio_password === true,
    createdAt: profile.created_at,
  };
}

async function fetchUserProfile(session: Session): Promise<User> {
  const { data: profile, error } = await supabase
    .from('usuarios')
    .select('id, nombre, rol, celular, dni, ruc, requiere_cambio_password, created_at')
    .eq('id', session.user.id)
    .single<UserProfileRow>();

  if (error) {
    // Si la columna requiere_cambio_password aún no está migrada en la base de datos, fallback seguro
    const { data: fallbackProfile, error: fallbackError } = await supabase
      .from('usuarios')
      .select('id, nombre, rol, celular, dni, ruc, created_at')
      .eq('id', session.user.id)
      .single<UserProfileRow>();

    if (fallbackError || !fallbackProfile) {
      throw error;
    }
    return mapProfileToUser(fallbackProfile, session);
  }

  return mapProfileToUser(profile, session);
}

async function syncSession(
  session: Session | null,
  event: AuthChangeEvent | 'INITIAL_SESSION',
  set: (partial: Partial<AuthStore>) => void
): Promise<void> {
  if (!session) {
    set({
      user: null,
      sessionToken: null,
      error: null,
      loading: false,
      initialized: true,
    });
    return;
  }

  try {
    const user = await fetchUserProfile(session);
    set({
      user,
      sessionToken: session.access_token,
      error: null,
      loading: false,
      initialized: true,
    });
  } catch (error: unknown) {
    console.error(`Error sincronizando perfil en evento ${event}:`, error);
    set({
      user: null,
      sessionToken: null,
      error: getErrorMessage(error, 'Error al sincronizar tu perfil.'),
      loading: false,
      initialized: true,
    });
  }
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  sessionToken: null,
  loading: false,
  error: null,
  initialized: false,

  initialize: async () => {
    if (get().initialized && authSubscription) {
      return;
    }

    if (!initializationPromise) {
      initializationPromise = (async () => {
        set({ loading: true, error: null });

        try {
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            throw sessionError;
          }

          await syncSession(session, 'INITIAL_SESSION', set);

          if (!authSubscription) {
            const { data } = supabase.auth.onAuthStateChange((event, currentSession) => {
              void syncSession(currentSession, event, set);
            });
            authSubscription = data.subscription;
          }
        } catch (error: unknown) {
          console.error('Error durante la inicialización de autenticación:', error);
          set({
            error: getErrorMessage(error, 'Error de conexión'),
            loading: false,
            initialized: true,
          });
        }
      })().finally(() => {
        initializationPromise = null;
      });
    }

    await initializationPromise;
  },

  login: async (email, password) => {
    set({ loading: true, error: null });

    try {
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (!session) {
        throw new Error('No se pudo establecer la sesión.');
      }

      const loggedUser = await fetchUserProfile(session);
      set({
        user: loggedUser,
        sessionToken: session.access_token,
        error: null,
        loading: false,
        initialized: true,
      });

      return loggedUser;
    } catch (error: unknown) {
      console.error('Error en login:', error);
      set({
        error: getErrorMessage(error, 'Credenciales incorrectas'),
        loading: false,
      });
      return null;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }

      set({
        user: null,
        sessionToken: null,
        error: null,
        loading: false,
      });
    } catch (error: unknown) {
      console.error('Error al cerrar sesión:', error);
      set({
        error: getErrorMessage(error, 'Error al cerrar sesión'),
        loading: false,
      });
    }
  },

  completePasswordChange: async (newPassword: string) => {
    set({ loading: true, error: null });

    try {
      // 1. Actualizar contraseña del usuario autenticado en Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (authError) {
        throw authError;
      }

      // 2. Invocar RPC para desactivar la bandera de cambio obligatorio
      const { error: rpcError } = await supabase.rpc('marcar_password_actualizada');

      if (rpcError) {
        console.warn('Fallo RPC marcar_password_actualizada, aplicando fallback:', rpcError.message);
        await supabase
          .from('usuarios')
          .update({ requiere_cambio_password: false })
          .eq('id', get().user?.id);
      }

      // 3. Sincronizar estado local en memoria
      const currentUser = get().user;
      if (currentUser) {
        set({
          user: {
            ...currentUser,
            requiereCambioPassword: false,
          },
          loading: false,
          error: null,
        });
      } else {
        set({ loading: false, error: null });
      }
    } catch (error: unknown) {
      console.error('Error completando cambio obligatorio de contraseña:', error);
      const msg = getErrorMessage(error, 'Error al actualizar la contraseña');
      set({ error: msg, loading: false });
      throw new Error(msg, { cause: error });
    }
  },
}));
