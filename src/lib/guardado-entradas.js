// guardado-entradas.js — cruzamento entre as entradas de um mês e o quanto
// delas já foi para dentro de uma caixinha.
//
// Quando um depósito tem `origem: { tipo: "entrada", descricao }`, aquele
// dinheiro entrou na conta mas não está mais disponível pra gastar. As telas
// usam esse mapa pra sinalizar a transação e pra não somar o valor guardado no
// "+X entradas" do card de saldo.
//
// O casamento é por DESCRIÇÃO (não por id): várias txs "Shopee" no mesmo mês
// contam como uma origem só, que é como o modal de depósito as apresenta.
// Funções puras, sem React.

// Total guardado no mês por descrição de entrada.
export function alocadoPorDescricao(caixinhas, txs, mes) {
  const m = {};
  for (const c of caixinhas || []) {
    for (const dep of c.depositos || []) {
      if (dep.origem?.tipo !== "entrada") continue;
      if (!(dep.data || "").startsWith(mes)) continue;
      if (!(dep.valor > 0)) continue;
      let desc = dep.origem.descricao;
      // Depósitos antigos guardavam só o id da tx — resolvemos pela descrição.
      if (!desc && dep.origem.entradaId) {
        desc = (txs || []).find((t) => t.id === dep.origem.entradaId)?.descricao;
      }
      if (desc) m[desc] = (m[desc] || 0) + dep.valor;
    }
  }
  return m;
}

// Mapa txId → quanto daquela entrada está guardado em caixinha.
// Dentro de um grupo (mesma descrição) o valor é rateado proporcionalmente:
// guardar 50 de duas entradas de 50 marca 25 em cada uma.
export function guardadoPorTx(txs, caixinhas, mes) {
  const out = {};
  const alocado = alocadoPorDescricao(caixinhas, txs, mes);
  if (Object.keys(alocado).length === 0) return out;

  const grupos = {};
  for (const t of txs || []) {
    if (t.tipo !== "entrada") continue;
    if (!(t.data || "").startsWith(mes)) continue;
    if (alocado[t.descricao] == null) continue;
    if (!grupos[t.descricao]) grupos[t.descricao] = [];
    grupos[t.descricao].push(t);
  }

  for (const desc in grupos) {
    const lista = grupos[desc];
    const total = lista.reduce((s, t) => s + t.valor, 0);
    if (total <= 0) continue;
    const fracao = Math.min(1, alocado[desc] / total);
    for (const t of lista) out[t.id] = t.valor * fracao;
  }
  return out;
}

