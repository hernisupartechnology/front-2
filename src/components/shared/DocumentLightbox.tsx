import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, Trash2 } from 'lucide-react';
import { medicalDocumentService } from '@/services/api/medicalDocuments';
import { formatDate, formatFileSize } from '@/utils/statusHelpers';
import type { MedicalDocument } from '@/types';

interface DocumentLightboxProps {
  documents: MedicalDocument[];
  initialIndex: number;
  onClose: () => void;
  onDelete?: (doc: MedicalDocument) => void;
}

/**
 * Visor de documentos — zoom y navegación para imágenes, embed inline para PDFs.
 * Siempre descarga el binario vía el cliente axios autenticado (nunca una URL pública).
 */
export default function DocumentLightbox({ documents, initialIndex, onClose, onDelete }: DocumentLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const doc = documents[index];

  const { data: blobUrl, isLoading } = useQuery({
    queryKey: ['medical-documents', doc.id, 'blob'],
    queryFn: () => medicalDocumentService.fetchBlobUrl(doc.id),
    staleTime: Infinity,
  });

  useEffect(() => setZoom(1), [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(documents.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [documents.length, onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white flex-shrink-0">
        <div className="min-w-0">
          <p className="font-medium truncate">{doc.title}</p>
          <p className="text-xs text-white/60">{formatDate(doc.document_date)} · {formatFileSize(doc.file_size)}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {doc.file_type === 'image' && (
            <>
              <button onClick={() => setZoom((z) => Math.max(1, z - 0.5))} className="p-2 rounded-full hover:bg-white/10"><ZoomOut size={18} /></button>
              <button onClick={() => setZoom((z) => Math.min(4, z + 0.5))} className="p-2 rounded-full hover:bg-white/10"><ZoomIn size={18} /></button>
            </>
          )}
          {blobUrl && (
            <a href={blobUrl} download={doc.file_name} className="p-2 rounded-full hover:bg-white/10"><Download size={18} /></a>
          )}
          {onDelete && (
            <button onClick={() => onDelete(doc)} className="p-2 rounded-full hover:bg-white/10"><Trash2 size={18} /></button>
          )}
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X size={20} /></button>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 flex items-center justify-center overflow-auto relative px-4">
        {index > 0 && (
          <button onClick={() => setIndex(index - 1)} className="absolute left-2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10">
            <ChevronLeft size={22} />
          </button>
        )}
        {index < documents.length - 1 && (
          <button onClick={() => setIndex(index + 1)} className="absolute right-2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10">
            <ChevronRight size={22} />
          </button>
        )}

        {isLoading && <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />}

        {blobUrl && doc.file_type === 'image' && (
          <img
            src={blobUrl}
            alt={doc.title}
            className="max-h-[80vh] max-w-full object-contain transition-transform"
            style={{ transform: `scale(${zoom})` }}
          />
        )}

        {blobUrl && doc.file_type === 'pdf' && (
          <embed src={blobUrl} type="application/pdf" className="w-full h-[80vh] rounded-lg bg-white" />
        )}
      </div>

      {documents.length > 1 && (
        <p className="text-center text-white/50 text-xs pb-3">{index + 1} / {documents.length}</p>
      )}
    </div>
  );
}
