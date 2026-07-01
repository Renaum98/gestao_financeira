// notifications.js — Disparo de notificações nativas (Web Notifications API)
// para contas a vencer. Funciona no Chrome/Android e em PWAs instalados no iOS 16.4+.
// As notificações são locais (não usam push remoto) — disparadas sempre que o
// app é aberto e há itens não notificados pendentes.

import { CATEGORIAS, fmtBRL } from '../data.js';

const ENVIADAS_KEY = 'finca.notif.enviadas';

export function notificacoesSuportadas() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function permissaoNotificacoes() {
  if (!notificacoesSuportadas()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function pedirPermissaoNotificacoes() {
  if (!notificacoesSuportadas()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const p = await Notification.requestPermission();
    return p;
  } catch {
    return 'denied';
  }
}

function lerEnviadas() {
  try {
    const raw = localStorage.getItem(ENVIADAS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function gravarEnviadas(set, idsAtivos) {
  // Mantém só IDs ainda ativos para não crescer indefinidamente.
  const ativos = new Set(idsAtivos);
  const limpo = [...set].filter((id) => ativos.has(id));
  try {
    localStorage.setItem(ENVIADAS_KEY, JSON.stringify(limpo));
  } catch {}
}

async function mostrarNotificacao(titulo, opcoes) {
  // Prefere disparar via service worker (suporta ações, persiste, agrupa).
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(titulo, opcoes);
        return true;
      }
    } catch {}
  }
  // Fallback: Notification constructor (apenas funciona em desktop ou web).
  try {
    new Notification(titulo, opcoes);
    return true;
  } catch {
    return false;
  }
}

// Dispara notificações nativas para itens não lidos e ainda não notificados,
// com vencimento até `diasJanela` dias (default 7).
export async function dispararPendentes({
  proximas = [],
  terminando = [],
  orcEstourados = [],
  orcProximos = [],
  lidas = [],
  idsAtivos = [],
  diasJanela = 7,
  t = (s) => s, // função de tradução (de useT); identidade se não passada
}) {
  if (!notificacoesSuportadas()) return 0;
  if (Notification.permission !== 'granted') return 0;

  const enviadas = lerEnviadas();
  const lidasSet = new Set(lidas);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diasAte = (yyyymmdd) => {
    const [y, m, d] = yyyymmdd.split('-').map(Number);
    return Math.ceil((new Date(y, m - 1, d) - hoje) / (1000 * 60 * 60 * 24));
  };
  const rotulo = (n) =>
    n <= 0 ? t('Vence hoje') : n === 1 ? t('Vence amanhã') : t('Vence em {n} dias', { n });

  let disparadas = 0;

  for (const tx of proximas) {
    if (enviadas.has(tx.id) || lidasSet.has(tx.id)) continue;
    const n = diasAte(tx.data);
    if (n > diasJanela) continue;
    const ok = await mostrarNotificacao(tx.descricao, {
      body: `${rotulo(n)} · ${fmtBRL(tx.valor)}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `vencimento-${tx.id}`,
      requireInteraction: n <= 1,
      data: { url: '/', tipo: 'vencimento', id: tx.id },
    });
    if (ok) {
      enviadas.add(tx.id);
      disparadas += 1;
    }
  }

  for (const tx of terminando) {
    if (enviadas.has(tx.id) || lidasSet.has(tx.id)) continue;
    const ok = await mostrarNotificacao(t('Parcelamento terminando'), {
      body: `${tx.descricao}${t(' — última parcela próxima ({atual}/{total})', { atual: tx.parcelas.atual, total: tx.parcelas.total })}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `parcela-fim-${tx.id}`,
      data: { url: '/', tipo: 'parcela-fim', id: tx.id },
    });
    if (ok) {
      enviadas.add(tx.id);
      disparadas += 1;
    }
  }

  // Orçamento de categoria estourado (>100%) — vermelho.
  for (const a of orcEstourados) {
    if (enviadas.has(a.id) || lidasSet.has(a.id)) continue;
    const nome = t(CATEGORIAS[a.catId]?.nome || 'Categoria');
    const ok = await mostrarNotificacao(t('{cat} estourou o orçamento', { cat: nome }), {
      body: t('{gasto} de {orc} ({pct}%).', { gasto: fmtBRL(a.gasto), orc: fmtBRL(a.orc), pct: Math.round(a.pct) }),
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: a.id,
      data: { url: '/', tipo: 'orc-est', id: a.id },
    });
    if (ok) {
      enviadas.add(a.id);
      disparadas += 1;
    }
  }

  // Orçamento de categoria perto do limite (≥90% e ≤100%) — aviso.
  for (const a of orcProximos) {
    if (enviadas.has(a.id) || lidasSet.has(a.id)) continue;
    const nome = t(CATEGORIAS[a.catId]?.nome || 'Categoria');
    const ok = await mostrarNotificacao(t('{cat} chegando ao limite', { cat: nome }), {
      body: t('Você já usou {pct}% do orçamento ({gasto} de {orc}).', { pct: Math.round(a.pct), gasto: fmtBRL(a.gasto), orc: fmtBRL(a.orc) }),
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: a.id,
      data: { url: '/', tipo: 'orc-prox', id: a.id },
    });
    if (ok) {
      enviadas.add(a.id);
      disparadas += 1;
    }
  }

  gravarEnviadas(enviadas, idsAtivos);
  return disparadas;
}
