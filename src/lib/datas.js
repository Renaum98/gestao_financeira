// datas.js — as contas de calendário do app, num lugar só.
//
// Antes isto vivia espalhado: "último dia do mês" tinha seis implementações
// (duas delas com nome próprio e corpo idêntico), deslocar um mês tinha três
// funções para a mesma ideia, e os dois formatadores — `yyyy-mm` e
// `yyyy-mm-dd` — apareciam copiados dentro de componentes.
//
// Tudo aqui é HORÁRIO LOCAL, de propósito. As datas do app são civis ("comprei
// no dia 3"), não instantes: usar UTC faria a virada do dia acontecer no meio
// da tarde pra quem está a oeste de Greenwich. Por isso a formatação é montada
// campo a campo, e não com `toISOString()`.
//
// Convenção dos tipos que circulam por aqui:
//   yyyy-mm     → "2026-08", o mês. Ordenável como string, e é disso que
//                 dependem as comparações `mes < mesAtual` espalhadas no app.
//   yyyy-mm-dd  → "2026-08-03", o dia. Mesma propriedade.

// ─── Formatação ───

// "yyyy-mm" de um Date.
export function chaveMes(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// "yyyy-mm-dd" de um Date.
export function dataISO(date) {
  return `${chaveMes(date)}-${String(date.getDate()).padStart(2, "0")}`;
}

// O mês de hoje, "yyyy-mm".
export function mesCorrente() {
  return chaveMes(new Date());
}

// Hoje, "yyyy-mm-dd".
export function hojeISO() {
  return dataISO(new Date());
}

// ─── Aritmética de meses ───

// Soma `delta` meses a um "yyyy-mm", normalizando virada de ano. O Date do JS
// aceita mês fora de 0–11 e faz a normalização sozinho.
export function mesShift(yyyymm, delta) {
  const [y, m] = yyyymm.split("-").map(Number);
  return chaveMes(new Date(y, m - 1 + delta, 1));
}

export function mesAnteriorDe(mes) {
  return mesShift(mes, -1);
}

export function mesSeguinteDe(mes) {
  return mesShift(mes, 1);
}

// Quantos dias tem o mês "yyyy-mm" — dia 0 do mês seguinte é o último do atual.
export function diasNoMes(yyyymm) {
  const [y, m] = yyyymm.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

// O dia `dia` dentro do mês "yyyy-mm", encolhido pro último dia quando ele não
// existe ali. É o caso de quem cadastra recorrente pra dia 31: em fevereiro a
// cobrança cai no 28 (ou 29), e não vaza pro mês seguinte.
function diaNoMes(yyyymm, dia) {
  return Math.min(dia, diasNoMes(yyyymm));
}

// A data "yyyy-mm-dd" do dia `dia` dentro do mês "yyyy-mm", com o mesmo
// encolhimento de `diaNoMes`. É o que monta a data de cada parcela de uma
// recorrência.
export function dataNoMes(yyyymm, dia) {
  return `${yyyymm}-${String(diaNoMes(yyyymm, dia)).padStart(2, "0")}`;
}
