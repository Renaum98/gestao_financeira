// modal-shell.jsx — wrapper de modal centralizado (mesmo estilo do add-expense)
// e os controles de formulário que os modais de cadastro compartilham: rótulo de
// campo, chave liga-desliga e o estilo de input.
//
// Nasceu dentro de screens/caixinhas/ e ficou lá mesmo depois que os cartões
// passaram a usá-lo. É infraestrutura de UI, não detalhe de caixinha — por isso
// mora aqui.

import { createPortal } from "react-dom";
import { Z_MODAL, useFecharComEsc } from "./modal-base.jsx";
import { useT } from "../lib/i18n.jsx";

// `corAcentoTexto` existe porque um acento claro (cartão amarelo, por exemplo)
// engole o branco. Só quem passa uma cor clara precisa informar.
export function ModalShell({ titulo, onFechar, onSalvar, salvarAtivo, corAcento, corAcentoTexto, children }) {
  const t = useT();
  useFecharComEsc(onFechar);
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
        padding: "20px",
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
          overflowX: "hidden",
          background: "var(--bg)",
          borderRadius: 28,
          padding: "16px 20px 24px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.08)",
          animation: "scaleIn .34s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <button
            onClick={onFechar}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {t("Cancelar")}
          </button>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.01em" }}>
            {titulo}
          </div>
          <button
            onClick={onSalvar}
            disabled={!salvarAtivo}
            style={{
              background: salvarAtivo ? corAcento || "var(--primary)" : "var(--linha)",
              color: salvarAtivo ? corAcentoTexto || "#fff" : "var(--muted)",
              border: "none",
              padding: "6px 14px",
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 13,
              cursor: salvarAtivo ? "pointer" : "default",
              fontFamily: "inherit",
            }}
          >
            {t("Salvar")}
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Campo({ label, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: 0.4,
          padding: "0 4px 6px",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

export function Toggle({ ativo, onChange }) {
  return (
    <div
      onClick={() => onChange(!ativo)}
      style={{
        width: 42,
        height: 26,
        borderRadius: 14,
        background: ativo ? "var(--primary)" : "var(--surface-sunken)",
        position: "relative",
        cursor: "pointer",
        transition: "background .15s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: ativo ? 18 : 2,
          width: 22,
          height: 22,
          borderRadius: 11,
          background: "#fff",
          transition: "left .15s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }}
      />
    </div>
  );
}

export const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "none",
  background: "var(--card-2)",
  outline: "none",
  fontSize: 14,
  fontWeight: 600,
  color: "var(--ink)",
  fontFamily: "inherit",
  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
  boxSizing: "border-box",
};
