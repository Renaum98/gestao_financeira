// TopCategorias.jsx — ranking de categorias com variação vs. mês anterior.
// Tocar numa categoria abre o detalhe dela.

import React from "react";
import { fmtBRLCompacto } from "../../data.js";
import { CatChip } from "../../ui/icons.jsx";
import { Card } from "../../ui/common.jsx";
import { BarraProgresso } from "../../ui/charts.jsx";
import { COR_POS as VERDE, COR_NEG as VERMELHO } from "../../lib/colors.js";
import { SecaoTitulo } from "./SecaoTitulo.jsx";
import { useT } from "../../lib/i18n.jsx";

export function TopCategorias({ dados, porCatAnt, irPara, ocultar }) {
  const t = useT();
  return (
    <div style={{ padding: "16px 20px 0" }}>
      <SecaoTitulo>{t("Top categorias")}</SecaoTitulo>
      <Card style={{ padding: "4px 16px" }}>
        {dados.map((d, i) => {
          const ant = porCatAnt[d.id] || 0;
          const diff = ant > 0 ? ((d.valor - ant) / ant) * 100 : null;
          return (
            <div
              key={d.id}
              onClick={() => irPara("categoria", { catId: d.id })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 0",
                borderTop: i === 0 ? "none" : "1px solid var(--linha)",
                cursor: "pointer",
              }}
            >
              <CatChip catId={d.id} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{t(d.nome)}</div>
                <div style={{ marginTop: 6 }}>
                  <BarraProgresso valor={d.valor} max={dados[0].valor} cor={d.cor} altura={6} />
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>
                  {fmtBRLCompacto(d.valor, ocultar)}
                </div>
                {diff !== null && (
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      marginTop: 2,
                      color: diff >= 0 ? VERMELHO : VERDE,
                    }}
                  >
                    {diff >= 0 ? "▲" : "▼"} {Math.abs(diff).toFixed(0)}%
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
