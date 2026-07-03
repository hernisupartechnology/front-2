import type { ScheduleInput } from '@/services/api/medications';

/**
 * Sugiere horarios de toma interpretando el texto libre de "frecuencia".
 * Es solo un punto de partida — el usuario siempre puede editar las horas
 * antes de guardar (spec: "el usuario puede ajustar manualmente").
 */
export function suggestSchedulesFromFrequency(frequency: string): ScheduleInput[] {
  const f = frequency.toLowerCase();

  const every = f.match(/cada\s+(\d+)\s*hora/);
  if (every) {
    const hours = Math.max(1, Math.min(24, parseInt(every[1], 10)));
    return buildEvenlySpaced(Math.round(24 / hours));
  }

  if (/\b(4|cuatro)\s+veces/.test(f)) return buildEvenlySpaced(4);
  if (/\b(3|tres)\s+veces/.test(f)) return buildEvenlySpaced(3);
  if (/\b(2|dos)\s+veces/.test(f) || /cada\s+12\s*hora/.test(f)) return buildEvenlySpaced(2);
  if (/\b(1|una)\s+vez/.test(f) || /una vez al d[ií]a/.test(f) || /diari[ao]/.test(f)) {
    return [{ time_of_day: '07:00', label: 'Con el desayuno' }];
  }

  // Sin coincidencia clara — un horario por defecto para que el usuario ajuste.
  return [{ time_of_day: '08:00', label: '' }];
}

function buildEvenlySpaced(count: number): ScheduleInput[] {
  const labels = ['Mañana', 'Mediodía', 'Tarde', 'Noche', 'Antes de dormir', 'Madrugada'];
  const startHour = 6;
  const intervalHours = 24 / count;

  return Array.from({ length: count }, (_, i) => {
    const hour = Math.round(startHour + i * intervalHours) % 24;
    return {
      time_of_day: `${String(hour).padStart(2, '0')}:00`,
      label: labels[i] ?? '',
    };
  });
}
