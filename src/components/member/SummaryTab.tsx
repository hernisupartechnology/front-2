import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Pill, FlaskConical, Stethoscope } from 'lucide-react';
import { appointmentService } from '@/services/api/appointments';
import { medicationService } from '@/services/api/medications';
import { examService } from '@/services/api/exams';
import { referralService } from '@/services/api/referrals';
import { medicalLeaveService } from '@/services/api/medicalLeaves';
import { vaccinationService } from '@/services/api/vaccinations';
import {
  getAppointmentTrafficLight, getMedicationRenewalTrafficLight, getStatusBadge,
  formatDate, formatDateTime,
} from '@/utils/statusHelpers';

interface SummaryTabProps {
  patientId: number;
  onNavigateTab: (tab: string) => void;
}

const FINAL_APPOINTMENT_STATUSES = ['realizada', 'cancelada', 'no_asistio'];

interface TimelineItem {
  id: string;
  date: string;
  title: string;
  subtitle?: string;
  badge: { label: string; cssClass: string };
  tab: string;
}

export default function SummaryTab({ patientId, onNavigateTab }: SummaryTabProps) {
  const { data: appointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['appointments', { userId: patientId }],
    queryFn: () => appointmentService.list({ userId: patientId }),
  });
  const { data: medications, isLoading: loadingMedications } = useQuery({
    queryKey: ['medications', { userId: patientId }],
    queryFn: () => medicationService.list({ userId: patientId }),
  });
  const { data: exams, isLoading: loadingExams } = useQuery({
    queryKey: ['exams', { userId: patientId }],
    queryFn: () => examService.list({ userId: patientId }),
  });
  const { data: referrals, isLoading: loadingReferrals } = useQuery({
    queryKey: ['referrals', { userId: patientId }],
    queryFn: () => referralService.list({ userId: patientId }),
  });
  const { data: leaves } = useQuery({
    queryKey: ['medical-leaves', { userId: patientId }],
    queryFn: () => medicalLeaveService.list({ userId: patientId }),
  });
  const { data: vaccinations } = useQuery({
    queryKey: ['vaccinations', { userId: patientId }],
    queryFn: () => vaccinationService.list({ userId: patientId }),
  });

  const isLoading = loadingAppointments || loadingMedications || loadingExams || loadingReferrals;

  const alertCounts = useMemo(() => {
    let red = 0;
    let yellow = 0;

    for (const a of appointments ?? []) {
      if (FINAL_APPOINTMENT_STATUSES.includes(a.status)) continue;
      const level = getAppointmentTrafficLight(a).level;
      if (level === 'red') red += 1;
      else if (level === 'yellow') yellow += 1;
    }
    for (const m of medications ?? []) {
      if (!m.is_recurring || ['completado', 'suspendido'].includes(m.status)) continue;
      const level = getMedicationRenewalTrafficLight(m)?.level;
      if (level === 'red') red += 1;
      else if (level === 'yellow') yellow += 1;
    }
    for (const r of referrals ?? []) {
      const level = r.traffic_light?.level;
      if (level === 'red') red += 1;
      else if (level === 'yellow') yellow += 1;
    }

    return { red, yellow };
  }, [appointments, medications, referrals]);

  const nextAppointment = useMemo(() => {
    return (appointments ?? [])
      .filter((a) => ['programada', 'confirmada'].includes(a.status) && a.appointment_date)
      .sort((a, b) => new Date(a.appointment_date!).getTime() - new Date(b.appointment_date!).getTime())[0];
  }, [appointments]);

  const activeMedications = (medications ?? []).filter((m) => m.status === 'en_uso').length;
  const examsWithResults = (exams ?? []).filter((e) => e.status === 'resultado_disponible').length;
  const pendingReferrals = (referrals ?? []).filter((r) => r.status === 'autorizada').length;

  const timeline = useMemo(() => {
    const items: TimelineItem[] = [];

    for (const a of appointments ?? []) {
      const date = a.appointment_date ?? a.need_registered_date ?? a.created_at;
      if (!date) continue;
      items.push({
        id: `apt-${a.id}`,
        date,
        title: a.specialty,
        subtitle: a.is_need ? 'Necesidad de cita' : 'Cita médica',
        badge: getStatusBadge('appointment', a.status),
        tab: 'citas',
      });
    }
    for (const m of medications ?? []) {
      const date = m.start_date ?? m.created_at;
      items.push({
        id: `med-${m.id}`,
        date,
        title: m.name,
        subtitle: `${m.dosage} — ${m.frequency}`,
        badge: getStatusBadge('medication', m.status),
        tab: 'medicamentos',
      });
    }
    for (const e of exams ?? []) {
      const date = e.scheduled_date ?? e.performed_date ?? e.created_at;
      items.push({
        id: `exam-${e.id}`,
        date,
        title: e.name,
        subtitle: 'Examen',
        badge: getStatusBadge('exam', e.status),
        tab: 'examenes',
      });
    }
    for (const r of referrals ?? []) {
      items.push({
        id: `ref-${r.id}`,
        date: r.created_at,
        title: `Remisión a ${r.specialty}`,
        subtitle: r.reason,
        badge: getStatusBadge('referral', r.status),
        tab: 'remisiones',
      });
    }
    for (const l of leaves ?? []) {
      items.push({
        id: `leave-${l.id}`,
        date: l.start_date,
        title: `Incapacidad — ${l.total_days} día${l.total_days === 1 ? '' : 's'}`,
        subtitle: `${formatDate(l.start_date)} — ${formatDate(l.end_date)}`,
        badge: { label: 'Incapacidad', cssClass: 'badge--programada' },
        tab: 'incapacidades',
      });
    }
    for (const v of vaccinations ?? []) {
      items.push({
        id: `vac-${v.id}`,
        date: v.application_date,
        title: v.vaccine_name,
        subtitle: v.dose_number ?? undefined,
        badge: { label: 'Vacuna', cssClass: 'badge--realizada' },
        tab: 'vacunas',
      });
    }

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);
  }, [appointments, medications, exams, referrals, leaves, vaccinations]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Semáforo del miembro */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(['red', 'yellow'] as const).map((level) => (
          <div key={level} className="card p-4">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ background: level === 'red' ? 'var(--color-alert-red)' : 'var(--color-alert-yellow)' }}
              />
              <span className="text-2xl font-bold">{alertCounts[level]}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {level === 'red' ? 'alertas rojas (acción inmediata)' : 'alertas amarillas (atención pronta)'}
            </p>
          </div>
        ))}
        <div className="card p-4 flex items-center">
          {alertCounts.red + alertCounts.yellow === 0 ? (
            <p className="text-sm text-[var(--color-alert-green)] font-medium">✅ Todo bajo control</p>
          ) : (
            <p className="text-sm text-gray-500">{alertCounts.red + alertCounts.yellow} alerta(s) activa(s)</p>
          )}
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<CalendarClock size={18} />}
          label="Próxima cita"
          value={nextAppointment ? nextAppointment.specialty : 'Sin citas próximas'}
          sub={nextAppointment ? formatDateTime(nextAppointment.appointment_date) : undefined}
          onClick={() => onNavigateTab('citas')}
        />
        <SummaryCard icon={<Pill size={18} />} label="Medicamentos en uso" value={String(activeMedications)} onClick={() => onNavigateTab('medicamentos')} />
        <SummaryCard icon={<FlaskConical size={18} />} label="Exámenes con resultado" value={String(examsWithResults)} onClick={() => onNavigateTab('examenes')} />
        <SummaryCard icon={<Stethoscope size={18} />} label="Remisiones sin agendar" value={String(pendingReferrals)} onClick={() => onNavigateTab('remisiones')} />
      </div>

      {/* Línea de tiempo */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Línea de tiempo</h2>

        {timeline.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">Aún no hay historial registrado para este miembro.</p>
        ) : (
          <ul className="divide-y divide-[rgba(27,94,32,.06)]">
            {timeline.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onNavigateTab(item.tab)}
                  className="w-full py-3 flex items-center gap-3 text-left hover:bg-[var(--color-primary-100)]/30 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge ${item.badge.cssClass}`}>{item.badge.label}</span>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{item.title}</p>
                    </div>
                    {item.subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{item.subtitle}</p>}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(item.date)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, sub, onClick }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="card p-4 text-left transition-transform hover:-translate-y-0.5">
      <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ background: 'var(--color-primary-100)', color: 'var(--color-primary)' }}>
        {icon}
      </div>
      <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </button>
  );
}
