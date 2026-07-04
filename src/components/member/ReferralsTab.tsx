import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Stethoscope, Paperclip } from 'lucide-react';
import type { Referral } from '@/types';
import { referralService } from '@/services/api/referrals';
import { getStatusBadge, formatDate } from '@/utils/statusHelpers';
import NewReferralModal from '@/components/modals/NewReferralModal';
import ChangeReferralStatusModal from '@/components/modals/ChangeReferralStatusModal';
import UploadDocumentModal from '@/components/modals/UploadDocumentModal';
import DetailModal from '@/components/modals/DetailModal';

const URGENCY_LABEL: Record<string, string> = { rutina: 'Rutina', prioritaria: 'Prioritaria', urgente: 'Urgente' };

interface ReferralsTabProps {
  patientId: number;
  patientName: string;
}

export default function ReferralsTab({ patientId, patientName }: ReferralsTabProps) {
  const [showNew, setShowNew] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Referral | null>(null);
  const [attachTarget, setAttachTarget] = useState<Referral | null>(null);
  const [viewTarget, setViewTarget] = useState<Referral | null>(null);
  const [editTarget, setEditTarget] = useState<Referral | null>(null);

  const { data: referrals, isLoading } = useQuery({
    queryKey: ['referrals', { userId: patientId }],
    queryFn: () => referralService.list({ userId: patientId }),
  });

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">Remisiones</h2>
        <button onClick={() => setShowNew(true)} className="btn btn--primary text-sm gap-1.5 py-2 px-4">
          <Plus size={16} /> Nueva remisión
        </button>
      </div>

      {isLoading && <div className="skeleton h-24 rounded-xl" />}

      {!isLoading && referrals?.length === 0 && (
        <div className="card p-10 flex flex-col items-center text-center gap-2">
          <Stethoscope className="text-gray-300" size={36} />
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Sin remisiones registradas</h3>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {referrals?.map((r) => {
          const badge = getStatusBadge('referral', r.status);
          const isFinal = ['completada', 'negada', 'vencida'].includes(r.status);
          const level = r.traffic_light?.level ?? 'grey';

          return (
            <div key={r.id} className="card p-4 pl-5 cursor-pointer" onClick={() => setViewTarget(r)}>
              <div className={`traffic-bar traffic-bar--${level}`} />
              <span className={`badge ${badge.cssClass}`}>{badge.label}</span>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-1.5">{r.specialty}</h3>
              <p className="text-sm text-gray-500">{r.reason}</p>
              {r.traffic_light && (
                <p className="text-xs mt-1" style={{ color: level === 'red' ? '#C62828' : level === 'yellow' ? '#F9A825' : '#2E7D32' }}>
                  {r.traffic_light.label}
                </p>
              )}
              {r.status === 'negada' && r.denied_reason && (
                <p className="text-xs mt-1.5 text-[var(--color-alert-red)]">Negada: {r.denied_reason}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {!isFinal && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setStatusTarget(r); }}
                    className="btn btn--secondary text-xs py-1.5 px-3"
                    style={{ minHeight: 'auto' }}
                  >
                    Cambiar estado
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setAttachTarget(r); }}
                  className="btn btn--ghost text-xs py-1.5 px-3 gap-1"
                  style={{ minHeight: 'auto' }}
                >
                  <Paperclip size={13} /> Adjuntar documento
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showNew && <NewReferralModal patientId={patientId} patientName={patientName} onClose={() => setShowNew(false)} />}
      {statusTarget && <ChangeReferralStatusModal referral={statusTarget} onClose={() => setStatusTarget(null)} />}

      {editTarget && (
        <NewReferralModal patientId={patientId} patientName={patientName} referral={editTarget} onClose={() => setEditTarget(null)} />
      )}

      {viewTarget && (
        <DetailModal
          title={viewTarget.specialty}
          subtitle={`Para ${patientName}`}
          badge={getStatusBadge('referral', viewTarget.status)}
          relatedType="referral"
          relatedId={viewTarget.id}
          onEdit={() => { setEditTarget(viewTarget); setViewTarget(null); }}
          onClose={() => setViewTarget(null)}
          fields={[
            { label: 'Urgencia', value: URGENCY_LABEL[viewTarget.urgency] },
            { label: 'Médico que remite', value: viewTarget.referring_doctor?.name },
            { label: 'Médico al que se remite', value: viewTarget.referred_doctor?.name },
            { label: 'Número de autorización', value: viewTarget.authorization_number },
            { label: 'Vence autorización', value: viewTarget.authorization_expiry_date ? formatDate(viewTarget.authorization_expiry_date) : null },
            { label: 'Motivo', value: viewTarget.reason, fullWidth: true },
            { label: 'Negada', value: viewTarget.denied_reason, fullWidth: true },
            { label: 'Notas', value: viewTarget.notes, fullWidth: true },
          ]}
        />
      )}

      {attachTarget && (
        <UploadDocumentModal
          patientId={patientId}
          patientName={patientName}
          relatedType="referral"
          relatedId={attachTarget.id}
          contextLabel={attachTarget.specialty}
          onClose={() => setAttachTarget(null)}
        />
      )}
    </div>
  );
}
