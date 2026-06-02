// orcamento.js — utilidades de orçamento base + snapshots por mês.
//
// Por que snapshots: o "Restante" / "Sobrou" de um mês depende do orçamento
// daquele mês. Se o usuário mudar o orçamento mensal hoje, não queremos que
// o saldo de meses ANTIGOS também mude — o cenário daquele mês ficou no
// passado e deve permanecer estável.
//
// Janela "ao vivo": o orçamento vigente vale para o mês atual, os futuros e
// também para o mês IMEDIATAMENTE anterior ao atual. Ou seja, mudar o
// orçamento hoje reflete no mês passado mais recente e dali pra frente; só
// meses mais antigos que o anterior ficam congelados no snapshot.
//
// Estratégia simples:
//   1. Toda vez que o app abre, identificamos meses antigos (mais velhos que
//      o mês anterior ao atual) que ainda não têm snapshot e gravamos o
//      orçamento ATUAL como snapshot deles (best-effort — não temos máquina
//      do tempo pro orçamento histórico real; o valor capturado quando o mês
//      sai da janela "ao vivo" é a melhor aproximação).
//   2. Snapshots ficam em `preferences.orcBaseAt[yyyy-mm] = number`.
//   3. Mês atual, futuro e o anterior ao atual sempre usam o orçamento atual
//      (snapshot só vale pra meses mais antigos que isso).

// Orçamento base "agora" — só o mensal manual. Limites por categoria
// NÃO compõem o orçamento base: eles são sub-limites opcionais dentro do
// mensal, não substitutos dele. Sem mensal definido = sem orçamento base.
export function calcOrcBaseAtual(preferences) {
  return preferences?.orcamentoMensal > 0 ? preferences.orcamentoMensal : 0;
}

// Subtrai um mês de um "yyyy-mm", normalizando virada de ano.
export function mesAnteriorDe(mes) {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Orçamento base do mês `mes` (yyyy-mm). O orçamento vigente vale para o mês
// atual, futuros e o imediatamente anterior ao atual. Só meses mais antigos
// que o anterior retornam o snapshot congelado (ou o orçamento atual como
// fallback, quando não há snapshot).
export function obterOrcBaseDoMes(mes, preferences, mesAtual) {
  const atual = calcOrcBaseAtual(preferences);
  if (mes >= mesAnteriorDe(mesAtual)) return atual;
  const snap = preferences?.orcBaseAt?.[mes];
  return typeof snap === "number" ? snap : atual;
}

// Retorna o yyyy-mm do mês corrente (data local).
export function mesCorrente() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}
