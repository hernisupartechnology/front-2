import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { medicalDocumentService } from '@/services/api/medicalDocuments';
import type { DocumentType } from '@/types';

interface UploadDocumentModalProps {
  patientId: number;
  patientName: string;
  onClose: () => void;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'historia_clinica', label: 'Historia clínica' },
  { value: 'orden_medicamento', label: 'Orden de medicamento' },
  { value: 'orden_examen', label: 'Orden de examen' },
  { value: 'resultado_examen', label: 'Resultado de examen' },
  { value: 'autorizacion_eps', label: 'Autorización EPS' },
  { value: 'incapacidad', label: 'Incapacidad' },
  { value: 'remision', label: 'Remisión' },
  { value: 'vacuna', label: 'Carné de vacunación' },
  { value: 'otro', label: 'Otro' },
];

interface FormValues {
  title: string;
  document_type: DocumentType;
  document_date?: string;
  description?: string;
}

export default function UploadDocumentModal({ patientId, patientName, onClose }: UploadDocumentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm<FormValues>({ defaultValues: { document_type: 'otro' } });

  const mutation = useMutation({
    mutationFn: (v: FormValues) => {
      if (!file) throw new Error('Selecciona un archivo');
      return medicalDocumentService.upload({ ...v, user_id: patientId, file });
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['medical-documents'] });
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message ?? 'No se pudo subir el documento.'),
  });

  const onSubmit = (v: FormValues) => {
    if (!file) {
      setError('Selecciona un archivo para subir.');
      return;
    }
    setError(null);
    mutation.mutate(v);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto glass" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[rgba(27,94,32,.08)]">
          <div>
            <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>Subir documento</h2>
            <p className="text-xs text-gray-500 mt-0.5">Para {patientName}</p>
          </div>
          <button onClick={onClose} className="btn btn--ghost p-2 rounded-full"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Archivo (JPG, PNG, WEBP o PDF — máx. 10MB)</label>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--color-primary-300)] rounded-xl p-6 cursor-pointer hover:bg-[var(--color-primary-100)]/40 transition-colors">
              <Upload size={22} style={{ color: 'var(--color-primary)' }} />
              <span className="text-sm text-gray-600 dark:text-gray-300 text-center">
                {file ? file.name : 'Toca para seleccionar un archivo'}
              </span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {error && <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Título del documento</label>
            <input required className="input" placeholder="Ej: Orden de laboratorio" {...register('title', { required: true })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de documento</label>
            <select className="input" {...register('document_type')}>
              {DOCUMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha del documento</label>
            <input type="date" className="input" {...register('document_date')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción (opcional)</label>
            <textarea className="input" rows={2} {...register('description')} />
          </div>

          <button type="submit" disabled={mutation.isPending} className="btn btn--primary w-full py-3" style={{ borderRadius: '10px' }}>
            {mutation.isPending ? 'Subiendo...' : 'Subir documento'}
          </button>
        </form>
      </div>
    </div>
  );
}
