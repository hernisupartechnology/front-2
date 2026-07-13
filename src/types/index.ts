// ============================================================
// UparVital — Definiciones de tipos TypeScript
// Basado en el schema completo de la base de datos
// ============================================================

export type UserRole = 'owner' | 'member' | 'viewer';

export interface User {
  id: number;
  name: string;
  /** null en perfiles gestionados (is_managed) — no tienen cuenta propia. */
  email: string | null;
  avatar: string | null;
  role: UserRole;
  household_id: number | null;
  phone: string | null;
  birthdate: string | null; // ISO date
  gender: 'masculino' | 'femenino' | 'otro' | null;
  blood_type: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-' | null;
  eps: string | null;
  ips_preferida: string | null;
  numero_afiliado: string | null;
  is_minor: boolean;
  /** Perfil creado directamente por el owner, sin login propio (niños, adultos mayores, etc.). */
  is_managed: boolean;
  supervised_by: number | null;
  track_vital_signs: boolean;
  dark_mode: boolean;
  household?: Partial<Household>;
  allergies?: Allergy[];
  chronic_conditions?: ChronicCondition[];
  vital_sign_range?: VitalSignRange | null;
  created_at: string;
}

export interface Household {
  id: number;
  name: string;
  owner_id: number;
  avatar: string | null;
  members?: User[];
}

export interface HouseholdInvitation {
  id: number;
  household_id: number;
  email: string | null;
  token: string;
  role_assigned: 'member' | 'viewer';
  status: 'pending' | 'accepted' | 'expired';
  invited_by: number;
  expires_at: string;
  created_at: string;
}

// ── Citas ──────────────────────────────────────────────────────
export type AppointmentStatus =
  | 'necesidad' | 'programada' | 'confirmada' | 'realizada'
  | 'cancelada' | 'reprogramada' | 'no_asistio';

export type AppointmentType =
  | 'consulta' | 'control' | 'urgencias' | 'domiciliaria' | 'telemedicina';

export type NeedUrgency = 'rutina' | 'prioritaria' | 'urgente';

export type RecurrenceType =
  | 'semanal' | 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';

export type TrafficLight = 'red' | 'yellow' | 'green' | 'grey' | 'blue';

export interface TrafficLightResult {
  level: TrafficLight;
  label: string;
  icon: string;
  color: string;
}

export interface Appointment {
  id: number;
  household_id: number;
  user_id: number;
  registered_by: number;
  doctor_id: number | null;
  doctor_name_free: string | null;
  specialty: string;
  appointment_type: AppointmentType;
  ips: string | null;
  address: string | null;

  is_need: boolean;
  need_reason: string | null;
  need_urgency: NeedUrgency;
  need_registered_date: string | null;
  max_days_to_schedule: number;
  alert_days_before_scheduling: number;

  appointment_date: string | null; // ISO datetime
  reason: string | null;
  diagnosis: string | null;
  notes: string | null;
  status: AppointmentStatus;
  cancelled_reason: string | null;
  cancelled_by: 'paciente' | 'ips' | 'eps' | null;

  next_appointment_date: string | null;
  next_appointment_notes: string | null;
  next_appointment_specialty: string | null;

  is_recurring: boolean;
  recurrence_type: RecurrenceType | null;
  recurrence_interval_days: number | null;
  alert_days_before_appointment: number;
  parent_appointment_id: number | null;
  recurrence_number: number;
  next_recurrence_generated: boolean;

  traffic_light: { level: TrafficLight; label: string };

  doctor?: Doctor;
  patient?: Pick<User, 'id' | 'name' | 'avatar'>;
  medications?: Medication[];
  exams?: Exam[];
  documents?: MedicalDocument[];
  created_at: string;
  updated_at: string;
}

// ── Medicamentos ────────────────────────────────────────────────
export type MedicationStatus =
  | 'sin_orden' | 'con_orden' | 'en_autorizacion' | 'autorizado'
  | 'negado' | 'reclamado' | 'en_uso' | 'completado' | 'vencido' | 'suspendido';

export interface Medication {
  id: number;
  appointment_id: number | null;
  household_id: number;
  user_id: number;
  registered_by: number;
  name: string;
  active_ingredient: string | null;
  presentation: string | null;
  dosage: string;
  frequency: string;
  duration_days: number | null;
  quantity: number | null;
  start_date: string | null;
  end_date: string | null;
  is_recurring: boolean;
  recurrence_days: number | null;
  alert_days_before: number;
  status: MedicationStatus;
  denied_reason: string | null;
  authorization_date: string | null;
  authorization_number: string | null;
  claimed_date: string | null;
  notes: string | null;
  track_intake: boolean;
  intake_quantity_per_dose: number | null;
  remaining_doses: number | null;
  low_stock_alert_doses: number;
  days_until_expiration?: number | null;
  renewal_traffic_light?: { level: TrafficLight; label: string } | null;
  patient?: Pick<User, 'id' | 'name' | 'avatar'>;
  renewals?: MedicationRenewal[];
  schedules?: MedicationSchedule[];
  created_at: string;
  updated_at: string;
}

