// PizzaCategorias.jsx — pizza de gastos por categoria + legenda interativa.
// O destaque (categoria ativa) é estado local: só afeta este card.

import React from "react";
import { fmtBRLCompacto } from "../../data.js";
import { Card } from "../../ui/common.jsx";
import { PieChart } from "../../ui/charts.jsx";
import { useT } from "../../lib/i18n.jsx";

export function PizzaCategorias({ dados, total, ocultar }) {
  const t = useT();
  const [ativa, setAtiva] = React.useState(null);

  return (
    <div style={{ padding: "16px 20px 0" }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0" }}>
          <PieChart
            dados={dados}
            total={total}
            tamanho={230}
            ativo={ativa}
            onHover={setAtiva}
            ocultar={ocultar}
          />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginTop: 6,
            paddingTop: 14,
            borderTop: "1px solid var(--linha)",
          }}
        >
          {dados.map((d) => (
            <div
              key={d.id}
              onClick={() => setAtiva(ativa === d.id ? null : d.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                opacity: ativa && ativa !== d.id ? 0.4 : 1,
                padding: "4px 0",
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: 5, background: d.cor }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink)",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {t(d.nome)}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>
                  {fmtBRLCompacto(d.valor, ocultar)} · {((d.valor / total) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
