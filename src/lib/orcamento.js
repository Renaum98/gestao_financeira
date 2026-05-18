// orcamento.js — utilidades de orçamento base + snapshots por mês.
//
// Por que snapshots: o "Restante" / "Sobrou" de um mês depende do orçamento
// daquele mês. Se o usuário mudar o orçamento mensal hoje, não queremos que
// o saldo de meses passados também mude — o cenário daquele mês ficou no
// passado e deve permanecer estável.
//
// Estratégia simples:
//   1. Toda vez que o app abre, identificamos meses passados que ainda não
//      têm snapshot e gravamos o orçamento ATUAL como snapshot deles
//      (best-effort — não temos máquina do tempo pro orçamento histórico
//      real, mas a primeira vez que o app abre depois da virada do mês
//      captura o valor mais recente, que é a melhor aproximação).
//   2. Snapshots ficam em `preferences.orcBaseAt[yyyy-mm] = number`.
//   3. Mês atual / futuro sempre usa o orçamento atual (snapshot só é útil
//      pra meses passados — o presente ainda está acontecendo).

// Orçamento base "agora" — só o mensal manual. Limites por categoria
// NÃO compõem o orçamento base: eles são sub-limites opcionais dentro do
// mensal, não substitutos dele. Sem mensal definido = sem orçamento base.
export function calcOrcBaseAtual(preferences) {
  return preferences?.orcamentoMensal > 0 ? preferences.orcamentoMensal : 0;
}

// Orçamento base do mês `mes` (yyyy-mm). Pra mês passado, retorna o
// snapshot salvo (se existir) ou o orçamento atual como fallback.
// Pra mês atual ou futuro, sempre retorna o orçamento atual.
export function obterOrcBaseDoMes(mes, preferences, mesAtual) {
  const atual = calcOrcBaseAtual(preferences);
  if (mes >= mesAtual) return atual;
  const snap = preferences?.orcBaseAt?.[mes];
  return typeof snap === "number" ? snap : atual;
}

// Retorna o yyyy-mm do mês corrente (data local).
export function mesCorrente() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}
