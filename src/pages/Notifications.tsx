import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { notificationService } from '@/services/api/notifications';
import { formatDateTime } from '@/utils/statusHelpers';

const PRIORITY_DOT: Record<string, string> = {
  danger: 'var(--color-alert-red)',
  warning: 'var(--color-alert-yellow)',
  info: 'var(--color-alert-blue)',
};

/**
 * Historial completo de notificaciones, paginado. El dropdown del Header
 * muestra las 10 más recientes; esta página trae el histórico completo.
 */
export default function Notifications() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'page', page],
    queryFn: () => notificationService.list(page),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const hasUnread = data?.data.some((n) => !n.read_at) ?? false;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
          Notificaciones
        </h1>
        {hasUnread && (
          <button onClick={() => markAllReadMutation.mutate()} className="btn btn--secondary text-sm gap-1.5 py-2 px-4">
            <CheckCheck size={15} /> Marcar todas como leídas
          </button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      )}

      {!isLoading && data?.data.length === 0 && (
        <div className="card p-10 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--color-primary-100)' }}>
            <Bell size={24} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h2 className="font-semibold text-gray-700 dark:text-gray-200">✅ Sin notificaciones</h2>
        </div>
      )}

      <div className="card divide-y divide-[rgba(27,94,32,.06)] overflow-hidden">
        {data?.data.map((n) => (
          <button
            key={n.id}
            onClick={() => !n.read_at && markReadMutation.mutate(n.id)}
            className={`w-full text-left p-4 flex items-start gap-3 transition-colors hover:bg-[var(--color-primary-100)]/40 ${!n.read_at ? 'bg-[#E8F5E9]/30' : ''}`}
          >
            <span className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: PRIORITY_DOT[n.priority] }} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!n.read_at ? 'font-semibold' : 'font-medium'} text-gray-800 dark:text-gray-100`}>{n.title}</p>
              <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
              <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.created_at)}</p>
            </div>
          </button>
        ))}
      </div>

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn--ghost p-2 rounded-full disabled:opacity-30">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-500">Página {data.current_page} de {data.last_page}</span>
          <button onClick={() => setPage((p) => Math.min(data.last_page, p + 1))} disabled={page === data.last_page} className="btn btn--ghost p-2 rounded-full disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
