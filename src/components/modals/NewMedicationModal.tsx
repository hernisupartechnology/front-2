import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { medicationService } from '@/services/api/medications';
import { suggestSchedulesFromFrequency } from '@/utils/scheduleSuggestions';
import { toDateInputValue } from '@/utils/statusHelpers';
import type { Medication, MedicationStatus } from '@/types';

interface NewMedicationModalProps {
  patientId: number;
  patientName: string;
  medication?: Medication;
  onClose: () => void;
}

const PRESENTATIONS = [
  'tabletas', 'cápsulas', 'jarabe', 'inyectable', 'crema', 'gotas', 'parche', 'inhalador', 'otro',
];

const STATUSES: { value: string; label: string }[] = [
  { value: 'sin_orden', label: 'Sin orden' },
  { value: 'con_orden', label: 'Con orden' },
  { value: 'en_autorizacion', label: 'En autorización' },
  { value: 'autorizado', label: 'Autorizado' },
  { value: 'reclamado', label: 'Reclamado' },
  { value: 'en_uso', label: 'En uso' },
];

const schema = z.object({
  name: z.string().min(2, 'Indica el nombre del medicamento'),
  active_ingredient: z.string().optional(),
  presentation: z.string().optional(),
  dosage: z.string().min(1, 'Indica la dosis'),
  frequency: z.string().min(1, 'Indica la frecuencia'),
  duration_days: z.string().optional(),
  quantity: z.string().optional(),
  start_date: z.string().optional(),
  is_recurring: z.boolean().optional(),
  recurrence_days: z.string().optional(),
  alert_days_before: z.string().optional(),
  status: z.string().optional(),
  authorization_number: z.string().optional(),
  notes: z.string().optional(),
  track_intake: z.boolean().optional(),
  intake_quantity_per_dose: z.string().optional(),
  low_stock_alert_doses: z.string().optional(),
  schedules: z.array(z.object({
    time_of_day: z.string().min(1),
    label: z.string().optional(),
    reminder_minutes_before: z.string().optional(),
  })).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewMedicationModal({ patientId, patientName, medication, onClose }: NewMedicationModalProps) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: medication ? {
      name: medication.name,
      active_ingredient: medication.active_ingredient ?? '',
      presentation: medication.presentation ?? '',
      dosage: medication.dosage,
      frequency: medication.frequency,
      duration_days: medication.duration_days ? String(medication.duration_days) : '',
      quantity: medication.quantity ? String(medication.quantity) : '',
      start_date: toDateInputValue(medication.start_date),
      is_recurring: medication.is_recurring,
      recurrence_days: medication.recurrence_days ? String(medication.recurrence_days) : '',
      alert_days_before: medication.alert_days_before ? String(medication.alert_days_before) : '',
      status: medication.status,
      authorization_number: medication.authorization_number ?? '',
      notes: medication.notes ?? '',
      track_intake: medication.track_intake,
      intake_quantity_per_dose: medication.intake_quantity_per_dose ? String(medication.intake_quantity_per_dose) : '',
      low_stock_alert_doses: medication.low_stock_alert_doses ? String(medication.low_stock_alert_doses) : '',
      schedules: medication.schedules?.map((s) => ({
        time_of_day: s.time_of_day.slice(0, 5),
        label: s.label ?? '',
        reminder_minutes_before: String(s.reminder_minutes_before),
      })),
    } : { is_recurring: false, track_intake: false, status: 'con_orden' },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'schedules' });

  const trackIntake = watch('track_intake');
  const isRecurring = watch('is_recurring');
  const frequency = watch('frequency');

  useEffect(() => {
    if (trackIntake && fields.length === 0 && frequency) {
      replace(suggestSchedulesFromFrequency(frequency).map((s) => ({ ...s, reminder_minutes_before: '5' })));
    }
  }, [trackIntake, frequency, fields.length, replace]);

  const mutation = useMutation({
    mutationFn: async (v: FormValues) => {
      const basePayload = {
        name: v.name,
        active_ingredient: v.active_ingredient || undefined,
        presentation: v.presentation || undefined,
        dosage: v.dosage,
        frequency: v.frequency,
        duration_days: v.duration_days ? Number(v.duration_days) : undefined,
        quantity: v.quantity ? Number(v.quantity) : undefined,
        start_date: v.start_date || undefined,
        is_recurring: v.is_recurring,
        recurrence_days: v.is_recurring && v.recurrence_days ? Number(v.recurrence_days) : undefined,
        alert_days_before: v.alert_days_before ? Number(v.alert_days_before) : undefined,
        authorization_number: v.authorization_number || undefined,
        notes: v.notes || undefined,
        track_intake: v.track_intake,
        intake_quantity_per_dose: v.track_intake && v.intake_quantity_per_dose ? Number(v.intake_quantity_per_dose) : undefined,
        low_stock_alert_doses: v.low_stock_alert_doses ? Number(v.low_stock_alert_doses) : undefined,
      };
      const schedules = v.track_intake
        ? v.schedules?.map((s) => ({
          time_of_day: s.time_of_day,
          label: s.label || undefined,
          reminder_minutes_before: s.reminder_minutes_before ? Number(s.reminder_minutes_before) : 5,
        }))
        : undefined;

      if (medication) {
        const result = await medicationService.update(medication.id, basePayload);
        // Los horarios de toma se gestionan en un endpoint aparte (editor de horarios).
        if (schedules && schedules.length > 0) {
          await medicationService.saveSchedules(medication.id, schedules);
        } else if ((medication.schedules?.length ?? 0) > 0) {
          await Promise.all(medication.schedules!.map((s) => medicationService.deleteSchedule(medication.id, s.id)));
        }
        return result;
      }

      return medicationService.create({
        ...basePayload,
        user_id: patientId,
        status: v.status as MedicationStatus,
        schedules,
      });
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: (error: { response?: { data?: { message?: string } } }) =>
      toast.error(error.response?.data?.message ?? 'No se pudo registrar el medicamento.'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto glass" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[rgba(27,94,32,.08)] sticky top-0 bg-[var(--color-surface)] dark:bg-[#1a2e1b] z-10">
          <div>
            <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
              {medication ? 'Editar medicamento' : 'Nuevo medicamento'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Para {patientName}</p>
          </div>
          <button onClick={onClose} className="btn btn--ghost p-2 rounded-full"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="p-5 space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del medicamento</label>
            <input className={`input ${errors.name ? 'input--error' : ''}`} placeholder="Ej: Losartán" {...register('name')} />
            {errors.name && <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Dosis</label>
              <input className={`input ${errors.dosage ? 'input--error' : ''}`} placeholder="Ej: 50mg" {...register('dosage')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Presentación</label>
              <select className="input" {...register('presentation')}>
                <option value="">Selecciona...</option>
                {PRESENTATIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Frecuencia</label>
            <input className={`input ${errors.frequency ? 'input--error' : ''}`} placeholder="Ej: cada 8 horas" {...register('frequency')} />
            {errors.frequency && <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{errors.frequency.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Duración (días)</label>
              <input type="number" className="input" {...register('duration_days')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Cantidad a dispensar</label>
              <input type="number" className="input" {...register('quantity')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de inicio</label>
            <input type="date" className="input" {...register('start_date')} />
          </div>

          {!medication && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado inicial</label>
              <select className="input" {...register('status')}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          )}

          {/* Recurrencia / crónico */}
          <div className="p-3 rounded-lg bg-[var(--color-primary-100)]/40">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" {...register('is_recurring')} />
              ¿Es recurrente / crónico?
            </label>
            {isRecurring && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Renovar cada (días)</label>
                  <input type="number" className="input" placeholder="30" {...register('recurrence_days')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Alertar (días antes)</label>
                  <input type="number" className="input" placeholder="10" {...register('alert_days_before')} />
                </div>
              </div>
            )}
          </div>

          {/* Recordatorios de toma */}
          <div className="p-3 rounded-lg bg-[var(--color-primary-100)]/40">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" {...register('track_intake')} />
              ¿Activar recordatorios de toma?
            </label>

            {trackIntake && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Cantidad por toma</label>
                    <input type="number" step="0.5" className="input" placeholder="1" {...register('intake_quantity_per_dose')} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Alertar con pocas dosis</label>
                    <input type="number" className="input" placeholder="5" {...register('low_stock_alert_doses')} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-gray-600">Horarios de toma (editable)</label>
                    <button
                      type="button"
                      onClick={() => append({ time_of_day: '08:00', label: '', reminder_minutes_before: '5' })}
                      className="text-xs font-medium flex items-center gap-1"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      <Plus size={13} /> Agregar horario
                    </button>
                  </div>

                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-white/50 dark:bg-black/10">
                        <input type="time" className="input flex-shrink-0 w-[6.5rem]" {...register(`schedules.${index}.time_of_day`)} />
                        <input className="input flex-1 min-w-[8rem]" placeholder="Etiqueta (ej: Desayuno)" {...register(`schedules.${index}.label`)} />
                        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                          <select className="input w-20" {...register(`schedules.${index}.reminder_minutes_before`)}>
                            {[0, 5, 10, 15, 30].map((m) => <option key={m} value={m}>{m} min</option>)}
                          </select>
                          <button type="button" onClick={() => remove(index)} className="text-gray-400 hover:text-[var(--color-alert-red)] p-1 flex-shrink-0">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Número de autorización (opcional)</label>
            <input className="input" {...register('authorization_number')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas</label>
            <textarea className="input" rows={2} {...register('notes')} />
          </div>

          <button type="submit" disabled={mutation.isPending} className="btn btn--primary w-full py-3" style={{ borderRadius: '10px' }}>
            {mutation.isPending ? 'Guardando...' : medication ? 'Guardar cambios' : '¡Registrar medicamento!'}
          </button>
        </form>
      </div>
    </div>
  );
}
