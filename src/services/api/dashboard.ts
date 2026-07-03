import api from '@/lib/axios';
import type { DashboardSummary, DashboardAlert } from '@/types';

interface AlertsResponse {
  alerts: DashboardAlert[];
  summary: { red: number; yellow: number; blue: number };
}

interface ActivityEntry {
  id: number;
  user_id: number;
  action: string;
  model_type: string;
  model_id: number;
  previous_status: string | null;
  new_status: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user?: { id: number; name: string; avatar: string | null };
}

/**
 * Servicio del panel principal — resumen personal, semáforo del hogar y actividad reciente.
 */
export const dashboardService = {
  async summary(): Promise<DashboardSummary> {
    const { data } = await api.get<DashboardSummary>('/dashboard/summary');
    return data;
  },

  async alerts(): Promise<AlertsResponse> {
    const { data } = await api.get<AlertsResponse>('/dashboard/alerts');
    return data;
  },

  async activity(): Promise<ActivityEntry[]> {
    const { data } = await api.get<{ activity: ActivityEntry[] }>('/dashboard/activity');
    return data.activity;
  },
};
