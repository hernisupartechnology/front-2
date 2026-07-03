import api from '@/lib/axios';
import type { VitalSign } from '@/types';

interface VitalSignResponse { message: string; data: VitalSign }

export const vitalSignService = {
  async list(filters: { userId?: number; from?: string; to?: string } = {}): Promise<VitalSign[]> {
    const { data } = await api.get<{ data: VitalSign[] }>('/vital-signs', { params: filters });
    return data.data;
  },
  async create(payload: Record<string, unknown>): Promise<VitalSignResponse> {
    const { data } = await api.post<VitalSignResponse>('/vital-signs', payload);
    return data;
  },
  async update(id: number, payload: Record<string, unknown>): Promise<VitalSignResponse> {
    const { data } = await api.put<VitalSignResponse>(`/vital-signs/${id}`, payload);
    return data;
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/vital-signs/${id}`);
  },
};
