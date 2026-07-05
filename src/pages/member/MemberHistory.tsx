import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileBarChart } from 'lucide-react';
import { householdService } from '@/services/api/household';
import { useAuthStore } from '@/store/authStore';
import { calcularEdad } from '@/utils/statusHelpers';
import AppointmentsTab from '@/components/member/AppointmentsTab';
import MedicationsTab from '@/components/member/MedicationsTab';
import ExamsTab from '@/components/member/ExamsTab';
import ReferralsTab from '@/components/member/ReferralsTab';
import MedicalLeavesTab from '@/components/member/MedicalLeavesTab';
import VaccinationsTab from '@/components/member/VaccinationsTab';
import VitalSignsTab from '@/components/member/VitalSignsTab';
import DocumentsTab from '@/components/member/DocumentsTab';
import SummaryTab from '@/components/member/SummaryTab';

const TABS = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'citas', label: 'Citas' },
  { key: 'medicamentos', label: 'Medicamentos' },
  { key: 'examenes', label: 'Exámenes' },
  { key: 'remisiones', label: 'Remisiones' },
  { key: 'incapacidades', label: 'Incapacidades' },
  { key: 'vacunas', label: 'Vacunas' },
  { key: 'signos', label: 'Signos Vitales' },
  { key: 'documentos', label: 'Documentos' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

/** Historial médico completo del miembro, organizado por pestañas. */
export default function MemberHistory() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [tab, setTab] = useState<TabKey>('resumen');

  const { data: household, isLoading } = useQuery({
    queryKey: ['household', 'current'],
    queryFn: householdService.current,
  });

  const member = household?.members?.find((m) => m.id === Number(userId));
  const isSelf = currentUser?.id === Number(userId);
  const age = member?.birthdate ? calcularEdad(member.birthdate) : null;

  if (isLoading) {
    return <div className="skeleton h-40 rounded-2xl animate-fade-in" />;
  }

  if (!member) {
    return (
      <div className="card p-10 text-center animate-fade-in">
        <p className="text-gray-500">No encontramos este miembro del hogar.</p>
        <button onClick={() => navigate('/dashboard')} className="btn btn--secondary mt-4">Volver al dashboard</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={14} />
        Volver al dashboard
      </button>

      {/* Header del miembro */}
      <div className="card p-5 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
              style={{ background: 'var(--color-primary)' }}
            >
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
                {member.name} {isSelf && <span className="text-sm font-normal text-gray-400">(tú)</span>}
              </h1>
              <p className="text-sm text-gray-500">
                {age !== null ? `${age} años` : 'Edad no registrada'}
                {member.blood_type && ` · Tipo de sangre ${member.blood_type}`}
                {member.eps && ` · ${member.eps}`}
              </p>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {member.chronic_conditions?.filter((c) => c.is_active).map((c) => (
                  <span key={c.id} className="chip chip--blue">{c.name}</span>
                ))}
                {member.allergies?.filter((a) => a.is_active).map((a) => (
                  <span key={a.id} className="chip chip--red" title={a.reaction ?? undefined}>⚠️ {a.name}</span>
                ))}
              </div>
            </div>
          </div>

          <button className="btn btn--secondary text-sm gap-1.5">
            <FileBarChart size={15} />
            Generar reporte
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
            style={tab === t.key
              ? { background: 'var(--color-primary)', color: 'white' }
              : { color: '#546E7A' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'resumen' && <SummaryTab patientId={member.id} onNavigateTab={(t) => setTab(t as TabKey)} />}
      {tab === 'citas' && <AppointmentsTab patientId={member.id} patientName={member.name} />}
      {tab === 'medicamentos' && <MedicationsTab patientId={member.id} patientName={member.name} />}
      {tab === 'examenes' && <ExamsTab patientId={member.id} patientName={member.name} />}
      {tab === 'remisiones' && <ReferralsTab patientId={member.id} patientName={member.name} />}
      {tab === 'incapacidades' && <MedicalLeavesTab patientId={member.id} patientName={member.name} />}
      {tab === 'vacunas' && <VaccinationsTab patientId={member.id} patientName={member.name} />}
      {tab === 'signos' && <VitalSignsTab patientId={member.id} patientName={member.name} />}
      {tab === 'documentos' && <DocumentsTab patientId={member.id} patientName={member.name} />}
    </div>
  );
}
