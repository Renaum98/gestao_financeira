// CardCaixinha.jsx — card de caixinha (usado na lista e no dashboard).

import React from "react";
import { fmtBRLCompacto } from "../../data.js";
import { Icon } from "../../ui/icons.jsx";
import { COR_POS, COR_POS_FUNDO } from "../../lib/colors.js";
import { BarraProgresso } from "../../ui/charts.jsx";
import { useSelic, calcularRendimento } from "../../lib/selic.js";
import { valorAtual, calcularLembranca } from "./utils.js";
import { useT } from "../../lib/i18n.jsx";

export function CardCaixinha({ cx, ocultar, onClick }) {
  const t = useT();
  const selic = useSelic();
  const principal = valorAtual(cx);
  const rendimento = calcularRendimento(cx, selic);
  const atual = principal + rendimento;
  const lembranca = calcularLembranca(cx);

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--card)",
        borderRadius: 18,
        padding: 16,
        boxShadow: "0 1px 2px rgba(20,16,24,0.04), 0 4px 12px rgba(20,16,24,0.03)",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, background: cx.cor }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 4 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: `${cx.cor}22`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="piggy" size={18} color={cx.cor} strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "var(--ink)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {cx.nome}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--muted)",
              fontWeight: 600,
              marginTop: 1,
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            <span>
              {cx.meta > 0
                ? t("{gasto} de {orc}", { gasto: fmtBRLCompacto(atual, ocultar), orc: fmtBRLCompacto(cx.meta, ocultar) })
                : t("Guardado: {x}", { x: fmtBRLCompacto(atual, ocultar) })}
            </span>
            {rendimento > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "1px 6px",
                  borderRadius: 999,
                  background: COR_POS_FUNDO,
                  color: COR_POS,
                  fontWeight: 800,
                  fontSize: 10,
                }}
                title={!ocultar ? t("Rendimento: +{x}", { x: fmtBRLCompacto(rendimento) }) : undefined}
              >
                +{fmtBRLCompacto(rendimento, ocultar)}
              </span>
            )}
          </div>
        </div>
        <Icon name="chevron-right" size={16} color="var(--muted)" strokeWidth={2} />
      </div>

      {cx.meta > 0 && (
        <div style={{ marginLeft: 4, marginTop: 10 }}>
          <BarraProgresso valor={atual} max={cx.meta} cor={cx.cor} altura={6} />
        </div>
      )}

      {lembranca && !lembranca.completo && !lembranca.vencido && !lembranca.semData && (
        <div
          style={{
            marginLeft: 4,
            marginTop: 10,
            padding: "8px 10px",
            borderRadius: 10,
            background: `${cx.cor}14`,
            fontSize: 11,
            fontWeight: 700,
            color: cx.cor,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="target" size={12} color={cx.cor} strokeWidth={2.4} />
          {lembranca.tipo === "mensal"
            ? t("Guarde {x} por mês", { x: fmtBRLCompacto(lembranca.valor, ocultar) })
            : lembranca.tipo === "semanal"
              ? t("Guarde {x} por semana", { x: fmtBRLCompacto(lembranca.valor, ocultar) })
              : t("Guarde {x} por dia", { x: fmtBRLCompacto(lembranca.valor, ocultar) })}
        </div>
      )}
    </div>
  );
}
