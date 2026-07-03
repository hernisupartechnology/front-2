import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  darkMode: boolean;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Acciones
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (value: boolean) => void;
  toggleSidebarCollapsed: () => void;
}

/**
 * Store de UI — modo oscuro, estado del sidebar.
 * Se persiste para mantener las preferencias del usuario.
 */
export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      darkMode: false,
      sidebarOpen: false,
      sidebarCollapsed: false,

      toggleDarkMode: () => {
        const newValue = !get().darkMode;
        set({ darkMode: newValue });
        // Aplicar clase 'dark' al document root para Tailwind dark mode
        document.documentElement.classList.toggle('dark', newValue);
      },

      setDarkMode: (value) => {
        set({ darkMode: value });
        document.documentElement.classList.toggle('dark', value);
      },

      toggleSidebar: () =>
        set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      setSidebarOpen: (value) =>
        set({ sidebarOpen: value }),

      toggleSidebarCollapsed: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: 'uparvital-ui',
      partialize: (state) => ({
        darkMode: state.darkMode,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      onRehydrateStorage: () => (state) => {
        // Aplicar modo oscuro al restaurar desde localStorage
        if (state?.darkMode) {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);
