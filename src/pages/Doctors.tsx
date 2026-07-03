import { Stethoscope } from 'lucide-react';

/**
 * Catálogo de médicos del hogar — se implementa completo en la Fase 4
 * (CRUD de médicos, historial de citas por médico).
 */
export default function Doctors() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
        Médicos
      </h1>

      <div className="card p-10 flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--color-primary-100)' }}>
          <Stethoscope size={24} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">El catálogo de médicos está en construcción</h2>
        <p className="text-sm text-gray-500 max-w-md">
          Aquí podrás gestionar los médicos del hogar: nombre, especialidad, IPS, teléfono y su historial de citas (Fase 4).
        </p>
      </div>
    </div>
  );
}
