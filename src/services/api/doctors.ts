import api from '@/lib/axios';
import type { Doctor } from '@/types';

interface DoctorResponse { message: string; data: Doctor }

export const doctorService = {
  async list(activeOnly = false): Promise<Doctor[]> {
    const { data } = await api.get<{ data: Doctor[] }>('/doctors', { params: { active_only: activeOnly } });
    return data.data;
  },
  async get(id: number): Promise<Doctor & { appointments?: unknown[] }> {
    const { data } = await api.get<{ data: Doctor }>(`/doctors/${id}`);
    return data.data;
  },
  async create(payload: Record<string, unknown>): Promise<DoctorResponse> {
    const { data } = await api.post<DoctorResponse>('/doctors', payload);
    return data;
  },
  async update(id: number, payload: Record<string, unknown>): Promise<DoctorResponse> {
    const { data } = await api.put<DoctorResponse>(`/doctors/${id}`, payload);
    return data;
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/doctors/${id}`);
  },
};
