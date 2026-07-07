// saldo-mes.js — agregados financeiros de um mês.
// Centraliza a conta que antes vivia duplicada no Dashboard (cabeçalho do mês
// ativo + cada slide do carrossel). Funções puras, sem React.

import { totalGeral, totalEntradas, txDoMes } from "../data.js";
import { obterOrcBaseDoMes, mesCorrente } from "./orcamento.js";

// Soma depósitos em caixinhas feitos no mês, separando o que é meu do parceiro.
// Saques (valor <= 0) são ignorados: voltam como entrada do mês e seriam
// contados em dobro. Em conta solo, sem feitoPor, tudo cai em "meu".
export function guardadoNoMes(caixinhas, mes, meuUid, partnerUid) {
  let meu = 0;
  let parceiro = 0;
  for (const c of caixinhas || []) {
    for (const d of c.depositos || []) {
      if (!d.data || !d.data.startsWith(mes)) continue;
      if (!(d.valor > 0)) continue;
      // Saldo inicial: dinheiro que já existia na caixinha ao criá-la. Não é
      // dinheiro saindo do orçamento agora, então não abate o saldo do mês.
      if (d.tipo === "inicial") continue;
      const dono = d.feitoPor || meuUid || "_anon";
      if (dono === (meuUid || "_anon")) meu += d.valor;
      else if (partnerUid && dono === partnerUid) parceiro += d.valor;
    }
  }
  return { meu, parceiro };
}

// Calcula todos os agregados exibidos no card de saldo de um mês: gasto, delta
// vs. mês anterior, orçamento, restante e os equivalentes do parceiro.
export function calcularSaldoMes(
  mesCard,
  { txs, partnerTxs, todosMeses, preferences, caixinhas, meuUid, partnerUid, orcBaseParceiro },
) {
  const idx = todosMeses.indexOf(mesCard);
  const mesAnt = idx >= 0 && idx < todosMeses.length - 1 ? todosMeses[idx + 1] : null;
  const txMes = txDoMes(txs, mesCard);
  const txMesAnt = mesAnt ? txDoMes(txs, mesAnt) : [];
  const total = totalGeral(txMes);
  const totalAnt = totalGeral(txMesAnt);
  const entradas = totalEntradas(txMes);
  const delta = totalAnt > 0 ? ((total - totalAnt) / totalAnt) * 100 : 0;
  // Mês atual, futuro e o anterior ao atual usam o orçamento corrente; meses
  // mais antigos usam o snapshot congelado (preferences.orcBaseAt). Evita que
  // alterações de hoje retroajam ao "Restante" de meses antigos.
  const orcBase = obterOrcBaseDoMes(mesCard, preferences, mesCorrente());
  const { meu: guardado, parceiro: guardadoParceiro } = guardadoNoMes(
    caixinhas,
    mesCard,
    meuUid,
    partnerUid,
  );
  // Diferença trazida do mês anterior: o "sobrou/faltou" que o usuário optou
  // por carregar (ver modal de virada de mês). Positivo = sobra que soma ao
  // orçamento; negativo = dívida que o reduz. Guardado por mês em
  // preferences.carryover[yyyy-mm]. Zero/ausente = mês não recebeu diferença.
  const carryover = preferences?.carryover?.[mesCard] || 0;
  const orcTotal = orcBase + entradas - guardado + carryover;
  const restante = orcTotal - total;

  const parceiroDoMes = txDoMes(partnerTxs, mesCard);
  const totalParceiro = totalGeral(parceiroDoMes);
  const entradasParceiro = totalEntradas(parceiroDoMes);
  const orcTotalParceiro = orcBaseParceiro + entradasParceiro - guardadoParceiro;
  const restanteParceiro = orcTotalParceiro - totalParceiro;
  const disponivelConjunto = restante + restanteParceiro;

  return {
    txMes,
    txMesAnt,
    total,
    totalAnt,
    entradas,
    delta,
    orcBase,
    guardado,
    guardadoParceiro,
    carryover,
    orcTotal,
    restante,
    totalParceiro,
    entradasParceiro,
    orcTotalParceiro,
    restanteParceiro,
    disponivelConjunto,
    temEntrada: entradas > 0,
  };
}
