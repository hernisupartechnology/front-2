import api from '@/lib/axios';
import type { MedicalLeave } from '@/types';

interface MedicalLeaveResponse { message: string; data: MedicalLeave }

export const medicalLeaveService = {
  async list(filters: { userId?: number; from?: string; to?: string } = {}): Promise<MedicalLeave[]> {
    const { data } = await api.get<{ data: MedicalLeave[] }>('/medical-leaves', { params: filters });
    return data.data;
  },
  async create(payload: Record<string, unknown>): Promise<MedicalLeaveResponse> {
    const { data } = await api.post<MedicalLeaveResponse>('/medical-leaves', payload);
    return data;
  },
  async update(id: number, payload: Record<string, unknown>): Promise<MedicalLeaveResponse> {
    const { data } = await api.put<MedicalLeaveResponse>(`/medical-leaves/${id}`, payload);
    return data;
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/medical-leaves/${id}`);
  },
};
