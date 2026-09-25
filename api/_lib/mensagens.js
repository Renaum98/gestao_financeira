// mensagens.js — monta, no servidor, as notificações que um usuário tem a
// receber hoje: título, corpo e um id estável pra não repetir.
//
// É o espelho de `dispararPendentes` (src/lib/notifications.js), que faz o
// mesmo no navegador quando o app abre. Os textos são os mesmos de propósito:
// pro usuário, o lembrete que chega com o app fechado tem que ser idêntico ao
// que ele veria abrindo o app. A regra de negócio (o que está vencendo, o que
// estourou) vem de `calcularNotificacoes`, importada direto do app — a Vercel
// empacota o que a função importa, mesmo fora de api/.
//
// O que NÃO dá pra reaproveitar do cliente é a camada de apresentação:
// `fmtBRL` lê a moeda de um estado de módulo e `useT` é um hook. Aqui cada
// usuário tem a sua moeda e o seu idioma, e a função processa todos numa
// invocação só — então formatação e tradução são funções puras que recebem
// as preferências.

import { calcularNotificacoes } from '../../src/screens/notificacoes/calcular.js';
import { EN } from '../../src/lib/i18n-dict.js';
import { MOEDAS } from '../../src/lib/moeda.js';
import { CATEGORIAS } from '../../src/data.js';
import { atividadeDoParceiro, textoAtividade } from '../../src/lib/atividade-caixinhas.js';

const DICIONARIOS = { en: EN };

// Mesma interpolação de `traduzir` (src/lib/i18n.jsx), sem o React em volta.
function traduzir(lang, texto, vars) {
  let saida = texto;
  const dic = DICIONARIOS[lang];
  if (dic && dic[texto] != null) saida = dic[texto];
  if (vars) {
    for (const chave in vars) {
      saida = saida.split(`{${chave}}`).join(String(vars[chave]));
    }
  }
  return saida;
}