// Devolve pra fora da caixinha o que uma entrada não banca mais — usado ao
// EXCLUIR ou EDITAR uma entrada.
//
// Sem isso o depósito vira órfão: ele continua abatendo o orçamento do mês
// (`guardadoNoMes`) enquanto a entrada que o financiava sumiu ou encolheu, e o
// mês fecha menor como se aquilo tivesse virado gasto. Corrigir a entrada tem
// que voltar ao estado de antes — inclusive tirando o dinheiro da caixinha.
//
// A regra é uma invariante simples, aplicada por grupo (descrição + mês):
//
//     guardado do grupo  ≤  soma das entradas do grupo
//
// Excluir a entrada zera o lado direito e devolve tudo; reduzir o valor devolve
// só o excesso; mudar descrição/data/tipo tira a tx do grupo antigo, que também
// passa a ter excesso. Um caso só resolve todos.
//
// `txsDepois` é a lista de transações COMO VAI FICAR (sem a excluída, ou já com
// a versão editada) e `escopos` são os grupos a checar. Devolve a nova lista de
// caixinhas, quanto foi devolvido e o detalhamento por caixinha (pro aviso na
// confirmação). Função pura: dá pra chamar só pra pré-visualizar, sem aplicar.
export function reconciliarGuardado(caixinhas, txsDepois, escopos) {
  const lista = caixinhas || [];
  const novoValor = {}; // "cxId|depId" → valor após o corte (0 = some)
  const porCaixinha = {};
  let removido = 0;

  for (const { descricao, mes } of escopos || []) {
    if (!descricao || !mes) continue;

    // Quanto de entrada aquele grupo ainda tem pra bancar depósitos.
    let capacidade = 0;
    for (const t of txsDepois || []) {
      if (t.tipo !== "entrada") continue;
      if (!(t.data || "").startsWith(mes)) continue;
      if (t.descricao !== descricao) continue;
      capacidade += t.valor;
    }

    // Depósitos bancados por esse grupo, do mais recente pro mais antigo:
    // desfazemos primeiro o depósito mais novo.
    const candidatos = [];
    for (const c of lista) {
      for (const d of c.depositos || []) {
        if (d.origem?.tipo !== "entrada") continue;
        if (!(d.valor > 0)) continue;
        if (!(d.data || "").startsWith(mes)) continue;
        let desc = d.origem.descricao;
        if (!desc && d.origem.entradaId) {
          desc = (txsDepois || []).find((t) => t.id === d.origem.entradaId)?.descricao;
        }
        if (desc !== descricao) continue;
        const chave = `${c.id}|${d.id}`;
        const valor = novoValor[chave] != null ? novoValor[chave] : d.valor;
        if (valor <= 0.005) continue;
        candidatos.push({ chave, cxId: c.id, data: d.data, valor });
      }
    }
    candidatos.sort((a, b) => b.data.localeCompare(a.data));

    const alocado = candidatos.reduce((s, c) => s + c.valor, 0);
    let excesso = alocado - capacidade;
    if (excesso <= 0.005) continue;

    for (const cand of candidatos) {
      if (excesso <= 0.005) break;
      const corte = Math.min(cand.valor, excesso);
      excesso -= corte;
      removido += corte;
      novoValor[cand.chave] = cand.valor - corte;
      porCaixinha[cand.cxId] = (porCaixinha[cand.cxId] || 0) + corte;
    }
  }

  if (removido <= 0.005) return { caixinhas: lista, removido: 0, detalhes: [] };

  const novas = lista.map((c) => {
    if (!porCaixinha[c.id]) return c;
    const depositos = (c.depositos || [])
      .map((d) => {
        const v = novoValor[`${c.id}|${d.id}`];
        return v == null ? d : { ...d, valor: v };
      })
      .filter((d) => {
        const v = novoValor[`${c.id}|${d.id}`];
        return v == null || v > 0.005; // zerado pelo corte → some do histórico
      });
    return { ...c, depositos };
  });

  const detalhes = lista
    .filter((c) => porCaixinha[c.id])
    .map((c) => ({ id: c.id, nome: c.nome, valor: porCaixinha[c.id] }));

  return { caixinhas: novas, removido, detalhes };
}

// Açúcar pra quem só mexeu numa tx: monta os escopos afetados (o grupo de onde
// ela saiu e o grupo pra onde foi) e reconcilia. `txDepois` nulo = exclusão.
export function ajustarGuardado(caixinhas, txsDepois, txAntes, txDepois) {
  const escopos = [];
  for (const t of [txAntes, txDepois]) {
    if (!t || t.tipo !== "entrada") continue;
    const mes = (t.data || "").slice(0, 7);
    if (escopos.some((e) => e.descricao === t.descricao && e.mes === mes)) continue;
    escopos.push({ descricao: t.descricao, mes });
  }
  if (escopos.length === 0) return { caixinhas: caixinhas || [], removido: 0, detalhes: [] };
  return reconciliarGuardado(caixinhas, txsDepois, escopos);
}

// Soma das entradas do mês que já foram parar numa caixinha.
export function totalEntradasGuardadas(txs, caixinhas, mes) {
  const mapa = guardadoPorTx(txs, caixinhas, mes);
  let s = 0;
  for (const id in mapa) s += mapa[id];
  return s;
}
