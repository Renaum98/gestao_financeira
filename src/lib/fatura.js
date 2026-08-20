// fatura.js — ciclo de fatura do cartão de crédito.
//
// Regra do banco: as compras no cartão se acumulam numa fatura que FECHA num
// dia do mês e só é PAGA no mês seguinte. Comprei em agosto, pago com o
// salário de setembro.
//
// IMPORTANTE — isto NÃO mexe no saldo do mês. A conta de saldo continua por
// competência: a compra abate o mês em que foi feita (ver lib/saldo-mes.js).
// Este módulo existe só para MOSTRAR o ciclo — em que fatura a compra caiu e
// quando ela vence. Se um dia o app virar regime de caixa, é aqui que muda.

import { diasNoMes, mesAnteriorDe, mesSeguinteDe } from "./datas.js";

export const PAG_CARTAO = "Cartão de crédito";

// Dia em que a fatura de um mês fecha. 0/ausente = último dia do mês (padrão),
// que dá o comportamento "fatura de agosto = compras de agosto". Um dia que o
// mês não comporta (31 em fevereiro) também cai no último dia.
export function fechamentoDoMes(mes, diaFechamento) {
  const ultimo = diasNoMes(mes);
  const dia = Number(diaFechamento) || 0;
  return dia >= 1 && dia < ultimo ? dia : ultimo;
}

// Data (yyyy-mm-dd) em que a fatura de um mês fecha.
export function dataFechamento(faturaMes, diaFechamento) {
  const dia = fechamentoDoMes(faturaMes, diaFechamento);
  return `${faturaMes}-${String(dia).padStart(2, "0")}`;
}

// Em qual fatura (yyyy-mm) uma compra cai. Compras feitas DEPOIS do fechamento
// já entram na fatura do mês seguinte — igual ao banco.
export function faturaDaCompra(data, diaFechamento) {
  if (!data) return null;
  const mes = data.slice(0, 7);
  const dia = Number(data.slice(8, 10));
  return dia <= fechamentoDoMes(mes, diaFechamento) ? mes : mesSeguinteDe(mes);
}

// Mês em que uma fatura é paga — sempre o seguinte ao do fechamento.
export function mesPagamentoDaFatura(faturaMes) {
  return mesSeguinteDe(faturaMes);
}

// Soma das compras no cartão que compõem uma fatura. Usa `valor` (o valor do
// mês), igual ao resto dos agregados — parcelas já vêm lançadas mês a mês.
//
// `cartaoId` recorta por cartão: `undefined` soma todos (o comportamento de
// quem não cadastrou cartão nenhum), um id soma só o dele, e `null` soma as
// órfãs — as que ficaram sem cartão depois que um cartão foi apagado.
export function totalFatura(txs, faturaMes, diaFechamento, cartaoId) {
  let total = 0;
  for (const tx of txs || []) {
    if (tx.tipo === "entrada" || tx.pagamento !== PAG_CARTAO) continue;
    if (cartaoId !== undefined && (tx.cartaoId || null) !== cartaoId) continue;
    if (faturaDaCompra(tx.data, diaFechamento) === faturaMes) total += tx.valor || 0;
  }
  return total;
}

// As duas faturas que interessam hoje:
//   aberta  — ainda acumulando compras, fecha no futuro
//   fechada — já fechou e ainda vai ser paga (null quando não há)
// A fechada some quando o mês de vencimento dela já passou: aí ela não é mais
// "a pagar", virou histórico.
//
// `cartaoId` segue a convenção de totalFatura: ausente = todos os cartões.
export function faturasEmAberto(txs, diaFechamento, hoje, cartaoId) {
  const mesAtual = hoje.slice(0, 7);
  const mesAberta = faturaDaCompra(hoje, diaFechamento);
  const aberta = {
    mes: mesAberta,
    total: totalFatura(txs, mesAberta, diaFechamento, cartaoId),
    fecha: dataFechamento(mesAberta, diaFechamento),
    vence: mesPagamentoDaFatura(mesAberta),
  };

  const mesFechada = mesAnteriorDe(mesAberta);
  const venceFechada = mesPagamentoDaFatura(mesFechada);
  const totalFechada = totalFatura(txs, mesFechada, diaFechamento, cartaoId);
  const fechada =
    venceFechada >= mesAtual && totalFechada > 0
      ? { mes: mesFechada, total: totalFechada, vence: venceFechada }
      : null;

  return { aberta, fechada };
}

// As faturas de cada cartão cadastrado, na ordem da lista. Com zero cartões,
// devolve um grupo único sem cartão — o card do Dashboard de antes. Um grupo
// "sem cartão" também aparece no fim quando sobrou tx órfã (cartão apagado com
// "deixar sem cartão") e ainda existe algum cartão cadastrado.
export function faturasPorCartao(txs, cartoes, diaFechamentoGlobal, hoje) {
  const lista = cartoes || [];
  if (lista.length === 0) {
    return [{ cartao: null, faturas: faturasEmAberto(txs, diaFechamentoGlobal, hoje) }];
  }

  const grupos = lista.map((cartao) => ({
    cartao,
    faturas: faturasEmAberto(txs, cartao.diaFechamento || 0, hoje, cartao.id),
  }));

  const orfas = faturasEmAberto(txs, diaFechamentoGlobal, hoje, null);
  if (orfas.fechada || orfas.aberta.total > 0) {
    grupos.push({ cartao: null, faturas: orfas });
  }
  return grupos;
}
