// selic.js — busca a Meta Selic na API do BCB (SGS série 432) e calcula
// rendimento projetado das caixinhas marcadas como investimento.
//
// A Meta Selic é definida pelo COPOM e raramente muda; cacheamos por 24h em
// localStorage pra não bater na API toda hora. Se a requisição falhar (offline,
// CORS, etc.), reutilizamos o cache antigo ou caímos num fallback estático.

import { useEffect, useState } from "react";

// Fallback caso a API esteja fora e não exista cache anterior.
// Atualize quando o COPOM mudar — é só um plano B; o caminho feliz pega da API.
const SELIC_FALLBACK = 14.75;

const CACHE_KEY = "finca.selic.cache";
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

function lerCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (typeof obj?.valor !== "number" || typeof obj?.savedAt !== "number") return null;
    return obj;
  } catch {
    return null;
  }
}

function escreverCache(valor) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ valor, savedAt: Date.now() }));
  } catch {}
}

export async function buscarSelic() {
  const cache = lerCache();
  if (cache && Date.now() - cache.savedAt < TTL_MS) return cache.valor;

  try {
    const r = await fetch(
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json",
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    const valor = parseFloat(String(data?.[0]?.valor).replace(",", "."));
    if (Number.isFinite(valor) && valor > 0 && valor < 100) {
      escreverCache(valor);
      return valor;
    }
    throw new Error("payload inválido");
  } catch (err) {
    console.warn("[Selic] falha ao buscar; usando fallback:", err);
    return cache?.valor ?? SELIC_FALLBACK;
  }
}

export function useSelic() {
  const [selic, setSelic] = useState(() => lerCache()?.valor ?? SELIC_FALLBACK);
  useEffect(() => {
    let cancelado = false;
    buscarSelic().then((v) => {
      if (!cancelado) setSelic(v);
    });
    return () => {
      cancelado = true;
    };
  }, []);
  return selic;
}

// CDI ≈ Selic Meta − 0,10 p.p. (convenção do mercado brasileiro).
function cdiAnualDecimal(selicAnualPct) {
  return Math.max(0, (selicAnualPct - 0.1) / 100);
}

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function diasEntre(de, ate) {
  const d1 = new Date(de + "T12:00:00");
  const d2 = new Date(ate + "T12:00:00");
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

// Rendimento projetado (R$) entre os depósitos e hoje.
//
// Cada depósito (positivo ou saque negativo) é projetado pelo regime de juros
// compostos diários: contribuiHoje = valor * (1+r)^(diasDesdeDeposito). O ganho
// é (somaContribuiHoje − somaPrincipal). Saques negativos removem proporção do
// pool, então o "deveria ter rendido" daquele resgate sai junto — equivale a
// retirada FIFO/proporcional, que é como contas de investimento se comportam.
export function calcularRendimento(cx, selicAnualPct) {
  if (!cx?.rendimentoAtivo) return 0;
  const cdiPct = Number(cx.rendimentoCDI);
  if (!Number.isFinite(cdiPct) || cdiPct <= 0) return 0;

  const taxaEfetivaAnual = cdiAnualDecimal(selicAnualPct) * (cdiPct / 100);
  if (taxaEfetivaAnual <= 0) return 0;
  const taxaDiaria = Math.pow(1 + taxaEfetivaAnual, 1 / 365) - 1;

  const hoje = hojeISO();
  let balanco = 0;
  let principal = 0;
  for (const dep of cx.depositos || []) {
    const dias = Math.max(0, diasEntre(dep.data, hoje));
    balanco += dep.valor * Math.pow(1 + taxaDiaria, dias);
    principal += dep.valor;
  }
  return Math.max(0, balanco - principal);
}

// Taxa anual efetiva (em %) — útil pra mostrar "rendendo X% a.a." pro usuário.
export function taxaAnualEfetiva(rendimentoCDI, selicAnualPct) {
  const cdiPct = Number(rendimentoCDI);
  if (!Number.isFinite(cdiPct) || cdiPct <= 0) return 0;
  return cdiAnualDecimal(selicAnualPct) * cdiPct;
}
