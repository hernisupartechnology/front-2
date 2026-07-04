import api from '@/lib/axios';

/** Convierte la VAPID public key (base64url) al formato Uint8Array que pide PushManager.subscribe(). */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export const pushSubscriptionService = {
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  /** Pide permiso, se suscribe vía el service worker y guarda la suscripción en el backend. */
  async subscribe(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Este navegador no soporta notificaciones push.');
    }

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
    if (!vapidPublicKey) {
      throw new Error('Falta configurar VITE_VAPID_PUBLIC_KEY en el frontend.');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Debes aceptar los permisos de notificación para activar los recordatorios.');
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });
    }

    const json = subscription.toJSON();
    await api.post('/push-subscriptions', {
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    });
  },

  /** Cancela la suscripción de este navegador, tanto en el push service como en el backend. */
  async unsubscribe(): Promise<void> {
    if (!this.isSupported()) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await api.delete('/push-subscriptions', { data: { endpoint } });
  },

  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported()) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  },

  async listDevices(): Promise<{ id: number; device_label: string | null; last_used_at: string | null }[]> {
    const { data } = await api.get('/push-subscriptions');
    return data.subscriptions;
  },
};
