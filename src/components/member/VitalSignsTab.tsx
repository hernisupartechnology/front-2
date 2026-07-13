import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, HeartPulse } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { vitalSignService } from '@/services/api/vitalSigns';
import { formatDate, formatDateTime } from '@/utils/statusHelpers';
import NewVitalSignModal from '@/components/modals/NewVitalSignModal';

const OUT_OF_RANGE_LABEL: Record<string, string> = {
  systolic_pressure: 'Presión sistólica',
  diastolic_pressure: 'Presión diastólica',
  blood_glucose: 'Glucosa',
  oxygen_saturation: 'Saturación O2',
};

export default function VitalSignsTab({ patientId, patientName }: { patientId: number; patientName: string }) {
  const [showNew, setShowNew] = useState(false);

  const { data: vitalSigns, isLoading } = useQuery({
    queryKey: ['vital-signs', { userId: patientId }],
    queryFn: () => vitalSignService.list({ userId: patientId }),
  });

  // Gráficos aparte del historial completo de arriba: un paciente crónico
  // puede tener años de mediciones, y el gráfico solo necesita las últimas
  // 12 — pedirlas directamente al backend evita traer todo el historial (que
  // ya se trae igual para la lista de abajo) solo para descartar casi todo
  // en el navegador.
  const { data: recentForChart } = useQuery({
    queryKey: ['vital-signs', 'chart', { userId: patientId }],
    queryFn: () => vitalSignService.list({ userId: patientId, limit: 12 }),
  });

  const last12 = useMemo(() => {
    return [...(recentForChart ?? [])]
      .sort((a, b) => new Date(a.measurement_date).getTime() - new Date(b.measurement_date).getTime())
      .map((v) => ({
        date: formatDate(v.measurement_date.split('T')[0] ?? v.measurement_date),
        systolic_pressure: v.systolic_pressure,
        diastolic_pressure: v.diastolic_pressure,
        blood_glucose: v.blood_glucose,
        weight: v.weight,
        oxygen_saturation: v.oxygen_saturation,
      }));
  }, [vitalSigns]);

  const latest = vitalSigns?.[0];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">Signos vitales</h2>
        <button onClick={() => setShowNew(true)} className="btn btn--primary text-sm gap-1.5 py-2 px-4">
          <Plus size={16} /> Registrar
        </button>
      </div>

      {isLoading && <div className="skeleton h-24 rounded-xl" />}

      {!isLoading && vitalSigns?.length === 0 && (
        <div className="card p-10 flex flex-col items-center text-center gap-2">
          <HeartPulse className="text-gray-300" size={36} />
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Sin registros de signos vitales</h3>
        </div>
      )}

      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <VitalCard label="Presión" value={latest.systolic_pressure && latest.diastolic_pressure ? `${latest.systolic_pressure}/${latest.diastolic_pressure}` : '—'} alert={latest.out_of_range?.includes('systolic_pressure') || latest.out_of_range?.includes('diastolic_pressure')} />
          <VitalCard label="Glucosa" value={latest.blood_glucose ? `${latest.blood_glucose} mg/dL` : '—'} alert={latest.out_of_range?.includes('blood_glucose')} />
          <VitalCard label="Peso" value={latest.weight ? `${latest.weight} kg` : '—'} />
          <VitalCard label="Saturación O2" value={latest.oxygen_saturation ? `${latest.oxygen_saturation}%` : '—'} alert={latest.out_of_range?.includes('oxygen_saturation')} />
        </div>
      )}

      {last12.length > 1 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Presión arterial (últimas 12 mediciones)">
            <LineChart data={last12}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="systolic_pressure" name="Sistólica" stroke="#C62828" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="diastolic_pressure" name="Diastólica" stroke="#1565C0" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ChartCard>

          <ChartCard title="Glucosa (mg/dL)">
            <LineChart data={last12}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="blood_glucose" name="Glucosa" stroke="#F9A825" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ChartCard>

          <ChartCard title="Peso (kg)">
            <LineChart data={last12}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" name="Peso" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ChartCard>

          <ChartCard title="Saturación de oxígeno (%)">
            <LineChart data={last12}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[80, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="oxygen_saturation" name="O2" stroke="#6A1B9A" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ChartCard>
        </div>
      )}

      <div className="space-y-2">
        {vitalSigns?.map((v) => (
          <div key={v.id} className="card p-3 pl-4 flex items-center justify-between flex-wrap gap-2">
            <div className={`traffic-bar traffic-bar--${(v.out_of_range?.length ?? 0) > 0 ? 'red' : 'grey'}`} />
            <span className="text-sm text-gray-500">{formatDateTime(v.measurement_date)}</span>
            <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-300">
              {v.systolic_pressure && <span>PA: {v.systolic_pressure}/{v.diastolic_pressure}</span>}
              {v.blood_glucose && <span>Glucosa: {v.blood_glucose}</span>}
              {v.weight && <span>Peso: {v.weight}kg</span>}
              {v.oxygen_saturation && <span>O2: {v.oxygen_saturation}%</span>}
            </div>
            {v.out_of_range && v.out_of_range.length > 0 && (
              <span className="chip chip--red">
                ⚠️ {v.out_of_range.map((f) => OUT_OF_RANGE_LABEL[f] ?? f).join(', ')}
              </span>
            )}
          </div>
        ))}
      </div>

      {showNew && <NewVitalSignModal patientId={patientId} patientName={patientName} onClose={() => setShowNew(false)} />}
    </div>
  );
}

function VitalCard({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="card p-4" style={alert ? { outline: '2px solid var(--color-alert-red)' } : undefined}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-bold text-lg" style={{ color: alert ? 'var(--color-alert-red)' : undefined }}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">{title}</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
