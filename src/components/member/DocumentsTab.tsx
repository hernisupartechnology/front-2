import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, FolderOpen, Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { medicalDocumentService } from '@/services/api/medicalDocuments';
import { formatDate, formatFileSize } from '@/utils/statusHelpers';
import type { DocumentType, MedicalDocument } from '@/types';
import DocumentThumbnail from '@/components/shared/DocumentThumbnail';
import DocumentLightbox from '@/components/shared/DocumentLightbox';
import UploadDocumentModal from '@/components/modals/UploadDocumentModal';

const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  historia_clinica: 'Historia clínica',
  orden_medicamento: 'Orden de medicamento',
  orden_examen: 'Orden de examen',
  resultado_examen: 'Resultado de examen',
  autorizacion_eps: 'Autorización EPS',
  incapacidad: 'Incapacidad',
  remision: 'Remisión',
  vacuna: 'Vacuna',
  otro: 'Otro',
};

export default function DocumentsTab({ patientId, patientName }: { patientId: number; patientName: string }) {
  const [showUpload, setShowUpload] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | ''>('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  // Búsqueda y filtro de tipo ahora van al backend (ya los soportaba, el
  // frontend los ignoraba y filtraba en el navegador sobre TODO el historial
  // descargado) — debounce para no mandar una petición por cada tecla.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, typeFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ['medical-documents', { userId: patientId, search: debouncedSearch, type: typeFilter, page }],
    queryFn: () => medicalDocumentService.list({ userId: patientId, search: debouncedSearch || undefined, type: typeFilter || undefined, page }),
  });
  const documents = data?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: number) => medicalDocumentService.remove(id),
    onSuccess: () => {
      toast.success('Documento eliminado correctamente.');
      queryClient.invalidateQueries({ queryKey: ['medical-documents'] });
      setLightboxIndex(null);
    },
    onError: () => toast.error('No se pudo eliminar el documento.'),
  });

  const handleDelete = (doc: MedicalDocument) => {
    if (confirm(`¿Eliminar "${doc.title}"? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(doc.id);
    }
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">Documentos</h2>
        <button onClick={() => setShowUpload(true)} className="btn btn--primary text-sm gap-1.5 py-2 px-4">
          <Plus size={16} /> Subir documento
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o descripción..."
            className="input pl-9"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as DocumentType | '')} className="input w-auto">
          <option value="">Todos los tipos</option>
          {Object.entries(DOCUMENT_TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton aspect-square rounded-lg" />)}
        </div>
      )}

      {!isLoading && documents.length === 0 && (
        <div className="card p-10 flex flex-col items-center text-center gap-2">
          <FolderOpen className="text-gray-300" size={36} />
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Sin documentos</h3>
          <p className="text-sm text-gray-500 max-w-sm">Sube órdenes médicas, resultados o autorizaciones para tenerlos siempre a la mano.</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {documents.map((doc, i) => (
          <div key={doc.id} className="group">
            <button onClick={() => setLightboxIndex(i)} className="w-full text-left relative">
              <DocumentThumbnail document={doc} />
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(doc); }}
                className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={13} />
              </button>
            </button>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-200 mt-1.5 truncate">{doc.title}</p>
            <p className="text-[10px] text-gray-400">{DOCUMENT_TYPE_LABEL[doc.document_type]} · {formatDate(doc.document_date)}</p>
            <p className="text-[10px] text-gray-400">{formatFileSize(doc.file_size)}</p>
          </div>
        ))}
      </div>

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn--ghost p-2 rounded-full disabled:opacity-30">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-500">Página {data.current_page} de {data.last_page}</span>
          <button onClick={() => setPage((p) => Math.min(data.last_page, p + 1))} disabled={page === data.last_page} className="btn btn--ghost p-2 rounded-full disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {showUpload && <UploadDocumentModal patientId={patientId} patientName={patientName} onClose={() => setShowUpload(false)} />}

      {lightboxIndex !== null && (
        <DocumentLightbox
          documents={documents}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
