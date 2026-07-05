import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { referralService } from '@/services/api/referrals';
import { toDateInputValue } from '@/utils/statusHelpers';
import type { Referral } from '@/types';

interface NewReferralModalProps {
  patientId: number;
  patientName: string;
  referral?: Referral;
  onClose: () => void;
}

const schema = z.object({
  specialty: z.string().min(2, 'Indica la especialidad'),
  reason: z.string().min(3, 'Indica el motivo de la remisión'),
  urgency: z.enum(['rutina', 'prioritaria', 'urgente']),
  authorization_expiry_date: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewReferralModal({ patientId, patientName, referral, onClose }: NewReferralModalProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: referral ? {
      specialty: referral.specialty,
      reason: referral.reason,
      urgency: referral.urgency,
      authorization_expiry_date: toDateInputValue(referral.authorization_expiry_date),
      notes: referral.notes ?? '',
    } : { urgency: 'rutina' },
  });

  const mutation = useMutation({
    mutationFn: (v: FormValues) => (referral ? referralService.update(referral.id, v) : referralService.create({ ...v, user_id: patientId })),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      onClose();
    },
    onError: (error: { response?: { data?: { message?: string } } }) =>
      toast.error(error.response?.data?.message ?? 'No se pudo registrar la remisión.'),
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="min-h-full flex items-center justify-center p-4">
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto glass" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[rgba(27,94,32,.08)]">
          <div>
            <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
              {referral ? 'Editar remisión' : 'Nueva remisión'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Para {patientName}</p>
          </div>
          <button onClick={onClose} className="btn btn--ghost p-2 rounded-full"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="p-5 space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Especialidad</label>
            <input className={`input ${errors.specialty ? 'input--error' : ''}`} placeholder="Ej: Cardiología" {...register('specialty')} />
            {errors.specialty && <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{errors.specialty.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Motivo de la remisión</label>
            <textarea className={`input ${errors.reason ? 'input--error' : ''}`} rows={2} {...register('reason')} />
            {errors.reason && <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{errors.reason.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Urgencia</label>
            <select className="input" {...register('urgency')}>
              <option value="rutina">Rutina</option>
              <option value="prioritaria">Prioritaria</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          {!referral && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Vencimiento de autorización (si ya la tienen)</label>
              <input type="date" className="input" {...register('authorization_expiry_date')} />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas</label>
            <textarea className="input" rows={2} {...register('notes')} />
          </div>

          <button type="submit" disabled={mutation.isPending} className="btn btn--primary w-full py-3" style={{ borderRadius: '10px' }}>
            {mutation.isPending ? 'Guardando...' : referral ? 'Guardar cambios' : 'Registrar remisión'}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
