// orcamento.js — orçamento base + histórico de vigência por mês.
//
// Por que histórico: o "Restante" / "Sobrou" de um mês depende do orçamento
// daquele mês, e a projeção do ano soma os doze. Se o usuário toma um aumento
// e sobe o orçamento em agosto, agosto em diante vale o valor novo — mas os
// meses anteriores (fora julho, que está na janela ao vivo) têm que continuar
// com o valor antigo. Sem isso a projeção anual vira "orçamento de hoje × 12",
// que achata a mudança.
//
// Modelo: `preferences.orcBaseAt[yyyy-mm] = number` é o orçamento que passou a
// valer A PARTIR daquele mês. A leitura é carry-forward: o orçamento de um mês
// é o do registro mais recente com data menor ou igual a ele.
//
//   orcBaseAt = { "2026-01": 5000, "2026-07": 6000 }
//   jan–jun → 5000        jul–dez → 6000
//
// Quem escreve é `registrarMudancaOrcBase`, chamado quando o usuário salva um
// orçamento novo. Não existe agendamento: a mudança sempre vale do mês em que
// foi feita — e, como sempre, do mês imediatamente anterior também.
//
// Meses anteriores ao registro mais antigo herdam esse registro — é o melhor
// palpite disponível para um período em que o app ainda não guardava histórico.

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

// Orçamento base do mês `mes` (yyyy-mm). A janela "ao vivo" — mês atual,
// futuros e o imediatamente anterior — usa sempre o orçamento vigente; meses
// mais antigos que isso leem o histórico de vigência.
export function obterOrcBaseDoMes(mes, preferences, mesAtual) {
  const atual = calcOrcBaseAtual(preferences);
  if (mes >= mesAnteriorDe(mesAtual)) return atual;

  const snaps = preferences?.orcBaseAt;
  if (!snaps) return atual;

  let vigente = null; // registro mais recente com chave <= mes
  let maisAntigo = null; // registro mais antigo de todos
  for (const k of Object.keys(snaps)) {
    if (typeof snaps[k] !== "number") continue;
    if (maisAntigo === null || k < maisAntigo) maisAntigo = k;
    if (k <= mes && (vigente === null || k > vigente)) vigente = k;
  }
  if (vigente !== null) return snaps[vigente];
  if (maisAntigo !== null) return snaps[maisAntigo];
  return atual;
}

// Novo mapa `orcBaseAt` para quando o usuário salva o orçamento mensal `novo`
// estando em `mes` (yyyy-mm).
//
// A vigência começa no mês ANTERIOR, não em `mes`: é o mesmo alcance da janela
// ao vivo. Mudou o salário em agosto → julho também acompanha, junho pra trás
// não. Gravar assim faz o valor de julho continuar o mesmo depois da virada do
// mês, quando ele sai da janela e passa a ser lido pelo histórico.
//
// E, se o histórico ainda não cobre o passado, congela o valor antigo dois
// meses atrás — senão o carry-forward puxaria o valor NOVO para trás.
export function registrarMudancaOrcBase(preferences, novo, mes) {
  const snaps = { ...(preferences?.orcBaseAt || {}) };
  const antigo = calcOrcBaseAtual(preferences);
  const inicioVigencia = mesAnteriorDe(mes);
  const ultimoAntigo = mesAnteriorDe(inicioVigencia);
  const cobrePassado = Object.keys(snaps).some(
    (k) => k <= ultimoAntigo && typeof snaps[k] === "number",
  );
  if (antigo > 0 && antigo !== novo && !cobrePassado) snaps[ultimoAntigo] = antigo;
  snaps[inicioVigencia] = novo;
  return snaps;
}

// Retorna o yyyy-mm do mês corrente (data local).
export function mesCorrente() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}
