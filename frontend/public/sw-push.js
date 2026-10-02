/*
 * Service worker de notificaciones push de ACTIVATE.
 *
 * - Si la app está abierta y visible, no muestra notificación del sistema: le pasa el aviso
 *   a la pestaña (postMessage) para que abra el modal de "Es hora de tu pausa".
 * - Si la app está cerrada o en segundo plano, muestra la notificación del sistema.
 * - Al hacer clic en la notificación enfoca/abre la app y abre el modal (o inicia la pausa).
 */
const MESSAGE_SOURCE = 'activate-push';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

function readPayload(event) {
  if (!event.data) return {};
  try {
    return event.data.json();
  } catch {
    return { title: 'ACTIVATE', body: event.data.text() };
  }
}

function startUrl(payload) {
  const data = payload.data || {};
  const routine = data.idRoutine || 'libre';
  const slot = data.scheduledAt ? `?slot=${encodeURIComponent(data.scheduledAt)}` : '';
  return `/app/pausas/ejecutar/${routine}${slot}`;
}

function openUrl(payload) {
  const base = payload.url || '/app';
  if (payload.type !== 'pausa-due') return base;
  const aviso = encodeURIComponent(JSON.stringify(payload.data || {}));
  return `${base}${base.includes('?') ? '&' : '?'}aviso=${aviso}`;
}

async function appWindows() {
  const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  return list.filter((client) => new URL(client.url).origin === self.location.origin);
}

self.addEventListener('push', (event) => {
  const payload = readPayload(event);

  event.waitUntil(
    (async () => {
      const visible = (await appWindows()).filter((client) => client.visibilityState === 'visible');
      if (visible.length > 0) {
        visible.forEach((client) => client.postMessage({ source: MESSAGE_SOURCE, action: 'show', payload }));
        return;
      }

      const isPause = payload.type === 'pausa-due';
      await self.registration.showNotification(payload.title || 'ACTIVATE', {
        body: payload.body || '',
        icon: '/logo-ue.png',
        badge: '/logo-ue.png',
        tag: payload.tag || 'activate',
        renotify: true,
        requireInteraction: isPause,
        vibrate: isPause ? [200, 100, 200] : undefined,
        data: payload,
        actions: isPause
          ? [
              { action: 'start', title: 'Iniciar pausa' },
              { action: 'later', title: 'Más tarde' },
            ]
          : [],
      });
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  const payload = event.notification.data || {};
  event.notification.close();
  if (event.action === 'later') return;

  const action = event.action === 'start' ? 'start' : 'show';

  event.waitUntil(
    (async () => {
      const [client] = await appWindows();
      if (client) {
        await client.focus();
        client.postMessage({ source: MESSAGE_SOURCE, action, payload });
        return;
      }
      const target = action === 'start' && payload.type === 'pausa-due' ? startUrl(payload) : openUrl(payload);
      await self.clients.openWindow(target);
    })(),
  );
});
