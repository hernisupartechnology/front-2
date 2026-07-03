import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, FileText } from 'lucide-react';
import { medicalLeaveService } from '@/services/api/medicalLeaves';
import { formatDate } from '@/utils/statusHelpers';
import NewMedicalLeaveModal from '@/components/modals/NewMedicalLeaveModal';

const LEAVE_TYPE_LABEL: Record<string, string> = {
  enfermedad_general: 'Enfermedad general',
  accidente_trabajo: 'Accidente de trabajo',
  licencia_maternidad: 'Licencia de maternidad',
  licencia_paternidad: 'Licencia de paternidad',
  otro: 'Otro',
};

export default function MedicalLeavesTab({ patientId, patientName }: { patientId: number; patientName: string }) {
  const [showNew, setShowNew] = useState(false);

  const { data: leaves, isLoading } = useQuery({
    queryKey: ['medical-leaves', { userId: patientId }],
    queryFn: () => medicalLeaveService.list({ userId: patientId }),
  });

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
          <div key={leave.id} className="card p-4 pl-5">
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
          </div>
        ))}
      </div>

      {showNew && <NewMedicalLeaveModal patientId={patientId} patientName={patientName} onClose={() => setShowNew(false)} />}
    </div>
  );
}
