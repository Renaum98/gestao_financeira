// calcular.js — lógica pura das notificações (sem React). Calcula lembretes de
// contas a vencer, parcelamentos terminando, recorrências a revisar e alertas
// de orçamento. Também devolve `naoLidas` para alimentar o badge.
//
// `orcamentos` é opcional — só geram alerta as categorias com valor > 0
// definido pelo usuário (orçamento por categoria é uma medida opcional).

import { chaveMes, mesSeguinteDe } from '../../lib/datas.js';

export function calcularNotificacoes(
  txs,
  recorrentes = [],
  lidas = [],
  convites = [],
  notifsParceria = [],
  orcamentos = {},
) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const lim7 = new Date(hoje);
  lim7.setDate(lim7.getDate() + 7);
  const lim60 = new Date(hoje);
  lim60.setDate(lim60.getDate() + 60);

  const dataDe = (yyyymmdd) => {
    const [y, m, d] = yyyymmdd.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const proximas = txs
    .filter((t) => {
      if (t.tipo === 'entrada') return false;
      if (!t.recorrenteId && !t.parcelas) return false;
      const dt = dataDe(t.data);
      return dt >= hoje && dt <= lim7;
    })
    .sort((a, b) => a.data.localeCompare(b.data));

  const terminando = txs
    .filter((t) => {
      if (!t.parcelas) return false;
      if (t.parcelas.atual !== t.parcelas.total) return false;
      const dt = dataDe(t.data);
      return dt >= hoje && dt <= lim60;
    })
    .sort((a, b) => a.data.localeCompare(b.data));

  // Recorrências sem pré-geração para o próximo mês — sinaliza que o usuário
  // pode revisar (continuar ou cancelar).
  const proximoYYMM = mesSeguinteDe(chaveMes(hoje));
  const recsRevisar = recorrentes.filter(
    (r) => r.ultimoMesGerado && r.ultimoMesGerado < proximoYYMM,
  );

  // ─── Alertas de orçamento por categoria (mês atual) ───────────────────
  // Só categorias com orçamento explícito (>0) entram aqui. Calcula o gasto
  // do mês corrente por categoria e classifica em "estourada" (>100%) ou
  // "perto do limite" (≥90% e ≤100%). IDs por mês para não repetir alerta
  // após virada de mês.
  const mesAtual = chaveMes(hoje);
  const gastosMesPorCat = {};
  for (const t of txs) {
    if (t.tipo === 'entrada') continue;
    if (!t.data || !t.data.startsWith(mesAtual)) continue;
    gastosMesPorCat[t.categoria] = (gastosMesPorCat[t.categoria] || 0) + t.valor;
  }
  const orcEstourados = [];
  const orcProximos = [];
  for (const [catId, orc] of Object.entries(orcamentos || {})) {
    if (!(orc > 0)) continue;
    const gasto = gastosMesPorCat[catId] || 0;
    const pct = (gasto / orc) * 100;
    if (pct > 100) {
      orcEstourados.push({ id: `orc-est-${catId}-${mesAtual}`, catId, gasto, orc, pct, mes: mesAtual });
    } else if (pct >= 90) {
      orcProximos.push({ id: `orc-prox-${catId}-${mesAtual}`, catId, gasto, orc, pct, mes: mesAtual });
    }
  }
  // Ordena: maiores % primeiro (mais urgente no topo).
  orcEstourados.sort((a, b) => b.pct - a.pct);
  orcProximos.sort((a, b) => b.pct - a.pct);

  const setLidas = new Set(lidas);
  const idsAtivos = [
    ...proximas.map((t) => t.id),
    ...terminando.map((t) => t.id),
    ...recsRevisar.map((r) => r.id),
    ...orcEstourados.map((o) => o.id),
    ...orcProximos.map((o) => o.id),
  ];
  // Convites pendentes e eventos de parceria sempre contam como "não lidos".
  const naoLidas =
    idsAtivos.filter((id) => !setLidas.has(id)).length +
    convites.length +
    notifsParceria.length;

  return {
    proximas,
    terminando,
    recsRevisar,
    convites,
    orcEstourados,
    orcProximos,
    naoLidas,
    idsAtivos,
  };
}
