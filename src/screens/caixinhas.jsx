// caixinhas.jsx — Caixinhas (metas de poupança). Entry que reexporta as telas
// e o card; a implementação vive em ./caixinhas/*.
//
// Modelo:
//   caixinha = {
//     id, nome, cor,
//     meta?, dataMeta?,           // opcionais — se setados, exibe lembrança
//     criadoEm,
//     depositos: [{ id, valor, data }]
//   }
//
// Valor atual = soma dos depositos.

export { CaixinhasScreen } from "./caixinhas/ListaCaixinhas.jsx";
export { CaixinhaScreen } from "./caixinhas/CaixinhaScreen.jsx";
export { CardCaixinha } from "./caixinhas/CardCaixinha.jsx";
