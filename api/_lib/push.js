// push.js — envio de Web Push (protocolo VAPID) a partir do servidor.
//
// Uma assinatura de push é um endpoint no serviço do navegador (FCM no
// Chrome, APNs no Safari, Mozilla no Firefox) mais um par de chaves que
// cifra o conteúdo. O `web-push` cuida do protocolo inteiro; a gente só
// entrega a assinatura e o JSON da notificação.
//
// As chaves VAPID identificam ESTE servidor perante o serviço de push. A
// pública vai pro cliente (VAPID_PUBLIC_KEY em src/lib/push.js) e é usada na hora de
// assinar; a privada fica só aqui. Gerar uma vez com:
//   npx web-push generate-vapid-keys

import webpush from 'web-push';

let configurado = false;

// Confere as chaves e configura o web-push. O cron chama isto logo no começo
// pra uma variável faltando virar UM 500 com a mensagem, e não um erro
// repetido por usuário no meio da rodada.
export function prepararPush() {
  if (configurado) return;
  const publica = process.env.VAPID_PUBLIC_KEY;
  const privada = process.env.VAPID_PRIVATE_KEY;
  if (!publica || !privada) throw new Error('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY não configuradas.');
  // O subject é um contato pro serviço de push falar com o dono das chaves
  // caso algo dê errado — mailto: ou a URL do site.
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', publica, privada);
  configurado = true;
}

// Manda uma notificação. Devolve:
//   { ok: true }              entregue ao serviço de push
//   { ok: false, morta: true } assinatura expirou ou o usuário revogou —
//                              quem chamou deve apagar o doc dela
//   { ok: false, erro }        outro erro (rede, cota…); tenta de novo amanhã
export async function enviarPush(assinatura, payload) {
  prepararPush();
  try {
    await webpush.sendNotification(
      { endpoint: assinatura.endpoint, keys: assinatura.keys },
      JSON.stringify(payload),
      // O serviço guarda a mensagem até o aparelho aparecer, por até um dia —
      // depois disso o lembrete já perdeu o sentido (o cron manda outro).
      { TTL: 24 * 60 * 60, urgency: payload.urgente ? 'high' : 'normal' },
    );
    return { ok: true };
  } catch (err) {
    // 404/410: o serviço de push não conhece mais esse endpoint.
    if (err?.statusCode === 404 || err?.statusCode === 410) {
      return { ok: false, morta: true };
    }
    return { ok: false, erro: err?.body || err?.message || String(err) };
  }
}
