import api from '@/lib/axios';
import type { Referral, ReferralStatus } from '@/types';

interface ReferralResponse { message: string; data: Referral }

export const referralService = {
  async list(filters: { userId?: number; status?: ReferralStatus; specialty?: string } = {}): Promise<Referral[]> {
    const { data } = await api.get<{ data: Referral[] }>('/referrals', { params: filters });
    return data.data;
  },
  async create(payload: Record<string, unknown>): Promise<ReferralResponse> {
    const { data } = await api.post<ReferralResponse>('/referrals', payload);
    return data;
  },
  async update(id: number, payload: Record<string, unknown>): Promise<ReferralResponse> {
    const { data } = await api.put<ReferralResponse>(`/referrals/${id}`, payload);
    return data;
  },
  async changeStatus(id: number, payload: Record<string, unknown>): Promise<ReferralResponse> {
    const { data } = await api.patch<ReferralResponse>(`/referrals/${id}/status`, payload);
    return data;
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/referrals/${id}`);
  },
};
