// ListaCartoes.jsx — tela com os cartões cadastrados e o botão de criar.
//
// O total comprometido, um bloco por cartão e o aviso do que está apertado. No
// mobile isso é um painel só, empilhado; no desktop o resumo se separa da lista
// em duas colunas. Tudo aqui é leitura do ciclo da fatura (lib/fatura.js) —
// nada entra na conta do saldo do mês.

import React from "react";
import { fmtBRL } from "../../data.js";
import { Icon } from "../../ui/icons.jsx";
import { Card, TopBar } from "../../ui/common.jsx";
import { CardCartao, corDaFaixa } from "./CardCartao.jsx";
import { ModalCartao } from "./ModalCartao.jsx";
import { ModalApagarCartao } from "./ModalApagarCartao.jsx";
import { contarNoCartao, usoDoCartao, faixaDoUso } from "../../lib/cartoes.js";
import { faturasEmAberto } from "../../lib/fatura.js";
import { hojeISO } from "../../lib/datas.js";
import { useT } from "../../lib/i18n.jsx";

// Rótulo da situação geral, no chip do topo. Vale a faixa do cartão mais
// apertado — é o que decide se tem problema, não a média.
function rotuloDaFaixa(faixa, t) {
  if (faixa === "estourado") return t("Estourado");
  if (faixa === "aperto") return t("No limite");
  if (faixa === "meio") return t("Em uso");
  return t("Folgado");
}

