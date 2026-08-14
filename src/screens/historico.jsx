// historico.jsx — Tela Histórico (comparativo de meses, agrupado por ano)
//
// Os anos começam RECOLHIDOS. Com dois ou três anos de uso a lista corrida
// passava de trinta linhas e enterrava os meses recentes; recolhido, a tela
// cabe inteira e quem quer 2024 abre 2024.

import React, { useMemo } from "react";
import {
  MESES_CURTO,
  fmtBRLCompacto,
  rotuloMesT,
} from "../data.js";
import { Icon } from "../ui/icons.jsx";
import { Card, TopBar } from "../ui/common.jsx";
import { vibrar } from "../lib/haptics.js";
import { useT } from "../lib/i18n.jsx";

function LinhaMes({ d, ativo, primeiro, t, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderTop: primeiro ? "none" : "1px solid var(--linha)",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: ativo ? "var(--primary)" : "var(--bg)",
          color: ativo ? "#fff" : "var(--ink)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 10, opacity: 0.8 }}>{d.mes.split("-")[0].slice(2)}</div>
        <div style={{ fontSize: 13, letterSpacing: "-0.02em" }}>
          {t(MESES_CURTO[parseInt(d.mes.split("-")[1], 10) - 1])}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
          {rotuloMesT(t, d.mes)}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>
          {t("{count} transações", { count: d.count })}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>
          {fmtBRLCompacto(d.total)}
        </div>
      </div>
      <Icon name="chevron-right" size={16} color="var(--muted)" strokeWidth={2} />
    </div>
  );
}

export function HistoricoScreen({ ctx }) {
  const { txs, todosMeses, voltar, irPara, mes, ehDesktop } = ctx;
  const t = useT();
  // Anos abertos. Set vazio = tudo recolhido, que é como a tela abre.
  const [abertos, setAbertos] = React.useState(() => new Set());

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

  // Agrupa por ano preservando a ordem de `todosMeses` (mais recente primeiro).
  const anos = useMemo(() => {
    const porAno = new Map();
    for (const d of dadosMeses) {
      const ano = d.mes.slice(0, 4);
      let grupo = porAno.get(ano);
      if (!grupo) {
        grupo = { ano, meses: [], total: 0, count: 0 };
        porAno.set(ano, grupo);
      }
      grupo.meses.push(d);
      grupo.total += d.total;
      grupo.count += d.count;
    }
    return Array.from(porAno.values());
  }, [dadosMeses]);

  const alternar = (ano) => {
    vibrar();
    setAbertos((atual) => {
      const novo = new Set(atual);
      if (novo.has(ano)) novo.delete(ano);
      else novo.add(ano);
      return novo;
    });
  };

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

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {anos.map((g) => {
            const aberto = abertos.has(g.ano);
            // O ano do mês que está aberto no app ganha destaque: recolhido,
            // é o único jeito de saber onde você está.
            const ehAnoAtivo = mes.slice(0, 4) === g.ano;
            return (
              <Card key={g.ano} style={{ padding: "4px 16px" }}>
                <div
                  onClick={() => alternar(g.ano)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={aberto}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      alternar(g.ano);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 0",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: ehAnoAtivo ? "var(--primary)" : "var(--bg)",
                      color: ehAnoAtivo ? "#fff" : "var(--ink)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      flexShrink: 0,
                    }}
                  >
                    {g.ano.slice(2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>
                      {g.ano}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        fontWeight: 600,
                        marginTop: 2,
                      }}
                    >
                      {g.meses.length === 1
                        ? t("1 mês · {count} transações", { count: g.count })
                        : t("{n} meses · {count} transações", {
                            n: g.meses.length,
                            count: g.count,
                          })}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>
                      {fmtBRLCompacto(g.total)}
                    </div>
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      transform: aberto ? "rotate(180deg)" : "none",
                      transition: "transform .15s",
                    }}
                  >
                    <Icon name="chevron-down" size={18} color="var(--muted)" strokeWidth={2} />
                  </span>
                </div>

                {aberto && (
                  <div style={{ borderTop: "1px solid var(--linha)", paddingBottom: 4 }}>
                    {g.meses.map((d, i) => (
                      <LinhaMes
                        key={d.mes}
                        d={d}
                        t={t}
                        ativo={d.mes === mes}
                        primeiro={i === 0}
                        onClick={() => irPara("gastos", { mes: d.mes })}
                      />
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
