import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarClock, Pill, FlaskConical, Stethoscope } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { householdService } from '@/services/api/household';
import { dashboardService } from '@/services/api/dashboard';
import { formatDateTime } from '@/utils/statusHelpers';
import TodayIntakesPanel from '@/components/shared/TodayIntakesPanel';
import type { TrafficLight } from '@/types';

const LEVEL_DOT: Record<string, string> = {
  red: 'var(--color-alert-red)',
  yellow: 'var(--color-alert-yellow)',
  blue: 'var(--color-alert-blue)',
  green: 'var(--color-alert-green)',
  grey: '#9E9E9E',
};

export default function Dashboard() {
  const { user, isViewer } = useAuthStore();
  const [levelFilter, setLevelFilter] = useState<TrafficLight | null>(null);

  const { data: household } = useQuery({
    queryKey: ['household', 'current'],
    queryFn: householdService.current,
  });

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardService.summary,
  });

  const { data: alertsData, isLoading: loadingAlerts } = useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: dashboardService.alerts,
  });

  const { data: activity } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: dashboardService.activity,
    enabled: !isViewer(),
  });

  const filteredAlerts = useMemo(() => {
    if (!alertsData) return [];
    return levelFilter ? alertsData.alerts.filter((a) => a.level === levelFilter) : alertsData.alerts;
  }, [alertsData, levelFilter]);

  // Peor semáforo por miembro, derivado de las alertas activas
  const memberSeverity = useMemo(() => {
    const order: Record<string, number> = { red: 0, yellow: 1, blue: 2, green: 3, grey: 4 };
    const map = new Map<number, TrafficLight>();
    for (const alert of alertsData?.alerts ?? []) {
      const current = map.get(alert.member.id);
      if (!current || order[alert.level] < order[current]) {
        map.set(alert.member.id, alert.level);
      }
    }
    return map;
  }, [alertsData]);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
          ¡Hola, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 text-sm">Este es tu panel de salud familiar.</p>
      </div>

      {/* Fila 0 — Tomas de hoy (primero en móvil: es la acción más frecuente del día) */}
      <TodayIntakesPanel showPatientName={!isViewer()} />

      {/* Fila 1 — Semáforo general */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(['red', 'yellow'] as const).map((level) => (
          <button
            key={level}
            onClick={() => setLevelFilter(levelFilter === level ? null : level)}
            className="card p-4 text-left transition-transform hover:-translate-y-0.5"
            style={{ outline: levelFilter === level ? `2px solid ${LEVEL_DOT[level]}` : undefined }}
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: LEVEL_DOT[level] }} />
              <span className="text-2xl font-bold">{alertsData?.summary[level] ?? 0}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {level === 'red' ? 'alertas rojas (acción inmediata)' : 'alertas amarillas (atención pronta)'}
            </p>
          </button>
        ))}
        <div className="card p-4">
          {loadingAlerts ? (
            <div className="skeleton h-8 w-8 rounded-full" />
          ) : (alertsData?.summary.red ?? 0) + (alertsData?.summary.yellow ?? 0) === 0 ? (
            <p className="text-sm text-[var(--color-alert-green)] font-medium">✅ Todo bajo control</p>
          ) : (
            <p className="text-sm text-gray-500">{alertsData?.alerts.length} alerta(s) activa(s) en total</p>
          )}
        </div>
      </div>

      {/* Fila 2 — Resumen personal */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<CalendarClock size={18} />}
          label="Próxima cita"
          value={summary?.next_appointment ? `${summary.next_appointment.specialty}` : 'Sin citas próximas'}
          sub={summary?.next_appointment ? formatDateTime(summary.next_appointment.appointment_date) : undefined}
          loading={loadingSummary}
        />
        <SummaryCard icon={<Pill size={18} />} label="Medicamentos en uso" value={String(summary?.active_medications ?? 0)} loading={loadingSummary} />
        <SummaryCard icon={<FlaskConical size={18} />} label="Exámenes con resultado" value={String(summary?.exams_with_results ?? 0)} loading={loadingSummary} />
        <SummaryCard icon={<Stethoscope size={18} />} label="Remisiones sin agendar" value={String(summary?.pending_referrals ?? 0)} loading={loadingSummary} />
      </div>

      {/* Fila 3 — Alertas detalladas */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200">
            Alertas {levelFilter && <span className="text-xs font-normal text-gray-400">— filtrando por {levelFilter}</span>}
          </h2>
          {levelFilter && (
            <button onClick={() => setLevelFilter(null)} className="text-xs text-gray-400 hover:text-gray-600">Limpiar filtro</button>
          )}
        </div>

        {filteredAlerts.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">✅ Todo en orden — Sin alertas activas hoy</p>
        ) : (
          <ul className="divide-y divide-[rgba(27,94,32,.06)]">
            {filteredAlerts.map((alert, i) => (
              <li key={i} className="py-3 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: LEVEL_DOT[alert.level] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{alert.title}</p>
                  <p className="text-xs text-gray-500">{alert.description} · {alert.member.name}</p>
                </div>
                {alert.related_type === 'appointment' && (
                  <Link to={`/member/${alert.member.id}/history`} className="text-xs font-medium hover:underline flex-shrink-0" style={{ color: 'var(--color-primary)' }}>
                    Ver
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Fila 4 — Resumen del hogar (oculto para viewer) */}
      {!isViewer() && household?.members && household.members.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Miembros del hogar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {household.members.map((m) => {
              const level = memberSeverity.get(m.id) ?? 'green';
              return (
                <Link key={m.id} to={`/member/${m.id}/history`} className="card p-4 flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'var(--color-primary)' }}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#1a2e1b]"
                      style={{ background: LEVEL_DOT[level] }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{m.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{m.role}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Fila 5 — Actividad reciente (oculto para viewer) */}
      {!isViewer() && activity && activity.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Actividad reciente</h2>
          <ul className="space-y-2">
            {activity.map((a) => (
              <li key={a.id} className="text-sm text-gray-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-300)] flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">{a.user?.name ?? 'Alguien'}</span>
                {a.action.replace(/\./g, ' → ')}
                <span className="text-gray-400 text-xs ml-auto">{formatDateTime(a.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, sub, loading }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <div className="card p-4">
      <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ background: 'var(--color-primary-100)', color: 'var(--color-primary)' }}>
        {icon}
      </div>
      {loading ? (
        <div className="skeleton h-5 w-16 rounded" />
      ) : (
        <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{value}</p>
      )}
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}
