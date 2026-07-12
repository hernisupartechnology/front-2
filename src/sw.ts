/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

// Requerido por vite-plugin-pwa (estrategia injectManifest) — precachea los
// assets de la build para que la app funcione offline.
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();

// NO se llama self.clients.claim() acá a propósito. clients.claim() hace que el
// SW recién activado tome control INMEDIATO de las pestañas ya abiertas —
// incluida la que lo acaba de instalar, en pleno medio de sus peticiones
// fetch() iniciales (dashboard, hoy-tomas, etc.). Ese cambio de controlador a
// mitad de vuelo hace que Chrome reencole esas peticiones ya en curso, y en la
// primera visita (service worker nuevo, sin nada precacheado todavía) se
// traduce en varias peticiones "Stalled" 10-15s seguidas — exactamente lo que
// reportó el usuario ("la primera vez que se abre toca actualizar varias
// veces"). Sin clients.claim(), esta primera pestaña simplemente sigue sin
// controlar hasta la próxima navegación/recarga (comportamiento normal de
// cualquier SW), y ninguna petición en curso se ve afectada. Para el flujo de
// notificationclick (self.clients.matchAll + postMessage más abajo) no hace
// falta: para cuando el usuario puede recibir una notificación push ya usó la
// app en sesiones normales previas, así que esas pestañas ya están controladas
// por el ciclo normal de activación del SW.

interface PushPayload {
  title: string;
  body: string;
  data?: { medication_schedule_id?: number; medication_id?: number };
}

/**
 * Notificación push de UparVital — recordatorios de toma de medicamentos.
 * El payload viaja en texto plano (no cifrado por la app; Web Push ya cifra
 * el transporte end-to-end vía VAPID).
 */
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  let payload: PushPayload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'UparVital', body: event.data.text() };
  }

  // `actions` es parte del estándar Notification API pero no siempre está en
  // el lib.dom.d.ts del TS instalado — se tipa aparte para evitar el chequeo
  // de propiedades excedentes de un objeto literal.
  const options: NotificationOptions & { actions?: { action: string; title: string }[] } = {
    body: payload.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: payload.data ?? {},
    actions: [
      { action: 'take', title: '✓ Tomado' },
      { action: 'snooze', title: 'Posponer 15 min' },
    ],
  };

  event.waitUntil(self.registration.showNotification(payload.title || 'UparVital', options));
});

/**
 * Clic en la notificación (o en sus botones de acción). El service worker no
 * tiene acceso al token de sesión (vive en localStorage, fuera de su scope),
 * así que en vez de llamar la API directamente, abre/enfoca la app con los
 * parámetros de la acción — el frontend ya autenticado la completa al cargar.
 */
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const { medication_schedule_id: scheduleId, medication_id: medicationId } = event.notification.data ?? {};
  const action = event.action; // 'take' | 'snooze' | '' (clic en el cuerpo)

  const targetUrl = action && scheduleId
    ? `/dashboard?intake_action=${action}&scheduleId=${scheduleId}&medicationId=${medicationId ?? ''}`
    : '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if ('focus' in client) {
          client.postMessage({ type: 'INTAKE_ACTION', action, scheduleId, medicationId });
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
