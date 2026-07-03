import api from '@/lib/axios';
import type {
  Medication, MedicationStatus, MedicationSchedule, MedicationRenewal,
  MedicationIntakeLog, TodayIntake,
} from '@/types';

export interface MedicationFilters {
  userId?: number;
  status?: MedicationStatus;
  recurring?: boolean;
}

export interface ScheduleInput {
  time_of_day: string; // "HH:mm"
  label?: string;
  days_of_week?: number[] | null; // ISO 8601: 1=lunes ... 7=domingo
  reminder_minutes_before?: number;
}

export interface CreateMedicationPayload {
  user_id: number;
  appointment_id?: number | null;
  name: string;
  active_ingredient?: string;
  presentation?: string;
  dosage: string;
  frequency: string;
  duration_days?: number;
  quantity?: number;
  start_date?: string;
  is_recurring?: boolean;
  recurrence_days?: number;
  alert_days_before?: number;
  status?: MedicationStatus;
  authorization_number?: string;
  notes?: string;
  track_intake?: boolean;
  intake_quantity_per_dose?: number;
  low_stock_alert_doses?: number;
  schedules?: ScheduleInput[];
}

export interface ChangeMedicationStatusPayload {
  status: MedicationStatus;
  authorization_number?: string;
  authorization_date?: string;
  denied_reason?: string;
  claimed_date?: string;
  start_date?: string;
  notes?: string;
}

interface MedicationResponse {
  message: string;
  data: Medication;
}

export interface AdherenceStats {
  adherence_7d: number;
  adherence_month: number;
  adherence_total: number;
  counts: { tomado: number; atrasado: number; omitido: number; pospuesto: number };
  current_streak: number;
  calendar: { date: string; percentage: number; level: 'red' | 'yellow' | 'green'; logs: MedicationIntakeLog[] }[];
}

export const medicationService = {
  async list(filters: MedicationFilters = {}): Promise<Medication[]> {
    const { data } = await api.get<{ data: Medication[] }>('/medications', { params: filters });
    return data.data;
  },

  async alerts(): Promise<Medication[]> {
    const { data } = await api.get<{ alerts: Medication[] }>('/medications/alerts');
    return data.alerts;
  },

  async get(id: number): Promise<Medication> {
    const { data } = await api.get<{ data: Medication }>(`/medications/${id}`);
    return data.data;
  },

  async create(payload: CreateMedicationPayload): Promise<MedicationResponse> {
    const { data } = await api.post<MedicationResponse>('/medications', payload);
    return data;
  },

  async update(id: number, payload: Partial<CreateMedicationPayload>): Promise<MedicationResponse> {
    const { data } = await api.put<MedicationResponse>(`/medications/${id}`, payload);
    return data;
  },

  async changeStatus(id: number, payload: ChangeMedicationStatusPayload): Promise<MedicationResponse> {
    const { data } = await api.patch<MedicationResponse>(`/medications/${id}/status`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/medications/${id}`);
  },

  async renew(id: number): Promise<MedicationRenewal> {
    const { data } = await api.post<{ renewal: MedicationRenewal }>(`/medications/${id}/renew`);
    return data.renewal;
  },

  async renewals(id: number): Promise<MedicationRenewal[]> {
    const { data } = await api.get<{ renewals: MedicationRenewal[] }>(`/medications/${id}/renewals`);
    return data.renewals;
  },

  async schedules(id: number): Promise<MedicationSchedule[]> {
    const { data } = await api.get<{ schedules: MedicationSchedule[] }>(`/medications/${id}/schedules`);
    return data.schedules;
  },

  /** Reemplaza el conjunto completo de horarios del medicamento. */
  async saveSchedules(id: number, schedules: ScheduleInput[]): Promise<MedicationSchedule[]> {
    const { data } = await api.post<{ schedules: MedicationSchedule[] }>(`/medications/${id}/schedules`, { schedules });
    return data.schedules;
  },

  async deleteSchedule(id: number, scheduleId: number): Promise<void> {
    await api.delete(`/medications/${id}/schedules/${scheduleId}`);
  },

  async adherence(id: number, month?: number, year?: number): Promise<AdherenceStats> {
    const { data } = await api.get<AdherenceStats>(`/medications/${id}/adherence`, { params: { month, year } });
    return data;
  },
};

export const intakeLogService = {
  async today(userId?: number): Promise<TodayIntake[]> {
    const { data } = await api.get<{ intakes: TodayIntake[] }>('/medications/today-intakes', { params: { userId } });
    return data.intakes;
  },

  async history(medicationId: number, from?: string, to?: string): Promise<MedicationIntakeLog[]> {
    const { data } = await api.get<{ intake_logs: MedicationIntakeLog[] }>(`/medications/${medicationId}/intake-logs`, { params: { from, to } });
    return data.intake_logs;
  },

  /** Registra una toma nueva (usado para tomas "virtuales" que aún no tienen id). */
  async register(medicationId: number, payload: {
    medication_schedule_id?: number | null;
    scheduled_datetime: string;
    taken_at?: string | null;
    status?: 'tomado' | 'omitido' | 'atrasado' | 'pospuesto';
    dose_taken?: string;
    notes?: string;
  }) {
    const { data } = await api.post(`/medications/${medicationId}/intake-logs`, payload);
    return data;
  },

  async update(medicationId: number, logId: number, payload: Partial<MedicationIntakeLog>) {
    const { data } = await api.patch(`/medications/${medicationId}/intake-logs/${logId}`, payload);
    return data;
  },

  /** Marca como tomado ahora — solo para tomas que ya tienen un log (id no nulo). */
  async quickTake(logId: number) {
    const { data } = await api.patch(`/medications/intake-logs/${logId}/quick-take`);
    return data;
  },

  async snooze(logId: number, minutes: 15 | 30 | 60) {
    const { data } = await api.patch(`/medications/intake-logs/${logId}/snooze`, { minutes });
    return data;
  },

  /**
   * Acción "✓ Tomado" universal — funciona tanto para tomas ya registradas
   * (quick-take por id) como virtuales (crea el registro).
   */
  async take(intake: TodayIntake) {
    if (intake.id) {
      return this.quickTake(intake.id);
    }
    return this.register(intake.medication_id, {
      medication_schedule_id: intake.medication_schedule_id,
      scheduled_datetime: intake.scheduled_datetime,
      taken_at: new Date().toISOString(),
      status: 'tomado',
    });
  },

  /** Acción "Posponer" universal. */
  async postpone(intake: TodayIntake, minutes: 15 | 30 | 60) {
    if (intake.id) {
      return this.snooze(intake.id, minutes);
    }
    return this.register(intake.medication_id, {
      medication_schedule_id: intake.medication_schedule_id,
      scheduled_datetime: intake.scheduled_datetime,
      status: 'pospuesto',
      notes: `Pospuesto ${minutes} min`,
    });
  },

  /** Acción "✗ Omitir" universal. */
  async skip(intake: TodayIntake, reason?: string) {
    if (intake.id) {
      return this.update(intake.medication_id, intake.id, { status: 'omitido', notes: reason });
    }
    return this.register(intake.medication_id, {
      medication_schedule_id: intake.medication_schedule_id,
      scheduled_datetime: intake.scheduled_datetime,
      status: 'omitido',
      notes: reason,
    });
  },
};
