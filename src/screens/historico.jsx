// historico.jsx — Tela Histórico (comparativo de meses)

import { useMemo } from "react";
import {
  MESES_CURTO,
  fmtBRLCompacto,
  rotuloMesT,
} from "../data.js";
import { Icon } from "../ui/icons.jsx";
import { Card, TopBar } from "../ui/common.jsx";
import { useT } from "../lib/i18n.jsx";

export function HistoricoScreen({ ctx }) {
  const { txs, todosMeses, voltar, irPara, mes, ehDesktop } = ctx;
  const t = useT();
  // Uma passada pela lista inteira, agrupando por mês, em vez de varrer todas as
  // transações duas vezes para cada mês da lista. Com três anos de uso e alguns
  // milhares de lançamentos, a diferença entre O(meses × txs) e O(txs) sai da
  // casa das centenas de milhares de iterações — a cada render, porque isto
  // rodava solto no corpo do componente.
  const dadosMeses = useMemo(() => {
    const porMes = new Map(todosMeses.map((m) => [m, { mes: m, total: 0, count: 0 }]));
    for (const t of txs) {
      const d = porMes.get(t.data.slice(0, 7));
      if (!d) continue; // mês fora da lista (não deve acontecer, mas não custa)
      d.count += 1;
      if (t.tipo !== "entrada") d.total += t.valor;
    }
    return todosMeses.map((m) => porMes.get(m));
  }, [txs, todosMeses]);

  return (
    <div style={{ paddingBottom: "var(--pad-bottom)" }}>
      <TopBar voltar={ehDesktop ? undefined : voltar} titulo={t("Histórico")} />
      <div style={{ padding: "4px 20px 0" }}>
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
          {t("Meses")}
        </div>
        <Card style={{ padding: "4px 16px" }}>
          {dadosMeses.map((d, i) => (
            <div
              key={d.mes}
              onClick={() => irPara("gastos", { mes: d.mes })}
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
                  {t(MESES_CURTO[parseInt(d.mes.split("-")[1], 10) - 1])}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}
                >
                  {rotuloMesT(t, d.mes)}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    fontWeight: 600,
                    marginTop: 2,
                  }}
                >
                  {t("{count} transações", { count: d.count })}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}
                >
                  {fmtBRLCompacto(d.total)}
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
