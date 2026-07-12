import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Clock3, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { intakeLogService } from '@/services/api/medications';
import { formatTime } from '@/utils/statusHelpers';
import type { TodayIntake, IntakeDisplayStatus } from '@/types';

const NOW_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

/**
 * Reloj en vivo (hora Colombia, explícita) — visible junto a "Tomas de hoy"
 * para que el usuario pueda comparar de un vistazo la hora que usa el
 * dispositivo/navegador contra la hora real, útil para detectar si un
 * "Atrasado" es real o un desfase de reloj/timezone del dispositivo.
 */
function useNowClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

interface TodayIntakesPanelProps {
  /** Si se omite, trae las tomas de todos los miembros visibles (uso en Dashboard). */
  userId?: number;
  showPatientName?: boolean;
}

const DISPLAY_STATUS_META: Record<IntakeDisplayStatus, { icon: string; label: string; color: string }> = {
  pendiente: { icon: '⚪', label: 'Pendiente', color: '#9E9E9E' },
  por_tomar: { icon: '🟡', label: 'Por tomar', color: '#F9A825' },
  atrasado: { icon: '🔴', label: 'Atrasado', color: '#C62828' },
  tomado_a_tiempo: { icon: '🟢', label: 'Tomado a tiempo', color: '#2E7D32' },
  tomado_tarde: { icon: '🟡', label: 'Tomado tarde', color: '#F9A825' },
  omitido: { icon: '🔴', label: 'Omitido', color: '#C62828' },
  pospuesto: { icon: '🟡', label: 'Pospuesto', color: '#F9A825' },
};

const isResolved = (status: IntakeDisplayStatus) =>
  ['tomado_a_tiempo', 'tomado_tarde', 'omitido'].includes(status);

/**
 * Panel "Tomas de hoy" — lista todas las tomas programadas del día con
 * acciones rápidas. Se usa tanto en el Dashboard (todos los miembros
 * visibles) como dentro del tab de Medicamentos (un solo miembro).
 */
export default function TodayIntakesPanel({ userId, showPatientName }: TodayIntakesPanelProps) {
  const queryClient = useQueryClient();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const now = useNowClock();

  const { data: intakes, isLoading } = useQuery({
    queryKey: ['medications', 'today-intakes', userId ?? 'all'],
    queryFn: () => intakeLogService.today(userId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['medications', 'today-intakes'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const takeMutation = useMutation({
    mutationFn: (intake: TodayIntake) => intakeLogService.take(intake),
    onSuccess: () => { toast.success('¡Toma registrada!'); invalidate(); },
    onError: () => toast.error('No se pudo registrar la toma.'),
  });

  const skipMutation = useMutation({
    mutationFn: (intake: TodayIntake) => intakeLogService.skip(intake),
    onSuccess: () => { toast.success('Toma marcada como omitida.'); invalidate(); },
    onError: () => toast.error('No se pudo omitir la toma.'),
  });

  const postponeMutation = useMutation({
    mutationFn: ({ intake, minutes }: { intake: TodayIntake; minutes: 15 | 30 | 60 }) => intakeLogService.postpone(intake, minutes),
    onSuccess: () => { toast.success('Recordatorio pospuesto.'); invalidate(); },
    onError: () => toast.error('No se pudo posponer.'),
  });

  if (isLoading) {
    return <div className="skeleton h-32 rounded-xl" />;
  }

  if (!intakes || intakes.length === 0) {
    return null;
  }

  const allDone = intakes.every((i) => isResolved(i.display_status));
  const key = (i: TodayIntake) => `${i.medication_id}-${i.scheduled_datetime}`;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
          <Clock3 size={16} style={{ color: 'var(--color-primary)' }} />
          Tomas de hoy
        </h2>
        <span className="text-xs text-gray-400 tabular-nums capitalize">{NOW_FORMATTER.format(now)}</span>
      </div>

      {allDone ? (
        <p className="text-sm text-[var(--color-alert-green)] py-2">✅ Todas las tomas de hoy completadas 🎉</p>
      ) : (
        <ul className="divide-y divide-[rgba(27,94,32,.06)]">
          {intakes.map((intake) => {
            const meta = DISPLAY_STATUS_META[intake.display_status];
            const resolved = isResolved(intake.display_status);
            const k = key(intake);

            return (
              <li key={k} className="py-2.5 flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500 w-16 flex-shrink-0">
                  {formatTime(intake.scheduled_datetime)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                    {intake.medication?.name} — {intake.medication?.dosage}
                    {showPatientName && intake.patient && <span className="text-gray-400 font-normal"> · {intake.patient.name}</span>}
                  </p>
                  <span className="text-xs" style={{ color: meta.color }}>{meta.icon} {meta.label}</span>
                </div>

                {!resolved && (
                  <div className="relative flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => takeMutation.mutate(intake)}
                      disabled={takeMutation.isPending}
                      className="btn btn--primary text-xs py-1.5 px-2.5 gap-1"
                      style={{ minHeight: 'auto' }}
                    >
                      <Check size={13} />
                      Tomado
                    </button>
                    <button
                      onClick={() => setMenuFor(menuFor === k ? null : k)}
                      className="btn btn--ghost p-1.5 rounded-full"
                    >
                      <MoreHorizontal size={16} />
                    </button>

                    {menuFor === k && (
                      <div className="absolute right-0 top-9 w-44 card shadow-modal z-20 p-1.5 animate-fade-in">
                        <button
                          onClick={() => { skipMutation.mutate(intake); setMenuFor(null); }}
                          className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-[var(--color-primary-100)]"
                        >
                          ✗ Omitir
                        </button>
                        {([15, 30, 60] as const).map((m) => (
                          <button
                            key={m}
                            onClick={() => { postponeMutation.mutate({ intake, minutes: m }); setMenuFor(null); }}
                            className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-[var(--color-primary-100)]"
                          >
                            Posponer {m} min
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
