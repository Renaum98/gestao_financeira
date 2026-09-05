// cartoes.js — cadastro de cartões de crédito.
//
// REGRA DE CONVIVÊNCIA COM O QUE JÁ EXISTE (decidida em 2026-08-14):
//
//   • ZERO cartões cadastrados → nada muda. `pagamento === "Cartão de crédito"`
//     segue sendo uma etiqueta solta, existe uma fatura só, e o ciclo usa o
//     fechamento global (`preferences.diaFechamentoCartao`). É o app de sempre.
//
//   • Ao criar o PRIMEIRO cartão → tudo que já foi lançado no crédito passa a
//     ser dele. O backfill (`aplicarPrimeiroCartao`) roda UMA vez, na criação, e
//     grava `cartaoId` em cada tx e recorrência. Custa uma escrita: `txs` é um
//     campo único do doc do usuário (ver lib/storage.js).
//
//   • Do SEGUNDO cartão em diante → nada é tocado. Mover uma compra de um cartão
//     pro outro é manual, pelo modal de gasto.
//
// Preferimos o backfill ao "cartão padrão implícito" (tx sem cartaoId = primeiro
// cartão, resolvido na leitura) porque o implícito obriga toda tela que agrupa
// por cartão a lembrar da regra, e faz o histórico inteiro saltar de dono
// sozinho no dia em que o primeiro cartão for apagado. Com o backfill,
// `cartaoId` é o dado — quem lê só lê.
//
// NÃO guardamos número de cartão, nem bandeira: o que identifica um cartão aqui
// é o nome que o usuário deu e a cor que ele escolheu. Nenhum dado do plástico
// passa pelo app ou pelo Firestore. Decisão explícita do usuário.
//
// O saldo do mês continua igual: cartão é organização e leitura, não uma nova
// conta de saldo. Ver o cabeçalho de lib/fatura.js.

import { hojeISO } from "./datas.js";
import { PAG_CARTAO } from "./fatura.js";

// ─── Cor do cartão ─────────────────────────────────────────────────────────
//
// A cor é a identidade visual do cartão na lista: o que faz o usuário
// reconhecer o dele de relance é o roxo do Nubank ou o laranja do Itaú. Os
// presets são as cores das marcas mais conhecidas por aqui — é só uma paleta,
// o app não se integra com banco nenhum nem afirma vínculo com eles.
export const CORES_CARTAO = [
  { hex: "#8D0DE3", nome: "Nubank" },
  { hex: "#EC7000", nome: "Itaú" },
  { hex: "#CC092F", nome: "Bradesco" },
  { hex: "#EC0000", nome: "Santander" },
  { hex: "#FAE128", nome: "Banco do Brasil" },
  { hex: "#0057A6", nome: "Caixa" },
  { hex: "#FF7A00", nome: "Inter" },
  { hex: "#00A651", nome: "Sicredi" },
  { hex: "#12284C", nome: "BTG" },
  { hex: "#1A1416", nome: "Preto" },
];

