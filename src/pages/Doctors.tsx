import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Stethoscope, Phone, Mail, MapPin, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { doctorService } from '@/services/api/doctors';
import NewDoctorModal from '@/components/modals/NewDoctorModal';
import type { Doctor } from '@/types';

/**
 * Catálogo de médicos del hogar — compartido entre todos los miembros.
 */
export default function Doctors() {
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const queryClient = useQueryClient();

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorService.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => doctorService.remove(id),
    onSuccess: () => {
      toast.success('Médico desactivado del catálogo.');
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
    onError: () => toast.error('No se pudo desactivar el médico.'),
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
          Médicos
        </h1>
        <button onClick={() => setShowNew(true)} className="btn btn--primary text-sm gap-1.5 py-2 px-4">
          <Plus size={16} /> Nuevo médico
        </button>
      </div>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      )}

      {!isLoading && doctors?.length === 0 && (
        <div className="card p-10 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--color-primary-100)' }}>
            <Stethoscope size={24} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h2 className="font-semibold text-gray-700 dark:text-gray-200">Sin médicos en el catálogo</h2>
          <p className="text-sm text-gray-500 max-w-md">Agrega los médicos de tu familia para vincularlos rápidamente a citas, remisiones e incapacidades.</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {doctors?.filter((d) => d.is_active).map((doctor) => (
          <div key={doctor.id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">{doctor.name}</h3>
                <p className="text-sm" style={{ color: 'var(--color-primary)' }}>{doctor.specialty}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setEditing(doctor)} className="btn btn--ghost p-1.5 rounded-full"><Pencil size={14} /></button>
                <button
                  onClick={() => confirm(`¿Desactivar a ${doctor.name} del catálogo?`) && deleteMutation.mutate(doctor.id)}
                  className="btn btn--ghost p-1.5 rounded-full text-[var(--color-alert-red)]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-1 text-xs text-gray-500">
              <div className="flex items-center gap-1.5"><MapPin size={12} className="flex-shrink-0" />{doctor.ips}</div>
              {doctor.phone && <div className="flex items-center gap-1.5"><Phone size={12} className="flex-shrink-0" />{doctor.phone}</div>}
              {doctor.email && <div className="flex items-center gap-1.5"><Mail size={12} className="flex-shrink-0" />{doctor.email}</div>}
              {doctor.registration_number && <p className="text-gray-400">TP {doctor.registration_number}</p>}
            </div>
          </div>
        ))}
      </div>

      {showNew && <NewDoctorModal onClose={() => setShowNew(false)} />}
      {editing && <NewDoctorModal doctor={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
