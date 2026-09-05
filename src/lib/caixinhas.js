// caixinhas.js — o saldo de uma caixinha.
//
// Mora em lib/ porque não é só a tela de caixinhas que pergunta isso: o cálculo
// de rendimento (lib/selic.js) precisa do principal, e os insights precisam do
// quanto já foi juntado. Antes cada um refazia o mesmo reduce.

// Soma de tudo que está dentro da caixinha: depósitos, saldo inicial e saques.
// Saque é gravado com valor NEGATIVO justamente pra caber nesta soma — ver o
// resgate em app.jsx. É o principal, sem rendimento: quem quer o valor com
// rendimento usa `comRendimento` (lib/selic.js).
export function valorAtual(cx) {
  return (cx?.depositos || []).reduce((s, d) => s + (Number(d.valor) || 0), 0);
}

// Depósitos do mês no formato que a lista de Transações consome.
//
// Guardar dinheiro é um movimento como outro qualquer: sai do que estava
// disponível pra gastar e vai pra caixinha. Só que isso aparecia apenas na tela
// da caixinha e, de lado, no orçamento do mês (`guardadoNoMes` já abate o
// valor) — em Transações não havia linha nenhuma, e o dinheiro parecia ter
// evaporado do mês.
//
// As linhas são DERIVADAS: não existe tx gravada por trás delas, e por isso
// ficam FORA do "Total" da tela. Contá-las lá somaria o valor duas vezes — uma
// abatendo o orçamento, outra entrando como gasto.
//
// Ficam de fora:
//   • saques (valor negativo) — o resgate já cria uma entrada de verdade;
//   • saldo inicial (`tipo: "inicial"`) — dinheiro que já estava na caixinha
//     quando ela nasceu, não saiu deste mês (mesmo critério do `guardadoNoMes`);
//   • depósito do parceiro — a lista mostra os lançamentos de quem está vendo.
export function depositosDoMes(caixinhas, mes, meuUid) {
  const linhas = [];
  for (const c of caixinhas || []) {
    for (const d of c.depositos || []) {
      if (!(d.data || "").startsWith(mes)) continue;
      if (!(d.valor > 0)) continue;
      if (d.tipo === "inicial") continue;
      if (d.feitoPor && meuUid && d.feitoPor !== meuUid) continue;
      linhas.push({
        id: `cxdep-${c.id}-${d.id}`,
        tipo: "guardado",
        descricao: c.nome,
        valor: d.valor,
        data: d.data,
        caixinhaId: c.id,
        caixinhaCor: c.cor,
        origem: d.origem || null,
      });
    }
  }
  return linhas;
}
