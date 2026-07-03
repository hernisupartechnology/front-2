import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import type { Referral, ReferralStatus } from '@/types';
import { referralService } from '@/services/api/referrals';

interface ChangeReferralStatusModalProps {
  referral: Referral;
  onClose: () => void;
}

interface StatusOption { target: ReferralStatus; label: string }

function nextOptions(referral: Referral): StatusOption[] {
  switch (referral.status) {
    case 'emitida':
      return [{ target: 'en_autorizacion', label: '📨 Radicar en la EPS' }];
    case 'en_autorizacion':
      return [
        { target: 'autorizada', label: '✅ Autorizada por la EPS' },
        { target: 'negada', label: '❌ Negada por la EPS' },
      ];
    case 'autorizada':
      return [{ target: 'cita_agendada', label: '📅 Cita con especialista agendada' }];
    case 'cita_agendada':
      return [{ target: 'completada', label: '🏁 Consulta realizada' }];
    default:
      return [];
  }
}

type FormValues = Record<string, string>;

export default function ChangeReferralStatusModal({ referral, onClose }: ChangeReferralStatusModalProps) {
  const options = nextOptions(referral);
  const [target, setTarget] = useState<ReferralStatus | null>(options.length === 1 ? options[0].target : null);
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm<FormValues>();

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!target) throw new Error('no target');
      return referralService.changeStatus(referral.id, { status: target, ...values });
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      onClose();
    },
    onError: (error: { response?: { data?: { message?: string } } }) =>
      toast.error(error.response?.data?.message ?? 'No se pudo actualizar el estado.'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto glass" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[rgba(27,94,32,.08)]">
          <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>Cambiar estado de la remisión</h2>
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
              {target === 'autorizada' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Número de autorización</label>
                    <input required className="input" {...register('authorization_number')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de autorización</label>
                    <input required type="date" className="input" {...register('authorization_date')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de vencimiento de la autorización</label>
                    <input required type="date" className="input" {...register('authorization_expiry_date')} />
                  </div>
                </>
              )}
              {target === 'negada' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Motivo de negación</label>
                  <textarea required className="input" rows={2} {...register('denied_reason')} />
                </div>
              )}
              {(target === 'cita_agendada' || target === 'completada') && (
                <p className="text-sm text-gray-500">
                  {target === 'cita_agendada' ? '¿Confirmas que ya agendaste la cita con el especialista?' : '¿Confirmas que la consulta ya se realizó?'}
                </p>
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
