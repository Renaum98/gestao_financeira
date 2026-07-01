// ModalResgate.jsx — resgatar valor da caixinha (volta como entrada do mês).

import React from "react";
import { fmtBRL } from "../../data.js";
import { COR_NEG } from "../../lib/colors.js";
import { formatarValorDigitado, formatarValorInicial, parseValorBR, valorZero } from "../../lib/money-input.js";
import { simboloMoeda } from "../../lib/moeda.js";
import { ModalShell } from "./ModalShell.jsx";
import { useT } from "../../lib/i18n.jsx";

export function ModalResgate({ cor, nome, disponivel, onFechar, onSalvar }) {
  const t = useT();
  const [valor, setValor] = React.useState(valorZero());

  const aoDigitar = (texto) => setValor(formatarValorDigitado(texto));
  const valorNum = parseValorBR(valor);
  const excede = valorNum > disponivel + 0.001;
  const podeSalvar = valorNum > 0 && !excede;

  const aplicarTudo = () => setValor(formatarValorInicial(disponivel));

  const salvar = () => {
    if (!podeSalvar) return;
    onSalvar(valorNum);
  };

  return (
    <ModalShell titulo={t("Resgatar de \"{nome}\"", { nome })} onFechar={onFechar} onSalvar={salvar} salvarAtivo={podeSalvar} corAcento={cor}>
      <label
        style={{
          display: "block",
          textAlign: "center",
          padding: "14px 0 6px",
          position: "relative",
          cursor: "text",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          {t("Valor a resgatar")}
        </div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 800,
            color: "var(--ink)",
            letterSpacing: "-0.03em",
            marginTop: 4,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span style={{ fontSize: 20, color: "var(--muted)", marginRight: 6, verticalAlign: "top" }}>
            {simboloMoeda()}
          </span>
          {valor}
        </div>
        <input
          autoFocus
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={valor.replace(",", "")}
          onChange={(e) => aoDigitar(e.target.value)}
          aria-label={t("Valor a resgatar")}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            border: "none",
            background: "transparent",
            outline: "none",
            fontSize: 16,
            cursor: "text",
          }}
        />
      </label>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "12px 14px",
          marginTop: 4,
          borderRadius: 12,
          background: "var(--card-2)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            {t("Disponível na caixinha")}
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "var(--ink)",
              marginTop: 2,
              letterSpacing: "-0.01em",
            }}
          >
            {fmtBRL(disponivel)}
          </div>
        </div>
        <button
          onClick={aplicarTudo}
          disabled={disponivel <= 0}
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            border: "none",
            background: cor,
            color: "#fff",
            fontSize: 12,
            fontWeight: 800,
            cursor: disponivel > 0 ? "pointer" : "default",
            opacity: disponivel > 0 ? 1 : 0.5,
            fontFamily: "inherit",
          }}
        >
          {t("Tudo")}
        </button>
      </div>

      {excede && (
        <div style={{ marginTop: 10, fontSize: 12, color: COR_NEG, fontWeight: 700, padding: "0 4px" }}>
          {t("Valor maior que o disponível na caixinha.")}
        </div>
      )}

      <div
        style={{
          marginTop: 14,
          padding: "12px 14px",
          borderRadius: 12,
          background: "color-mix(in oklab, var(--primary) 8%, transparent)",
          fontSize: 12,
          color: "var(--muted)",
          fontWeight: 500,
          lineHeight: 1.45,
        }}
      >
        {t("O valor volta como uma ")}<strong style={{ color: "var(--ink)" }}>{t("entrada do mês atual")}</strong>{t(" e fica disponível no orçamento.")}
      </div>
    </ModalShell>
  );
}