export interface MedicationRenewal {
  id: number;
  medication_id: number;
  renewal_number: number;
  period_start: string;
  period_end: string;
  status: 'pendiente' | 'en_autorizacion' | 'autorizado' | 'negado' | 'reclamado' | 'completado';
  authorization_date: string | null;
  authorization_number: string | null;
  claimed_date: string | null;
  alert_sent_at: string | null;
  notes: string | null;
}

export interface MedicationSchedule {
  id: number;
  medication_id: number;
  user_id: number;
  time_of_day: string; // "08:00:00"
  label: string | null;
  days_of_week: number[] | null; // null = todos los días
  is_active: boolean;
  reminder_minutes_before: number;
}

export type IntakeStatus = 'tomado' | 'omitido' | 'atrasado' | 'pospuesto';

export interface MedicationIntakeLog {
  id: number;
  medication_id: number;
  medication_schedule_id: number | null;
  user_id: number;
  registered_by: number;
  scheduled_datetime: string;
  taken_at: string | null;
  status: IntakeStatus;
  delay_minutes: number | null;
  dose_taken: string | null;
  notes: string | null;
  medication?: Pick<Medication, 'id' | 'name' | 'dosage' | 'presentation'>;
  patient?: Pick<User, 'id' | 'name' | 'avatar'>;
}

/** Estado visual de una toma (distinto del `status` de BD) — calculado por el backend. */
export type IntakeDisplayStatus =
  | 'pendiente' | 'por_tomar' | 'atrasado'
  | 'tomado_a_tiempo' | 'tomado_tarde' | 'omitido' | 'pospuesto';

/**
 * Toma del día — combina horarios activos con los registros ya existentes.
 * `id` es null cuando aún no existe una fila en BD (toma "virtual").
 */
export interface TodayIntake {
  id: number | null;
  medication_id: number;
  medication_schedule_id: number | null;
  user_id: number;
  scheduled_datetime: string;
  taken_at: string | null;
  status: IntakeStatus | null;
  display_status: IntakeDisplayStatus;
  delay_minutes: number | null;
  label: string | null;
  medication: Pick<Medication, 'id' | 'name' | 'dosage' | 'presentation'> | null;
  patient: Pick<User, 'id' | 'name' | 'avatar'> | null;
}

// ── Exámenes ─────────────────────────────────────────────────────
export type ExamStatus =
  | 'sin_orden' | 'con_orden' | 'en_autorizacion' | 'autorizado' | 'negado'
  | 'agendado' | 'muestra_tomada' | 'resultado_pendiente'
  | 'resultado_disponible' | 'entregado_medico' | 'cancelado';

export interface Exam {
  id: number;
  appointment_id: number | null;
  household_id: number;
  user_id: number;
  registered_by: number;
  name: string;
  exam_type: 'laboratorio' | 'imagen' | 'especializado' | 'otro';
  lab_or_center: string | null;
  urgency: 'rutina' | 'urgente';
  status: ExamStatus;
  denied_reason: string | null;
  authorization_date: string | null;
  authorization_number: string | null;
  scheduled_date: string | null;
  performed_date: string | null;
  result_date: string | null;
  result_summary: string | null;
  delivered_to_doctor_date: string | null;
  cancelled_reason: string | null;
  notes: string | null;
  patient?: Pick<User, 'id' | 'name' | 'avatar'>;
  created_at: string;
}

// ── Remisiones ───────────────────────────────────────────────────
export type ReferralStatus =
  | 'emitida' | 'en_autorizacion' | 'autorizada' | 'negada'
  | 'cita_agendada' | 'completada' | 'vencida';

export interface Referral {
  id: number;
  appointment_id: number | null;
  household_id: number;
  user_id: number;
  registered_by: number;
  specialty: string;
  referring_doctor_id: number | null;
  referred_doctor_id: number | null;
  reason: string;
  urgency: NeedUrgency;
  status: ReferralStatus;
  denied_reason: string | null;
  authorization_date: string | null;
  authorization_number: string | null;
  authorization_expiry_date: string | null;
  scheduled_appointment_id: number | null;
  notes: string | null;
  days_until_expiration?: number | null;
  traffic_light?: { level: TrafficLight; label: string } | null;
  referring_doctor?: Doctor;
  referred_doctor?: Doctor;
  patient?: Pick<User, 'id' | 'name' | 'avatar'>;
  created_at: string;
}

