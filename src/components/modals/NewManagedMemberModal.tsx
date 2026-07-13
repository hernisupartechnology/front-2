import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { householdService } from '@/services/api/household';
import type { User } from '@/types';

interface NewManagedMemberModalProps {
  householdId: number;
  /** Candidatos a supervisor — miembros con cuenta propia (owner/member). */
  supervisors: User[];
  /** Si se pasa, edita ese perfil gestionado en vez de crear uno nuevo. */
  member?: User;
  onClose: () => void;
}

interface FormValues {
  name: string;
  birthdate?: string;
  gender?: 'masculino' | 'femenino' | 'otro' | '';
  blood_type?: string;
  eps?: string;
  phone?: string;
  is_minor?: boolean;
  supervised_by?: string;
}

/**
 * Crea o edita un "perfil gestionado" — un familiar sin correo/contraseña
 * propios (niños, adultos mayores, cualquiera que no vaya a usar la app por
 * su cuenta). El owner administra toda su información médica.
 */
export default function NewManagedMemberModal({ householdId, supervisors, member, onClose }: NewManagedMemberModalProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: member ? {
      name: member.name,
      birthdate: member.birthdate ?? '',
      gender: member.gender ?? '',
      blood_type: member.blood_type ?? '',
      eps: member.eps ?? '',
      phone: member.phone ?? '',
      is_minor: member.is_minor,
      supervised_by: member.supervised_by ? String(member.supervised_by) : '',
    } : { is_minor: false },
  });

  const mutation = useMutation({
    mutationFn: (v: FormValues) => {
      const payload = {
        name: v.name,
        birthdate: v.birthdate || undefined,
        gender: v.gender || undefined,
        blood_type: v.blood_type || undefined,
        eps: v.eps || undefined,
        phone: v.phone || undefined,
        is_minor: v.is_minor,
        supervised_by: v.supervised_by ? Number(v.supervised_by) : null,
      };
      return member
        ? householdService.updateManagedMember(householdId, member.id, payload)
        : householdService.createManagedMember(householdId, payload);
    },
    onSuccess: (data) => {
      toast.success(member ? `${data.name} fue actualizado.` : `${data.name} fue agregado al hogar.`);
      queryClient.invalidateQueries({ queryKey: ['household'] });
      onClose();
    },
    onError: (error: { response?: { data?: { message?: string } } }) =>
      toast.error(error.response?.data?.message ?? 'No se pudo guardar el perfil.'),
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="min-h-full flex items-center justify-center p-4">
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto glass" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[rgba(27,94,32,.08)]">
          <div>
            <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
              {member ? 'Editar familiar' : 'Agregar familiar'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {member ? 'Perfil gestionado — sin cuenta propia.' : 'Sin correo ni contraseña — tú administras su información.'}
            </p>
          </div>
          <button onClick={onClose} className="btn btn--ghost p-2 rounded-full"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="p-5 space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
            <input required className="input" placeholder="Ej: Mateo Pérez" {...register('name')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha de nacimiento</label>
              <input type="date" className="input" {...register('birthdate')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Género</label>
              <select className="input" {...register('gender')}>
                <option value="">Selecciona...</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo de sangre</label>
              <select className="input" {...register('blood_type')}>
                <option value="">Selecciona...</option>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bt) => <option key={bt} value={bt}>{bt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Teléfono</label>
              <input className="input" {...register('phone')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">EPS</label>
            <input className="input" {...register('eps')} />
          </div>

          {supervisors.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Supervisado por (opcional)</label>
              <select className="input" {...register('supervised_by')}>
                <option value="">Sin supervisor asignado</option>
                {supervisors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" {...register('is_minor')} />
            Es menor de edad
          </label>

          <button type="submit" disabled={mutation.isPending} className="btn btn--primary w-full py-3" style={{ borderRadius: '10px' }}>
            {mutation.isPending ? 'Guardando...' : member ? 'Guardar cambios' : 'Agregar familiar'}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
