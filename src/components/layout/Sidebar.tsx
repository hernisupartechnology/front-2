import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Stethoscope, FileBarChart,
  Bell, Settings, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { authService } from '@/services/api/auth';
import { toast } from 'sonner';

const navLinks = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/doctors',     icon: Stethoscope,     label: 'Médicos' },
  { to: '/reports',     icon: FileBarChart,    label: 'Reportes' },
  { to: '/notifications', icon: Bell,          label: 'Notificaciones' },
  { to: '/settings',    icon: Settings,        label: 'Configuración' },
];

/**
 * Sidebar principal de UparVital — navegación lateral con identidad de marca verde.
 * En móvil se comporta como drawer deslizante.
 * En desktop puede colapsar a solo íconos.
 */
export default function Sidebar() {
  const { user, household } = useAuthStore();
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, toggleSidebarCollapsed } = useUiStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
      toast.success('Sesión cerrada correctamente.');
    } catch {
      toast.error('No se pudo cerrar la sesión. Intenta de nuevo.');
    }
  };

  const isOpen = sidebarOpen; // móvil
  const isCollapsed = sidebarCollapsed; // desktop

  return (
    <aside
      className="sidebar"
      style={{
        width: isCollapsed ? '72px' : '256px',
        transform: isOpen || window.innerWidth >= 1024 ? 'translateX(0)' : 'translateX(-100%)',
      }}
    >
      {/* Logo y nombre */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div
          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
          style={{ background: 'rgba(255,255,255,0.2)' }}
        >
          UV
        </div>
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-white font-bold text-sm tracking-wide truncate">UparVital</span>
            <span className="text-white/60 text-xs truncate">{household?.name ?? 'Sin hogar'}</span>
          </div>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navLinks.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-0 mx-2' : ''}`
            }
            onClick={() => setSidebarOpen(false)}
            title={isCollapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!isCollapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {/* Separador + Historial del hogar */}
        {user?.household_id && !isCollapsed && (
          <div className="mt-4 px-4">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-2 font-semibold">
              Miembros
            </p>
          </div>
        )}
      </nav>

      {/* Perfil del usuario */}
      <div className="border-t border-white/10 p-4">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-white/50 text-xs capitalize">{user?.role}</p>
            </div>
          </div>
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold mx-auto mb-3"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
        )}

        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-300 hover:!text-red-200 hover:!bg-red-900/20"
          style={{ margin: 0, padding: '8px 10px' }}
          title={isCollapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut size={16} />
          {!isCollapsed && <span className="text-sm">Cerrar sesión</span>}
        </button>
      </div>

      {/* Botón colapsar (solo desktop) */}
      <button
        onClick={toggleSidebarCollapsed}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full items-center justify-center text-white"
        style={{ background: 'var(--color-primary-600)', boxShadow: '0 2px 8px rgba(0,0,0,.2)' }}
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