// Luminância relativa (fórmula do WCAG). Serve pra uma coisa só: decidir se o
// que vai POR CIMA da cor é branco ou escuro. Sem isso, cartão amarelo fica com
// texto branco em cima e some.
function luminancia(hex) {
  const h = String(hex || "").replace("#", "");
  if (h.length !== 6) return 0;
  const canal = (i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(0) + 0.7152 * canal(2) + 0.0722 * canal(4);
}

function ehCorClara(hex) {
  return luminancia(hex) > 0.45;
}

// Cor de texto/ícone legível sobre `hex`.
export function corTextoSobre(hex) {
  return ehCorClara(hex) ? "#1A1416" : "#FFFFFF";
}

export const COR_CARTAO_PADRAO = CORES_CARTAO[0].hex;

export function corDoCartao(cartao) {
  return cartao?.cor || COR_CARTAO_PADRAO;
}

// Um gasto no cartão de crédito. Entradas nunca contam.
export function ehGastoNoCartao(tx) {
  return !!tx && tx.tipo !== "entrada" && tx.pagamento === PAG_CARTAO;
}

// Uma recorrência no cartão de crédito. Recorrências não têm `tipo`: são sempre
// contas a pagar.
export function ehRecorrenteNoCartao(rec) {
  return !!rec && rec.pagamento === PAG_CARTAO;
}

export function novoCartao({ nome, cor, diaFechamento, limite }) {
  return {
    id: `ct-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    nome: String(nome || "").trim() || "Cartão",
    cor: cor || COR_CARTAO_PADRAO,
    diaFechamento: Number(diaFechamento) || 0, // 0 = último dia do mês
    limite: Number(limite) > 0 ? Number(limite) : 0, // 0 = sem limite informado
    criadoEm: hojeISO(),
  };
}

function acharCartao(cartoes, id) {
  if (!id) return null;
  return (cartoes || []).find((c) => c.id === id) || null;
}

// Dia de fechamento a aplicar numa compra. Sem cartão (ou cartão apagado),
// vale o fechamento global — que é o que o app usava antes dos cartões.
export function fechamentoDe(cartoes, cartaoId, preferences) {
  const cartao = acharCartao(cartoes, cartaoId);
  if (cartao) return cartao.diaFechamento || 0;
  return preferences?.diaFechamentoCartao || 0;
}

// Backfill do primeiro cartão. Devolve `null` quando não há nada a mudar, pra
// quem chama não gravar à toa.
//
// `lista` é de txs ou de recorrências; `ehDoCartao` diz qual das duas. Só toca
// em quem ainda não tem `cartaoId` — se um dia sobrar tx órfã (cartão apagado
// com "deixar sem cartão"), ela também é adotada, que é o comportamento certo:
// voltamos a ter um cartão só.
function backfill(lista, ehDoCartao, cartaoId) {
  const alvo = (lista || []).filter((x) => ehDoCartao(x) && !x.cartaoId);
  if (alvo.length === 0) return null;
  return (lista || []).map((x) =>
    ehDoCartao(x) && !x.cartaoId ? { ...x, cartaoId } : x,
  );
}

export function aplicarPrimeiroCartaoEmTxs(txs, cartaoId) {
  return backfill(txs, ehGastoNoCartao, cartaoId);
}

export function aplicarPrimeiroCartaoEmRecorrentes(recorrentes, cartaoId) {
  return backfill(recorrentes, ehRecorrenteNoCartao, cartaoId);
}

// Quantos lançamentos estão presos a um cartão — o número que a confirmação de
// exclusão mostra ("esse cartão tem 47 gastos").
export function contarNoCartao(txs, recorrentes, cartaoId) {
  const nTxs = (txs || []).filter((t) => ehGastoNoCartao(t) && t.cartaoId === cartaoId).length;
  const nRec = (recorrentes || []).filter(
    (r) => ehRecorrenteNoCartao(r) && r.cartaoId === cartaoId,
  ).length;
  return { txs: nTxs, recorrentes: nRec, total: nTxs + nRec };
}

// ─── Limite ────────────────────────────────────────────────────────────────
//
// O limite é o teto do CARTÃO (o que o banco liberou), diferente do
// `preferences.orcamentoCartaoCredito`, que é quanto o usuário quer gastar no
// crédito no mês. Um é do banco, o outro é meta pessoal.
//
// O que ocupa o limite é só a FATURA ABERTA — o ciclo em que o usuário está
// gastando agora. É o que responde "quanto ainda dá pra passar neste cartão
// antes de estourar", que é a pergunta da barra.
//
// A fatura que já fechou fica de fora de propósito. Somar as duas transforma a
// barra num acumulado que só cresce até a virada do ciclo e nunca reflete o
// mês corrente — com um gasto grande em julho, o cartão aparecia no vermelho em
// agosto sem o usuário ter gasto nada em agosto. Quem quiser ver a fatura
// fechada tem o card do Dashboard, que mostra as duas separadas.
//
// Com o fechamento padrão (último dia do mês), fatura aberta = mês corrente.
// Com fechamento no dia 25, o ciclo atravessa a virada — e é esse ciclo que
// vale, porque é dele que o limite está sendo consumido.
export function usoDoCartao(cartao, faturas) {
  const usado = faturas?.aberta?.total || 0;
  const limite = cartao?.limite > 0 ? cartao.limite : 0;
  return {
    usado,
    limite,
    disponivel: limite > 0 ? Math.max(0, limite - usado) : 0,
    pct: limite > 0 ? (usado / limite) * 100 : 0,
    temLimite: limite > 0,
  };
}

// Faixa de aperto de um uso, pra cor e rótulo. Sem limite informado não há o
// que classificar — quem chama decide se mostra algo.
export function faixaDoUso(pct) {
  if (pct >= 100) return "estourado";
  if (pct >= 80) return "aperto";
  if (pct >= 50) return "meio";
  return "folga";
}

// Move (ou solta) os lançamentos de um cartão. `destinoId` null = "sem cartão",
// que devolve a tx ao estado genérico de antes dos cartões.
export function moverLancamentos(lista, ehDoCartao, deId, destinoId) {
  return (lista || []).map((x) => {
    if (!ehDoCartao(x) || x.cartaoId !== deId) return x;
    const { cartaoId, ...resto } = x;
    return destinoId ? { ...resto, cartaoId: destinoId } : resto;
  });
}
