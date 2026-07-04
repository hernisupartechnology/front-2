import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { intakeLogService } from '@/services/api/medications';

interface IntakeActionMessage {
  action: 'take' | 'snooze';
  scheduleId: number;
  medicationId?: number;
}

/**
 * Completa la acción que el usuario disparó desde el botón de una
 * notificación push ("✓ Tomado" / "Posponer 15 min"). El service worker no
 * puede llamar la API directamente (no tiene el token de sesión), así que
 * abre/enfoca la app y esta la resuelve aquí, ya autenticada — vía
 * postMessage (app ya abierta) o vía query params (app recién abierta).
 */
export function useNotificationIntakeAction() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const resolveAction = async ({ action, scheduleId }: IntakeActionMessage) => {
      try {
        const todayIntakes = await intakeLogService.today();
        const intake = todayIntakes.find((i) => i.medication_schedule_id === scheduleId);
        if (!intake) {
          toast.error('No encontramos esa toma en el listado de hoy.');
          return;
        }

        if (action === 'take') {
          await intakeLogService.take(intake);
          toast.success('¡Toma registrada!');
        } else {
          await intakeLogService.postpone(intake, 15);
          toast.success('Recordatorio pospuesto 15 minutos.');
        }

        queryClient.invalidateQueries({ queryKey: ['medications', 'today-intakes'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      } catch {
        toast.error('No se pudo completar la acción de la notificación.');
      }
    };

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'INTAKE_ACTION' && event.data.scheduleId) {
        resolveAction(event.data);
      }
    };
    navigator.serviceWorker?.addEventListener('message', onMessage);

    const params = new URLSearchParams(window.location.search);
    const action = params.get('intake_action');
    const scheduleId = params.get('scheduleId');
    if (action && scheduleId && (action === 'take' || action === 'snooze')) {
      resolveAction({ action, scheduleId: Number(scheduleId) });
      params.delete('intake_action');
      params.delete('scheduleId');
      params.delete('medicationId');
      const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
      window.history.replaceState({}, '', cleanUrl);
    }

    return () => navigator.serviceWorker?.removeEventListener('message', onMessage);
  }, [queryClient]);
}
