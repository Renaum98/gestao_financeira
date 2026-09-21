// badge.js — número no ícone do app (Badging API).
//
// Funciona com o PWA instalado: Android/Chrome, iOS 16.4+ e Chrome/Edge no
// desktop. No navegador comum a API nem existe, e aí não fazemos nada.
//
// Quem alimenta é `naoLidas` de calcularNotificacoes — o mesmo número do
// sininho do dashboard. O service worker (public/sw-notifications.js) também
// ajusta o badge quando chega push com o app fechado; ao abrir, o número daqui
// prevalece porque é o mais completo (inclui convites e avisos de parceria,
// que o servidor não enxerga).

export function atualizarBadge(n) {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.setAppBadge !== "function") return;
  try {
    // setAppBadge(0) já limpa, mas clearAppBadge é o gesto explícito e não
    // deixa o ponto "vazio" que alguns Androids mostram pra zero.
    const p = n > 0 ? navigator.setAppBadge(n) : navigator.clearAppBadge?.();
    p?.catch?.(() => {});
  } catch {
    /* sem permissão de notificação ou API indisponível — ignora */
  }
}
