import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, ChevronDown, ChevronRight, Paperclip, RefreshCw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Medication } from '@/types';
import { getMedicationRenewalTrafficLight, getStatusBadge, formatDate } from '@/utils/statusHelpers';
import { medicationService } from '@/services/api/medications';

interface MedicationCardProps {
  medication: Medication;
  onChangeStatus?: (medication: Medication) => void;
  onAttachDocument?: (medication: Medication) => void;
  onShowAdherence?: (medication: Medication) => void;
  onView?: (medication: Medication) => void;
}

export default function MedicationCard({ medication, onChangeStatus, onAttachDocument, onShowAdherence, onView }: MedicationCardProps) {
  const [showRenewals, setShowRenewals] = useState(false);
  const badge = getStatusBadge('medication', medication.status);
  const renewalTl = getMedicationRenewalTrafficLight(medication);
  const isFinal = ['completado', 'suspendido'].includes(medication.status);
  const queryClient = useQueryClient();

  const { data: renewals } = useQuery({
    queryKey: ['medications', medication.id, 'renewals'],
    queryFn: () => medicationService.renewals(medication.id),
    enabled: showRenewals,
  });

  const renewMutation = useMutation({
    mutationFn: () => medicationService.renew(medication.id),
    onSuccess: () => {
      toast.success('Renovación iniciada correctamente.');
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['medications', medication.id, 'renewals'] });
    },
    onError: () => toast.error('No se pudo iniciar la renovación.'),
  });

  return (
    <div className={`card p-4 pl-5 animate-fade-in ${onView ? 'cursor-pointer' : ''}`} onClick={() => onView?.(medication)}>
      <div className={`traffic-bar traffic-bar--${renewalTl?.level ?? 'grey'}`} />

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`badge ${badge.cssClass}`}>{badge.label}</span>
        {medication.is_recurring && (
          <span className="chip chip--purple">
            <RefreshCw size={11} /> Recurrente
          </span>
        )}
      </div>

      <h3 className="font-semibold text-gray-800 dark:text-gray-100" style={{ fontFamily: 'var(--font-display)' }}>
        {medication.name} {medication.presentation && <span className="text-sm font-normal text-gray-400">· {medication.presentation}</span>}
      </h3>
      <p className="text-sm text-gray-500">{medication.dosage} — {medication.frequency}</p>

      {medication.is_recurring && renewalTl && (
        <div className="mt-2">
          <div className="h-1.5 rounded-full bg-[var(--color-primary-100)] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(4, Math.min(100, ((medication.days_until_expiration ?? 0) / (medication.alert_days_before * 2)) * 100))}%`,
                background: renewalTl.color,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{renewalTl.icon} {renewalTl.label}</p>
        </div>
      )}

      {medication.track_intake && medication.remaining_doses !== null && (
        <p className="text-xs text-gray-500 mt-2">
          💊 Quedan aproximadamente <strong>{medication.remaining_doses}</strong> dosis
          {medication.remaining_doses <= medication.low_stock_alert_doses && (
            <span style={{ color: 'var(--color-alert-yellow)' }}> — considera solicitar la renovación</span>
          )}
        </p>
      )}

      {medication.status === 'negado' && medication.denied_reason && (
        <p className="text-xs mt-1.5 text-[var(--color-alert-red)]">Negado: {medication.denied_reason}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[rgba(27,94,32,.08)] dark:border-[rgba(165,214,167,.08)]">
        {!isFinal && onChangeStatus && (
          <button
            onClick={(e) => { e.stopPropagation(); onChangeStatus(medication); }}
            className="btn btn--secondary text-xs py-1.5 px-3"
            style={{ minHeight: 'auto' }}
          >
            Cambiar estado
          </button>
        )}
        {medication.is_recurring && renewalTl && ['red', 'yellow'].includes(renewalTl.level) && (
          <button
            onClick={(e) => { e.stopPropagation(); renewMutation.mutate(); }}
            disabled={renewMutation.isPending}
            className="btn text-xs py-1.5 px-3"
            style={{ minHeight: 'auto', background: 'var(--color-alert-yellow)', color: '#4a3200' }}
          >
            Iniciar renovación
          </button>
        )}
        {onAttachDocument && (
          <button
            onClick={(e) => { e.stopPropagation(); onAttachDocument(medication); }}
            className="btn btn--ghost text-xs py-1.5 px-3 gap-1"
            style={{ minHeight: 'auto' }}
          >
            <Paperclip size={13} /> Adjuntar documento
          </button>
        )}
        {medication.track_intake && onShowAdherence && (
          <button
            onClick={(e) => { e.stopPropagation(); onShowAdherence(medication); }}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <CalendarCheck size={13} /> Calendario de tomas
          </button>
        )}
        {(medication.renewals?.length ?? 0) > 0 || medication.is_recurring ? (
          <button
            onClick={(e) => { e.stopPropagation(); setShowRenewals(!showRenewals); }}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 ml-auto"
          >
            {showRenewals ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            Historial de renovaciones
          </button>
        ) : null}
      </div>

      {showRenewals && (
        <div className="mt-2 pt-2 border-t border-[rgba(27,94,32,.06)]" onClick={(e) => e.stopPropagation()}>
          {!renewals || renewals.length === 0 ? (
            <p className="text-xs text-gray-400 py-1">Sin renovaciones registradas.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 text-left">
                  <th className="font-normal pb-1">#</th>
                  <th className="font-normal pb-1">Período</th>
                  <th className="font-normal pb-1">Estado</th>
                </tr>
              </thead>
              <tbody>
                {renewals.map((r) => (
                  <tr key={r.id} className="text-gray-600 dark:text-gray-300">
                    <td className="py-0.5">{r.renewal_number}</td>
                    <td className="py-0.5">{formatDate(r.period_start)} – {formatDate(r.period_end)}</td>
                    <td className="py-0.5 capitalize">{r.status.replace('_', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
