// cartoes.jsx — cadastro de cartões de crédito. Entry que reexporta a tela; a
// implementação vive em ./cartoes/*.
//
// Modelo:
//   cartao = { id, nome, cor, diaFechamento, limite, criadoEm }
//
// A regra de convivência com os gastos que já existiam (o primeiro cartão adota
// tudo) está em lib/cartoes.js, não aqui.

export { CartoesScreen } from "./cartoes/ListaCartoes.jsx";
