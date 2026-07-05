import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { doctorService } from '@/services/api/doctors';
import type { Doctor } from '@/types';

interface NewDoctorModalProps {
  doctor?: Doctor;
  onClose: () => void;
}

const schema = z.object({
  name: z.string().min(2, 'Indica el nombre del médico'),
  specialty: z.string().min(2, 'Indica la especialidad'),
  registration_number: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  ips: z.string().min(1, 'Indica la IPS'),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewDoctorModal({ doctor, onClose }: NewDoctorModalProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: doctor ? {
      name: doctor.name, specialty: doctor.specialty, registration_number: doctor.registration_number ?? '',
      phone: doctor.phone ?? '', email: doctor.email ?? '', ips: doctor.ips, address: doctor.address ?? '', notes: doctor.notes ?? '',
    } : undefined,
  });

  const mutation = useMutation({
    mutationFn: (v: FormValues) => doctor ? doctorService.update(doctor.id, v) : doctorService.create(v),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      onClose();
    },
    onError: (error: { response?: { data?: { message?: string } } }) =>
      toast.error(error.response?.data?.message ?? 'No se pudo guardar el médico.'),
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="min-h-full flex items-center justify-center p-4">
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto glass" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[rgba(27,94,32,.08)]">
          <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
            {doctor ? 'Editar médico' : 'Nuevo médico'}
          </h2>
          <button onClick={onClose} className="btn btn--ghost p-2 rounded-full"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="p-5 space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
            <input className={`input ${errors.name ? 'input--error' : ''}`} placeholder="Ej: Dra. Camila Restrepo" {...register('name')} />
            {errors.name && <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Especialidad</label>
            <input className={`input ${errors.specialty ? 'input--error' : ''}`} {...register('specialty')} />
            {errors.specialty && <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{errors.specialty.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tarjeta profesional (opcional)</label>
            <input className="input" {...register('registration_number')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
              <input className="input" {...register('phone')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo</label>
              <input className="input" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">IPS</label>
            <input className={`input ${errors.ips ? 'input--error' : ''}`} {...register('ips')} />
            {errors.ips && <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{errors.ips.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Dirección (opcional)</label>
            <input className="input" {...register('address')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas</label>
            <textarea className="input" rows={2} {...register('notes')} />
          </div>

          <button type="submit" disabled={mutation.isPending} className="btn btn--primary w-full py-3" style={{ borderRadius: '10px' }}>
            {mutation.isPending ? 'Guardando...' : doctor ? 'Guardar cambios' : 'Agregar médico'}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
