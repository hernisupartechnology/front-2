import api from '@/lib/axios';
import type { Allergy, ChronicCondition } from '@/types';

export const allergyService = {
  async list(userId: number): Promise<Allergy[]> {
    const { data } = await api.get<{ allergies: Allergy[] }>('/allergies', { params: { userId } });
    return data.allergies;
  },
  async create(payload: Record<string, unknown>): Promise<Allergy> {
    const { data } = await api.post<{ allergy: Allergy }>('/allergies', payload);
    return data.allergy;
  },
  async update(id: number, payload: Record<string, unknown>): Promise<Allergy> {
    const { data } = await api.put<{ allergy: Allergy }>(`/allergies/${id}`, payload);
    return data.allergy;
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/allergies/${id}`);
  },
};

export const chronicConditionService = {
  async list(userId: number): Promise<ChronicCondition[]> {
    const { data } = await api.get<{ chronic_conditions: ChronicCondition[] }>('/chronic-conditions', { params: { userId } });
    return data.chronic_conditions;
  },
  async create(payload: Record<string, unknown>): Promise<ChronicCondition> {
    const { data } = await api.post<{ chronic_condition: ChronicCondition }>('/chronic-conditions', payload);
    return data.chronic_condition;
  },
  async update(id: number, payload: Record<string, unknown>): Promise<ChronicCondition> {
    const { data } = await api.put<{ chronic_condition: ChronicCondition }>(`/chronic-conditions/${id}`, payload);
    return data.chronic_condition;
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/chronic-conditions/${id}`);
  },
};
