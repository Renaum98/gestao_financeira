// historico.jsx — Tela Histórico (comparativo de meses, agrupado por ano)
//
// Os anos começam RECOLHIDOS. Com dois ou três anos de uso a lista corrida
// passava de trinta linhas e enterrava os meses recentes; recolhido, a tela
// cabe inteira e quem quer 2024 abre 2024.

import React, { useMemo } from "react";
import { flushSync } from "react-dom";
import {
  MESES_CURTO,
  fmtBRLCompacto,
  rotuloMesT,
} from "../data.js";
import { Icon } from "../ui/icons.jsx";
import { Card, TopBar } from "../ui/common.jsx";
import { Expansivel } from "../ui/expansivel.jsx";
import { modoLeve, semMovimento } from "../lib/anime.js";
import { vibrar } from "../lib/haptics.js";
import { useT } from "../lib/i18n.jsx";

function LinhaMes({ d, ativo, primeiro, t, onClick }) {
  return (
    <div
      onClick={onClick}
      className="clicavel"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        borderTop: primeiro ? "none" : "1px solid var(--linha)",
        cursor: "pointer",
      }}
    >
      {/* Menor que o quadrado do ano e no fundo do card (o subgrupo já pinta
          var(--bg)): a hierarquia ano › mês também se lê pelo tamanho. */}
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: "var(--raio-compacto)",
          background: ativo ? "var(--primary)" : "var(--card)",
          color: ativo ? "#fff" : "var(--ink)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 9, opacity: 0.8 }}>{d.mes.split("-")[0].slice(2)}</div>
        <div style={{ fontSize: 12, letterSpacing: "-0.02em" }}>
          {t(MESES_CURTO[parseInt(d.mes.split("-")[1], 10) - 1])}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
          {rotuloMesT(t, d.mes)}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>
          {t("{count} transações", { count: d.count })}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>
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

  // Abrir e fechar um ano tem movimento nos dois layouts, cada um com o seu:
  //   • celular: os meses abrem em altura (Expansivel), o card só cresce;
  //   • desktop: o ano muda de lugar na grade (de uma célula pra linha inteira)
  //     e empurra os vizinhos. Isso é troca de layout, que transição CSS não
  //     alcança — então é uma View Transition: cada card de ano tem nome
  //     próprio e o navegador faz o morph de posição e tamanho entre as duas
  //     grades (o CSS do morph está em layout.css, sob .vt-anos).
  // Sem suporte, no modo leve ou com "reduzir movimento", troca seco.
  const alternar = (ano) => {
    vibrar();
    const aplicar = () =>
      setAbertos((atual) => {
        const novo = new Set(atual);
        if (novo.has(ano)) novo.delete(ano);
        else novo.add(ano);
        return novo;
      });
    if (!ehDesktop || !document.startViewTransition || semMovimento() || modoLeve()) {
      aplicar();
      return;
    }
    const raiz = document.documentElement;
    raiz.classList.add("vt-anos");
    // flushSync: a View Transition fotografa o DOM assim que o callback volta,
    // e o React precisa já ter aplicado o novo estado nesse instante.
    const vt = document.startViewTransition(() => flushSync(aplicar));
    vt.finished.finally(() => raiz.classList.remove("vt-anos"));
  };

  return (
    <div style={{ paddingBottom: "var(--pad-bottom)" }}>
      <TopBar voltar={ehDesktop ? undefined : voltar} titulo={t("Histórico")} />
      <div style={{ padding: "4px var(--pad-x) 0" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: 0.4,
            padding: "0 4px var(--esp-titulo)",
          }}
        >
          {t("Meses")}
        </div>

        {/* Um card por ano, e nenhum depende do outro: no desktop eles se
            repartem em colunas. Aberto, o ano toma a linha inteira da grade e
            os meses se espalham em colunas dentro dele (layout.css) — crescendo
            numa célula só, ele virava uma tira comprida ao lado de um vizinho
            baixinho. */}
        <div className="grade-tiles">
          {anos.map((g) => {
            const aberto = abertos.has(g.ano);
            // O ano do mês que está aberto no app ganha destaque: recolhido,
            // é o único jeito de saber onde você está.
            const ehAnoAtivo = mes.slice(0, 4) === g.ano;
            // Os meses formam um subgrupo dentro do card do ano: bloco
            // recuado com fundo próprio, pra a lista não se confundir com a
            // linha do ano (antes era tudo da mesma cor, separado só por
            // divisórias iguais).
            const meses = (
              <div
                className="meses-do-ano"
                style={{
                  margin: "0 -6px 12px",
                  padding: "2px 12px",
                  borderRadius: "var(--raio-bloco)",
                  background: "var(--bg)",
                }}
              >
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
            );
            return (
              <Card
                key={g.ano}
                className={aberto ? "ano-aberto" : undefined}
                style={{
                  padding: "4px 16px",
                  // nome e classe do morph do desktop (ver `alternar`)
                  ...(ehDesktop && {
                    viewTransitionName: `ano-${g.ano}`,
                    viewTransitionClass: "ano",
                  }),
                }}
              >
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
                      borderRadius: "var(--raio-bloco)",
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

                {/* No desktop quem anima é a View Transition (ver `alternar`):
                    um Expansivel ali brigaria com o morph. */}
                {ehDesktop ? (
                  aberto && meses
                ) : (
                  <Expansivel aberto={aberto}>{meses}</Expansivel>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
