// compact.js — helpers para "magrelar" os dados antes de salvar no Firestore.
//
// Toda a leitura faz `...DEFAULT, ...(data ?? {})`, então campos ausentes
// caem nos defaults. Aqui omitimos:
//   • valores numéricos zero (orcamentos, meta da caixinha, orcamentoMensal…)
//   • strings vazias (fotoUrl, dataMeta…)
//   • arrays vazios
//   • objetos cujos campos são todos default
//   • o `origem.tipo === 'orcamento'` de cada depósito (é o padrão)
//
// Quando o resultado é "vazio", retornamos `deleteField()` pra remover o campo
// do doc inteiro (mais limpo que salvar `[]`, `{}` ou `null`).

import { deleteField } from "./firebase.js";

const PALETA_PADRAO = "#6E4FF6";
const MODO_PADRAO = "sistema";

function ehObjetoVazio(o) {
  return !o || Object.keys(o).length === 0;
}

// ─── Caixinha / Depósito ───────────────────────────────────────────────────

function compactarDeposito(d) {
  const out = { id: d.id, valor: d.valor, data: d.data };
  // Origem "orcamento" é o padrão — só salva se for entrada (com descricao).
  if (d.origem && d.origem.tipo && d.origem.tipo !== "orcamento") {
    out.origem = d.origem;
  }
  if (d.feitoPor) out.feitoPor = d.feitoPor;
  return out;
}

export function compactarCaixinha(cx) {
  const out = { id: cx.id, nome: cx.nome, cor: cx.cor };
  if (cx.meta > 0) out.meta = cx.meta;
  if (cx.dataMeta) out.dataMeta = cx.dataMeta;
  if (cx.criadoEm) out.criadoEm = cx.criadoEm;
  if (cx.criadoPor) out.criadoPor = cx.criadoPor;
  if (cx.rendimentoAtivo && cx.rendimentoCDI > 0) {
    out.rendimentoAtivo = true;
    out.rendimentoCDI = cx.rendimentoCDI;
  }
  if (cx.depositos && cx.depositos.length > 0) {
    out.depositos = cx.depositos.map(compactarDeposito);
  }
  return out;
}

export function compactarCaixinhas(lista) {
  return (lista || []).map(compactarCaixinha);
}

// ─── Por chave do user doc ─────────────────────────────────────────────────

function compactarOrcamentos(orcamentos) {
  if (!orcamentos) return deleteField();
  const filtrado = Object.fromEntries(
    Object.entries(orcamentos).filter(([, v]) => v > 0),
  );
  return ehObjetoVazio(filtrado) ? deleteField() : filtrado;
}

function compactarPreferences(p) {
  if (!p) return deleteField();
  const out = {};
  if (p.paleta && p.paleta !== PALETA_PADRAO) out.paleta = p.paleta;
  if (p.modo && p.modo !== MODO_PADRAO) out.modo = p.modo;
  if (p.nome) out.nome = p.nome;
  if (p.fotoUrl) out.fotoUrl = p.fotoUrl;
  if (p.orcamentoMensal > 0) out.orcamentoMensal = p.orcamentoMensal;
  if (p.notifLidas && p.notifLidas.length > 0) out.notifLidas = p.notifLidas;
  return ehObjetoVazio(out) ? deleteField() : out;
}

function compactarArray(arr) {
  return arr && arr.length > 0 ? arr : deleteField();
}

// Dispatcher por chave. Retorna o valor a passar pro updateDoc — pode ser
// `deleteField()`, removendo o campo do doc.
export function compactarPorChave(key, value) {
  switch (key) {
    case "orcamentos":
      return compactarOrcamentos(value);
    case "preferences":
      return compactarPreferences(value);
    case "caixinhas":
      return value && value.length > 0 ? compactarCaixinhas(value) : deleteField();
    case "txs":
    case "recorrentes":
    case "categoriasCustom":
    case "notificacoesParceria":
      return compactarArray(value);
    default:
      return value;
  }
}
