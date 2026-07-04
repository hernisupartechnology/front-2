import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { medicalLeaveService } from '@/services/api/medicalLeaves';
import { toDateInputValue } from '@/utils/statusHelpers';
import type { MedicalLeave } from '@/types';

interface NewMedicalLeaveModalProps {
  patientId: number;
  patientName: string;
  leave?: MedicalLeave;
  onClose: () => void;
}

const schema = z.object({
  issuing_doctor_name_free: z.string().optional(),
  start_date: z.string().min(1, 'Indica la fecha de inicio'),
  end_date: z.string().min(1, 'Indica la fecha de fin'),
  diagnosis: z.string().optional(),
  diagnosis_code: z.string().optional(),
  leave_type: z.enum(['enfermedad_general', 'accidente_trabajo', 'licencia_maternidad', 'licencia_paternidad', 'otro']),
  ips_issued: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewMedicalLeaveModal({ patientId, patientName, leave, onClose }: NewMedicalLeaveModalProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: leave ? {
      issuing_doctor_name_free: leave.issuing_doctor_name_free ?? '',
      start_date: toDateInputValue(leave.start_date),
      end_date: toDateInputValue(leave.end_date),
      diagnosis: leave.diagnosis ?? '',
      diagnosis_code: leave.diagnosis_code ?? '',
      leave_type: leave.leave_type,
      ips_issued: leave.ips_issued ?? '',
      notes: leave.notes ?? '',
    } : { leave_type: 'enfermedad_general' },
  });

  const mutation = useMutation({
    mutationFn: (v: FormValues) => (leave ? medicalLeaveService.update(leave.id, v) : medicalLeaveService.create({ ...v, user_id: patientId })),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['medical-leaves'] });
      onClose();
    },
    onError: (error: { response?: { data?: { message?: string } } }) =>
      toast.error(error.response?.data?.message ?? 'No se pudo registrar la incapacidad.'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto glass" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[rgba(27,94,32,.08)]">
          <div>
            <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
              {leave ? 'Editar incapacidad' : 'Nueva incapacidad'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Para {patientName}</p>
          </div>
          <button onClick={onClose} className="btn btn--ghost p-2 rounded-full"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="p-5 space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha inicio</label>
              <input type="date" className={`input ${errors.start_date ? 'input--error' : ''}`} {...register('start_date')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha fin</label>
              <input type="date" className={`input ${errors.end_date ? 'input--error' : ''}`} {...register('end_date')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de incapacidad</label>
            <select className="input" {...register('leave_type')}>
              <option value="enfermedad_general">Enfermedad general</option>
              <option value="accidente_trabajo">Accidente de trabajo</option>
              <option value="licencia_maternidad">Licencia de maternidad</option>
              <option value="licencia_paternidad">Licencia de paternidad</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Diagnóstico</label>
              <input className="input" {...register('diagnosis')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Código CIE-10</label>
              <input className="input" {...register('diagnosis_code')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Médico que la expidió</label>
            <input className="input" {...register('issuing_doctor_name_free')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">IPS que la expidió</label>
            <input className="input" {...register('ips_issued')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas</label>
            <textarea className="input" rows={2} {...register('notes')} />
          </div>

          <button type="submit" disabled={mutation.isPending} className="btn btn--primary w-full py-3" style={{ borderRadius: '10px' }}>
            {mutation.isPending ? 'Guardando...' : leave ? 'Guardar cambios' : 'Registrar incapacidad'}
          </button>
        </form>
      </div>
    </div>
  );
}
