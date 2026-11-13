// recorrentes.js — contas de uma recorrência: o que já foi pago, o que falta,
// quanto dá no total e quando ela acabou.
//
// A fonte é sempre o lançamento (tx) de cada mês, não o molde da recorrência:
// mês com o valor alterado à mão conta pelo valor alterado, e mês excluído não
// conta. O molde só entra nos meses que o gerador ainda não lançou (depois de
// `ultimoMesGerado`).

import { valorRecNoMes } from '../data.js';
import { hojeISO, mesShift } from './datas.js';

// Uma ocorrência conta como paga quando foi marcada como paga ou quando o dia
// dela já passou. No próprio dia ela ainda está "a vencer".
function ehPaga(tx, hoje) {
  return Boolean(tx.pago) || tx.data < hoje;
}

// Recorrência com fim que não tem mais nada a cobrar: o último mês já passou,
// ou estamos nele e não sobrou conta em aberto (vencida, paga antes ou
// excluída).
export function recorrenteEncerrada(r, txs, hoje = hojeISO()) {
  if (!r?.fim) return false;
  const mesHoje = hoje.slice(0, 7);
  if (r.fim < mesHoje) return true;
  if (r.fim > mesHoje) return false;
  if ((r.ultimoMesGerado || '') < r.fim) return false;
  return !txs.some((t) => t.recorrenteId === r.id && !ehPaga(t, hoje));
}

// Histórico e saldo de uma recorrência.
// - pagas: ocorrências já pagas, da mais recente pra mais antiga
// - faltam: o que ainda vai ser cobrado (só com fim definido), em ordem
// - valorTotal: pagas + as que faltam (só com fim definido)
// - valorMes: quanto ela pesa no mês atual (0 se o mês foi excluído)
export function resumoRecorrente(r, txs, hoje = hojeISO()) {
  const mesHoje = hoje.slice(0, 7);
  const daRec = txs.filter((t) => t.recorrenteId === r.id);
  const gerado = r.ultimoMesGerado || '';

  const pagas = daRec
    .filter((t) => ehPaga(t, hoje))
    .sort((a, b) => b.data.localeCompare(a.data));
  const totalPago = pagas.reduce((s, t) => s + (Number(t.valor) || 0), 0);

  // Mês atual: o que foi lançado nele. Ainda não lançado (e dentro da
  // vigência) usa o molde.
  const doMes = daRec.filter((t) => t.data.startsWith(mesHoje));
  const dentro = (!r.inicio || r.inicio <= mesHoje) && (!r.fim || r.fim >= mesHoje);
  const valorMes = doMes.length
    ? doMes.reduce((s, t) => s + (Number(t.valor) || 0), 0)
    : dentro && mesHoje > gerado ? valorRecNoMes(r, mesHoje) : 0;

  if (!r.fim || !r.inicio) {
    return { pagas, totalPago, faltam: null, totalFalta: null, valorTotal: null, totalParcelas: null, valorMes };
  }

  const faltam = daRec
    .filter((t) => !ehPaga(t, hoje))
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((t) => ({ chave: t.id, mes: t.data.slice(0, 7), data: t.data, valor: Number(t.valor) || 0 }));
  // Meses da vigência que o gerador ainda não lançou.
  const desde = gerado && gerado >= r.inicio ? mesShift(gerado, 1) : r.inicio;
  for (let m = desde > mesHoje ? desde : mesHoje; m <= r.fim; m = mesShift(m, 1)) {
    faltam.push({ chave: m, mes: m, data: null, valor: valorRecNoMes(r, m) });
  }
  const totalFalta = faltam.reduce((s, f) => s + f.valor, 0);

  return {
    pagas,
    totalPago,
    faltam,
    totalFalta,
    valorTotal: totalPago + totalFalta,
    totalParcelas: pagas.length + faltam.length,
    valorMes,
  };
}
