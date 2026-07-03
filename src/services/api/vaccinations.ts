import api from '@/lib/axios';
import type { Vaccination } from '@/types';

interface VaccinationResponse { message: string; data: Vaccination }

export const vaccinationService = {
  async list(filters: { userId?: number; name?: string; year?: number } = {}): Promise<Vaccination[]> {
    const { data } = await api.get<{ data: Vaccination[] }>('/vaccinations', { params: filters });
    return data.data;
  },
  async create(payload: Record<string, unknown>): Promise<VaccinationResponse> {
    const { data } = await api.post<VaccinationResponse>('/vaccinations', payload);
    return data;
  },
  async update(id: number, payload: Record<string, unknown>): Promise<VaccinationResponse> {
    const { data } = await api.put<VaccinationResponse>(`/vaccinations/${id}`, payload);
    return data;
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/vaccinations/${id}`);
  },
};