export function CartoesScreen({ ctx }) {
  const { cartoes, txs, recorrentes, preferences, salvarCartao, excluirCartao, voltar, ehDesktop } = ctx;
  const t = useT();
  const [modal, setModal] = React.useState(null); // null | 'novo' | { editando }
  const [apagando, setApagando] = React.useState(null); // null | cartao

  // Quanto de cada cartão já foi no ciclo em que ele está agora — a fatura
  // aberta (ver usoDoCartao).
  const usos = React.useMemo(() => {
    const hoje = hojeISO();
    const mapa = {};
    for (const c of cartoes) {
      mapa[c.id] = usoDoCartao(c, faturasEmAberto(txs, c.diaFechamento || 0, hoje, c.id));
    }
    return mapa;
  }, [cartoes, txs]);

  const totalUsado = cartoes.reduce((s, c) => s + (usos[c.id]?.usado || 0), 0);

  // O cartão mais apertado manda no chip do topo e no aviso do rodapé. Sem
  // nenhum limite informado não há o que classificar — o chip some.
  const pior = React.useMemo(() => {
    let alvo = null;
    for (const c of cartoes) {
      const uso = usos[c.id];
      if (!uso?.temLimite) continue;
      if (!alvo || uso.pct > usos[alvo.id].pct) alvo = c;
    }
    return alvo;
  }, [cartoes, usos]);

  const faixaPior = pior ? faixaDoUso(usos[pior.id].pct) : null;
  const corPior = pior ? corDaFaixa(usos[pior.id].pct) : null;

  // A tela tem quatro peças; o que muda entre mobile e desktop é só o arranjo
  // delas. No mobile as três primeiras empilham dentro de um card só, como
  // sempre foi. No desktop o resumo vira um painel estreito à esquerda e a
  // lista de cartões fica com a largura toda à direita — que é onde a largura
  // extra realmente serve pra alguma coisa.
  const resumo = (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: "var(--ink)",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          {fmtBRL(totalUsado)}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", marginTop: 4 }}>
          {/* Dizer de que número se trata: agora ele é só o ciclo
              aberto, não a dívida toda do cartão. */}
          {cartoes.length === 1
            ? t("1 cartão · fatura aberta")
            : t("{n} cartões · faturas abertas", { n: cartoes.length })}
        </div>
      </div>
      {pior && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 999,
            background: `color-mix(in oklab, ${corPior} 16%, transparent)`,
            flexShrink: 0,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: 4, background: corPior }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: corPior }}>
            {rotuloDaFaixa(faixaPior, t)}
          </span>
        </div>
      )}
    </div>
  );

  const lista = (
    <>
      {cartoes.map((c, i) => (
        <CardCartao
          key={c.id}
          cartao={c}
          uso={usos[c.id]}
          primeiro={i === 0}
          onClick={() => setModal({ editando: c })}
        />
      ))}
    </>
  );

  const rodape = (
    <div
      style={{
        marginTop: 4,
        paddingTop: 12,
        borderTop: "1px solid var(--linha)",
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
      }}
    >
      <Icon
        name={faixaPior === "estourado" || faixaPior === "aperto" ? "bell" : "card"}
        size={15}
        color={faixaPior === "estourado" || faixaPior === "aperto" ? corPior : "var(--muted)"}
        strokeWidth={2.2}
      />
      <div
        style={{
          flex: 1,
          fontSize: 11.5,
          fontWeight: 600,
          lineHeight: 1.45,
          color:
            faixaPior === "estourado" || faixaPior === "aperto" ? corPior : "var(--muted)",
        }}
      >
        {faixaPior === "estourado"
          ? t("{nome} passou do limite.", { nome: pior.nome })
          : faixaPior === "aperto"
            ? t("{nome} já usou {pct}% do limite.", {
                nome: pior.nome,
                pct: usos[pior.id].pct.toFixed(0),
              })
            : t("A fatura é só uma forma de ver o ciclo do cartão: cada compra já abateu o mês em que foi feita.")}
      </div>
    </div>
  );

  const botaoNovo = (
    <button
      onClick={() => setModal("novo")}
      style={{
        width: "100%",
        marginTop: 16,
        padding: "14px",
        borderRadius: 16,
        border: "none",
        cursor: "pointer",
        background: "linear-gradient(135deg, var(--primary), var(--primary-2))",
        color: "#fff",
        fontSize: 14,
        fontWeight: 800,
        fontFamily: "inherit",
        boxShadow: "0 6px 16px color-mix(in oklab, var(--primary) 30%, transparent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <Icon name="plus" size={18} color="#fff" strokeWidth={2.6} />
      {t("Novo cartão")}
    </button>
  );

  return (
    <div style={{ paddingBottom: "var(--pad-bottom)" }}>
      <TopBar voltar={ehDesktop ? undefined : voltar} titulo={t("Cartões")} />

      <div style={{ padding: "4px var(--pad-x) 0" }}>
        {cartoes.length === 0 ? (
          // Sem cartões não há o que espalhar: o convite fica numa coluna
          // estreita em vez de virar uma faixa vazia de mil pixels.
          <div className="coluna-estreita">
            <Card style={{ padding: 28, textAlign: "center" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  background: "linear-gradient(135deg, var(--primary), var(--primary-2))",
                  margin: "0 auto 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="card" size={26} color="#fff" strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>
                {t("Nenhum cartão cadastrado")}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  fontWeight: 500,
                  marginTop: 6,
                  lineHeight: 1.4,
                }}
              >
                {t("Cadastre seus cartões para separar as faturas, cada um com seu dia de fechamento. Não pedimos o número do cartão.")}
              </div>
            </Card>
            {botaoNovo}
          </div>
        ) : ehDesktop ? (
          <div className="painel-lateral">
            <div>
              <Card style={{ padding: "18px 18px 14px" }}>
                {resumo}
                {rodape}
              </Card>
              {botaoNovo}
            </div>
            <Card style={{ padding: "2px 18px 14px" }}>{lista}</Card>
          </div>
        ) : (
          <>
            <Card style={{ padding: "18px 18px 14px" }}>
              {resumo}
              <div style={{ marginTop: 14 }}>{lista}</div>
              {rodape}
            </Card>
            {botaoNovo}
          </>
        )}
      </div>

      {modal && (
        <ModalCartao
          editando={modal === "novo" ? null : modal.editando}
          ehPrimeiro={cartoes.length === 0}
          diaFechamentoGlobal={preferences?.diaFechamentoCartao || 0}
          onFechar={() => setModal(null)}
          onSalvar={(dados) => {
            salvarCartao(dados);
            setModal(null);
          }}
          onApagar={() => {
            setApagando(modal.editando);
            setModal(null);
          }}
        />
      )}

      {apagando && (
        <ModalApagarCartao
          cartao={apagando}
          outros={cartoes.filter((c) => c.id !== apagando.id)}
          quantidade={contarNoCartao(txs, recorrentes, apagando.id).total}
          onFechar={() => setApagando(null)}
          onConfirmar={(destinoId) => {
            excluirCartao(apagando.id, destinoId);
            setApagando(null);
          }}
        />
      )}
    </div>
  );
}
