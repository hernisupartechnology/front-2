import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import type { Appointment, AppointmentStatus } from '@/types';
import { appointmentService } from '@/services/api/appointments';

interface ChangeAppointmentStatusModalProps {
  appointment: Appointment;
  onClose: () => void;
}

interface StatusOption {
  target: AppointmentStatus;
  label: string;
}

/** Próximos estados válidos según el estado actual — refleja el flujo del spec. */
function nextOptions(appointment: Appointment): StatusOption[] {
  if (appointment.is_need) {
    return [{ target: 'programada', label: '📅 Agendar cita' }];
  }
  switch (appointment.status) {
    case 'programada':
      return [
        { target: 'confirmada', label: '✅ Confirmar con la IPS' },
        { target: 'realizada', label: '🏁 Marcar como realizada' },
        { target: 'cancelada', label: '❌ Cancelar' },
        { target: 'no_asistio', label: '🚫 No asistió' },
      ];
    case 'confirmada':
      return [
        { target: 'realizada', label: '🏁 Marcar como realizada' },
        { target: 'cancelada', label: '❌ Cancelar' },
        { target: 'no_asistio', label: '🚫 No asistió' },
      ];
    case 'cancelada':
      return [{ target: 'programada', label: '🔄 Reprogramar' }];
    case 'reprogramada':
      return [{ target: 'programada', label: '📅 Asignar nueva fecha' }];
    case 'no_asistio':
      return [{ target: 'programada', label: '🔄 Reagendar' }];
    default:
      return [];
  }
}

type FormValues = {
  appointment_date?: string;
  diagnosis?: string;
  next_appointment_date?: string;
  next_appointment_notes?: string;
  cancelled_reason?: string;
  cancelled_by?: 'paciente' | 'ips' | 'eps';
};

export default function ChangeAppointmentStatusModal({ appointment, onClose }: ChangeAppointmentStatusModalProps) {
  const options = nextOptions(appointment);
  const [target, setTarget] = useState<AppointmentStatus | null>(options.length === 1 ? options[0].target : null);
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm<FormValues>();

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!target) throw new Error('no target');

      if (appointment.is_need) {
        return appointmentService.schedule(appointment.id, {
          appointment_date: values.appointment_date!,
        });
      }

      return appointmentService.changeStatus(appointment.id, {
        status: target,
        appointment_date: values.appointment_date,
        diagnosis: values.diagnosis,
        next_appointment_date: values.next_appointment_date || undefined,
        next_appointment_notes: values.next_appointment_notes || undefined,
        cancelled_reason: values.cancelled_reason,
        cancelled_by: values.cancelled_by,
      });
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: (error: { response?: { data?: { message?: string } } }) =>
      toast.error(error.response?.data?.message ?? 'No se pudo actualizar el estado.'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto glass" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[rgba(27,94,32,.08)]">
          <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
            {appointment.is_need ? 'Agendar cita' : 'Cambiar estado de la cita'}
          </h2>
          <button onClick={onClose} className="btn btn--ghost p-2 rounded-full"><X size={18} /></button>
        </div>

        <div className="p-5">
          {!target ? (
            <div className="space-y-2">
              {options.map((o) => (
                <button
                  key={o.target}
                  onClick={() => setTarget(o.target)}
                  className="w-full text-left p-3 rounded-lg hover:bg-[var(--color-primary-100)] transition-colors font-medium text-gray-700 dark:text-gray-200"
                >
                  {o.label}
                </button>
              ))}
              {options.length === 0 && (
                <p className="text-sm text-gray-500">Esta cita no tiene transiciones disponibles.</p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
              {(target === 'programada') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha y hora de la cita</label>
                  <input type="datetime-local" required className="input" {...register('appointment_date')} />
                </div>
              )}

              {target === 'realizada' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Diagnóstico</label>
                    <textarea required className="input" rows={2} {...register('diagnosis')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Próxima cita sugerida (opcional)</label>
                    <input type="date" className="input" {...register('next_appointment_date')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas de la próxima cita</label>
                    <input className="input" {...register('next_appointment_notes')} />
                  </div>
                </>
              )}

              {target === 'cancelada' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Motivo de cancelación</label>
                    <textarea required className="input" rows={2} {...register('cancelled_reason')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Cancelado por</label>
                    <select required className="input" {...register('cancelled_by')}>
                      <option value="">Selecciona...</option>
                      <option value="paciente">Paciente</option>
                      <option value="ips">IPS</option>
                      <option value="eps">EPS</option>
                    </select>
                  </div>
                </>
              )}

              {(target === 'confirmada' || target === 'no_asistio') && (
                <p className="text-sm text-gray-500">¿Confirmas este cambio de estado?</p>
              )}

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
  );
}
