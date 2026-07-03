import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, FlaskConical } from 'lucide-react';
import type { Exam } from '@/types';
import { examService } from '@/services/api/exams';
import { getStatusBadge, formatDate, formatDateTime } from '@/utils/statusHelpers';
import NewExamModal from '@/components/modals/NewExamModal';
import ChangeExamStatusModal from '@/components/modals/ChangeExamStatusModal';

interface ExamsTabProps {
  patientId: number;
  patientName: string;
}

export default function ExamsTab({ patientId, patientName }: ExamsTabProps) {
  const [showNew, setShowNew] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Exam | null>(null);

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
            {withResults.map((e) => <ExamCard key={e.id} exam={e} onChangeStatus={setStatusTarget} />)}
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
          {others.map((e) => <ExamCard key={e.id} exam={e} onChangeStatus={setStatusTarget} />)}
        </div>
      )}

      {showNew && <NewExamModal patientId={patientId} patientName={patientName} onClose={() => setShowNew(false)} />}
      {statusTarget && <ChangeExamStatusModal exam={statusTarget} onClose={() => setStatusTarget(null)} />}
    </div>
  );
}

function ExamCard({ exam, onChangeStatus }: { exam: Exam; onChangeStatus: (e: Exam) => void }) {
  const badge = getStatusBadge('exam', exam.status);
  const isFinal = ['entregado_medico', 'cancelado'].includes(exam.status);

  return (
    <div className="card p-4 pl-5">
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
      {!isFinal && (
        <button onClick={() => onChangeStatus(exam)} className="btn btn--secondary text-xs py-1.5 px-3 mt-3" style={{ minHeight: 'auto' }}>
          Cambiar estado
        </button>
      )}
      {exam.performed_date && (
        <p className="text-xs text-gray-400 mt-2">Realizado: {formatDate(exam.performed_date)}</p>
      )}
    </div>
  );
}
