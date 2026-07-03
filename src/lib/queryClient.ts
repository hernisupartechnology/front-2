import { QueryClient } from '@tanstack/react-query';

/**
 * Configuración global de TanStack Query para UparVital.
 * Estrategia:
 * - staleTime: 60s para la mayoría de datos (no refetch innecesario)
 * - gcTime: 5min para mantener en cache datos que el usuario puede necesitar pronto
 * - retry: 2 reintentos para errores de red, no para errores 4xx
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 60 segundos
      gcTime: 5 * 60 * 1000, // 5 minutos
      retry: (failureCount, error: unknown) => {
        // No reintentar en errores 4xx (auth, validación, permisos)
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0, // Las mutaciones no se reintentan automáticamente
    },
  },
});
