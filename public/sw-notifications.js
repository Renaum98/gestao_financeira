// sw-notifications.js — Importado pelo service worker gerado pelo VitePWA.
// Duas responsabilidades:
//   • `push`: mostra a notificação que chegou do servidor (api/push/enviar.js).
//   • `notificationclick`: foca a janela existente do app ou abre uma nova.

// O payload é o JSON montado no servidor:
//   { titulo, corpo, tag, urgente, badge, data }.
// Ícone e o `badge` da notificação (o desenho monocromático da barra de
// status) ficam fixos aqui e não viajam no payload — o serviço de push limita
// o tamanho da mensagem (4 KB) e são sempre os mesmos. O `badge` do payload é
// outra coisa: o NÚMERO no ícone do app (Badging API), que o app fechado não
// tem como calcular sozinho.
self.addEventListener('push', (event) => {
  let dados = {};
  try {
    dados = event.data ? event.data.json() : {};
  } catch {
    // Não era JSON: mostra o texto cru como corpo, em vez de perder o aviso.
    dados = { corpo: event.data ? event.data.text() : '' };
  }
  const titulo = dados.titulo || 'MyCounts';
  const opcoes = {
    body: dados.corpo || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: dados.tag,
    // `urgente` (vence hoje/amanhã) segura a notificação na tela até o usuário
    // mexer nela — mesmo critério do disparo local em lib/notifications.js.
    requireInteraction: !!dados.urgente,
    data: dados.data || { url: '/' },
  };
  // O waitUntil é obrigatório: a assinatura foi feita com userVisibleOnly, e
  // o Chrome pune push sem notificação visível trocando por um aviso genérico.
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(titulo, opcoes),
      atualizarBadge(dados.badge),
    ]),
  );
});

// Número no ícone do app instalado. `setAppBadge` existe no escopo do SW no
// Android/Chrome e no iOS 16.4+; onde não existe, ignora. Só mexe quando o
// servidor mandou um número — payload antigo/sem o campo deixa como está.
async function atualizarBadge(n) {
  if (typeof n !== 'number' || typeof self.navigator?.setAppBadge !== 'function') return;
  try {
    if (n > 0) await self.navigator.setAppBadge(n);
    else await self.navigator.clearAppBadge();
  } catch {}
}

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
