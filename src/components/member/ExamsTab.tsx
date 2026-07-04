import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, FlaskConical, Paperclip } from 'lucide-react';
import type { Exam } from '@/types';
import { examService } from '@/services/api/exams';
import { getStatusBadge, formatDate, formatDateTime } from '@/utils/statusHelpers';
import NewExamModal from '@/components/modals/NewExamModal';
import ChangeExamStatusModal from '@/components/modals/ChangeExamStatusModal';
import UploadDocumentModal from '@/components/modals/UploadDocumentModal';
import DetailModal from '@/components/modals/DetailModal';

const EXAM_TYPE_LABEL: Record<string, string> = { laboratorio: 'Laboratorio', imagen: 'Imagen', especializado: 'Especializado', otro: 'Otro' };

interface ExamsTabProps {
  patientId: number;
  patientName: string;
}

export default function ExamsTab({ patientId, patientName }: ExamsTabProps) {
  const [showNew, setShowNew] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Exam | null>(null);
  const [attachTarget, setAttachTarget] = useState<Exam | null>(null);
  const [viewTarget, setViewTarget] = useState<Exam | null>(null);
  const [editTarget, setEditTarget] = useState<Exam | null>(null);

  const { data: exams, isLoading } = useQuery({
    queryKey: ['exams', { userId: patientId }],
    queryFn: () => examService.list({ userId: patientId }),
  });

  const withResults = exams?.filter((e) => e.status === 'resultado_disponible') ?? [];
  const others = exams?.filter((e) => e.status !== 'resultado_disponible') ?? [];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">Exámenes</h2>
        <button onClick={() => setShowNew(true)} className="btn btn--primary text-sm gap-1.5 py-2 px-4">
          <Plus size={16} /> Nuevo examen
        </button>
      </div>

      {withResults.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-alert-green)] mb-2">✅ Resultados disponibles</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {withResults.map((e) => (
              <ExamCard key={e.id} exam={e} onChangeStatus={setStatusTarget} onAttachDocument={setAttachTarget} onView={setViewTarget} />
            ))}
          </div>
        </div>
      )}

      {isLoading && <div className="skeleton h-24 rounded-xl" />}

      {!isLoading && exams?.length === 0 && (
        <div className="card p-10 flex flex-col items-center text-center gap-2">
          <FlaskConical className="text-gray-300" size={36} />
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Sin exámenes registrados</h3>
        </div>
      )}

      {others.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {others.map((e) => (
            <ExamCard key={e.id} exam={e} onChangeStatus={setStatusTarget} onAttachDocument={setAttachTarget} onView={setViewTarget} />
          ))}
        </div>
      )}

      {showNew && <NewExamModal patientId={patientId} patientName={patientName} onClose={() => setShowNew(false)} />}
      {statusTarget && <ChangeExamStatusModal exam={statusTarget} onClose={() => setStatusTarget(null)} />}

      {editTarget && (
        <NewExamModal patientId={patientId} patientName={patientName} exam={editTarget} onClose={() => setEditTarget(null)} />
      )}

      {viewTarget && (
        <DetailModal
          title={viewTarget.name}
          subtitle={`Para ${patientName}`}
          badge={getStatusBadge('exam', viewTarget.status)}
          relatedType="exam"
          relatedId={viewTarget.id}
          onEdit={() => { setEditTarget(viewTarget); setViewTarget(null); }}
          onClose={() => setViewTarget(null)}
          fields={[
            { label: 'Tipo', value: EXAM_TYPE_LABEL[viewTarget.exam_type] },
            { label: 'Urgencia', value: viewTarget.urgency === 'urgente' ? 'Urgente' : 'Rutina' },
            { label: 'Laboratorio / centro', value: viewTarget.lab_or_center },
            { label: 'Fecha agendada', value: viewTarget.scheduled_date ? formatDateTime(viewTarget.scheduled_date) : null },
            { label: 'Fecha de realización', value: viewTarget.performed_date ? formatDate(viewTarget.performed_date) : null },
            { label: 'Fecha de resultado', value: viewTarget.result_date ? formatDate(viewTarget.result_date) : null },
            { label: 'Resultado', value: viewTarget.result_summary, fullWidth: true },
            { label: 'Negado', value: viewTarget.denied_reason, fullWidth: true },
            { label: 'Cancelado', value: viewTarget.cancelled_reason, fullWidth: true },
            { label: 'Notas', value: viewTarget.notes, fullWidth: true },
          ]}
        />
      )}

      {attachTarget && (
        <UploadDocumentModal
          patientId={patientId}
          patientName={patientName}
          relatedType="exam"
          relatedId={attachTarget.id}
          contextLabel={attachTarget.name}
          onClose={() => setAttachTarget(null)}
        />
      )}
    </div>
  );
}

function ExamCard({
  exam, onChangeStatus, onAttachDocument, onView,
}: { exam: Exam; onChangeStatus: (e: Exam) => void; onAttachDocument: (e: Exam) => void; onView: (e: Exam) => void }) {
  const badge = getStatusBadge('exam', exam.status);
  const isFinal = ['entregado_medico', 'cancelado'].includes(exam.status);

  return (
    <div className="card p-4 pl-5 cursor-pointer" onClick={() => onView(exam)}>
      <div className={`traffic-bar traffic-bar--${exam.urgency === 'urgente' ? 'red' : 'grey'}`} />
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`badge ${badge.cssClass}`}>{badge.label}</span>
        {exam.urgency === 'urgente' && <span className="chip chip--red">Urgente</span>}
      </div>
      <h3 className="font-semibold text-gray-800 dark:text-gray-100">{exam.name}</h3>
      <p className="text-sm text-gray-500 capitalize">{exam.exam_type}{exam.lab_or_center && ` · ${exam.lab_or_center}`}</p>
      {exam.scheduled_date && <p className="text-xs text-gray-400 mt-1">Agendado: {formatDateTime(exam.scheduled_date)}</p>}
      {exam.result_summary && (
        <p className="text-xs mt-1.5 p-2 rounded-lg bg-[var(--color-primary-100)] dark:bg-[#1a2e1b] text-gray-600 dark:text-gray-300">
          {exam.result_summary}
        </p>
      )}
      {exam.status === 'negado' && exam.denied_reason && (
        <p className="text-xs mt-1.5 text-[var(--color-alert-red)]">Negado: {exam.denied_reason}</p>
      )}
      <div className="flex flex-wrap gap-2 mt-3">
        {!isFinal && (
          <button
            onClick={(e) => { e.stopPropagation(); onChangeStatus(exam); }}
            className="btn btn--secondary text-xs py-1.5 px-3"
            style={{ minHeight: 'auto' }}
          >
            Cambiar estado
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onAttachDocument(exam); }}
          className="btn btn--ghost text-xs py-1.5 px-3 gap-1"
          style={{ minHeight: 'auto' }}
        >
          <Paperclip size={13} /> Adjuntar documento
        </button>
      </div>
      {exam.performed_date && (
        <p className="text-xs text-gray-400 mt-2">Realizado: {formatDate(exam.performed_date)}</p>
      )}
    </div>
  );
}
