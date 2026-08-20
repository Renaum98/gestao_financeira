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
