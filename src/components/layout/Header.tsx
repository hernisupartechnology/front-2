import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, Moon, Sun } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import api from '@/lib/axios';
import type { AppNotification } from '@/types';

/**
 * Header principal — hamburguesa (móvil), búsqueda, notificaciones y modo oscuro.
 */
export default function Header() {
  const { user } = useAuthStore();
  const { darkMode, toggleDarkMode, toggleSidebar } = useUiStore();
  const [showNotifications, setShowNotifications] = useState(false);

  // Cargar notificaciones no leídas
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const { data } = await api.get<{ data: AppNotification[] }>('/notifications?per_page=10');
      return data.data;
    },
    refetchInterval: 60000, // actualizar cada minuto
  });

  const unreadCount = notificationsData?.filter((n) => !n.read_at).length ?? 0;

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 px-4 md:px-6 h-16 border-b bg-surface dark:bg-[#1a2e1b] border-[rgba(27,94,32,.1)] dark:border-[rgba(165,214,167,.08)]">
      {/* Hamburguesa — solo móvil */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden btn btn--ghost p-2"
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      {/* Título de página */}
      <div className="flex-1" />

      {/* Acciones del header */}
      <div className="flex items-center gap-2">

        {/* Modo oscuro */}
        <button
          onClick={toggleDarkMode}
          className="btn btn--ghost p-2 rounded-full"
          aria-label={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
          title={darkMode ? '☀️ Modo claro' : '🌙 Modo oscuro'}
        >
          {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
        </button>

        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="btn btn--ghost p-2 rounded-full relative"
            aria-label="Notificaciones"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                style={{ background: '#C62828' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown de notificaciones */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 card shadow-modal z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(27,94,32,.08)]">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>
                  Notificaciones
                </h3>
                <Link
                  to="/notifications"
                  className="text-xs font-medium hover:underline"
                  style={{ color: 'var(--color-primary)' }}
                  onClick={() => setShowNotifications(false)}
                >
                  Ver todas
                </Link>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[rgba(27,94,32,.06)]">
                {!notificationsData || notificationsData.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">
                    ✅ Sin notificaciones nuevas
                  </div>
                ) : (
                  notificationsData.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 text-sm ${!n.read_at ? 'bg-[#E8F5E9]/40' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{
                            background: n.priority === 'danger' ? '#C62828'
                              : n.priority === 'warning' ? '#F9A825' : '#2E7D32',
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{n.title}</p>
                          <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{n.body}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar del usuario */}
        <Link to="/settings" className="ml-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'var(--color-primary)' }}
            title={user?.name}
          >
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
        </Link>
      </div>

      {/* Cerrar dropdown al hacer click fuera */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </header>
  );
}
