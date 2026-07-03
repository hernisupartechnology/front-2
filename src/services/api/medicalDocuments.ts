import api from '@/lib/axios';
import type { MedicalDocument, DocumentRelatedType, DocumentType } from '@/types';

interface MedicalDocumentResponse { message: string; data: MedicalDocument }

export interface UploadDocumentPayload {
  user_id: number;
  title: string;
  document_type: DocumentType;
  document_date?: string;
  related_type?: DocumentRelatedType;
  related_id?: number;
  description?: string;
  file: File;
}

export const medicalDocumentService = {
  async list(filters: {
    userId?: number; type?: DocumentType; relatedType?: DocumentRelatedType; relatedId?: number; search?: string;
  } = {}): Promise<MedicalDocument[]> {
    const { data } = await api.get<{ data: MedicalDocument[] }>('/medical-documents', { params: filters });
    return data.data;
  },

  async upload(payload: UploadDocumentPayload): Promise<MedicalDocumentResponse> {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) form.append(key, value as string | Blob);
    });

    const { data } = await api.post<MedicalDocumentResponse>('/medical-documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/medical-documents/${id}`);
  },

  /** Descarga el archivo autenticado y devuelve una object URL lista para <img src> o <a href>. */
  async fetchBlobUrl(id: number): Promise<string> {
    const { data } = await api.get(`/medical-documents/${id}`, { responseType: 'blob' });
    return URL.createObjectURL(data as Blob);
  },
};
