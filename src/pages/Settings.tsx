import { Settings as SettingsIcon, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/api/auth';

/**
 * Configuración — se implementa completo en la Fase 5
 * (perfil médico, hogar, notificaciones, médicos, rangos de signos vitales,
 * dispositivos con push, exportación de datos, zona peligrosa).
 */
export default function Settings() {
  const navigate = useNavigate();
  const { user, household } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
      toast.success('Sesión cerrada correctamente.');
    } catch {
      toast.error('No se pudo cerrar la sesión.');
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
        Configuración
      </h1>

      <div className="card p-6 mb-4 flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
          style={{ background: 'var(--color-primary)' }}
        >
          {user?.name?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <div>
          <p className="font-semibold text-gray-800 dark:text-gray-100">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <p className="text-xs text-gray-400 capitalize mt-0.5">{user?.role} · {household?.name ?? 'Sin hogar'}</p>
        </div>
      </div>

      <div className="card p-10 flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--color-primary-100)' }}>
          <SettingsIcon size={24} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">Las opciones de configuración están en construcción</h2>
        <p className="text-sm text-gray-500 max-w-md">
          Aquí podrás editar tu perfil médico, gestionar el hogar, notificaciones, médicos, rangos de
          signos vitales, dispositivos con notificaciones push y exportar tus datos (Fase 5).
        </p>
      </div>

      <button onClick={handleLogout} className="btn btn--danger mt-4 gap-2">
        <LogOut size={16} />
        Cerrar sesión
      </button>
    </div>
  );
}
