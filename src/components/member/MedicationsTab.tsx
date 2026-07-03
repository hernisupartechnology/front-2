import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import type { Medication } from '@/types';
import { medicationService } from '@/services/api/medications';
import MedicationCard from '@/components/shared/MedicationCard';
import TodayIntakesPanel from '@/components/shared/TodayIntakesPanel';
import NewMedicationModal from '@/components/modals/NewMedicationModal';
import ChangeMedicationStatusModal from '@/components/modals/ChangeMedicationStatusModal';
import AdherenceCalendar from '@/components/shared/AdherenceCalendar';

interface MedicationsTabProps {
  patientId: number;
  patientName: string;
}

export default function MedicationsTab({ patientId, patientName }: MedicationsTabProps) {
  const [showNewModal, setShowNewModal] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Medication | null>(null);
  const [adherenceFor, setAdherenceFor] = useState<Medication | null>(null);

  const { data: alerts } = useQuery({
    queryKey: ['medications', 'alerts'],
    queryFn: medicationService.alerts,
  });

  const { data: medications, isLoading } = useQuery({
    queryKey: ['medications', { userId: patientId }],
    queryFn: () => medicationService.list({ userId: patientId }),
  });

  const memberAlerts = alerts?.filter((m) => m.user_id === patientId) ?? [];
  const active = medications?.filter((m) => !['completado', 'suspendido'].includes(m.status)) ?? [];
  const finished = medications?.filter((m) => ['completado', 'suspendido'].includes(m.status)) ?? [];

  return (
    <div className="animate-fade-in space-y-6">
      <TodayIntakesPanel userId={patientId} />

      {memberAlerts.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">🔔 Alertas de renovación</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {memberAlerts.map((m) => (
              <MedicationCard key={m.id} medication={m} onChangeStatus={setStatusTarget} />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">Medicamentos</h2>
        <button onClick={() => setShowNewModal(true)} className="btn btn--primary text-sm gap-1.5 py-2 px-4">
          <Plus size={16} />
          Nuevo medicamento
        </button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      )}

      {!isLoading && active.length === 0 && finished.length === 0 && (
        <div className="card p-10 flex flex-col items-center text-center gap-2">
          <p className="text-4xl">💊</p>
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Sin medicamentos registrados</h3>
          <p className="text-sm text-gray-500 max-w-sm">Registra el primer medicamento para hacerle seguimiento.</p>
        </div>
      )}

      {active.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {active.map((m) => (
            <div key={m.id} onDoubleClick={() => m.track_intake && setAdherenceFor(m)}>
              <MedicationCard medication={m} onChangeStatus={setStatusTarget} />
              {m.track_intake && (
                <button
                  onClick={() => setAdherenceFor(adherenceFor?.id === m.id ? null : m)}
                  className="text-xs mt-1.5 font-medium hover:underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {adherenceFor?.id === m.id ? 'Ocultar' : 'Ver'} calendario de adherencia
                </button>
              )}
              {adherenceFor?.id === m.id && (
                <div className="mt-2">
                  <AdherenceCalendar medication={m} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {finished.length > 0 && (
        <details className="group">
          <summary className="font-semibold text-gray-600 dark:text-gray-300 text-sm cursor-pointer list-none flex items-center gap-1.5">
            ✅ Finalizados / suspendidos ({finished.length})
          </summary>
          <div className="grid gap-3 sm:grid-cols-2 mt-3">
            {finished.map((m) => <MedicationCard key={m.id} medication={m} />)}
          </div>
        </details>
      )}

      {showNewModal && (
        <NewMedicationModal patientId={patientId} patientName={patientName} onClose={() => setShowNewModal(false)} />
      )}

      {statusTarget && (
        <ChangeMedicationStatusModal medication={statusTarget} onClose={() => setStatusTarget(null)} />
      )}
    </div>
  );
}
