// utils.js — helpers de data usados só na Análise.

// Soma `delta` meses a um "yyyy-mm", normalizando virada de ano.
export function mesShift(yyyymm, delta) {
  const [y, m] = yyyymm.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Quantos dias tem o mês "yyyy-mm".
export function diasNoMes(yyyymm) {
  const [y, m] = yyyymm.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}
