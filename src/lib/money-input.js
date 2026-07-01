// money-input.js — helpers pros inputs de valor monetário "estilo calculadora".
//
// O usuário digita só números e a string sai já formatada como "X,YY" (ou
// "X.YY" em moedas que usam ponto como separador decimal): cada dígito vira
// centavo e empurra pros reais. Equivalente ao que caixas registradoras fazem.
//
// O separador decimal acompanha a moeda ativa (lib/moeda.js).

import { sepDecimal } from './moeda.js';

// Limite de 10 dígitos = 99.999.999,99 (mais que suficiente).
const MAX_DIGITOS = 10;

// String de "zero" no formato da moeda ativa — usada para inicializar inputs.
export function valorZero() {
  return `0${sepDecimal()}00`;
}

// Recebe o texto cru digitado e devolve a string formatada "X,YY" / "X.YY".
// Ignora não-dígitos, pad com zeros à esquerda pra sempre ter centavos.
export function formatarValorDigitado(texto) {
  let v = String(texto ?? '').replace(/\D/g, '');
  if (v.length > MAX_DIGITOS) v = v.slice(0, MAX_DIGITOS);
  if (!v) return valorZero();
  v = v.padStart(3, '0');
  const reais = v.slice(0, -2);
  const cent = v.slice(-2);
  return `${parseInt(reais, 10)}${sepDecimal()}${cent}`;
}

// Converte um número (ex.: 1234.5) pro formato exibido inicial "1234,50".
// Útil ao abrir o input com um valor pré-existente (editar caixinha, etc.).
export function formatarValorInicial(numero) {
  if (!numero || numero <= 0) return valorZero();
  return Number(numero).toFixed(2).replace('.', sepDecimal());
}

// Faz o caminho inverso: "1234,56" → 1234.56. Quando a vírgula é o separador
// decimal (BRL/EUR), o ponto é tratado como separador de milhar e removido;
// quando o ponto é o decimal (USD/GBP), a vírgula é o milhar.
export function parseValorBR(s) {
  let str = String(s ?? '');
  if (sepDecimal() === ',') {
    str = str.replace(/\./g, '').replace(',', '.');
  } else {
    str = str.replace(/,/g, '');
  }
  return parseFloat(str) || 0;
}
