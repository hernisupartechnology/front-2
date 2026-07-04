import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Syringe, Paperclip } from 'lucide-react';
import type { Vaccination } from '@/types';
import { vaccinationService } from '@/services/api/vaccinations';
import { formatDate } from '@/utils/statusHelpers';
import NewVaccinationModal from '@/components/modals/NewVaccinationModal';
import UploadDocumentModal from '@/components/modals/UploadDocumentModal';
import DetailModal from '@/components/modals/DetailModal';

export default function VaccinationsTab({ patientId, patientName }: { patientId: number; patientName: string }) {
  const [showNew, setShowNew] = useState(false);
  const [attachTarget, setAttachTarget] = useState<Vaccination | null>(null);
  const [viewTarget, setViewTarget] = useState<Vaccination | null>(null);
  const [editTarget, setEditTarget] = useState<Vaccination | null>(null);

  const { data: vaccinations, isLoading } = useQuery({
    queryKey: ['vaccinations', { userId: patientId }],
    queryFn: () => vaccinationService.list({ userId: patientId }),
  });

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">Vacunas</h2>
        <button onClick={() => setShowNew(true)} className="btn btn--primary text-sm gap-1.5 py-2 px-4">
          <Plus size={16} /> Registrar vacuna
        </button>
      </div>

      {isLoading && <div className="skeleton h-24 rounded-xl" />}

      {!isLoading && vaccinations?.length === 0 && (
        <div className="card p-10 flex flex-col items-center text-center gap-2">
          <Syringe className="text-gray-300" size={36} />
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Sin vacunas registradas</h3>
        </div>
      )}

      {/* Tabla en desktop */}
      {vaccinations && vaccinations.length > 0 && (
        <div className="card overflow-hidden hidden sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-[rgba(27,94,32,.08)]">
                <th className="p-3 font-medium">Vacuna</th>
                <th className="p-3 font-medium">Dosis</th>
                <th className="p-3 font-medium">Fecha</th>
                <th className="p-3 font-medium">Lugar</th>
                <th className="p-3 font-medium">Próxima dosis</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {vaccinations.map((v) => (
                <tr key={v.id} className="border-b border-[rgba(27,94,32,.04)] last:border-0 cursor-pointer hover:bg-[var(--color-primary-100)]/30" onClick={() => setViewTarget(v)}>
                  <td className="p-3 font-medium text-gray-700 dark:text-gray-200">{v.vaccine_name}</td>
                  <td className="p-3 text-gray-500">{v.dose_number ?? '—'}</td>
                  <td className="p-3 text-gray-500">{formatDate(v.application_date)}</td>
                  <td className="p-3 text-gray-500">{v.ips_or_center ?? '—'}</td>
                  <td className="p-3">
                    <NextDoseBadge date={v.next_dose_date} daysUntil={v.days_until_next_dose} />
                  </td>
                  <td className="p-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setAttachTarget(v); }}
                      className="btn btn--ghost text-xs py-1.5 px-3 gap-1"
                      style={{ minHeight: 'auto' }}
                    >
                      <Paperclip size={13} /> Adjuntar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cards en móvil */}
      <div className="grid gap-3 sm:hidden">
        {vaccinations?.map((v) => (
          <div key={v.id} className="card p-4 cursor-pointer" onClick={() => setViewTarget(v)}>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{v.vaccine_name} {v.dose_number && `· ${v.dose_number}`}</h3>
            <p className="text-sm text-gray-500">{formatDate(v.application_date)}{v.ips_or_center && ` · ${v.ips_or_center}`}</p>
            {v.next_dose_date && <div className="mt-2"><NextDoseBadge date={v.next_dose_date} daysUntil={v.days_until_next_dose} /></div>}
            <button
              onClick={(e) => { e.stopPropagation(); setAttachTarget(v); }}
              className="btn btn--ghost text-xs py-1.5 px-3 gap-1 mt-2"
              style={{ minHeight: 'auto' }}
            >
              <Paperclip size={13} /> Adjuntar documento
            </button>
          </div>
        ))}
      </div>

      {showNew && <NewVaccinationModal patientId={patientId} patientName={patientName} onClose={() => setShowNew(false)} />}

      {editTarget && (
        <NewVaccinationModal patientId={patientId} patientName={patientName} vaccination={editTarget} onClose={() => setEditTarget(null)} />
      )}

      {viewTarget && (
        <DetailModal
          title={viewTarget.vaccine_name}
          subtitle={`Para ${patientName}`}
          relatedType="vaccination"
          relatedId={viewTarget.id}
          onEdit={() => { setEditTarget(viewTarget); setViewTarget(null); }}
          onClose={() => setViewTarget(null)}
          fields={[
            { label: 'Dosis', value: viewTarget.dose_number },
            { label: 'Fecha de aplicación', value: formatDate(viewTarget.application_date) },
            { label: 'Aplicada por', value: viewTarget.applied_by },
            { label: 'Número de lote', value: viewTarget.lot_number },
            { label: 'IPS / centro', value: viewTarget.ips_or_center },
            { label: 'Próxima dosis', value: viewTarget.next_dose_date ? formatDate(viewTarget.next_dose_date) : null },
            { label: 'Notas', value: viewTarget.notes, fullWidth: true },
          ]}
        />
      )}

      {attachTarget && (
        <UploadDocumentModal
          patientId={patientId}
          patientName={patientName}
          relatedType="vaccination"
          relatedId={attachTarget.id}
          contextLabel={attachTarget.vaccine_name}
          onClose={() => setAttachTarget(null)}
        />
      )}
    </div>
  );
}

function NextDoseBadge({ date, daysUntil }: { date: string | null; daysUntil?: number | null }) {
  if (!date) return <span className="text-gray-400 text-xs">—</span>;
  if (daysUntil !== null && daysUntil !== undefined && daysUntil < 0) {
    return <span className="chip chip--red">Dosis vencida</span>;
  }
  if (daysUntil !== null && daysUntil !== undefined && daysUntil <= 30) {
    return <span className="chip chip--yellow">En {daysUntil} días</span>;
  }
  return <span className="text-xs text-gray-500">{formatDate(date)}</span>;
}
