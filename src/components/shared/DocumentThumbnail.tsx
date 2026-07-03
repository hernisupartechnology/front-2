import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { medicalDocumentService } from '@/services/api/medicalDocuments';
import type { MedicalDocument } from '@/types';

/** Miniatura de un documento — trae el binario solo para imágenes (los PDF muestran ícono). */
export default function DocumentThumbnail({ document }: { document: MedicalDocument }) {
  const { data: blobUrl, isLoading } = useQuery({
    queryKey: ['medical-documents', document.id, 'blob'],
    queryFn: () => medicalDocumentService.fetchBlobUrl(document.id),
    staleTime: Infinity,
    enabled: document.file_type === 'image',
  });

  if (document.file_type === 'pdf') {
    return (
      <div className="w-full aspect-square rounded-lg flex items-center justify-center bg-[#FFEBEE]">
        <FileText size={28} style={{ color: '#C62828' }} />
      </div>
    );
  }

  if (isLoading || !blobUrl) {
    return <div className="w-full aspect-square rounded-lg skeleton" />;
  }

  return (
    <img src={blobUrl} alt={document.title} className="w-full aspect-square object-cover rounded-lg" loading="lazy" />
  );
}
