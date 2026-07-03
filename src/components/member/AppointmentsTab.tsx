import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import type { Appointment, AppointmentStatus } from '@/types';
import { appointmentService } from '@/services/api/appointments';
import { getAppointmentTrafficLight } from '@/utils/statusHelpers';
import AppointmentCard from '@/components/shared/AppointmentCard';
import NewAppointmentModal from '@/components/modals/NewAppointmentModal';
import ChangeAppointmentStatusModal from '@/components/modals/ChangeAppointmentStatusModal';

interface AppointmentsTabProps {
  patientId: number;
  patientName: string;
}

const FINAL_STATUSES: AppointmentStatus[] = ['realizada', 'cancelada', 'no_asistio'];

interface Group {
  key: string;
  title: string;
  appointments: Appointment[];
  collapsedByDefault?: boolean;
}

function groupAppointments(appointments: Appointment[]): Group[] {
  const red: Appointment[] = [];
  const yellow: Appointment[] = [];
  const scheduled: Appointment[] = [];
  const needs: Appointment[] = [];
  const done: Appointment[] = [];

  for (const a of appointments) {
    if (FINAL_STATUSES.includes(a.status)) {
      done.push(a);
      continue;
    }
    const level = getAppointmentTrafficLight(a).level;
    if (level === 'red') red.push(a);
    else if (level === 'yellow') yellow.push(a);
    else if (a.is_need) needs.push(a);
    else scheduled.push(a);
  }

  return [
    { key: 'red', title: '🔴 Atención inmediata', appointments: red },
    { key: 'yellow', title: '🟡 Próximamente', appointments: yellow },
    { key: 'scheduled', title: '🟢 Programadas', appointments: scheduled },
    { key: 'needs', title: '📋 Necesidades sin agendar', appointments: needs },
    { key: 'done', title: '✅ Realizadas', appointments: done, collapsedByDefault: true },
  ].filter((g) => g.appointments.length > 0);
}

export default function AppointmentsTab({ patientId, patientName }: AppointmentsTabProps) {
  const [showNewModal, setShowNewModal] = useState(false);
  const [statusChangeTarget, setStatusChangeTarget] = useState<Appointment | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ done: true });

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', { userId: patientId }],
    queryFn: () => appointmentService.list({ userId: patientId }),
  });

  const groups = useMemo(() => groupAppointments(appointments ?? []), [appointments]);

  const toggleCollapse = (key: string) => setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">Citas y necesidades</h2>
        <button onClick={() => setShowNewModal(true)} className="btn btn--primary text-sm gap-1.5 py-2 px-4">
          <Plus size={16} />
          Nueva cita / Necesidad
        </button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      )}

      {!isLoading && groups.length === 0 && (
        <div className="card p-10 flex flex-col items-center text-center gap-2">
          <p className="text-4xl">📋</p>
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Sin citas ni necesidades registradas</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Registra tu primera necesidad de cita médica para empezar a hacerle seguimiento.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.key}>
            <button
              onClick={() => toggleCollapse(group.key)}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2"
            >
              {collapsed[group.key] ?? group.collapsedByDefault ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              {group.title} <span className="text-gray-400 font-normal">({group.appointments.length})</span>
            </button>

            {!(collapsed[group.key] ?? group.collapsedByDefault) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {group.appointments.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    onChangeStatus={setStatusChangeTarget}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {showNewModal && (
        <NewAppointmentModal
          patientId={patientId}
          patientName={patientName}
          onClose={() => setShowNewModal(false)}
        />
      )}

      {statusChangeTarget && (
        <ChangeAppointmentStatusModal
          appointment={statusChangeTarget}
          onClose={() => setStatusChangeTarget(null)}
        />
      )}
    </div>
  );
}
