// BaixarDadosModal.jsx — escolha do período e exportação dos dados.
//
// Serve aos dois formatos: `.xlsx` (dados crus, mês a mês ou tudo) e `.pdf`
// (relatório formatado). O PDF é sempre de UM mês — a opção "Todos os dados"
// nem aparece nesse modo.

import { createPortal } from "react-dom";
import { useFecharComEsc } from "../../ui/modal-base.jsx";
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
  formato = "xlsx",
  mesSelecionado,
  onSelecionarMes,
  baixando,
  erro,
  todosMeses,
  onCancelar,
  onConfirmar,
}) {
  const t = useT();
  const ehPdf = formato === "pdf";
  // Sem mês com lançamento não há relatório possível. No .xlsx ainda sobra a
  // opção "Todos os dados", então só o PDF trava.
  const semOpcoes = ehPdf && todosMeses.length === 0;
  const podeBaixar = !baixando && !!mesSelecionado;
  // Mesmo critério do clique fora: durante o download não se fecha nada.
  useFecharComEsc(baixando ? undefined : onCancelar);

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
              background: "var(--primary-degrade)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name={ehPdf ? "file-text" : "list"} size={20} color="#fff" strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              {ehPdf ? t("Baixar relatório") : t("Baixar dados")}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>
              {ehPdf
                ? t("Relatório em PDF com as transações do mês")
                : t("Arquivo .xlsx para abrir no Excel ou Google Sheets")}
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
          {ehPdf ? t("Mês do relatório") : t("Período")}
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
          {!ehPdf && (
            <OpcaoBaixar
              label={t("Todos os dados")}
              descricao={t("Transações, caixinhas, recorrentes e orçamentos")}
              selecionado={mesSelecionado === "todos"}
              onClick={() => onSelecionarMes("todos")}
            />
          )}
          {todosMeses.map((m) => (
            <OpcaoBaixar
              key={m}
              label={rotuloMes(m)}
              descricao={
                ehPdf ? t("Relatório deste mês") : t("Apenas transações deste mês")
              }
              selecionado={mesSelecionado === m}
              onClick={() => onSelecionarMes(m)}
            />
          ))}
          {semOpcoes && (
            <div
              style={{
                padding: "24px 18px",
                textAlign: "center",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--muted)",
                lineHeight: 1.5,
              }}
            >
              {t("Você ainda não tem nenhum mês com transações lançadas.")}
            </div>
          )}
        </div>

        {ehPdf && !semOpcoes && (
          <div
            style={{
              marginTop: 10,
              fontSize: 11.5,
              color: "var(--muted)",
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            {t("O relatório é sempre de um mês só.")}
          </div>
        )}

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
            disabled={!podeBaixar}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 14,
              border: "none",
              background: "var(--primary-degrade)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              fontFamily: "inherit",
              cursor: podeBaixar ? "pointer" : "default",
              boxShadow: "0 4px 14px color-mix(in oklab, var(--primary) 32%, transparent)",
              opacity: podeBaixar ? 1 : 0.5,
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
