import api from '@/lib/axios';

export type ReportType = 'individual' | 'household' | 'alerts' | 'leaves';
export type ReportFormat = 'pdf' | 'excel';

export interface ReportHistoryEntry {
  id: number;
  user_id: number;
  report_type: ReportType;
  format: ReportFormat;
  file_name: string | null;
  file_size: number | null;
  status: 'generando' | 'completado' | 'error';
  error_message: string | null;
  generated_at: string | null;
  created_at: string;
}

export interface GenerateReportPayload {
  report_type: ReportType;
  format: ReportFormat;
  user_id?: number;
  sections?: Record<string, boolean>;
  period?: 'month' | 'year' | 'all';
  from?: string;
  to?: string;
}

export const reportService = {
  async generate(payload: GenerateReportPayload): Promise<{ message: string; report: ReportHistoryEntry }> {
    const { data } = await api.post('/reports/generate', payload);
    return data;
  },

  async history(): Promise<ReportHistoryEntry[]> {
    const { data } = await api.get<{ reports: ReportHistoryEntry[] }>('/reports/history');
    return data.reports;
  },

  /** Descarga el reporte y dispara la descarga en el navegador. */
  async download(report: ReportHistoryEntry): Promise<void> {
    const { data } = await api.get(`/reports/${report.id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(data as Blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = report.file_name ?? `reporte.${report.format === 'pdf' ? 'pdf' : 'xlsx'}`;
    link.click();
    URL.revokeObjectURL(url);
  },
};
