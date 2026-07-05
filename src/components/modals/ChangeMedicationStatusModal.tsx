import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import type { Medication, MedicationStatus } from '@/types';
import { medicationService } from '@/services/api/medications';

interface ChangeMedicationStatusModalProps {
  medication: Medication;
  onClose: () => void;
}

interface StatusOption {
  target: MedicationStatus;
  label: string;
}

function nextOptions(medication: Medication): StatusOption[] {
  switch (medication.status) {
    case 'sin_orden':
      return [{ target: 'con_orden', label: '📝 Ya tengo la orden médica' }];
    case 'con_orden':
      return [{ target: 'en_autorizacion', label: '📨 Radicar en la EPS' }];
    case 'en_autorizacion':
      return [
        { target: 'autorizado', label: '✅ Autorizado por la EPS' },
        { target: 'negado', label: '❌ Negado por la EPS' },
      ];
    case 'autorizado':
      return [{ target: 'reclamado', label: '💊 Reclamado en farmacia' }];
    case 'reclamado':
      return [{ target: 'en_uso', label: '▶️ Iniciar tratamiento' }];
    case 'en_uso':
      return [{ target: 'completado', label: '🏁 Finalizar tratamiento' }];
    default:
      return [];
  }
}

const ALWAYS_AVAILABLE: StatusOption = { target: 'suspendido', label: '⏸️ Suspender medicamento' };

type FormValues = {
  authorization_number?: string;
  authorization_date?: string;
  denied_reason?: string;
  claimed_date?: string;
  start_date?: string;
  notes?: string;
};

export default function ChangeMedicationStatusModal({ medication, onClose }: ChangeMedicationStatusModalProps) {
  const canSuspend = !['completado', 'suspendido', 'vencido'].includes(medication.status);
  const options = [...nextOptions(medication), ...(canSuspend ? [ALWAYS_AVAILABLE] : [])];
  const [target, setTarget] = useState<MedicationStatus | null>(null);
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm<FormValues>();

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!target) throw new Error('no target');
      return medicationService.changeStatus(medication.id, { status: target, ...values });
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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
          <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
            Cambiar estado del medicamento
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
              {options.length === 0 && <p className="text-sm text-gray-500">Este medicamento no tiene transiciones disponibles.</p>}
            </div>
          ) : (
            <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
              {target === 'autorizado' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Número de autorización</label>
                    <input required className="input" {...register('authorization_number')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de autorización</label>
                    <input type="date" required className="input" {...register('authorization_date')} />
                  </div>
                </>
              )}

              {target === 'negado' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Motivo de negación</label>
                  <textarea required className="input" rows={2} {...register('denied_reason')} />
                </div>
              )}

              {target === 'reclamado' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de reclamo en farmacia</label>
                  <input type="date" required className="input" {...register('claimed_date')} />
                </div>
              )}

              {target === 'en_uso' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de inicio del tratamiento</label>
                  <input type="date" required className="input" {...register('start_date')} />
                </div>
              )}

              {target === 'suspendido' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Motivo de suspensión y quién la ordenó</label>
                  <textarea required className="input" rows={2} placeholder="Ej: Suspendido por el médico por efectos secundarios" {...register('notes')} />
                </div>
              )}

              {target === 'con_orden' && (
                <p className="text-sm text-gray-500">¿Confirmas que ya tienes la orden médica en mano?</p>
              )}
              {target === 'completado' && (
                <p className="text-sm text-gray-500">¿Confirmas que el tratamiento ha finalizado?</p>
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
    </div>
  );
}
