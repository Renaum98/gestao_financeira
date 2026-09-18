// api/push/testar.js — manda uma notificação de teste pros aparelhos de quem
// chamou. Existe porque o cron roda uma vez por dia: sem isto, conferir se o
// push está funcionando de ponta a ponta (chave VAPID, assinatura salva,
// service worker) seria esperar até amanhã.
//
// Autenticação: o app manda o ID token do Firebase Auth em
// `Authorization: Bearer <token>`; o `jose` confere a assinatura contra o
// JWKS do Firebase e dali sai o uid. Nada de uid vindo do corpo.

import { uidDoIdToken, consultarPorCampo, apagarDoc } from '../_lib/firebase.js';
import { enviarPush, prepararPush } from '../_lib/push.js';

function resposta(status, corpo) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function POST(req) {
  let uid;
  try {
    uid = await uidDoIdToken(req);
  } catch (err) {
    // Sem FIREBASE_SERVICE_ACCOUNT nem o projeto a gente sabe — é config, não
    // credencial errada.
    return resposta(500, { erro: err?.message || String(err) });
  }
  if (!uid) return resposta(401, { erro: 'não autorizado' });

  let idioma = 'pt';
  try {
    const corpo = await req.json();
    if (corpo?.idioma === 'en') idioma = 'en';
  } catch {}

  const payload = {
    titulo: 'MyCounts',
    corpo:
      idioma === 'en'
        ? 'Push notifications are on for this device.'
        : 'As notificações push estão ativas neste aparelho.',
    tag: 'push-teste',
    urgente: false,
    data: { url: '/', tipo: 'teste' },
  };

  try {
    prepararPush();
    const assinaturas = await consultarPorCampo('pushSubs', 'uid', uid);
    let enviadas = 0;
    let removidas = 0;
    await Promise.all(
      assinaturas.map(async ({ caminho, dados }) => {
        const r = await enviarPush(dados, payload);
        if (r.ok) enviadas += 1;
        else if (r.morta) {
          await apagarDoc(caminho);
          removidas += 1;
        }
      }),
    );
    return resposta(200, { assinaturas: assinaturas.length, enviadas, removidas });
  } catch (err) {
    console.error('[push/testar]', err);
    return resposta(500, { erro: err?.message || String(err) });
  }
}

// Qualquer outro método: a função só entrega.
export function GET() {
  return resposta(405, { erro: 'use POST' });
}
