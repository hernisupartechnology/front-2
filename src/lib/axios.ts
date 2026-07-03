import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

/**
 * Instancia de Axios configurada para la API de UparVital.
 * Incluye interceptores para:
 * - Adjuntar el token de Sanctum automáticamente en cada petición
 * - Manejar errores 401 (sesión expirada) redirigiendo al login
 * - Mostrar errores de validación (422) con toast notifications
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

// ── Interceptor de REQUEST ────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Interceptor de RESPONSE ───────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Sesión expirada — limpiar estado y redirigir al login
      useAuthStore.getState().logout();
      window.location.href = '/login';
      toast.error('Tu sesión expiró. Por favor inicia sesión de nuevo.');
    } else if (status === 403) {
      toast.error('No tienes permiso para realizar esta acción.');
    } else if (status === 404) {
      toast.error('El recurso solicitado no fue encontrado.');
    } else if (status === 422) {
      // Errores de validación — se muestran en el formulario, no como toast
      // (manejados por React Hook Form en cada componente)
    } else if (status === 429) {
      toast.error('Demasiadas solicitudes. Espera un momento e intenta de nuevo.');
    } else if (status >= 500) {
      toast.error('Ocurrió un error en el servidor. Intenta de nuevo más tarde.');
    } else if (!status) {
      // Error de red (sin conexión)
      toast.error('Sin conexión a internet. Verifica tu red e intenta de nuevo.');
    }

    return Promise.reject(error);
  }
);

export default api;
