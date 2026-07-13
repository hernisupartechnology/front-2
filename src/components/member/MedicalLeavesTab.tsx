import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, FileText, Paperclip, ChevronLeft, ChevronRight } from 'lucide-react';
import type { MedicalLeave } from '@/types';
import { medicalLeaveService } from '@/services/api/medicalLeaves';
import { formatDate } from '@/utils/statusHelpers';
import NewMedicalLeaveModal from '@/components/modals/NewMedicalLeaveModal';
import UploadDocumentModal from '@/components/modals/UploadDocumentModal';
import DetailModal from '@/components/modals/DetailModal';

const LEAVE_TYPE_LABEL: Record<string, string> = {
  enfermedad_general: 'Enfermedad general',
  accidente_trabajo: 'Accidente de trabajo',
  licencia_maternidad: 'Licencia de maternidad',
  licencia_paternidad: 'Licencia de paternidad',
  otro: 'Otro',
};

export default function MedicalLeavesTab({ patientId, patientName }: { patientId: number; patientName: string }) {
  const [showNew, setShowNew] = useState(false);
  const [attachTarget, setAttachTarget] = useState<MedicalLeave | null>(null);
  const [viewTarget, setViewTarget] = useState<MedicalLeave | null>(null);
  const [editTarget, setEditTarget] = useState<MedicalLeave | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['medical-leaves', { userId: patientId, page }],
    queryFn: () => medicalLeaveService.list({ userId: patientId, page }),
  });
  const leaves = data?.data;

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">Incapacidades</h2>
        <button onClick={() => setShowNew(true)} className="btn btn--primary text-sm gap-1.5 py-2 px-4">
          <Plus size={16} /> Nueva incapacidad
        </button>
      </div>

      {isLoading && <div className="skeleton h-24 rounded-xl" />}

      {!isLoading && leaves?.length === 0 && (
        <div className="card p-10 flex flex-col items-center text-center gap-2">
          <FileText className="text-gray-300" size={36} />
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Sin incapacidades registradas</h3>
        </div>
      )}

      <div className="space-y-3">
        {leaves?.map((leave) => (
          <div key={leave.id} className="card p-4 pl-5 cursor-pointer" onClick={() => setViewTarget(leave)}>
            <div className="traffic-bar traffic-bar--grey" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                  {formatDate(leave.start_date)} — {formatDate(leave.end_date)}
                </h3>
                <p className="text-sm text-gray-500">{LEAVE_TYPE_LABEL[leave.leave_type]}</p>
              </div>
              <span className="chip chip--blue">{leave.total_days} día{leave.total_days === 1 ? '' : 's'}</span>
            </div>
            {leave.diagnosis && (
              <p className="text-xs text-gray-500 mt-2">
                {leave.diagnosis}{leave.diagnosis_code && ` (${leave.diagnosis_code})`}
              </p>
            )}
            {(leave.issuing_doctor_name_free || leave.ips_issued) && (
              <p className="text-xs text-gray-400 mt-1">
                {leave.issuing_doctor_name_free}{leave.issuing_doctor_name_free && leave.ips_issued && ' · '}{leave.ips_issued}
              </p>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setAttachTarget(leave); }}
              className="btn btn--ghost text-xs py-1.5 px-3 gap-1 mt-3"
              style={{ minHeight: 'auto' }}
            >
              <Paperclip size={13} /> Adjuntar documento
            </button>
          </div>
        ))}
      </div>

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn--ghost p-2 rounded-full disabled:opacity-30">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-500">Página {data.current_page} de {data.last_page}</span>
          <button onClick={() => setPage((p) => Math.min(data.last_page, p + 1))} disabled={page === data.last_page} className="btn btn--ghost p-2 rounded-full disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {showNew && <NewMedicalLeaveModal patientId={patientId} patientName={patientName} onClose={() => setShowNew(false)} />}

      {editTarget && (
        <NewMedicalLeaveModal patientId={patientId} patientName={patientName} leave={editTarget} onClose={() => setEditTarget(null)} />
      )}

      {viewTarget && (
        <DetailModal
          title={`${formatDate(viewTarget.start_date)} — ${formatDate(viewTarget.end_date)}`}
          subtitle={`Para ${patientName} · ${viewTarget.total_days} día${viewTarget.total_days === 1 ? '' : 's'}`}
          relatedType="medical_leave"
          relatedId={viewTarget.id}
          onEdit={() => { setEditTarget(viewTarget); setViewTarget(null); }}
          onClose={() => setViewTarget(null)}
          fields={[
            { label: 'Tipo de incapacidad', value: LEAVE_TYPE_LABEL[viewTarget.leave_type] },
            { label: 'Médico que la expidió', value: viewTarget.issuing_doctor?.name ?? viewTarget.issuing_doctor_name_free },
            { label: 'IPS que la expidió', value: viewTarget.ips_issued },
            { label: 'Código CIE-10', value: viewTarget.diagnosis_code },
            { label: 'Diagnóstico', value: viewTarget.diagnosis, fullWidth: true },
            { label: 'Notas', value: viewTarget.notes, fullWidth: true },
          ]}
        />
      )}

      {attachTarget && (
        <UploadDocumentModal
          patientId={patientId}
          patientName={patientName}
          relatedType="medical_leave"
          relatedId={attachTarget.id}
          contextLabel={`Incapacidad ${formatDate(attachTarget.start_date)} — ${formatDate(attachTarget.end_date)}`}
          onClose={() => setAttachTarget(null)}
        />
      )}
    </div>
  );
}
