// ResumoMes.jsx — grade de 4 indicadores no topo da Análise.

import React from "react";
import { fmtBRL, fmtBRLCompacto } from "../../data.js";
import { Card } from "../../ui/common.jsx";
import { COR_POS as VERDE, COR_NEG as VERMELHO } from "../../lib/colors.js";

function StatCard({ rotulo, valor, valorCor, extra, extraCor }) {
  return (
    <Card style={{ padding: "14px 16px" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: 0.4,
        }}
      >
        {rotulo}
      </div>
      <div
        style={{
          fontSize: 19,
          fontWeight: 800,
          color: valorCor || "var(--ink)",
          marginTop: 4,
          letterSpacing: "-0.02em",
        }}
      >
        {valor}
      </div>
      {extra && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: extraCor || "var(--muted)",
            marginTop: 3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {extra}
        </div>
      )}
    </Card>
  );
}

export function ResumoMes({
  total,
  ocultar,
  diffTotal,
  mediaDia,
  diasDecorridos,
  txCount,
  catCount,
  restante,
  orcTotal,
  pctRestante,
  spanAll,
}) {
  return (
    <div className={spanAll} style={{ padding: "0 20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <StatCard
          rotulo="Total gasto"
          valor={fmtBRL(total, ocultar)}
          extra={
            diffTotal !== null
              ? `${diffTotal >= 0 ? "▲" : "▼"} ${Math.abs(diffTotal).toFixed(0)}% vs mês anterior`
              : null
          }
          extraCor={diffTotal >= 0 ? VERMELHO : VERDE}
        />
        <StatCard
          rotulo="Média por dia"
          valor={fmtBRL(mediaDia, ocultar)}
          extra={`${diasDecorridos} dia${diasDecorridos > 1 ? "s" : ""}`}
        />
        <StatCard
          rotulo="Transações"
          valor={String(txCount)}
          extra={`${catCount} categoria${catCount > 1 ? "s" : ""}`}
        />
        <StatCard
          rotulo="Sobrou"
          valor={fmtBRLCompacto(restante, ocultar)}
          valorCor={restante >= 0 ? VERDE : VERMELHO}
          extra={
            orcTotal <= 0
              ? "sem orçamento definido"
              : restante >= 0
                ? `${pctRestante.toFixed(0)}% do orçamento`
                : "acima do orçamento"
          }
          extraCor={restante >= 0 ? VERDE : VERMELHO}
        />
      </div>
    </div>
  );
}
