// sw-notifications.js — Importado pelo service worker gerado pelo VitePWA.
// Trata clique em notificações: foca a janela existente do app ou abre uma nova.

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const alvo = data.url || '/';
  event.waitUntil((async () => {
    try {
      const lista = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const c of lista) {
        if ('focus' in c) {
          if (c.url.endsWith(alvo) || c.url.includes(alvo)) {
            return c.focus();
          }
        }
      }
      // Sem janela aberta: abre uma nova.
      if (self.clients.openWindow) {
        return self.clients.openWindow(alvo);
      }
    } catch {}
  })());
});