function formatarValor(codigoMoeda, v) {
  const m = MOEDAS[codigoMoeda] || MOEDAS.BRL;
  try {
    return new Intl.NumberFormat(m.locale, {
      style: 'currency',
      currency: m.codigo,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v || 0);
  } catch {
    return `${m.simbolo} ${(v || 0).toFixed(2)}`;
  }
}

// Nome da categoria: as fixas vêm do app; as personalizadas moram no doc do
// usuário. Não usamos `aplicarCategoriasCustom` porque ele muta o objeto
// global CATEGORIAS — e aqui o mesmo processo atende vários usuários seguidos.
function nomeCategoria(catId, categoriasCustom, t) {
  const custom = (categoriasCustom || []).find((c) => c.id === catId);
  if (custom?.nome) return custom.nome;
  return t(CATEGORIAS[catId]?.nome || 'Categoria');
}

// Dias entre hoje (meia-noite local) e uma data "yyyy-mm-dd".
function diasAte(yyyymmdd, hoje) {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  return Math.ceil((new Date(y, m - 1, d) - hoje) / (1000 * 60 * 60 * 24));
}

// Recebe o doc `users/{uid}` cru do Firestore e devolve:
//   lista     notificações pendentes: [{ id, titulo, corpo, tag, tipo, urgente }]
//   naoLidas  o número do sininho do app (mesma conta de calcularNotificacoes),
//             que viaja no push pro service worker pôr no ícone. Sem convites
//             e avisos de parceria — vivem em outras coleções e o app corrige
//             o número quando abre.
// `lidas` (preferences.notifLidas) já fica de fora — o que o usuário marcou
// como lido no app não vira push.
//
// `atividade` é o registro `partnerships/{pId}.atividade` de quem tem conta
// compartilhada: o que o parceiro fez nas caixinhas e o app ainda não trouxe
// pra dentro (ver src/lib/atividade-caixinhas.js).
export function montarNotificacoes(userDoc, { diasJanela = 7, atividade = [], uid } = {}) {
  const prefs = userDoc.preferences || {};
  const idioma = prefs.idioma || 'pt';
  const moeda = prefs.moeda || 'BRL';
  const t = (texto, vars) => traduzir(idioma, texto, vars);
  const fmt = (v) => formatarValor(moeda, v);

  const { proximas, terminando, orcEstourados, orcProximos, naoLidas } = calcularNotificacoes(
    userDoc.txs || [],
    userDoc.recorrentes || [],
    prefs.notifLidas || [],
    [],
    userDoc.notificacoesParceria || [],
    userDoc.orcamentos || {},
  );

  const lidas = new Set(prefs.notifLidas || []);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const rotulo = (n) =>
    n <= 0 ? t('Vence hoje') : n === 1 ? t('Vence amanhã') : t('Vence em {n} dias', { n });

  // Um aviso por id, o primeiro laço vence — igual ao cliente, onde o Set de
  // enviadas já tem o id quando o laço seguinte chega nele (uma parcela final
  // que vence esta semana é "vence em N dias", não também "terminando").
  const lista = [];
  const vistos = new Set();
  const incluir = (n) => {
    if (vistos.has(n.id)) return;
    vistos.add(n.id);
    lista.push(n);
  };

  for (const tx of proximas) {
    if (lidas.has(tx.id)) continue;
    const n = diasAte(tx.data, hoje);
    if (n > diasJanela) continue;
    incluir({
      id: tx.id,
      titulo: tx.descricao,
      corpo: `${rotulo(n)} · ${fmt(tx.valor)}`,
      tag: `vencimento-${tx.id}`,
      tipo: 'vencimento',
      urgente: n <= 1,
    });
  }

  for (const tx of terminando) {
    if (lidas.has(tx.id)) continue;
    incluir({
      id: tx.id,
      titulo: t('Parcelamento terminando'),
      corpo: `${tx.descricao}${t(' — última parcela próxima ({atual}/{total})', { atual: tx.parcelas.atual, total: tx.parcelas.total })}`,
      tag: `parcela-fim-${tx.id}`,
      tipo: 'parcela-fim',
      urgente: false,
    });
  }

  for (const a of orcEstourados) {
    if (lidas.has(a.id)) continue;
    const nome = nomeCategoria(a.catId, userDoc.categoriasCustom, t);
    incluir({
      id: a.id,
      titulo: t('{cat} estourou o orçamento', { cat: nome }),
      corpo: t('{gasto} de {orc} ({pct}%).', { gasto: fmt(a.gasto), orc: fmt(a.orc), pct: Math.round(a.pct) }),
      tag: a.id,
      tipo: 'orc-est',
      urgente: false,
    });
  }

  for (const a of orcProximos) {
    if (lidas.has(a.id)) continue;
    const nome = nomeCategoria(a.catId, userDoc.categoriasCustom, t);
    incluir({
      id: a.id,
      titulo: t('{cat} chegando ao limite', { cat: nome }),
      corpo: t('Você já usou {pct}% do orçamento ({gasto} de {orc}).', { pct: Math.round(a.pct), gasto: fmt(a.gasto), orc: fmt(a.orc) }),
      tag: a.id,
      tipo: 'orc-prox',
      urgente: false,
    });
  }

  // Só o que o app ainda não trouxe: se trouxe, o usuário já viu o aviso lá
  // dentro (e o sininho já conta ele em `notificacoesParceria`).
  const doParceiro = atividadeDoParceiro(atividade, uid, userDoc.atividadeParceriaVista);
  for (const ev of doParceiro) {
    const { titulo, corpo } = textoAtividade(ev, userDoc.partnerNome, t, fmt);
    incluir({ id: ev.id, titulo, corpo, tag: `parceria-${ev.id}`, tipo: ev.tipo, urgente: false });
  }

  return { lista, naoLidas: naoLidas + doParceiro.length };
}
