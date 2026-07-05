import { X } from 'lucide-react';
import type { Medication } from '@/types';
import AdherenceCalendar from '@/components/shared/AdherenceCalendar';

interface AdherenceCalendarModalProps {
  medication: Medication;
  onClose: () => void;
}

export default function AdherenceCalendarModal({ medication, onClose }: AdherenceCalendarModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto glass" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-5 border-b border-[rgba(27,94,32,.08)] sticky top-0 bg-[var(--color-surface)] dark:bg-[#1a2e1b] z-10">
            <div>
              <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
                Calendario de tomas
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">{medication.name}</p>
            </div>
            <button onClick={onClose} className="btn btn--ghost p-2 rounded-full"><X size={18} /></button>
          </div>

          <div className="p-5">
            <AdherenceCalendar medication={medication} />
          </div>
        </div>
      </div>
    </div>
  );
}
