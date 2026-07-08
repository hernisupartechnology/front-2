import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { examService } from '@/services/api/exams';
import { toDateTimeInputValue, fromDateTimeInputValue } from '@/utils/statusHelpers';
import type { Exam } from '@/types';

interface NewExamModalProps {
  patientId: number;
  patientName: string;
  exam?: Exam;
  onClose: () => void;
}

const schema = z.object({
  name: z.string().min(2, 'Indica el nombre del examen'),
  exam_type: z.enum(['laboratorio', 'imagen', 'especializado', 'otro']),
  urgency: z.enum(['rutina', 'urgente']),
  lab_or_center: z.string().optional(),
  scheduled_date: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewExamModal({ patientId, patientName, exam, onClose }: NewExamModalProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: exam ? {
      name: exam.name,
      exam_type: exam.exam_type,
      urgency: exam.urgency,
      lab_or_center: exam.lab_or_center ?? '',
      scheduled_date: toDateTimeInputValue(exam.scheduled_date),
      notes: exam.notes ?? '',
    } : { exam_type: 'laboratorio', urgency: 'rutina' },
  });

  const mutation = useMutation({
    mutationFn: (v: FormValues) => {
      const payload = { ...v, scheduled_date: v.scheduled_date ? fromDateTimeInputValue(v.scheduled_date) : undefined };
      return exam ? examService.update(exam.id, payload) : examService.create({ ...payload, user_id: patientId });
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      onClose();
    },
    onError: (error: { response?: { data?: { message?: string } } }) =>
      toast.error(error.response?.data?.message ?? 'No se pudo registrar el examen.'),
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="min-h-full flex items-center justify-center p-4">
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto glass" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[rgba(27,94,32,.08)]">
          <div>
            <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
              {exam ? 'Editar examen' : 'Nuevo examen'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Para {patientName}</p>
          </div>
          <button onClick={onClose} className="btn btn--ghost p-2 rounded-full"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="p-5 space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del examen</label>
            <input className={`input ${errors.name ? 'input--error' : ''}`} placeholder="Ej: Hemograma completo" {...register('name')} />
            {errors.name && <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
              <select className="input" {...register('exam_type')}>
                <option value="laboratorio">Laboratorio</option>
                <option value="imagen">Imagen</option>
                <option value="especializado">Especializado</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Urgencia</label>
              <select className="input" {...register('urgency')}>
                <option value="rutina">Rutina</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Laboratorio / centro (opcional)</label>
            <input className="input" {...register('lab_or_center')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha agendada (opcional)</label>
            <input type="datetime-local" className="input" {...register('scheduled_date')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas</label>
            <textarea className="input" rows={2} {...register('notes')} />
          </div>

          <button type="submit" disabled={mutation.isPending} className="btn btn--primary w-full py-3" style={{ borderRadius: '10px' }}>
            {mutation.isPending ? 'Guardando...' : exam ? 'Guardar cambios' : 'Registrar examen'}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
