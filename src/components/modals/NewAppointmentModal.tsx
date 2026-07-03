import { useState } from 'react';
import { useForm, type UseFormRegister, type UseFormWatch, type FieldValues, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ClipboardList, CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';
import { appointmentService } from '@/services/api/appointments';
import type { RecurrenceType } from '@/types';

interface NewAppointmentModalProps {
  patientId: number;
  patientName: string;
  onClose: () => void;
}

const RECURRENCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

const needSchema = z.object({
  specialty: z.string().min(2, 'Indica la especialidad requerida'),
  doctor_name_free: z.string().optional(),
  need_reason: z.string().min(3, 'Cuéntanos el motivo o los síntomas'),
  need_urgency: z.enum(['rutina', 'prioritaria', 'urgente']),
  max_days_to_schedule: z.string().optional(),
  alert_days_before_scheduling: z.string().optional(),
  is_recurring: z.boolean().optional(),
  recurrence_type: z.string().optional(),
  notes: z.string().optional(),
});

const scheduledSchema = z.object({
  specialty: z.string().min(2, 'Indica la especialidad'),
  doctor_name_free: z.string().optional(),
  appointment_date: z.string().min(1, 'Indica la fecha y hora de la cita'),
  appointment_type: z.enum(['consulta', 'control', 'urgencias', 'domiciliaria', 'telemedicina']),
  ips: z.string().optional(),
  address: z.string().optional(),
  reason: z.string().optional(),
  is_recurring: z.boolean().optional(),
  recurrence_type: z.string().optional(),
  notes: z.string().optional(),
});

type Step = 'choose' | 'need' | 'scheduled';

/**
 * Modal "Nueva cita / Necesidad" — Paso 1: elegir si es una necesidad sin
 * agendar (Opción A) o una cita que ya tiene fecha (Opción B).
 */
export default function NewAppointmentModal({ patientId, patientName, onClose }: NewAppointmentModalProps) {
  const [step, setStep] = useState<Step>('choose');
  const queryClient = useQueryClient();

  const needForm = useForm<z.infer<typeof needSchema>>({
    resolver: zodResolver(needSchema),
    defaultValues: { need_urgency: 'rutina', is_recurring: false },
  });
  const scheduledForm = useForm<z.infer<typeof scheduledSchema>>({
    resolver: zodResolver(scheduledSchema),
    defaultValues: { appointment_type: 'consulta', is_recurring: false },
  });

  const onSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    onClose();
  };

  const onError = (error: { response?: { data?: { message?: string } } }) =>
    toast.error(error.response?.data?.message ?? 'No se pudo guardar la cita.');

  const needMutation = useMutation({
    mutationFn: (v: z.infer<typeof needSchema>) => appointmentService.create({
      user_id: patientId,
      is_need: true,
      specialty: v.specialty,
      doctor_name_free: v.doctor_name_free || undefined,
      need_reason: v.need_reason,
      need_urgency: v.need_urgency,
      max_days_to_schedule: v.max_days_to_schedule ? Number(v.max_days_to_schedule) : undefined,
      alert_days_before_scheduling: v.alert_days_before_scheduling ? Number(v.alert_days_before_scheduling) : undefined,
      is_recurring: v.is_recurring,
      recurrence_type: v.is_recurring ? (v.recurrence_type as RecurrenceType) : undefined,
      notes: v.notes,
    }),
    onSuccess: (data) => onSuccess(data.message),
    onError,
  });

  const scheduledMutation = useMutation({
    mutationFn: (v: z.infer<typeof scheduledSchema>) => appointmentService.create({
      user_id: patientId,
      is_need: false,
      specialty: v.specialty,
      doctor_name_free: v.doctor_name_free || undefined,
      appointment_date: v.appointment_date,
      appointment_type: v.appointment_type,
      ips: v.ips,
      address: v.address,
      reason: v.reason,
      is_recurring: v.is_recurring,
      recurrence_type: v.is_recurring ? (v.recurrence_type as RecurrenceType) : undefined,
      notes: v.notes,
    }),
    onSuccess: (data) => onSuccess(data.message),
    onError,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto glass" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[rgba(27,94,32,.08)] sticky top-0 bg-[var(--color-surface)] dark:bg-[#1a2e1b] z-10">
          <div>
            <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
              Nueva cita / Necesidad
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Para {patientName}</p>
          </div>
          <button onClick={onClose} className="btn btn--ghost p-2 rounded-full"><X size={18} /></button>
        </div>

        <div className="p-5">
          {step === 'choose' && (
            <div className="space-y-3">
              <button
                onClick={() => setStep('need')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent hover:border-[var(--color-primary-300)] hover:bg-[var(--color-primary-100)] transition-colors text-left"
              >
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-100)' }}>
                  <ClipboardList size={20} style={{ color: 'var(--color-alert-purple)' }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">📋 Registrar necesidad</p>
                  <p className="text-xs text-gray-500 mt-0.5">Sé que debo ir pero aún no he agendado</p>
                </div>
              </button>

              <button
                onClick={() => setStep('scheduled')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent hover:border-[var(--color-primary-300)] hover:bg-[var(--color-primary-100)] transition-colors text-left"
              >
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-100)' }}>
                  <CalendarPlus size={20} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">📅 Registrar cita ya agendada</p>
                  <p className="text-xs text-gray-500 mt-0.5">Ya tengo fecha y hora asignada</p>
                </div>
              </button>
            </div>
          )}

          {step === 'need' && (
            <form onSubmit={needForm.handleSubmit((v) => needMutation.mutate(v))} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Especialidad requerida</label>
                <input className={`input ${needForm.formState.errors.specialty ? 'input--error' : ''}`} placeholder="Ej: Cardiología" {...needForm.register('specialty')} />
                {needForm.formState.errors.specialty && <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{needForm.formState.errors.specialty.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Motivo / síntomas</label>
                <textarea className={`input ${needForm.formState.errors.need_reason ? 'input--error' : ''}`} rows={2} {...needForm.register('need_reason')} />
                {needForm.formState.errors.need_reason && <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{needForm.formState.errors.need_reason.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Urgencia</label>
                <select className="input" {...needForm.register('need_urgency')}>
                  <option value="rutina">🟢 Rutina</option>
                  <option value="prioritaria">🟡 Prioritaria</option>
                  <option value="urgente">🔴 Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Médico (opcional)</label>
                <input className="input" placeholder="Nombre del médico" {...needForm.register('doctor_name_free')} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Plazo máx. para agendar (días)</label>
                  <input type="number" className="input" placeholder="30" {...needForm.register('max_days_to_schedule')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Alerta amarilla (días antes)</label>
                  <input type="number" className="input" placeholder="10" {...needForm.register('alert_days_before_scheduling')} />
                </div>
              </div>

              <RecurrenceFields register={needForm.register} watch={needForm.watch} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas</label>
                <textarea className="input" rows={2} {...needForm.register('notes')} />
              </div>

              <ModalActions onBack={() => setStep('choose')} pending={needMutation.isPending} label="Registrar necesidad" />
            </form>
          )}

          {step === 'scheduled' && (
            <form onSubmit={scheduledForm.handleSubmit((v) => scheduledMutation.mutate(v))} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Especialidad</label>
                <input className={`input ${scheduledForm.formState.errors.specialty ? 'input--error' : ''}`} placeholder="Ej: Pediatría" {...scheduledForm.register('specialty')} />
                {scheduledForm.formState.errors.specialty && <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{scheduledForm.formState.errors.specialty.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha y hora de la cita</label>
                <input type="datetime-local" className={`input ${scheduledForm.formState.errors.appointment_date ? 'input--error' : ''}`} {...scheduledForm.register('appointment_date')} />
                {scheduledForm.formState.errors.appointment_date && <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{scheduledForm.formState.errors.appointment_date.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de cita</label>
                <select className="input" {...scheduledForm.register('appointment_type')}>
                  <option value="consulta">Consulta</option>
                  <option value="control">Control</option>
                  <option value="urgencias">Urgencias</option>
                  <option value="domiciliaria">Domiciliaria</option>
                  <option value="telemedicina">Telemedicina</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Médico (opcional)</label>
                <input className="input" placeholder="Nombre del médico" {...scheduledForm.register('doctor_name_free')} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">IPS / Lugar</label>
                <input className="input" {...scheduledForm.register('ips')} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Motivo de consulta</label>
                <textarea className="input" rows={2} {...scheduledForm.register('reason')} />
              </div>

              <RecurrenceFields register={scheduledForm.register} watch={scheduledForm.watch} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas</label>
                <textarea className="input" rows={2} {...scheduledForm.register('notes')} />
              </div>

              <ModalActions onBack={() => setStep('choose')} pending={scheduledMutation.isPending} label="Registrar cita" />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

interface RecurringFormFields extends FieldValues {
  is_recurring?: boolean;
  recurrence_type?: string;
}

function RecurrenceFields<T extends RecurringFormFields>({ register, watch }: {
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
}) {
  const isRecurring = watch('is_recurring' as Path<T>);
  return (
    <div className="p-3 rounded-lg bg-[var(--color-primary-100)]/40">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
        <input type="checkbox" className="w-4 h-4" {...register('is_recurring' as Path<T>)} />
        ¿Es recurrente / control periódico?
      </label>
      {isRecurring && (
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Frecuencia</label>
          <select className="input" {...register('recurrence_type' as Path<T>)}>
            {RECURRENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

function ModalActions({ onBack, pending, label }: { onBack: () => void; pending: boolean; label: string }) {
  return (
    <div className="flex gap-2 pt-2">
      <button type="button" onClick={onBack} className="btn btn--ghost flex-1">Volver</button>
      <button type="submit" disabled={pending} className="btn btn--primary flex-1">
        {pending ? 'Guardando...' : label}
      </button>
    </div>
  );
}
