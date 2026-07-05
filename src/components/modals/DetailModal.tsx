import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Pencil, Paperclip } from 'lucide-react';
import { medicalDocumentService } from '@/services/api/medicalDocuments';
import DocumentThumbnail from '@/components/shared/DocumentThumbnail';
import DocumentLightbox from '@/components/shared/DocumentLightbox';
import type { DocumentRelatedType } from '@/types';

export interface DetailField {
  label: string;
  value: React.ReactNode;
  /** Ocupa las dos columnas de la grilla (para textos largos: motivos, notas, etc.) */
  fullWidth?: boolean;
}

interface DetailModalProps {
  title: string;
  subtitle?: string;
  badge?: { label: string; cssClass: string };
  chips?: React.ReactNode;
  fields: DetailField[];
  /** Si se indican, muestra los documentos adjuntos enlazados a este registro. */
  relatedType?: DocumentRelatedType;
  relatedId?: number;
  onEdit?: () => void;
  onClose: () => void;
}

/**
 * Modal de "solo lectura" para ver el detalle completo de un registro
 * (cita, medicamento, examen, etc.) con un botón para pasar a edición.
 * Omite automáticamente los campos vacíos (null/undefined/'').
 */
export default function DetailModal({
  title, subtitle, badge, chips, fields, relatedType, relatedId, onEdit, onClose,
}: DetailModalProps) {
  const visibleFields = fields.filter((f) => f.value !== null && f.value !== undefined && f.value !== '');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: documents } = useQuery({
    queryKey: ['medical-documents', { relatedType, relatedId }],
    queryFn: () => medicalDocumentService.list({ relatedType, relatedId }),
    enabled: !!relatedType && !!relatedId,
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="min-h-full flex items-center justify-center p-4">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto glass" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[rgba(27,94,32,.08)] sticky top-0 bg-[var(--color-surface)] dark:bg-[#1a2e1b] z-10">
          <div className="min-w-0">
            {badge && <span className={`badge ${badge.cssClass} mb-1.5`}>{badge.label}</span>}
            <h2 className="font-bold text-lg truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
              {title}
            </h2>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            {chips && <div className="flex flex-wrap gap-1.5 mt-1.5">{chips}</div>}
          </div>
          <button onClick={onClose} className="btn btn--ghost p-2 rounded-full flex-shrink-0"><X size={18} /></button>
        </div>

        <div className="p-5">
          {visibleFields.length === 0 ? (
            <p className="text-sm text-gray-400">Sin información adicional registrada.</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {visibleFields.map((f, i) => (
                <div key={i} className={f.fullWidth ? 'col-span-2' : ''}>
                  <p className="text-xs font-medium text-gray-500">{f.label}</p>
                  <p className="text-sm text-gray-800 dark:text-gray-100 mt-0.5 break-words">{f.value}</p>
                </div>
              ))}
            </div>
          )}

          {documents && documents.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[rgba(27,94,32,.08)] dark:border-[rgba(165,214,167,.08)]">
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mb-2">
                <Paperclip size={13} /> Documentos adjuntos ({documents.length})
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {documents.map((doc, i) => (
                  <button key={doc.id} onClick={() => setLightboxIndex(i)} className="text-left">
                    <DocumentThumbnail document={doc} />
                    <p className="text-[10px] text-gray-500 mt-1 truncate">{doc.title}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {onEdit && (
          <div className="p-5 pt-0">
            <button onClick={onEdit} className="btn btn--primary w-full py-3 gap-2" style={{ borderRadius: '10px' }}>
              <Pencil size={16} /> Editar
            </button>
          </div>
        )}
      </div>
      </div>

      {lightboxIndex !== null && documents && (
        <DocumentLightbox
          documents={documents}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
