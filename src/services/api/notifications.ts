import api from '@/lib/axios';
import type { AppNotification, PaginatedResponse } from '@/types';

export const notificationService = {
  async list(page = 1, perPage = 15): Promise<PaginatedResponse<AppNotification>> {
    const { data } = await api.get<PaginatedResponse<AppNotification>>('/notifications', { params: { page, per_page: perPage } });
    return data;
  },
  async markAsRead(id: number): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },
  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },
};
