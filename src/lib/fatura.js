// fatura.js — ciclo de fatura do cartão de crédito.
//
// Regra do banco: as compras no cartão se acumulam numa fatura que FECHA num
// dia do mês e é PAGA no vencimento. Comprei em agosto, pago com o salário de
// setembro.
//
// Internamente a fatura é identificada pelo mês em que FECHA (`faturaMes`).
// Pra quem lê, o nome é outro (rotuloFatura): o mês em que a maior parte das
// compras dela foi feita. Fecha dia 3 de novembro = compras de 4/out a 3/nov =
// "fatura de outubro".
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
function dataFechamento(faturaMes, diaFechamento) {
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

// Mês em que uma fatura é paga. Vencimento depois do dia de fechamento cai no
// MESMO mês (fecha 3/nov, vence 10/nov); antes ou igual, no seguinte (fecha
// 28/out, vence 5/nov). Sem vencimento informado, o mês seguinte ao que dá nome
// à fatura — "comprei em outubro, pago em novembro" — que no fechamento padrão
// (último dia) é o seguinte ao do fechamento, como sempre foi.
export function mesPagamentoDaFatura(faturaMes, diaFechamento, diaVencimento) {
  const venc = Number(diaVencimento) || 0;
  if (venc < 1) return mesSeguinteDe(rotuloFatura(faturaMes, diaFechamento));
  return venc > fechamentoDoMes(faturaMes, diaFechamento) ? faturaMes : mesSeguinteDe(faturaMes);
}

// Mês (yyyy-mm) que dá NOME à fatura: aquele em que caiu a maior parte do
// ciclo. Fechando até o dia 15, o ciclo mora quase todo no mês anterior ao do
// fechamento; depois disso, no próprio mês. Com o fechamento padrão (último
// dia) é o próprio mês: "fatura de agosto = compras de agosto".
export function rotuloFatura(faturaMes, diaFechamento) {
  return fechamentoDoMes(faturaMes, diaFechamento) <= 15 ? mesAnteriorDe(faturaMes) : faturaMes;
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
// A fechada some quando o vencimento dela já passou: aí ela não é mais "a
// pagar", virou histórico. Com o dia de vencimento informado a conta é pela
// data; sem ele, pelo mês.
//
// `mes` é o id (mês do fechamento); `rotulo` é o mês que dá nome à fatura.
// `vence` é o mês do pagamento; `dataVence` a data exata (yyyy-mm-dd), null
// quando o cartão não tem dia de vencimento informado.
// `cartaoId` segue a convenção de totalFatura: ausente = todos os cartões.
export function faturasEmAberto(txs, diaFechamento, hoje, cartaoId, diaVencimento) {
  const mesAtual = hoje.slice(0, 7);
  const mesAberta = faturaDaCompra(hoje, diaFechamento);
  const aberta = {
    mes: mesAberta,
    rotulo: rotuloFatura(mesAberta, diaFechamento),
    total: totalFatura(txs, mesAberta, diaFechamento, cartaoId),
    fecha: dataFechamento(mesAberta, diaFechamento),
    vence: mesPagamentoDaFatura(mesAberta, diaFechamento, diaVencimento),
    dataVence: dataVencimentoFatura(mesAberta, diaFechamento, diaVencimento),
  };

  const mesFechada = mesAnteriorDe(mesAberta);
  const venceFechada = mesPagamentoDaFatura(mesFechada, diaFechamento, diaVencimento);
  const dataVenceFechada = dataVencimentoFatura(mesFechada, diaFechamento, diaVencimento);
  const totalFechada = totalFatura(txs, mesFechada, diaFechamento, cartaoId);
  const aPagar = dataVenceFechada ? dataVenceFechada >= hoje : venceFechada >= mesAtual;
  const fechada =
    aPagar && totalFechada > 0
      ? {
          mes: mesFechada,
          rotulo: rotuloFatura(mesFechada, diaFechamento),
          total: totalFechada,
          vence: venceFechada,
          dataVence: dataVenceFechada,
        }
      : null;

  return { aberta, fechada };
}

// Data (yyyy-mm-dd) em que a fatura de `faturaMes` vence, pelo dia de
// vencimento do cartão. Cai no mês de pagamento (mesPagamentoDaFatura); um dia
// que o mês não comporta vira o último. null = cartão sem vencimento informado.
export function dataVencimentoFatura(faturaMes, diaFechamento, diaVencimento) {
  const dia = Number(diaVencimento) || 0;
  if (dia < 1) return null;
  const mes = mesPagamentoDaFatura(faturaMes, diaFechamento, diaVencimento);
  return `${mes}-${String(Math.min(dia, diasNoMes(mes))).padStart(2, "0")}`;
}

// Faturas que vencem entre hoje e `diasJanela` dias, uma por cartão com
// vencimento informado. É o lembrete que substitui o "vence em N dias" de cada
// conta no crédito: no cartão quem vence é a fatura, não a compra.
//   [{ id, cartaoId, cartaoNome, mes, rotulo, data, valor }]
// O id leva o mês da fatura — o lembrete de outubro não herda o "lido" do de
// setembro.
export function faturasAVencer(txs, cartoes, hoje, diasJanela = 7) {
  const lim = new Date(`${hoje}T12:00:00`);
  lim.setDate(lim.getDate() + diasJanela);
  const limite = `${lim.getFullYear()}-${String(lim.getMonth() + 1).padStart(2, "0")}-${String(lim.getDate()).padStart(2, "0")}`;
  const out = [];
  for (const cartao of cartoes || []) {
    if (!(cartao.diaVencimento > 0)) continue;
    const fech = cartao.diaFechamento || 0;
    const { aberta, fechada } = faturasEmAberto(txs, fech, hoje, cartao.id, cartao.diaVencimento);
    for (const f of [fechada, aberta]) {
      if (!f || !(f.total > 0)) continue;
      const data = dataVencimentoFatura(f.mes, fech, cartao.diaVencimento);
      if (data < hoje || data > limite) continue;
      out.push({
        id: `fatura-${cartao.id}-${f.mes}`,
        cartaoId: cartao.id,
        cartaoNome: cartao.nome,
        mes: f.mes,
        rotulo: f.rotulo,
        data,
        valor: f.total,
      });
      break; // uma fatura por cartão: a mais antiga que ainda vai vencer
    }
  }
  return out;
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
    faturas: faturasEmAberto(txs, cartao.diaFechamento || 0, hoje, cartao.id, cartao.diaVencimento),
  }));

  const orfas = faturasEmAberto(txs, diaFechamentoGlobal, hoje, null);
  if (orfas.fechada || orfas.aberta.total > 0) {
    grupos.push({ cartao: null, faturas: orfas });
  }
  return grupos;
}
