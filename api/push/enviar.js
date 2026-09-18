// api/push/enviar.js — o cron diário que manda os lembretes por push.
//
// A Vercel chama `GET /api/push/enviar` no horário do `crons` do vercel.json.
// A função lê todas as assinaturas de push (coleção `pushSubs`), agrupa por
// usuário, monta as notificações de cada um com a mesma regra do app
// (api/_lib/mensagens.js) e manda o que aquele aparelho ainda não recebeu.
//
// Quem impede a repetição é o campo `enviadas` de cada assinatura: a lista
// de ids já notificados NAQUELE aparelho. É o mesmo papel do
// `finca.notif.enviadas` do localStorage no cliente, e os dois conversam —
// o app registra ali o que disparou localmente (src/lib/push.js), então um
// lembrete visto com o app aberto de manhã não chega de novo por push à
// tarde. A lista é podada a cada rodada: só sobrevive o que ainda está
// pendente, senão cresceria pra sempre.
//
// Segurança: só aceita chamadas com `Authorization: Bearer <CRON_SECRET>`.
// A Vercel põe esse header sozinha nas invocações do cron quando a variável
// existe; pra disparar na mão (curl) é só mandar o mesmo header.
//
// Ver docs/push-setup.md para o passo a passo de configuração.

import { listarColecao, lerDoc, atualizarCampos, apagarDoc } from '../_lib/firebase.js';
import { enviarPush, prepararPush } from '../_lib/push.js';
import { montarNotificacoes } from '../_lib/mensagens.js';

// O app trabalha em datas civis no horário local do usuário; o servidor da
// Vercel vive em UTC. "Vence hoje" tem que ser o hoje do Brasil, senão de
// madrugada o lembrete sai com um dia de atraso ou de adianto. Precisa vir
// antes de qualquer `new Date()` do processo.
process.env.TZ = process.env.PUSH_TZ || 'America/Sao_Paulo';

function resposta(status, corpo) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function autorizado(req) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return false;
  return req.headers.get('authorization') === `Bearer ${segredo}`;
}

// Agrupa as assinaturas por uid: Map { uid → [{ caminho, dados }] }.
function porUsuario(docs) {
  const mapa = new Map();
  for (const d of docs) {
    const { uid, endpoint, keys } = d.dados;
    if (!uid || !endpoint || !keys) continue;
    if (!mapa.has(uid)) mapa.set(uid, []);
    mapa.get(uid).push(d);
  }
  return mapa;
}

// Processa um usuário: monta as notificações e manda pra cada aparelho dele.
async function processarUsuario(uid, assinaturas, resumo) {
  const userDoc = await lerDoc(`users/${uid}`);

  // Conta apagada (ou nunca criou o doc): as assinaturas ficaram órfãs.
  if (!userDoc) {
    await Promise.all(assinaturas.map((a) => apagarDoc(a.caminho)));
    resumo.removidas += assinaturas.length;
    return;
  }

  const lista = montarNotificacoes(userDoc);
  const idsPendentes = new Set(lista.map((n) => n.id));

  await Promise.all(
    assinaturas.map(async ({ caminho, dados }) => {
      const jaEnviadas = new Set(Array.isArray(dados.enviadas) ? dados.enviadas : []);
      const novas = lista.filter((n) => !jaEnviadas.has(n.id));
      const entregues = [];

      for (const n of novas) {
        const r = await enviarPush(dados, {
          titulo: n.titulo,
          corpo: n.corpo,
          tag: n.tag,
          urgente: n.urgente,
          data: { url: '/', tipo: n.tipo, id: n.id },
        });
        if (r.ok) {
          entregues.push(n.id);
          resumo.enviadas += 1;
        } else if (r.morta) {
          // Endpoint sumiu: o navegador revogou ou a assinatura expirou.
          await apagarDoc(caminho);
          resumo.removidas += 1;
          return;
        } else {
          resumo.erros.push({ uid, id: n.id, erro: r.erro });
        }
      }

      // Poda + registra o que foi: (já enviadas ∪ entregues) ∩ pendentes.
      const enviadas = [...jaEnviadas, ...entregues].filter((id) => idsPendentes.has(id));
      const mudou = enviadas.length !== jaEnviadas.size || entregues.length > 0;
      if (mudou) await atualizarCampos(caminho, { enviadas, ultimoEnvioEm: new Date() });
    }),
  );
}

export async function GET(req) {
  if (!autorizado(req)) return resposta(401, { erro: 'não autorizado' });

  const resumo = { usuarios: 0, assinaturas: 0, enviadas: 0, removidas: 0, erros: [] };

  try {
    prepararPush();
    const docs = await listarColecao('pushSubs');
    resumo.assinaturas = docs.length;
    const grupos = porUsuario(docs);
    resumo.usuarios = grupos.size;

    // Em lotes pra não abrir centenas de conexões de uma vez quando a base
    // crescer; dentro do lote cada usuário roda em paralelo.
    const LOTE = 10;
    const entradas = [...grupos.entries()];
    for (let i = 0; i < entradas.length; i += LOTE) {
      await Promise.all(
        entradas.slice(i, i + LOTE).map(([uid, subs]) =>
          processarUsuario(uid, subs, resumo).catch((err) => {
            resumo.erros.push({ uid, erro: err?.message || String(err) });
          }),
        ),
      );
    }

    return resposta(200, resumo);
  } catch (err) {
    console.error('[push/enviar]', err);
    return resposta(500, { erro: err?.message || String(err), ...resumo });
  }
}
