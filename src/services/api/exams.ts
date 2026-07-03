import api from '@/lib/axios';
import type { Exam, ExamStatus } from '@/types';

interface ExamResponse { message: string; data: Exam }

export const examService = {
  async list(filters: { userId?: number; status?: ExamStatus; type?: string } = {}): Promise<Exam[]> {
    const { data } = await api.get<{ data: Exam[] }>('/exams', { params: filters });
    return data.data;
  },
  async create(payload: Record<string, unknown>): Promise<ExamResponse> {
    const { data } = await api.post<ExamResponse>('/exams', payload);
    return data;
  },
  async update(id: number, payload: Record<string, unknown>): Promise<ExamResponse> {
    const { data } = await api.put<ExamResponse>(`/exams/${id}`, payload);
    return data;
  },
  async changeStatus(id: number, payload: Record<string, unknown>): Promise<ExamResponse> {
    const { data } = await api.patch<ExamResponse>(`/exams/${id}/status`, payload);
    return data;
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/exams/${id}`);
  },
};
