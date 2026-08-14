// ModalApagarCartao.jsx — confirma a exclusão e pergunta pra onde vão os
// lançamentos presos ao cartão.
//
// Apagar cartão é a única forma de gerar tx órfã (sem `cartaoId` com outros
// cartões cadastrados), então a pergunta é obrigatória: some o destino e o
// histórico do usuário muda de lugar sem ele saber. Com um cartão só, não há o
// que perguntar — os lançamentos voltam a ser "crédito" genérico, que é
// exatamente o app de antes do cadastro.

import React from "react";
import { createPortal } from "react-dom";
import { Icon } from "../../ui/icons.jsx";
import { Z_MODAL } from "../../ui/modal-base.jsx";
import { COR_NEG } from "../../lib/colors.js";
import { corDoCartao, corTextoSobre } from "../../lib/cartoes.js";
import { useT } from "../../lib/i18n.jsx";

function Opcao({ cor, titulo, legenda, selecionado, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 14px",
        borderRadius: 12,
        border: selecionado ? "1.5px solid var(--primary)" : "1.5px solid transparent",
        background: "var(--card-2)",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          background: cor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name="card" size={15} color={corTextoSobre(cor)} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>{titulo}</div>
        {legenda && (
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginTop: 1 }}>
            {legenda}
          </div>
        )}
      </div>
      {selecionado && <Icon name="check" size={16} color="var(--primary)" strokeWidth={2.6} />}
    </button>
  );
}

export function ModalApagarCartao({ cartao, outros, quantidade, onFechar, onConfirmar }) {
  const t = useT();
  const [destino, setDestino] = React.useState(outros[0]?.id ?? null);
  const temLancamentos = quantidade > 0;

  return createPortal(
    <div
      onClick={onFechar}
      style={{
        position: "fixed",
        inset: 0,
        height: "100dvh",
        zIndex: Z_MODAL,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(20, 16, 24, 0.45)",
        backdropFilter: "blur(12px) saturate(140%)",
        WebkitBackdropFilter: "blur(12px) saturate(140%)",
        animation: "fadeIn .28s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          maxHeight: "calc(100dvh - 40px)",
          overflowY: "auto",
          background: "var(--bg)",
          borderRadius: 28,
          padding: "22px 20px 20px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.08)",
          animation: "scaleIn .34s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.01em" }}>
          {t("Apagar {nome}?", { nome: cartao.nome })}
        </div>

        <div
          style={{
            fontSize: 13,
            color: "var(--muted)",
            fontWeight: 600,
            lineHeight: 1.5,
            marginTop: 8,
          }}
        >
          {!temLancamentos
            ? t("Nenhum lançamento está preso a este cartão.")
            : outros.length === 0
              ? t("{n} lançamentos estão neste cartão. Eles continuam no histórico como crédito, sem cartão — nada é apagado e nenhum valor muda.", { n: quantidade })
              : t("{n} lançamentos estão neste cartão. Escolha pra onde eles vão — nada é apagado e nenhum valor muda.", { n: quantidade })}
        </div>

        {temLancamentos && outros.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {outros.map((c) => (
              <Opcao
                key={c.id}
                cor={corDoCartao(c)}
                titulo={t("Mover para {nome}", { nome: c.nome })}
                selecionado={destino === c.id}
                onClick={() => setDestino(c.id)}
              />
            ))}
            <Opcao
              cor="var(--muted)"
              titulo={t("Deixar sem cartão")}
              legenda={t("Continuam como crédito, sem cartão definido")}
              selecionado={destino === null}
              onClick={() => setDestino(null)}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            onClick={onFechar}
            style={{
              flex: 1,
              padding: "13px",
              borderRadius: 14,
              border: "none",
              background: "var(--card-2)",
              color: "var(--ink)",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {t("Cancelar")}
          </button>
          <button
            onClick={() => onConfirmar(outros.length > 0 ? destino : null)}
            style={{
              flex: 1,
              padding: "13px",
              borderRadius: 14,
              border: "none",
              background: COR_NEG,
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {t("Apagar")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
