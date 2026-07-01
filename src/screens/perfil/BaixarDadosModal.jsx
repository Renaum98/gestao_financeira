// BaixarDadosModal.jsx — escolha do período e exportação dos dados em .xlsx.

import React from "react";
import { createPortal } from "react-dom";
import { rotuloMes } from "../../data.js";
import { Icon } from "../../ui/icons.jsx";
import { Z_MODAL } from "../../ui/modal-base.jsx";
import { COR_NEG } from "../../lib/colors.js";
import { useT } from "../../lib/i18n.jsx";

function OpcaoBaixar({ label, descricao, selecionado, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        background: selecionado ? "color-mix(in oklab, var(--primary) 8%, transparent)" : "transparent",
        border: "none",
        borderBottom: "1px solid var(--linha)",
        padding: "12px 14px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          border: `2px solid ${selecionado ? "var(--primary)" : "var(--linha)"}`,
          background: selecionado ? "var(--primary)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all .15s",
        }}
      >
        {selecionado && <Icon name="check" size={12} color="#fff" strokeWidth={3} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{label}</div>
        {descricao && (
          <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 500, marginTop: 2 }}>{descricao}</div>
        )}
      </div>
    </button>
  );
}

export function BaixarDadosModal({
  mesSelecionado,
  onSelecionarMes,
  baixando,
  erro,
  todosMeses,
  onCancelar,
  onConfirmar,
}) {
  const t = useT();
  return createPortal(
    <div
      onClick={baixando ? undefined : onCancelar}
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
        role="dialog"
        aria-modal="true"
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--bg)",
          borderRadius: 24,
          padding: "22px 20px 18px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.08)",
          animation: "scaleIn .34s cubic-bezier(0.22, 1, 0.36, 1)",
          maxHeight: "calc(100dvh - 40px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: "linear-gradient(135deg, var(--primary), var(--primary-2))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="list" size={20} color="#fff" strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              {t("Baixar dados")}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>
              {t("Arquivo .xlsx para abrir no Excel ou Google Sheets")}
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 8,
            paddingLeft: 2,
          }}
        >
          {t("Período")}
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            border: "1px solid var(--linha)",
            borderRadius: 14,
            background: "var(--card)",
          }}
        >
          <OpcaoBaixar
            label={t("Todos os dados")}
            descricao={t("Transações, caixinhas, recorrentes e orçamentos")}
            selecionado={mesSelecionado === "todos"}
            onClick={() => onSelecionarMes("todos")}
          />
          {todosMeses.map((m) => (
            <OpcaoBaixar
              key={m}
              label={rotuloMes(m)}
              descricao={t("Apenas transações deste mês")}
              selecionado={mesSelecionado === m}
              onClick={() => onSelecionarMes(m)}
            />
          ))}
        </div>

        {erro && (
          <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: COR_NEG, textAlign: "center" }}>
            {erro}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            onClick={onCancelar}
            disabled={baixando}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 14,
              border: "none",
              background: "var(--card-2)",
              color: "var(--ink)",
              fontSize: 14,
              fontWeight: 800,
              fontFamily: "inherit",
              cursor: baixando ? "default" : "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
              opacity: baixando ? 0.6 : 1,
            }}
          >
            {t("Cancelar")}
          </button>
          <button
            onClick={onConfirmar}
            disabled={baixando}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg, var(--primary), var(--primary-2))",
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              fontFamily: "inherit",
              cursor: baixando ? "default" : "pointer",
              boxShadow: "0 4px 14px color-mix(in oklab, var(--primary) 32%, transparent)",
              opacity: baixando ? 0.7 : 1,
            }}
          >
            {baixando ? t("Gerando…") : t("Baixar")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
