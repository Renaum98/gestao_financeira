// EvolucaoConjunta.jsx — barras lado a lado (você x parceiro) nos últimos 6
// meses. Só renderiza em conta compartilhada.

import React from "react";
import { fmtBRL } from "../../data.js";
import { Card } from "../../ui/common.jsx";
import { SecaoTitulo } from "./SecaoTitulo.jsx";

export function EvolucaoConjunta({ evolucaoConjunta, maxEvolConjunta, mes, setMes, ocultar, partnerNome }) {
  if (!evolucaoConjunta) return null;

  return (
    <div style={{ padding: "16px 20px 0" }}>
      <SecaoTitulo>Você vs. {partnerNome || "parceiro"}</SecaoTitulo>
      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 8,
            height: 150,
          }}
        >
          {evolucaoConjunta.map((e) => {
            const hMeu = Math.max((e.meu / maxEvolConjunta) * 100, e.meu > 0 ? 4 : 0);
            const hParc = Math.max((e.parceiro / maxEvolConjunta) * 100, e.parceiro > 0 ? 4 : 0);
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
                  gap: 4,
                  cursor: "pointer",
                  height: "100%",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 3,
                    height: "100%",
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  <div
                    title={`Você: ${fmtBRL(e.meu, ocultar)}`}
                    style={{
                      flex: 1,
                      maxWidth: 16,
                      height: `${hMeu}%`,
                      borderRadius: 6,
                      background: "linear-gradient(180deg, var(--primary), var(--primary-2))",
                      transition: "height .2s",
                      minHeight: e.meu > 0 ? 4 : 0,
                    }}
                  />
                  <div
                    title={`${partnerNome || "Parceiro"}: ${fmtBRL(e.parceiro, ocultar)}`}
                    style={{
                      flex: 1,
                      maxWidth: 16,
                      height: `${hParc}%`,
                      borderRadius: 6,
                      background: "var(--surface-sunken)",
                      border: "1px solid var(--linha)",
                      transition: "height .2s",
                      minHeight: e.parceiro > 0 ? 4 : 0,
                    }}
                  />
                </div>
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
            display: "flex",
            justifyContent: "center",
            gap: 18,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 4,
                background: "linear-gradient(180deg, var(--primary), var(--primary-2))",
              }}
            />
            <span style={{ color: "var(--ink)" }}>Você</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 4,
                background: "var(--surface-sunken)",
                border: "1px solid var(--linha)",
              }}
            />
            <span style={{ color: "var(--muted)" }}>{partnerNome || "Parceiro"}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
