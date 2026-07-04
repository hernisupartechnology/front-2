import { Calendar, MapPin, Paperclip, Repeat, Stethoscope, User as UserIcon } from 'lucide-react';
import type { Appointment } from '@/types';
import { getAppointmentTrafficLight, getStatusBadge, formatDateTime, formatDate } from '@/utils/statusHelpers';

interface AppointmentCardProps {
  appointment: Appointment;
  showPatientName?: boolean;
  onChangeStatus?: (appointment: Appointment) => void;
  onAttachDocument?: (appointment: Appointment) => void;
  onView?: (appointment: Appointment) => void;
}

const URGENCY_LABEL: Record<string, string> = {
  rutina: 'Rutina',
  prioritaria: 'Prioritaria',
  urgente: 'Urgente',
};

/**
 * Card de cita/necesidad — la barra lateral de color (semáforo) es el elemento
 * más visible, seguida del badge de estado. Nunca hardcodear colores aquí:
 * siempre vía getAppointmentTrafficLight / getStatusBadge.
 */
export default function AppointmentCard({ appointment, showPatientName, onChangeStatus, onAttachDocument, onView }: AppointmentCardProps) {
  const trafficLight = getAppointmentTrafficLight(appointment);
  const badge = getStatusBadge('appointment', appointment.status);
  const isFinal = ['realizada', 'cancelada', 'no_asistio'].includes(appointment.status);

  const daysElapsed = appointment.is_need && appointment.need_registered_date
    ? Math.floor((Date.now() - new Date(appointment.need_registered_date + 'T00:00:00').getTime()) / 86400000)
    : null;

  return (
    <div
      className={`card p-4 pl-5 animate-fade-in ${!isFinal ? '' : 'opacity-80'} ${onView ? 'cursor-pointer' : ''}`}
      onClick={() => onView?.(appointment)}
    >
      <div className={`traffic-bar traffic-bar--${trafficLight.level}`} />

      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`badge ${badge.cssClass}`}>{badge.label}</span>
          {appointment.is_recurring && (
            <span className="chip chip--purple">
              <Repeat size={11} />
              Recurrente · #{appointment.recurrence_number}
            </span>
          )}
          {!isFinal && (
            <span className="chip" style={{ background: `${trafficLight.color}1a`, color: trafficLight.color }}>
              {trafficLight.icon} {trafficLight.label}
            </span>
          )}
        </div>
        {showPatientName && appointment.patient && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <UserIcon size={12} />
            {appointment.patient.name}
          </div>
        )}
      </div>

      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        {appointment.specialty}
      </h3>

      <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="flex-shrink-0" />
          {appointment.is_need ? (
            <span style={{ color: 'var(--color-alert-purple)' }} className="font-medium">
              Sin fecha — Necesidad
              {daysElapsed !== null && ` · registrada hace ${daysElapsed} día${daysElapsed === 1 ? '' : 's'}`}
            </span>
          ) : (
            <span>{formatDateTime(appointment.appointment_date)}</span>
          )}
        </div>

        {(appointment.doctor?.name || appointment.doctor_name_free) && (
          <div className="flex items-center gap-1.5">
            <Stethoscope size={13} className="flex-shrink-0" />
            {appointment.doctor?.name ?? appointment.doctor_name_free}
          </div>
        )}

        {appointment.ips && (
          <div className="flex items-center gap-1.5">
            <MapPin size={13} className="flex-shrink-0" />
            {appointment.ips}
          </div>
        )}

        {appointment.is_need && (
          <div className="text-xs mt-1">
            Urgencia: <strong>{URGENCY_LABEL[appointment.need_urgency]}</strong>
          </div>
        )}

        {appointment.status === 'realizada' && appointment.diagnosis && (
          <div className="text-xs mt-1.5 p-2 rounded-lg bg-[var(--color-primary-100)] dark:bg-[#1a2e1b] text-gray-600 dark:text-gray-300">
            <strong>Diagnóstico:</strong> {appointment.diagnosis}
          </div>
        )}

        {appointment.status === 'cancelada' && appointment.cancelled_reason && (
          <div className="text-xs mt-1.5 text-[var(--color-alert-red)]">
            Cancelada por {appointment.cancelled_by}: {appointment.cancelled_reason}
          </div>
        )}

        {appointment.next_appointment_date && (
          <div className="text-xs mt-1 text-gray-400">
            Próxima cita sugerida: {formatDate(appointment.next_appointment_date)}
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-[rgba(27,94,32,.08)] dark:border-[rgba(165,214,167,.08)]">
        {!isFinal && onChangeStatus && (
          <button
            onClick={(e) => { e.stopPropagation(); onChangeStatus(appointment); }}
            className="btn btn--secondary text-xs py-1.5 px-3"
            style={{ minHeight: 'auto' }}
          >
            {appointment.is_need ? 'Agendar' : 'Cambiar estado'}
          </button>
        )}
        {onAttachDocument && (
          <button
            onClick={(e) => { e.stopPropagation(); onAttachDocument(appointment); }}
            className="btn btn--ghost text-xs py-1.5 px-3 gap-1 ml-auto"
            style={{ minHeight: 'auto' }}
          >
            <Paperclip size={13} /> Adjuntar documento
          </button>
        )}
      </div>
    </div>
  );
}
