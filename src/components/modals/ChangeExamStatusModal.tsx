import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import type { Exam, ExamStatus } from '@/types';
import { examService } from '@/services/api/exams';
import { fromDateTimeInputValue } from '@/utils/statusHelpers';

interface ChangeExamStatusModalProps {
  exam: Exam;
  onClose: () => void;
}

interface StatusOption { target: ExamStatus; label: string }

function nextOptions(exam: Exam): StatusOption[] {
  switch (exam.status) {
    case 'sin_orden':
      return [{ target: 'con_orden', label: '📝 Ya tengo la orden' }];
    case 'con_orden':
      return [{ target: 'en_autorizacion', label: '📨 Radicar en la EPS' }];
    case 'en_autorizacion':
      return [
        { target: 'autorizado', label: '✅ Autorizado por la EPS' },
        { target: 'negado', label: '❌ Negado por la EPS' },
      ];
    case 'autorizado':
      return [{ target: 'agendado', label: '📅 Agendar cita del examen' }];
    case 'agendado':
      return [{ target: 'muestra_tomada', label: '🧪 Muestra tomada / examen realizado' }];
    case 'muestra_tomada':
      return [{ target: 'resultado_pendiente', label: '⏳ Resultados en espera' }];
    case 'resultado_pendiente':
      return [{ target: 'resultado_disponible', label: '📄 Resultado disponible' }];
    case 'resultado_disponible':
      return [{ target: 'entregado_medico', label: '👨‍⚕️ Entregado al médico' }];
    default:
      return [];
  }
}

const CANCELABLE: ExamStatus[] = ['con_orden', 'en_autorizacion', 'autorizado', 'agendado'];

type FormValues = Record<string, string>;

export default function ChangeExamStatusModal({ exam, onClose }: ChangeExamStatusModalProps) {
  const options = [...nextOptions(exam), ...(CANCELABLE.includes(exam.status) ? [{ target: 'cancelado' as ExamStatus, label: '🚫 Cancelar examen' }] : [])];
  const [target, setTarget] = useState<ExamStatus | null>(null);
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm<FormValues>();

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!target) throw new Error('no target');
      const payload = { ...values };
      if (payload.scheduled_date) payload.scheduled_date = fromDateTimeInputValue(payload.scheduled_date);
      return examService.changeStatus(exam.id, { status: target, ...payload });
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      onClose();
    },
    onError: (error: { response?: { data?: { message?: string } } }) =>
      toast.error(error.response?.data?.message ?? 'No se pudo actualizar el estado.'),
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="min-h-full flex items-center justify-center p-4">
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto glass" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[rgba(27,94,32,.08)]">
          <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>Cambiar estado del examen</h2>
          <button onClick={onClose} className="btn btn--ghost p-2 rounded-full"><X size={18} /></button>
        </div>

        <div className="p-5">
          {!target ? (
            <div className="space-y-2">
              {options.map((o) => (
                <button key={o.target} onClick={() => setTarget(o.target)} className="w-full text-left p-3 rounded-lg hover:bg-[var(--color-primary-100)] font-medium text-gray-700 dark:text-gray-200">
                  {o.label}
                </button>
              ))}
              {options.length === 0 && <p className="text-sm text-gray-500">Sin transiciones disponibles.</p>}
            </div>
          ) : (
            <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
              {target === 'autorizado' && (
                <>
                  <Field label="Número de autorización" name="authorization_number" register={register} required />
                  <Field label="Fecha de autorización" name="authorization_date" type="date" register={register} required />
                </>
              )}
              {target === 'negado' && <Field label="Motivo de negación" name="denied_reason" register={register} textarea required />}
              {target === 'agendado' && <Field label="Fecha y hora de la cita" name="scheduled_date" type="datetime-local" register={register} required />}
              {target === 'muestra_tomada' && <Field label="Fecha de realización" name="performed_date" type="date" register={register} required />}
              {target === 'resultado_pendiente' && <Field label="Fecha estimada de resultados (opcional)" name="result_date" type="date" register={register} />}
              {target === 'resultado_disponible' && (
                <>
                  <Field label="Fecha de disponibilidad" name="result_date" type="date" register={register} required />
                  <Field label="Resumen del resultado (opcional)" name="result_summary" register={register} textarea />
                </>
              )}
              {target === 'entregado_medico' && <Field label="Fecha de entrega" name="delivered_to_doctor_date" type="date" register={register} required />}
              {target === 'cancelado' && <Field label="Motivo de cancelación" name="cancelled_reason" register={register} textarea required />}
              {target === 'con_orden' && <p className="text-sm text-gray-500">¿Confirmas que ya tienes la orden médica?</p>}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setTarget(null)} className="btn btn--ghost flex-1">Volver</button>
                <button type="submit" disabled={mutation.isPending} className="btn btn--primary flex-1">
                  {mutation.isPending ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

function Field({ label, name, type = 'text', register, required, textarea }: {
  label: string; name: string; type?: string;
  register: ReturnType<typeof useForm<FormValues>>['register'];
  required?: boolean; textarea?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {textarea ? (
        <textarea required={required} className="input" rows={2} {...register(name)} />
      ) : (
        <input required={required} type={type} className="input" {...register(name)} />
      )}
    </div>
  );
}