// ── Incapacidades ────────────────────────────────────────────────
export interface MedicalLeave {
  id: number;
  household_id: number;
  user_id: number;
  registered_by: number;
  appointment_id: number | null;
  issuing_doctor_id: number | null;
  issuing_doctor_name_free: string | null;
  start_date: string;
  end_date: string;
  total_days: number;
  diagnosis: string | null;
  diagnosis_code: string | null;
  leave_type: 'enfermedad_general' | 'accidente_trabajo' | 'licencia_maternidad' | 'licencia_paternidad' | 'otro';
  ips_issued: string | null;
  notes: string | null;
  issuing_doctor?: Doctor;
  patient?: Pick<User, 'id' | 'name' | 'avatar'>;
  created_at: string;
}

// ── Vacunas ──────────────────────────────────────────────────────
export interface Vaccination {
  id: number;
  user_id: number;
  registered_by: number;
  vaccine_name: string;
  dose_number: string | null;
  application_date: string;
  applied_by: string | null;
  lot_number: string | null;
  ips_or_center: string | null;
  next_dose_date: string | null;
  days_until_next_dose?: number | null;
  notes: string | null;
  patient?: Pick<User, 'id' | 'name' | 'avatar'>;
  created_at: string;
}

// ── Signos vitales ───────────────────────────────────────────────
export interface VitalSign {
  id: number;
  user_id: number;
  registered_by: number;
  appointment_id: number | null;
  measurement_date: string;
  systolic_pressure: number | null;
  diastolic_pressure: number | null;
  heart_rate: number | null;
  blood_glucose: number | null;
  weight: number | null;
  height: number | null;
  temperature: number | null;
  oxygen_saturation: number | null;
  notes: string | null;
  out_of_range?: string[];
  patient?: Pick<User, 'id' | 'name' | 'avatar'>;
  created_at?: string;
}

export interface VitalSignRange {
  user_id: number;
  systolic_min: number;
  systolic_max: number;
  diastolic_min: number;
  diastolic_max: number;
  glucose_min: number;
  glucose_max: number;
  oxygen_min: number;
}

// ── Alergias ─────────────────────────────────────────────────────
export interface Allergy {
  id: number;
  user_id: number;
  type: 'medicamento' | 'alimento' | 'ambiental' | 'otro';
  name: string;
  reaction: string | null;
  severity: 'leve' | 'moderada' | 'grave';
  diagnosed_date: string | null;
  is_active: boolean;
  notes: string | null;
}

// ── Condiciones crónicas ─────────────────────────────────────────
export interface ChronicCondition {
  id: number;
  user_id: number;
  name: string;
  diagnosed_date: string | null;
  treating_doctor_id: number | null;
  is_active: boolean;
  notes: string | null;
}

// ── Médicos ──────────────────────────────────────────────────────
export interface Doctor {
  id: number;
  household_id: number;
  name: string;
  specialty: string;
  registration_number: string | null;
  phone: string | null;
  email: string | null;
  ips: string;
  address: string | null;
  notes: string | null;
  is_active: boolean;
}

// ── Documentos médicos ───────────────────────────────────────────
export type DocumentRelatedType =
  | 'appointment' | 'medication' | 'exam' | 'referral'
  | 'medical_leave' | 'vaccination' | 'general';

export type DocumentType =
  | 'historia_clinica' | 'orden_medicamento' | 'orden_examen'
  | 'resultado_examen' | 'autorizacion_eps' | 'incapacidad'
  | 'remision' | 'vacuna' | 'otro';

export interface MedicalDocument {
  id: number;
  household_id: number;
  user_id: number;
  uploaded_by: number;
  related_type: DocumentRelatedType;
  related_id: number | null;
  document_type: DocumentType;
  title: string;
  description: string | null;
  file_name: string;
  file_type: 'image' | 'pdf';
  file_size: number;
  document_date: string | null;
  uploaded_at: string;
  patient?: Pick<User, 'id' | 'name' | 'avatar'>;
}

// ── Notificaciones ───────────────────────────────────────────────
export interface AppNotification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  priority: 'info' | 'warning' | 'danger';
  read_at: string | null;
  created_at: string;
}

// ── Dashboard ────────────────────────────────────────────────────
export interface DashboardSummary {
  next_appointment: Appointment | null;
  active_medications: number;
  exams_with_results: number;
  pending_referrals: number;
  today_intakes: TodayIntake[];
  today_intakes_completed: boolean;
}

export interface DashboardAlert {
  type: string;
  level: TrafficLight;
  title: string;
  description: string;
  member: Pick<User, 'id' | 'name' | 'avatar'>;
  related_id: number;
  related_type: string;
}

// ── Paginación ───────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ── API Response estándar ────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}
