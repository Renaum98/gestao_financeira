// CardLembranca.jsx — estado da meta: concluída, vencida, sem prazo ou
// sugestão de quanto guardar por período.

import React from "react";
import { fmtBRL } from "../../data.js";
import { Icon } from "../../ui/icons.jsx";
import { COR_POS, COR_NEG, COR_POS_FUNDO, COR_NEG_FUNDO } from "../../lib/colors.js";
import { Card } from "../../ui/common.jsx";
import { rotuloDataCurto } from "./utils.js";

export function CardLembranca({ lembranca, ocultar }) {
  if (!lembranca) return null;

  return (
    <Card style={{ marginTop: 14, padding: 16, display: "flex", alignItems: "flex-start", gap: 12 }}>
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          flexShrink: 0,
          background: lembranca.completo
            ? COR_POS_FUNDO
            : lembranca.vencido
              ? COR_NEG_FUNDO
              : "color-mix(in oklab, var(--primary) 14%, transparent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          name={lembranca.completo ? "check" : lembranca.vencido ? "bell" : "target"}
          size={18}
          color={lembranca.completo ? COR_POS : lembranca.vencido ? COR_NEG : "var(--primary)"}
          strokeWidth={2.4}
        />
      </div>
      <div style={{ flex: 1 }}>
        {lembranca.completo ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 800, color: COR_POS }}>Meta alcançada! 🎉</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, marginTop: 2 }}>
              Você juntou tudo. Hora de aproveitar.
            </div>
          </>
        ) : lembranca.vencido ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 800, color: COR_NEG }}>Prazo vencido</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, marginTop: 2 }}>
              Ainda faltam {fmtBRL(lembranca.faltam, ocultar)}. Reajuste a data ou a meta.
            </div>
          </>
        ) : lembranca.semData ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>
              Faltam {fmtBRL(lembranca.faltam, ocultar)}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, marginTop: 2 }}>
              Sem prazo definido. Edite a caixinha para receber uma sugestão de quanto guardar por mês.
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>
              Guarde {fmtBRL(lembranca.valor, ocultar)} por{" "}
              {lembranca.tipo === "mensal" ? "mês" : lembranca.tipo === "semanal" ? "semana" : "dia"}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, marginTop: 2 }}>
              Para chegar em {rotuloDataCurto(lembranca.dataMeta)} ({lembranca.dias}{" "}
              {lembranca.dias === 1 ? "dia restante" : "dias restantes"}).
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
