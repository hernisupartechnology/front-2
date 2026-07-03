import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Household } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  household: Partial<Household> | null;

  // Acciones
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  setHousehold: (household: Partial<Household> | null) => void;
  logout: () => void;

  // Getters
  isAuthenticated: () => boolean;
  isOwner: () => boolean;
  isMember: () => boolean;
  isViewer: () => boolean;
}

/**
 * Store global de autenticación.
 * Persiste el token y los datos del usuario en localStorage para mantener la sesión.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      household: null,

      setAuth: (user, token) =>
        set({ user, token, household: user.household ?? null }),

      setUser: (user) =>
        set({ user, household: user.household ?? get().household }),

      setHousehold: (household) =>
        set({ household }),

      logout: () =>
        set({ user: null, token: null, household: null }),

      isAuthenticated: () => !!get().token && !!get().user,

      isOwner: () => get().user?.role === 'owner',
      isMember: () => get().user?.role === 'member',
      isViewer: () => get().user?.role === 'viewer',
    }),
    {
      name: 'uparvital-auth', // clave en localStorage
      // Solo persistir token y usuario (no el household completo — se carga al iniciar)
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
