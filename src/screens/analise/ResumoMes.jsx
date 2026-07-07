// ResumoMes.jsx — grade de 4 indicadores no topo da Análise.

import { fmtBRL, fmtBRLCompacto } from "../../data.js";
import { Card } from "../../ui/common.jsx";
import { COR_POS as VERDE, COR_NEG as VERMELHO } from "../../lib/colors.js";
import { useT } from "../../lib/i18n.jsx";

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
  const t = useT();
  return (
    <div className={spanAll} style={{ padding: "0 20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <StatCard
          rotulo={t("Total gasto")}
          valor={fmtBRL(total, ocultar)}
          extra={
            diffTotal !== null
              ? `${diffTotal >= 0 ? "▲" : "▼"} ${t("{pct}% vs mês anterior", { pct: Math.abs(diffTotal).toFixed(0) })}`
              : null
          }
          extraCor={diffTotal >= 0 ? VERMELHO : VERDE}
        />
        <StatCard
          rotulo={t("Média por dia")}
          valor={fmtBRL(mediaDia, ocultar)}
          extra={diasDecorridos > 1 ? t("{n} dias", { n: diasDecorridos }) : t("{n} dia", { n: diasDecorridos })}
        />
        <StatCard
          rotulo={t("Transações")}
          valor={String(txCount)}
          extra={catCount > 1 ? t("{n} categorias", { n: catCount }) : t("{n} categoria", { n: catCount })}
        />
        <StatCard
          rotulo={t("Sobrou")}
          valor={fmtBRLCompacto(restante, ocultar)}
          valorCor={restante >= 0 ? VERDE : VERMELHO}
          extra={
            orcTotal <= 0
              ? t("sem orçamento definido")
              : restante >= 0
                ? t("{pct}% do orçamento", { pct: pctRestante.toFixed(0) })
                : t("acima do orçamento")
          }
          extraCor={restante >= 0 ? VERDE : VERMELHO}
        />
      </div>
    </div>
  );
}
