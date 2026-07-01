// moeda.js — suporte a múltiplas moedas de exibição.
//
// IMPORTANTE: trocar de moeda muda apenas o SÍMBOLO e o FORMATO dos valores —
// não há conversão de câmbio. Um saldo de 100 vira "$100" ou "R$ 100" conforme
// a moeda escolhida, mas o número guardado é sempre o mesmo.
//
// Como `fmtBRL`/`fmtBRLCompacto` (em data.js) e os helpers de input
// (money-input.js) são funções puras chamadas em todo o app, mantemos a moeda
// ativa num estado de módulo. O app.jsx chama `setMoedaAtiva` a cada render com
// base em `preferences.moeda`, então quando a preferência muda (estado React) o
// app re-renderiza e todos os valores já saem na moeda nova.

const STORAGE_KEY = "moeda";

export const MOEDAS = {
  BRL: { codigo: "BRL", locale: "pt-BR", simbolo: "R$", nome: "Real", flag: "🇧🇷" },
  USD: { codigo: "USD", locale: "en-US", simbolo: "$", nome: "US Dollar", flag: "🇺🇸" },
  EUR: { codigo: "EUR", locale: "de-DE", simbolo: "€", nome: "Euro", flag: "🇪🇺" },
  GBP: { codigo: "GBP", locale: "en-GB", simbolo: "£", nome: "British Pound", flag: "🇬🇧" },
};

export const MOEDAS_SUPORTADAS = Object.keys(MOEDAS);

let moedaAtiva = "BRL";

export function getMoeda() {
  return MOEDAS[moedaAtiva] || MOEDAS.BRL;
}

export function setMoedaAtiva(codigo) {
  if (MOEDAS[codigo]) moedaAtiva = codigo;
}

export function simboloMoeda() {
  return getMoeda().simbolo;
}

export function lerMoedaSalva() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return MOEDAS[v] ? v : null;
  } catch {
    return null;
  }
}

export function salvarMoeda(codigo) {
  try {
    localStorage.setItem(STORAGE_KEY, codigo);
  } catch {
    /* localStorage indisponível — ignora */
  }
}

// Separador decimal da moeda ativa (',' para pt-BR/EUR, '.' para en-*). Usado
// pelos inputs "estilo calculadora" pra exibir o valor digitado no formato local.
export function sepDecimal() {
  try {
    const partes = new Intl.NumberFormat(getMoeda().locale).formatToParts(1.1);
    const dec = partes.find((p) => p.type === "decimal");
    return dec ? dec.value : ",";
  } catch {
    return ",";
  }
}
