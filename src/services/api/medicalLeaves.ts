import api from '@/lib/axios';
import type { MedicalLeave, PaginatedResponse } from '@/types';

interface MedicalLeaveResponse { message: string; data: MedicalLeave }

export const medicalLeaveService = {
  async list(filters: { userId?: number; from?: string; to?: string; page?: number; per_page?: number } = {}): Promise<PaginatedResponse<MedicalLeave>> {
    const { data } = await api.get<PaginatedResponse<MedicalLeave>>('/medical-leaves', { params: filters });
    return data;
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
