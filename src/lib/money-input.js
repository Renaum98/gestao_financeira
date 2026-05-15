// money-input.js — helpers pros inputs de valor monetário "estilo calculadora".
//
// O usuário digita só números e a string sai já formatada como "X,YY":
// cada dígito vira centavo e empurra pros reais. Equivalente ao que
// caixas registradoras fazem — UX consistente em toda a app.

// Limite de 10 dígitos = R$ 99.999.999,99 (mais que suficiente).
const MAX_DIGITOS = 10;

// Recebe o texto cru digitado e devolve a string formatada "X,YY".
// Ignora não-dígitos, pad com zeros à esquerda pra sempre ter centavos.
export function formatarValorDigitado(texto) {
  let v = String(texto ?? '').replace(/\D/g, '');
  if (v.length > MAX_DIGITOS) v = v.slice(0, MAX_DIGITOS);
  if (!v) return '0,00';
  v = v.padStart(3, '0');
  const reais = v.slice(0, -2);
  const cent = v.slice(-2);
  return `${parseInt(reais, 10)},${cent}`;
}

// Converte um número (ex.: 1234.5) pro formato exibido inicial "1234,50".
// Útil ao abrir o input com um valor pré-existente (editar caixinha, etc.).
export function formatarValorInicial(numero) {
  if (!numero || numero <= 0) return '0,00';
  return Number(numero).toFixed(2).replace('.', ',');
}

// Faz o caminho inverso: "1234,56" → 1234.56. Aceita também "1.234,56"
// (formato BR clássico com separador de milhar).
export function parseValorBR(s) {
  const limpo = String(s ?? '').replace(/\./g, '').replace(',', '.');
  return parseFloat(limpo) || 0;
}
