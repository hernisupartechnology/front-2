import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Medication } from '@/types';
import { medicationService } from '@/services/api/medications';
import { formatTime } from '@/utils/statusHelpers';

interface AdherenceCalendarProps {
  medication: Medication;
}

const LEVEL_COLOR: Record<string, string> = {
  green: 'var(--color-alert-green)',
  yellow: 'var(--color-alert-yellow)',
  red: 'var(--color-alert-red)',
};

const DONUT_COLORS = {
  tomado: '#2E7D32',
  atrasado: '#F9A825',
  omitido: '#C62828',
  pospuesto: '#6A1B9A',
};

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/**
 * Calendario de tomas — grilla tipo "habit tracker" de GitHub, un color
 * por día según el % de tomas completadas. Click en un día → detalle de tomas.
 * Se embebe dentro de MedicationCard (sin chrome de tarjeta propio).
 */
export default function AdherenceCalendar({ medication }: AdherenceCalendarProps) {
  const now = new Date();
  const [cursor, setCursor] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['medications', medication.id, 'adherence', cursor.month, cursor.year],
    queryFn: () => medicationService.adherence(medication.id, cursor.month, cursor.year),
  });

  const calendarByDate = useMemo(() => {
    const map = new Map<string, NonNullable<typeof data>['calendar'][number]>();
    data?.calendar.forEach((d) => map.set(d.date, d));
    return map;
  }, [data]);

  const daysInMonth = new Date(cursor.year, cursor.month, 0).getDate();
  const firstWeekday = (new Date(cursor.year, cursor.month - 1, 1).getDay() + 6) % 7; // lunes=0

  const donutData = data ? [
    { name: 'Tomado', value: data.counts.tomado, color: DONUT_COLORS.tomado },
    { name: 'Atrasado', value: data.counts.atrasado, color: DONUT_COLORS.atrasado },
    { name: 'Omitido', value: data.counts.omitido, color: DONUT_COLORS.omitido },
    { name: 'Pospuesto', value: data.counts.pospuesto, color: DONUT_COLORS.pospuesto },
  ].filter((d) => d.value > 0) : [];

  if (isLoading || !data) {
    return <div className="skeleton h-48 rounded-xl" />;
  }

  const selectedLogs = selectedDay ? calendarByDate.get(selectedDay)?.logs ?? [] : [];

  return (
    <div>
      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-2 mb-4 text-center">
        <Stat label="7 días" value={`${data.adherence_7d}%`} />
        <Stat label="Este mes" value={`${data.adherence_month}%`} />
        <Stat label="Total" value={`${data.adherence_total}%`} />
        <Stat label="Racha" value={`${data.current_streak}d`} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Calendario */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setCursor((c) => shiftMonth(c, -1))} className="btn btn--ghost p-1 rounded-full"><ChevronLeft size={14} /></button>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{MESES[cursor.month - 1]} {cursor.year}</span>
            <button onClick={() => setCursor((c) => shiftMonth(c, 1))} className="btn btn--ghost p-1 rounded-full"><ChevronRight size={14} /></button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
              <span key={d} className="text-[10px] text-gray-400">{d}</span>
            ))}
            {Array.from({ length: firstWeekday }).map((_, i) => <span key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dateStr = `${cursor.year}-${String(cursor.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const entry = calendarByDate.get(dateStr);
              const color = entry ? LEVEL_COLOR[entry.level] : 'transparent';

              return (
                <button
                  key={day}
                  onClick={() => entry && setSelectedDay(selectedDay === dateStr ? null : dateStr)}
                  className="aspect-square rounded-md text-[10px] flex items-center justify-center transition-transform hover:scale-110"
                  style={{
                    background: entry ? color : 'rgba(0,0,0,.03)',
                    color: entry ? 'white' : '#9E9E9E',
                  }}
                  title={entry ? `${entry.percentage}% de tomas cumplidas` : 'Sin tomas programadas'}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Donut */}
        {donutData.length > 0 && (
          <div className="w-full sm:w-32 h-32 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="90%" paddingAngle={2}>
                  {donutData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {selectedDay && (
        <div className="mt-3 pt-3 border-t border-[rgba(27,94,32,.08)]">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Tomas del {selectedDay}</p>
          <ul className="space-y-1">
            {selectedLogs.map((log) => (
              <li key={log.id} className="text-xs text-gray-500 flex items-center justify-between">
                <span>{formatTime(log.scheduled_datetime)}</span>
                <span className="capitalize">{log.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function shiftMonth(c: { month: number; year: number }, delta: number) {
  const month = c.month + delta;
  if (month < 1) return { month: 12, year: c.year - 1 };
  if (month > 12) return { month: 1, year: c.year + 1 };
  return { month, year: c.year };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{value}</p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  );
}
