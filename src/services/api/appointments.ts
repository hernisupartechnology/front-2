import api from '@/lib/axios';
import type { Appointment, AppointmentType, NeedUrgency, RecurrenceType, AppointmentStatus, TrafficLight } from '@/types';

export interface AppointmentFilters {
  userId?: number;
  status?: AppointmentStatus;
  trafficLight?: TrafficLight;
  recurring?: boolean;
  isNeed?: boolean;
  from?: string;
  to?: string;
}

export interface CreateAppointmentPayload {
  user_id: number;
  doctor_id?: number | null;
  doctor_name_free?: string | null;
  specialty: string;
  appointment_type?: AppointmentType;
  ips?: string | null;
  address?: string | null;
  is_need: boolean;
  need_reason?: string;
  need_urgency?: NeedUrgency;
  max_days_to_schedule?: number;
  alert_days_before_scheduling?: number;
  appointment_date?: string;
  reason?: string;
  is_recurring?: boolean;
  recurrence_type?: RecurrenceType;
  alert_days_before_appointment?: number;
  notes?: string;
}

export interface ChangeStatusPayload {
  status: AppointmentStatus;
  appointment_date?: string;
  diagnosis?: string;
  next_appointment_date?: string;
  next_appointment_notes?: string;
  next_appointment_specialty?: string;
  cancelled_reason?: string;
  cancelled_by?: 'paciente' | 'ips' | 'eps';
  notes?: string;
}

interface AppointmentResponse {
  message: string;
  data: Appointment;
}

/**
 * Servicio de citas médicas y necesidades — cubre el flujo completo:
 * necesidad → programada → confirmada → realizada, cancelaciones y recurrencia.
 */
export const appointmentService = {
  async list(filters: AppointmentFilters = {}): Promise<Appointment[]> {
    const { data } = await api.get<{ data: Appointment[] }>('/appointments', { params: filters });
    return data.data;
  },

  async get(id: number): Promise<Appointment> {
    const { data } = await api.get<{ data: Appointment }>(`/appointments/${id}`);
    return data.data;
  },

  async create(payload: CreateAppointmentPayload): Promise<AppointmentResponse> {
    const { data } = await api.post<AppointmentResponse>('/appointments', payload);
    return data;
  },

  async update(id: number, payload: Partial<CreateAppointmentPayload>): Promise<AppointmentResponse> {
    const { data } = await api.put<AppointmentResponse>(`/appointments/${id}`, payload);
    return data;
  },

  async changeStatus(id: number, payload: ChangeStatusPayload): Promise<AppointmentResponse> {
    const { data } = await api.patch<AppointmentResponse>(`/appointments/${id}/status`, payload);
    return data;
  },

  /** Convierte una necesidad sin fecha en una cita programada. */
  async schedule(id: number, payload: {
    appointment_date: string;
    doctor_id?: number | null;
    doctor_name_free?: string | null;
    ips?: string | null;
    address?: string | null;
    appointment_type?: AppointmentType;
  }): Promise<AppointmentResponse> {
    const { data } = await api.patch<AppointmentResponse>(`/appointments/${id}/schedule`, payload);
    return data;
  },

  async generateNext(id: number): Promise<AppointmentResponse> {
    const { data } = await api.post<AppointmentResponse>(`/appointments/${id}/generate-next`);
    return data;
  },

  async recurrenceLog(id: number) {
    const { data } = await api.get(`/appointments/${id}/recurrence-log`);
    return data.recurrence_log;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/appointments/${id}`);
  },
};
