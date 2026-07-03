/**
 * statusHelpers.ts — Helpers centralizados del semáforo y badges de estado.
 *
 * REGLA: Todos los componentes deben usar estas funciones.
 * NUNCA hardcodear colores inline en los componentes.
 */

import type {
  Appointment,
  TrafficLightResult,
  AppointmentStatus,
  MedicationStatus,
  ExamStatus,
  ReferralStatus,
  Medication,
  Referral,
} from '@/types';

// ──────────────────────────────────────────────────────────────────────────────
// SEMÁFORO DE CITAS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Calcula el nivel del semáforo para una cita médica o necesidad.
 * Esta función es el corazón del sistema de alertas del frontend.
 */
export function getAppointmentTrafficLight(appointment: Appointment): TrafficLightResult {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Estados finales → gris, sin acción requerida
  const finalStatuses: AppointmentStatus[] = ['realizada', 'cancelada', 'no_asistio'];
  if (finalStatuses.includes(appointment.status)) {
    return { level: 'grey', label: 'Sin acción', icon: '⚫', color: '#9E9E9E' };
  }

  // ── Manejo de NECESIDADES (is_need = true) ──────────────────────────────
  if (appointment.is_need) {
    const urgency = appointment.need_urgency;
    const registeredDate = appointment.need_registered_date
      ? new Date(appointment.need_registered_date)
      : today;
    const daysElapsed = Math.floor((today.getTime() - registeredDate.getTime()) / 86400000);

    // Necesidad urgente → siempre rojo
    if (urgency === 'urgente') {
      return { level: 'red', label: 'Urgente — agendar hoy', icon: '🔴', color: '#C62828' };
    }

    // Superó el plazo máximo → rojo
    if (daysElapsed >= appointment.max_days_to_schedule) {
      return { level: 'red', label: 'Plazo vencido', icon: '🔴', color: '#C62828' };
    }

    // Está en la zona de alerta amarilla
    const alertThreshold = appointment.max_days_to_schedule - appointment.alert_days_before_scheduling;
    if (daysElapsed >= alertThreshold || urgency === 'prioritaria') {
      return { level: 'yellow', label: 'Agendar pronto', icon: '🟡', color: '#F9A825' };
    }

    // Dentro del plazo → verde
    return { level: 'green', label: 'Pendiente de agendar', icon: '🟢', color: '#2E7D32' };
  }

  // ── CITAS PROGRAMADAS Y CONFIRMADAS ────────────────────────────────────
  if (!appointment.appointment_date) {
    return { level: 'grey', label: 'Sin fecha', icon: '⚪', color: '#9E9E9E' };
  }

  const appointmentDate = new Date(appointment.appointment_date);
  const appointmentDay = new Date(
    appointmentDate.getFullYear(),
    appointmentDate.getMonth(),
    appointmentDate.getDate()
  );
  const diffDays = Math.floor((appointmentDay.getTime() - today.getTime()) / 86400000);

  // Cita reprogramada sin fecha hace más de 10 días → amarillo
  if (appointment.status === 'reprogramada') {
    return { level: 'yellow', label: 'Reprogramada — sin nueva fecha', icon: '🟡', color: '#F9A825' };
  }

  // Cita vencida (fecha pasó sin actualizar) → rojo
  if (diffDays < 0) {
    return { level: 'red', label: 'Fecha vencida', icon: '🔴', color: '#C62828' };
  }

  // Cita mañana o hoy → rojo
  if (diffDays <= 1) {
    return { level: 'red', label: diffDays === 0 ? '¡Hoy!' : '¡Mañana!', icon: '🔴', color: '#C62828' };
  }

  // Cita en 2-5 días → amarillo
  if (diffDays <= 5) {
    return { level: 'yellow', label: `En ${diffDays} días`, icon: '🟡', color: '#F9A825' };
  }

  // Cita con más de 5 días → verde
  return {
    level: 'green',
    label: `En ${diffDays} días`,
    icon: '🟢',
    color: '#2E7D32',
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// SEMÁFORO DE MEDICAMENTOS (renovación)
// ──────────────────────────────────────────────────────────────────────────────

export function getMedicationRenewalTrafficLight(medication: Medication): TrafficLightResult | null {
  if (!medication.is_recurring || !medication.end_date) return null;

  const daysLeft = medication.days_until_expiration ?? 0;

  if (daysLeft < 0) {
    return { level: 'red', label: 'Medicamento vencido', icon: '🔴', color: '#C62828' };
  }
  if (daysLeft <= 3) {
    return { level: 'red', label: `Vence en ${daysLeft} días`, icon: '🔴', color: '#C62828' };
  }
  if (daysLeft <= (medication.alert_days_before ?? 10)) {
    return { level: 'yellow', label: `Vence en ${daysLeft} días`, icon: '🟡', color: '#F9A825' };
  }
  return { level: 'green', label: `${daysLeft} días restantes`, icon: '🟢', color: '#2E7D32' };
}

// ──────────────────────────────────────────────────────────────────────────────
// SEMÁFORO DE REMISIONES
// ──────────────────────────────────────────────────────────────────────────────

export function getReferralTrafficLight(referral: Referral): TrafficLightResult | null {
  if (referral.status !== 'autorizada' || !referral.authorization_expiry_date) return null;

  const daysLeft = referral.days_until_expiration ?? 0;

  if (daysLeft < 0) {
    return { level: 'grey', label: 'Autorización vencida', icon: '⚫', color: '#9E9E9E' };
  }
  if (daysLeft <= 5) {
    return { level: 'red', label: `Vence en ${daysLeft} días`, icon: '🔴', color: '#C62828' };
  }
  if (daysLeft <= 15) {
    return { level: 'yellow', label: `Vence en ${daysLeft} días`, icon: '🟡', color: '#F9A825' };
  }
  return { level: 'green', label: `${daysLeft} días restantes`, icon: '🟢', color: '#2E7D32' };
}

// ──────────────────────────────────────────────────────────────────────────────
// BADGES DE ESTADO — getStatusBadge(tipo, estado)
// ──────────────────────────────────────────────────────────────────────────────

interface StatusBadge {
  label: string;
  cssClass: string; // clase CSS de .badge--{estado}
  color: string;
}

const APPOINTMENT_BADGES: Record<AppointmentStatus, StatusBadge> = {
  necesidad:    { label: 'Necesidad',    cssClass: 'badge--necesidad',    color: '#6A1B9A' },
  programada:   { label: 'Programada',   cssClass: 'badge--programada',   color: '#1565C0' },
  confirmada:   { label: 'Confirmada',   cssClass: 'badge--confirmada',   color: '#2E7D32' },
  realizada:    { label: 'Realizada',    cssClass: 'badge--realizada',    color: '#FFFFFF' },
  cancelada:    { label: 'Cancelada',    cssClass: 'badge--cancelada',    color: '#C62828' },
  reprogramada: { label: 'Reprogramada', cssClass: 'badge--reprogramada', color: '#E65100' },
  no_asistio:   { label: 'No asistió',   cssClass: 'badge--no_asistio',   color: '#616161' },
};

const MEDICATION_BADGES: Record<MedicationStatus, StatusBadge> = {
  sin_orden:      { label: 'Sin orden',      cssClass: 'badge--sin_orden',      color: '#616161' },
  con_orden:      { label: 'Con orden',      cssClass: 'badge--con_orden',      color: '#1565C0' },
  en_autorizacion:{ label: 'En autorización',cssClass: 'badge--en_autorizacion',color: '#F57F17' },
  autorizado:     { label: 'Autorizado',     cssClass: 'badge--autorizado',     color: '#2E7D32' },
  negado:         { label: 'Negado',         cssClass: 'badge--negado',         color: '#C62828' },
  reclamado:      { label: 'Reclamado',      cssClass: 'badge--reclamado',      color: '#388E3C' },
  en_uso:         { label: 'En uso',         cssClass: 'badge--en_uso',         color: '#FFFFFF' },
  completado:     { label: 'Completado',     cssClass: 'badge--completado',     color: '#455A64' },
  vencido:        { label: 'Vencido',        cssClass: 'badge--vencido',        color: '#E65100' },
  suspendido:     { label: 'Suspendido',     cssClass: 'badge--suspendido',     color: '#6A1B9A' },
};

const EXAM_BADGES: Record<ExamStatus, StatusBadge> = {
  sin_orden:           { label: 'Sin orden',          cssClass: 'badge--sin_orden',       color: '#616161' },
  con_orden:           { label: 'Con orden',          cssClass: 'badge--con_orden',       color: '#1565C0' },
  en_autorizacion:     { label: 'En autorización',    cssClass: 'badge--en_autorizacion', color: '#F57F17' },
  autorizado:          { label: 'Autorizado',         cssClass: 'badge--autorizado',      color: '#2E7D32' },
  negado:              { label: 'Negado',             cssClass: 'badge--negado',          color: '#C62828' },
  agendado:            { label: 'Agendado',           cssClass: 'badge--programada',      color: '#1565C0' },
  muestra_tomada:      { label: 'Muestra tomada',     cssClass: 'badge--confirmada',      color: '#2E7D32' },
  resultado_pendiente: { label: 'Resultado pendiente',cssClass: 'badge--en_autorizacion', color: '#F57F17' },
  resultado_disponible:{ label: 'Resultado disponible',cssClass: 'badge--reclamado',      color: '#388E3C' },
  entregado_medico:    { label: 'Entregado al médico',cssClass: 'badge--completado',      color: '#455A64' },
  cancelado:           { label: 'Cancelado',          cssClass: 'badge--cancelada',       color: '#C62828' },
};

const REFERRAL_BADGES: Record<ReferralStatus, StatusBadge> = {
  emitida:        { label: 'Emitida',       cssClass: 'badge--programada',    color: '#1565C0' },
  en_autorizacion:{ label: 'En autorización',cssClass: 'badge--en_autorizacion', color: '#F57F17' },
  autorizada:     { label: 'Autorizada',    cssClass: 'badge--confirmada',    color: '#2E7D32' },
  negada:         { label: 'Negada',        cssClass: 'badge--cancelada',     color: '#C62828' },
  cita_agendada:  { label: 'Cita agendada', cssClass: 'badge--programada',    color: '#1565C0' },
  completada:     { label: 'Completada',    cssClass: 'badge--realizada',     color: '#FFFFFF' },
  vencida:        { label: 'Vencida',       cssClass: 'badge--vencido',       color: '#E65100' },
};

export function getStatusBadge(
  type: 'appointment' | 'medication' | 'exam' | 'referral',
  status: string
): StatusBadge {
  const maps = {
    appointment: APPOINTMENT_BADGES,
    medication:  MEDICATION_BADGES,
    exam:        EXAM_BADGES,
    referral:    REFERRAL_BADGES,
  };

  const map = maps[type] as Record<string, StatusBadge>;
  return map[status] ?? { label: status, cssClass: 'badge--sin_orden', color: '#616161' };
}

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS ADICIONALES
// ──────────────────────────────────────────────────────────────────────────────

/** Formatea una fecha en español colombiano (ej: "3 de julio de 2026"). */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Formatea fecha y hora (ej: "3 de julio de 2026, 10:00 a.m."). */
export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Formatea solo la hora (ej: "7:00 a.m."). */
export function formatTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
}

/** Calcula la edad en años a partir de una fecha de nacimiento. */
export function calcularEdad(birthdate: string | null): number | null {
  if (!birthdate) return null;
  const hoy = new Date();
  const nacimiento = new Date(birthdate);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

/** Convierte bytes a formato legible (KB, MB). */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
