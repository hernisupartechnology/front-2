import { FileBarChart } from 'lucide-react';

/**
 * Reportes — se implementa completo en la Fase 5
 * (reporte individual, del hogar, de alertas y de incapacidades; PDF/Excel).
 */
export default function Reports() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
        Reportes
      </h1>

      <div className="card p-10 flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--color-primary-100)' }}>
          <FileBarChart size={24} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">Los reportes están en construcción</h2>
        <p className="text-sm text-gray-500 max-w-md">
          Aquí podrás generar reportes en PDF o Excel del historial médico, del hogar completo,
          de alertas activas o de incapacidades (Fase 5).
        </p>
      </div>
    </div>
  );
}
