import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileBarChart, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { reportService, type ReportType, type ReportFormat, type ReportHistoryEntry } from '@/services/api/reports';
import { householdService } from '@/services/api/household';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime, formatFileSize } from '@/utils/statusHelpers';

const SECTIONS = [
  { key: 'profile', label: 'Datos del paciente, alergias y condiciones' },
  { key: 'appointments', label: 'Citas' },
  { key: 'medications', label: 'Medicamentos' },
  { key: 'exams', label: 'Exámenes' },
  { key: 'referrals', label: 'Remisiones' },
  { key: 'leaves', label: 'Incapacidades' },
  { key: 'vaccinations', label: 'Vacunas' },
  { key: 'vitalSigns', label: 'Signos vitales' },
  { key: 'documents', label: 'Documentos adjuntos' },
];

const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  individual: 'Historial médico individual',
  household: 'Reporte del hogar completo',
  alerts: 'Alertas activas del hogar',
  leaves: 'Incapacidades por período',
};

interface FormValues {
  report_type: ReportType;
  format: ReportFormat;
  user_id: string;
  period: 'month' | 'year' | 'all';
}

export default function Reports() {
  const { isOwner } = useAuthStore();
  const [sections, setSections] = useState<Record<string, boolean>>(
    Object.fromEntries(SECTIONS.map((s) => [s.key, true])),
  );
  const queryClient = useQueryClient();

  const { data: household } = useQuery({ queryKey: ['household', 'current'], queryFn: householdService.current });
  const { data: history, isLoading: loadingHistory } = useQuery({ queryKey: ['reports', 'history'], queryFn: reportService.history });

  const { register, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: { report_type: 'individual', format: 'pdf', period: 'all' },
  });

  const reportType = watch('report_type');
  const needsMember = reportType === 'individual';
  const needsSections = reportType === 'individual' || reportType === 'household';

  const mutation = useMutation({
    mutationFn: (v: FormValues) => reportService.generate({
      report_type: v.report_type,
      format: v.format,
      user_id: v.user_id ? Number(v.user_id) : undefined,
      period: v.period,
      sections: needsSections ? sections : undefined,
    }),
    onSuccess: async (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['reports', 'history'] });
      await reportService.download(data.report);
    },
    onError: (error: { response?: { data?: { message?: string } } }) =>
      toast.error(error.response?.data?.message ?? 'No se pudo generar el reporte.'),
  });

  const downloadMutation = useMutation({
    mutationFn: (report: ReportHistoryEntry) => reportService.download(report),
    onError: () => toast.error('No se pudo descargar el reporte.'),
  });

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
        Reportes
      </h1>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="card p-5 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-semibold mb-1">
          <FileBarChart size={18} style={{ color: 'var(--color-primary)' }} />
          Generar nuevo reporte
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de reporte</label>
          <select className="input" {...register('report_type')}>
            <option value="individual">{REPORT_TYPE_LABEL.individual}</option>
            {isOwner() && <option value="household">{REPORT_TYPE_LABEL.household}</option>}
            {isOwner() && <option value="alerts">{REPORT_TYPE_LABEL.alerts}</option>}
            {isOwner() && <option value="leaves">{REPORT_TYPE_LABEL.leaves}</option>}
          </select>
        </div>

        {needsMember && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Miembro</label>
            <select className="input" {...register('user_id')}>
              {household?.members?.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Período</label>
            <select className="input" {...register('period')}>
              <option value="all">Histórico completo</option>
              <option value="month">Mes actual</option>
              <option value="year">Año actual</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Formato</label>
            <select className="input" {...register('format')}>
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
          </div>
        </div>

        {needsSections && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Secciones a incluir</label>
            <div className="grid grid-cols-2 gap-2">
              {SECTIONS.map((s) => (
                <label key={s.key} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sections[s.key] ?? true}
                    onChange={(e) => setSections((prev) => ({ ...prev, [s.key]: e.target.checked }))}
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>
        )}

        <button type="submit" disabled={mutation.isPending} className="btn btn--primary w-full py-3 gap-2" style={{ borderRadius: '10px' }}>
          {mutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Generando...</> : '¡Generar y descargar reporte!'}
        </button>
      </form>

      <div>
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Últimos reportes generados</h2>

        {loadingHistory && <div className="skeleton h-32 rounded-xl" />}

        {!loadingHistory && history?.length === 0 && (
          <p className="text-sm text-gray-500">Aún no has generado ningún reporte.</p>
        )}

        <div className="card divide-y divide-[rgba(27,94,32,.06)] overflow-hidden">
          {history?.map((r) => (
            <div key={r.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {REPORT_TYPE_LABEL[r.report_type]} <span className="text-gray-400 font-normal uppercase text-xs">· {r.format}</span>
                </p>
                <p className="text-xs text-gray-400">
                  {formatDateTime(r.created_at)}{r.file_size && ` · ${formatFileSize(r.file_size)}`}
                </p>
              </div>
              {r.status === 'completado' ? (
                <button onClick={() => downloadMutation.mutate(r)} className="btn btn--secondary text-xs py-1.5 px-3 gap-1.5" style={{ minHeight: 'auto' }}>
                  <Download size={13} /> Volver a descargar
                </button>
              ) : (
                <span className="chip chip--grey">{r.status === 'error' ? 'Error al generar' : 'Generando...'}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
