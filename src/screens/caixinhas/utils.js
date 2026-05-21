// utils.js — helpers puros e constantes das caixinhas.

import { MESES_CURTO } from "../../data.js";

// Cores selecionáveis pra colorir cada caixinha. Todas calibradas pra dar
// contraste ≥4 com texto branco (o cabeçalho do card de detalhe usa
// `linear-gradient(135deg, ${cor}, ${cor}CC)` com texto branco em cima).
export const CORES_CAIXINHA = [
  "#6E4FF6", // roxo (mesma da Violeta)
  "#D44B3F", // coral
  "#0E8554", // esmeralda
  "#2563EA", // oceano
  "#A26200", // mostarda
  "#D43D85", // rosa profundo
  "#168F6E", // teal
  "#7456E0", // lilás
];

export function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function valorAtual(cx) {
  return (cx.depositos || []).reduce((s, d) => s + d.valor, 0);
}

function diasEntre(de, ate) {
  const d1 = new Date(de + "T12:00:00");
  const d2 = new Date(ate + "T12:00:00");
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

export function calcularLembranca(cx) {
  if (!cx.meta || cx.meta <= 0) return null;
  const atual = valorAtual(cx);
  const faltam = cx.meta - atual;
  if (faltam <= 0) return { completo: true, atual, faltam: 0 };
  if (!cx.dataMeta) return { semData: true, faltam };

  const dias = diasEntre(hojeISO(), cx.dataMeta);
  if (dias <= 0) return { vencido: true, faltam };

  const meses = dias / 30.44; // média
  if (meses >= 1) {
    return { tipo: "mensal", valor: faltam / meses, dias, dataMeta: cx.dataMeta, faltam };
  }
  const semanas = dias / 7;
  if (semanas >= 1) {
    return { tipo: "semanal", valor: faltam / semanas, dias, dataMeta: cx.dataMeta, faltam };
  }
  return { tipo: "diario", valor: faltam / dias, dias, dataMeta: cx.dataMeta, faltam };
}

export function rotuloDataCurto(yyyymmdd) {
  const d = new Date(yyyymmdd + "T12:00:00");
  return `${d.getDate()} ${MESES_CURTO[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}
