// EvolucaoMeses.jsx — barras de gasto total nos últimos 6 meses. Tocar numa
// barra troca o mês selecionado.

import React from "react";
import { fmtBRL, fmtBRLCompacto } from "../../data.js";
import { Card } from "../../ui/common.jsx";
import { SecaoTitulo } from "./SecaoTitulo.jsx";

export function EvolucaoMeses({ evolucao, maxEvol, mediaEvol, mes, setMes, ocultar }) {
  return (
    <div style={{ padding: "16px 20px 0" }}>
      <SecaoTitulo>Evolução (6 meses)</SecaoTitulo>
      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 8,
            height: 130,
            position: "relative",
          }}
        >
          {evolucao.map((e) => {
            const h = Math.max((e.total / maxEvol) * 100, 2);
            const atual = e.key === mes;
            return (
              <div
                key={e.key}
                onClick={() => setMes(e.key)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                  height: "100%",
                  justifyContent: "flex-end",
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)" }}>
                  {e.total > 0 ? fmtBRLCompacto(e.total, ocultar) : ""}
                </div>
                <div
                  style={{
                    width: "100%",
                    maxWidth: 34,
                    height: `${h}%`,
                    borderRadius: 8,
                    background: atual
                      ? "linear-gradient(180deg, var(--primary), var(--primary-2))"
                      : "var(--surface-sunken)",
                    transition: "height .2s",
                  }}
                />
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: atual ? "var(--primary)" : "var(--muted)",
                  }}
                >
                  {e.label}
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--linha)",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--muted)",
            textAlign: "center",
          }}
        >
          Média mensal: {fmtBRL(mediaEvol, ocultar)}
        </div>
      </Card>
    </div>
  );
}
