import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

/**
 * Servicio de autenticación — llamadas a la API de auth.
 */
export const authService = {
  /** Iniciar sesión y guardar token en el store. */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    useAuthStore.getState().setAuth(data.user, data.token);
    return data;
  },

  /** Registrar nuevo usuario y guardar token. */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    useAuthStore.getState().setAuth(data.user, data.token);
    return data;
  },

  /** Cerrar sesión — revoca token en el servidor y limpia el store. */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      useAuthStore.getState().logout();
    }
  },

  /** Obtener los datos actualizados del usuario autenticado. */
  async me(): Promise<User> {
    const { data } = await api.get<{ user: User }>('/auth/me');
    useAuthStore.getState().setUser(data.user);
    return data.user;
  },

  /** Actualizar perfil del usuario autenticado. */
  async updateProfile(payload: Partial<User>): Promise<User> {
    const { data } = await api.put<{ user: User }>('/auth/profile', payload);
    useAuthStore.getState().setUser(data.user);
    return data.user;
  },

  /** Solicitar enlace de recuperación de contraseña. */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  /** Restablecer contraseña con el token del correo. */
  async resetPassword(payload: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string }> {
    const { data } = await api.post('/auth/reset-password', payload);
    return data;
  },
};
