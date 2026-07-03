import { Bell } from 'lucide-react';

/**
 * Página de notificaciones paginadas — se implementa completo en la Fase 5.
 * El dropdown de notificaciones del Header ya está funcional.
 */
export default function Notifications() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
        Notificaciones
      </h1>

      <div className="card p-10 flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--color-primary-100)' }}>
          <Bell size={24} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">El historial completo de notificaciones está en construcción</h2>
        <p className="text-sm text-gray-500 max-w-md">
          Mientras tanto, puedes ver tus notificaciones recientes desde la campanita 🔔 en la parte superior (Fase 5).
        </p>
      </div>
    </div>
  );
}
