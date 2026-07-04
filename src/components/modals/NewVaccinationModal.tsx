import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { vaccinationService } from '@/services/api/vaccinations';
import { toDateInputValue } from '@/utils/statusHelpers';
import type { Vaccination } from '@/types';

interface NewVaccinationModalProps {
  patientId: number;
  patientName: string;
  vaccination?: Vaccination;
  onClose: () => void;
}

const schema = z.object({
  vaccine_name: z.string().min(2, 'Indica el nombre de la vacuna'),
  dose_number: z.string().optional(),
  application_date: z.string().min(1, 'Indica la fecha de aplicación'),
  applied_by: z.string().optional(),
  lot_number: z.string().optional(),
  ips_or_center: z.string().optional(),
  next_dose_date: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewVaccinationModal({ patientId, patientName, vaccination, onClose }: NewVaccinationModalProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: vaccination ? {
      vaccine_name: vaccination.vaccine_name,
      dose_number: vaccination.dose_number ?? '',
      application_date: toDateInputValue(vaccination.application_date),
      applied_by: vaccination.applied_by ?? '',
      lot_number: vaccination.lot_number ?? '',
      ips_or_center: vaccination.ips_or_center ?? '',
      next_dose_date: toDateInputValue(vaccination.next_dose_date),
      notes: vaccination.notes ?? '',
    } : undefined,
  });

  const mutation = useMutation({
    mutationFn: (v: FormValues) => (vaccination ? vaccinationService.update(vaccination.id, v) : vaccinationService.create({ ...v, user_id: patientId })),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['vaccinations'] });
      onClose();
    },
    onError: (error: { response?: { data?: { message?: string } } }) =>
      toast.error(error.response?.data?.message ?? 'No se pudo registrar la vacuna.'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto glass" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[rgba(27,94,32,.08)]">
          <div>
            <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
              {vaccination ? 'Editar vacuna' : 'Registrar vacuna'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Para {patientName}</p>
          </div>
          <button onClick={onClose} className="btn btn--ghost p-2 rounded-full"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="p-5 space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la vacuna</label>
            <input className={`input ${errors.vaccine_name ? 'input--error' : ''}`} placeholder="Ej: Influenza" {...register('vaccine_name')} />
            {errors.vaccine_name && <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{errors.vaccine_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Dosis</label>
              <input className="input" placeholder="Ej: 1ra dosis" {...register('dose_number')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de aplicación</label>
              <input type="date" className={`input ${errors.application_date ? 'input--error' : ''}`} {...register('application_date')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Aplicada por</label>
            <input className="input" placeholder="Profesional o centro" {...register('applied_by')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Número de lote</label>
              <input className="input" {...register('lot_number')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">IPS / centro</label>
              <input className="input" {...register('ips_or_center')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de próxima dosis (opcional)</label>
            <input type="date" className="input" {...register('next_dose_date')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas</label>
            <textarea className="input" rows={2} {...register('notes')} />
          </div>

          <button type="submit" disabled={mutation.isPending} className="btn btn--primary w-full py-3" style={{ borderRadius: '10px' }}>
            {mutation.isPending ? 'Guardando...' : vaccination ? 'Guardar cambios' : 'Registrar vacuna'}
          </button>
        </form>
      </div>
    </div>
  );
}
