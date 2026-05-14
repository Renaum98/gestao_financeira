// historico.jsx — Tela Histórico (comparativo de meses)

import React from "react";
import {
  MESES_CURTO,
  fmtBRLCompacto,
  rotuloMes,
  rotuloMesCurto,
  totalGeral,
  txDoMes,
} from "../data.js";
import { Icon } from "../ui/icons.jsx";
import { Card, TopBar } from "../ui/common.jsx";

export function HistoricoScreen({ ctx }) {
  const { txs, todosMeses, ocultar, voltar, setMes, irPara, mesAnterior, mes, ehDesktop } =
    ctx;
  const dadosMeses = todosMeses.map((m) => {
    const t = totalGeral(txDoMes(txs, m));
    return { mes: m, total: t, count: txDoMes(txs, m).length };
  });
  const maxTot = Math.max(...dadosMeses.map((d) => d.total), 1);

  // Chart: somente os 5 meses anteriores ao atual (independente de haver
  // transações), ordenados do mais antigo para o mais recente.
  const mesesGrafico = React.useMemo(() => {
    const [y, m] = mes.split("-").map(Number);
    const out = [];
    for (let i = 5; i >= 1; i--) {
      const d = new Date(y, m - 1 - i, 1);
      const yyyymm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const total = totalGeral(txDoMes(txs, yyyymm));
      out.push({ mes: yyyymm, total });
    }
    return out;
  }, [txs, mes]);
  const maxTotGrafico = Math.max(...mesesGrafico.map((d) => d.total), 1);

  return (
    <div style={{ paddingBottom: "var(--pad-bottom)" }}>
      <TopBar voltar={ehDesktop ? undefined : voltar} titulo="Histórico" />
      <div style={{ padding: "4px 20px 0" }}>
        <Card>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--ink)",
              marginBottom: 14,
            }}
          >
            Gastos nos últimos meses
          </div>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 10,
                height: 170,
                width: "100%",
              }}
            >
              {mesesGrafico.map((d) => {
                const h = (d.total / maxTotGrafico) * 110;
                return (
                  <div
                    key={d.mes}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--muted)",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmtBRLCompacto(d.total, ocultar)}
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: h,
                        borderRadius: 10,
                        background: "var(--surface-sunken)",
                        transition: "all .25s",
                      }}
                    />
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {rotuloMesCurto(d.mes)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: 0.4,
            padding: "0 4px 10px",
          }}
        >
          Meses
        </div>
        <Card style={{ padding: "4px 16px" }}>
          {dadosMeses.map((d, i) => (
            <div
              key={d.mes}
              onClick={() => {
                setMes(d.mes);
                voltar();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 0",
                borderTop: i === 0 ? "none" : "1px solid var(--linha)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: d.mes === mes ? "var(--primary)" : "var(--bg)",
                  color: d.mes === mes ? "#fff" : "var(--ink)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                }}
              >
                <div style={{ fontSize: 10, opacity: 0.8 }}>
                  {d.mes.split("-")[0].slice(2)}
                </div>
                <div style={{ fontSize: 13, letterSpacing: "-0.02em" }}>
                  {MESES_CURTO[parseInt(d.mes.split("-")[1], 10) - 1]}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}
                >
                  {rotuloMes(d.mes)}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    fontWeight: 600,
                    marginTop: 2,
                  }}
                >
                  {d.count} transações
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}
                >
                  {fmtBRLCompacto(d.total, ocultar)}
                </div>
              </div>
              <Icon
                name="chevron-right"
                size={16}
                color="var(--muted)"
                strokeWidth={2}
              />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
