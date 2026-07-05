import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { vitalSignService } from '@/services/api/vitalSigns';

interface NewVitalSignModalProps {
  patientId: number;
  patientName: string;
  onClose: () => void;
}

interface FormValues {
  measurement_date?: string;
  systolic_pressure?: string;
  diastolic_pressure?: string;
  heart_rate?: string;
  blood_glucose?: string;
  weight?: string;
  height?: string;
  temperature?: string;
  oxygen_saturation?: string;
  notes?: string;
}

export default function NewVitalSignModal({ patientId, patientName, onClose }: NewVitalSignModalProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm<FormValues>();

  const mutation = useMutation({
    mutationFn: (v: FormValues) => vitalSignService.create({
      user_id: patientId,
      measurement_date: v.measurement_date || undefined,
      systolic_pressure: v.systolic_pressure ? Number(v.systolic_pressure) : undefined,
      diastolic_pressure: v.diastolic_pressure ? Number(v.diastolic_pressure) : undefined,
      heart_rate: v.heart_rate ? Number(v.heart_rate) : undefined,
      blood_glucose: v.blood_glucose ? Number(v.blood_glucose) : undefined,
      weight: v.weight ? Number(v.weight) : undefined,
      height: v.height ? Number(v.height) : undefined,
      temperature: v.temperature ? Number(v.temperature) : undefined,
      oxygen_saturation: v.oxygen_saturation ? Number(v.oxygen_saturation) : undefined,
      notes: v.notes || undefined,
    }),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['vital-signs'] });
      onClose();
    },
    onError: (error: { response?: { data?: { message?: string } } }) =>
      toast.error(error.response?.data?.message ?? 'No se pudo registrar el signo vital.'),
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="min-h-full flex items-center justify-center p-4">
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto glass" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[rgba(27,94,32,.08)]">
          <div>
            <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>Registrar signos vitales</h2>
            <p className="text-xs text-gray-500 mt-0.5">Para {patientName}</p>
          </div>
          <button onClick={onClose} className="btn btn--ghost p-2 rounded-full"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="p-5 space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha y hora</label>
            <input type="datetime-local" className="input" {...register('measurement_date')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Presión sistólica (mmHg)</label>
              <input type="number" className="input" {...register('systolic_pressure')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Presión diastólica (mmHg)</label>
              <input type="number" className="input" {...register('diastolic_pressure')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Frecuencia cardíaca (lpm)</label>
              <input type="number" className="input" {...register('heart_rate')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Glucosa (mg/dL)</label>
              <input type="number" step="0.1" className="input" {...register('blood_glucose')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Peso (kg)</label>
              <input type="number" step="0.1" className="input" {...register('weight')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Talla (cm)</label>
              <input type="number" step="0.1" className="input" {...register('height')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Temperatura (°C)</label>
              <input type="number" step="0.1" className="input" {...register('temperature')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Saturación O2 (%)</label>
              <input type="number" className="input" {...register('oxygen_saturation')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas</label>
            <textarea className="input" rows={2} {...register('notes')} />
          </div>

          <button type="submit" disabled={mutation.isPending} className="btn btn--primary w-full py-3" style={{ borderRadius: '10px' }}>
            {mutation.isPending ? 'Guardando...' : 'Registrar'}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
