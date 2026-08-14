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
const LEVE_PADRAO = "auto";
const IDIOMA_PADRAO = "pt";
const MOEDA_PADRAO = "BRL";

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
  // Preserva o tipo do depósito. "inicial" é essencial: sem ele, o depósito
  // (positivo) voltaria a abater o saldo após recarregar. "saque" sobrevive
  // pelo valor negativo, mas mantê-lo é mais explícito.
  if (d.tipo) out.tipo = d.tipo;
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

// ─── Cartão de crédito ─────────────────────────────────────────────────────

// `diaFechamento` 0 é o padrão (último dia do mês, ver lib/fatura.js), então só
// vale gravar quando o usuário escolheu um dia. Nunca há número nem bandeira de
// cartão aqui: o cadastro não coleta nenhum dos dois (ver lib/cartoes.js).
function compactarCartao(c) {
  const out = { id: c.id, nome: c.nome, cor: c.cor };
  if (c.diaFechamento > 0) out.diaFechamento = c.diaFechamento;
  if (c.limite > 0) out.limite = c.limite;
  if (c.criadoEm) out.criadoEm = c.criadoEm;
  return out;
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
  if (p.leve && p.leve !== LEVE_PADRAO) out.leve = p.leve;
  // Idioma e moeda: sem eles aqui, qualquer troca de preferência (ex.: tema)
  // reescrevia o doc sem esses campos e o app voltava pro padrão (pt/BRL).
  if (p.idioma && p.idioma !== IDIOMA_PADRAO) out.idioma = p.idioma;
  if (p.moeda && p.moeda !== MOEDA_PADRAO) out.moeda = p.moeda;
  if (p.nome) out.nome = p.nome;
  if (p.fotoUrl) out.fotoUrl = p.fotoUrl;
  if (p.orcamentoMensal > 0) out.orcamentoMensal = p.orcamentoMensal;
  if (p.orcamentoCartaoCredito > 0) out.orcamentoCartaoCredito = p.orcamentoCartaoCredito;
  // Dia de fechamento da fatura: 0 é o padrão (último dia do mês), então só
  // vale gravar quando o usuário escolheu um dia específico.
  if (p.diaFechamentoCartao > 0) out.diaFechamentoCartao = p.diaFechamentoCartao;
  if (p.notifLidas && p.notifLidas.length > 0) out.notifLidas = p.notifLidas;
  // Snapshots de orçamento por mês (mapa yyyy-mm → número). Sem compactar os
  // valores: cada entrada é um mês congelado que precisa sobreviver.
  if (p.orcBaseAt && !ehObjetoVazio(p.orcBaseAt)) out.orcBaseAt = p.orcBaseAt;
  // Diferença de mês trazida (carryover, mapa yyyy-mm → número). NÃO filtrar
  // zeros: o valor 0 é o marcador de "já perguntei neste mês" (usuário recusou),
  // e é o que impede o modal de virada de mês de reaparecer a cada abertura.
  if (p.carryover && !ehObjetoVazio(p.carryover)) out.carryover = p.carryover;
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
    case "cartoes":
      return value && value.length > 0 ? value.map(compactarCartao) : deleteField();
    default:
      return value;
  }
}
