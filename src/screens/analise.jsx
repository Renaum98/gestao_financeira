// analise.jsx — Tela Análise (pizza, resumo, evolução, formas de pagamento, ranking)

import React from "react";
import {
  CATEGORIAS,
  ORDEM_CATS,
  fmtBRL,
  fmtBRLCompacto,
  rotuloMesCurto,
  totalGeral,
  totalPorCategoria,
  txDoMes,
} from "../data.js";
import { CatChip, Icon, iconePagamento } from "../ui/icons.jsx";
import { Card, SeletorMes, TopBar } from "../ui/common.jsx";
import { BarraProgresso, LineChart, PieChart } from "../ui/charts.jsx";

const VERDE = "#1B9E6A";
const VERMELHO = "#D63A55";

function mesShift(yyyymm, delta) {
  const [y, m] = yyyymm.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function diasNoMes(yyyymm) {
  const [y, m] = yyyymm.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

function SecaoTitulo({ children }) {
  return (
    <div
      style={{
        fontSize: 15,
        fontWeight: 700,
        color: "var(--ink)",
        padding: "0 4px 8px",
      }}
    >
      {children}
    </div>
  );
}

export function AnaliseScreen({ ctx }) {
  const { txs, mes, setMes, todosMeses, mesAnterior, ocultar, irPara, ehDesktop } = ctx;
  const spanAll = ehDesktop ? "col-span-all" : undefined;
  const [ativa, setAtiva] = React.useState(null);

  const txMes = React.useMemo(() => txDoMes(txs, mes), [txs, mes]);
  const txMesAnt = React.useMemo(
    () => (mesAnterior ? txDoMes(txs, mesAnterior) : []),
    [txs, mesAnterior],
  );
  const porCat = totalPorCategoria(txMes);
  const porCatAnt = totalPorCategoria(txMesAnt);
  const total = totalGeral(txMes);
  const totalAnt = totalGeral(txMesAnt);

  const dados = ORDEM_CATS.filter((c) => (porCat[c] || 0) > 0)
    .map((c) => ({
      id: c,
      valor: porCat[c],
      cor: CATEGORIAS[c].cor,
      nome: CATEGORIAS[c].nome,
    }))
    .sort((a, b) => b.valor - a.valor);

  // ─── Resumo ───
  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  const diasDecorridos =
    mes === mesAtual ? hoje.getDate() : diasNoMes(mes);
  const mediaDia = diasDecorridos > 0 ? total / diasDecorridos : 0;
  const maiorTx = txMes.reduce(
    (a, t) => (t.tipo === "entrada" ? a : !a || t.valor > a.valor ? t : a),
    null,
  );
  const diffTotal =
    totalAnt > 0 ? ((total - totalAnt) / totalAnt) * 100 : null;

  // ─── Evolução (6 meses) ───
  const evolucao = React.useMemo(() => {
    const out = [];
    for (let i = 5; i >= 0; i--) {
      const k = mesShift(mes, -i);
      out.push({
        key: k,
        label: rotuloMesCurto(k).replace(/ \d+$/, ""),
        total: totalGeral(txDoMes(txs, k)),
      });
    }
    return out;
  }, [txs, mes]);
  const maxEvol = Math.max(...evolucao.map((e) => e.total), 1);
  const mediaEvol =
    evolucao.reduce((s, e) => s + e.total, 0) / evolucao.length;

  // ─── Por forma de pagamento (só saídas) ───
  const porPagamento = React.useMemo(() => {
    const m = {};
    for (const t of txMes) {
      if (t.tipo === "entrada") continue;
      const k = t.pagamento || "Outros";
      m[k] = (m[k] || 0) + t.valor;
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [txMes]);

  // ─── Gasto acumulado (só saídas) ───
  const acumular = (lista) => {
    const porDia = {};
    for (const t of lista) {
      if (t.tipo === "entrada") continue;
      const d = Number(t.data.slice(8, 10));
      porDia[d] = (porDia[d] || 0) + t.valor;
    }
    let acc = 0;
    const pts = [{ dia: 0, valor: 0 }];
    for (let d = 1; d <= 31; d++) {
      if (porDia[d]) acc += porDia[d];
      pts.push({ dia: d, valor: acc });
    }
    return pts;
  };
  const acumulado = React.useMemo(() => acumular(txMes), [txMes]);
  const acumuladoAnt = React.useMemo(
    () => (txMesAnt.length ? acumular(txMesAnt) : null),
    [txMesAnt],
  );

  // ─── Maiores gastos (só saídas) ───
  const maioresGastos = React.useMemo(
    () => txMes.filter((t) => t.tipo !== "entrada").sort((a, b) => b.valor - a.valor).slice(0, 5),
    [txMes],
  );

  return (
    <div className={ehDesktop ? "cols-desktop" : undefined} style={{ paddingBottom: "var(--pad-bottom)" }}>
      <div className={spanAll}>
        <TopBar titulo="Análise" />
      </div>
      <div
        className={spanAll}
        style={{
          padding: "0 20px 12px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <SeletorMes mes={mes} setMes={setMes} todosMeses={todosMeses} />
      </div>

      {total === 0 ? (
        <div className={spanAll} style={{ padding: "0 20px" }}>
          <Card style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600 }}>
              Nenhum gasto registrado neste mês.
            </div>
          </Card>
        </div>
      ) : (
        <>
          {/* Resumo do mês */}
          <div className={spanAll} style={{ padding: "0 20px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
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
                valor={String(txMes.length)}
                extra={`${dados.length} categoria${dados.length > 1 ? "s" : ""}`}
              />
              <StatCard
                rotulo="Maior gasto"
                valor={maiorTx ? fmtBRLCompacto(maiorTx.valor, ocultar) : "—"}
                extra={maiorTx ? maiorTx.descricao : null}
              />
            </div>
          </div>

          {/* Pizza grande */}
          <div style={{ padding: "16px 20px 0" }}>
            <Card>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "10px 0",
                }}
              >
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
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        background: d.cor,
                      }}
                    />
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
                        {d.nome}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--muted)",
                          fontWeight: 600,
                        }}
                      >
                        {fmtBRLCompacto(d.valor, ocultar)} ·{" "}
                        {((d.valor / total) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Evolução 6 meses */}
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
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: "var(--muted)",
                        }}
                      >
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

          {/* Gasto acumulado */}
          <div style={{ padding: "16px 20px 0" }}>
            <SecaoTitulo>Gasto acumulado no mês</SecaoTitulo>
            <Card>
              <LineChart
                pontos={acumulado}
                pontosComp={acumuladoAnt}
                largura={340}
                altura={150}
                ocultar={ocultar}
              />
              {acumuladoAnt && (
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--muted)",
                    marginTop: 4,
                  }}
                >
                  <span>
                    <span style={{ color: "var(--primary)" }}>—</span> Este mês
                  </span>
                  <span>
                    <span style={{ color: "var(--linha)" }}>┄</span> Mês anterior
                  </span>
                </div>
              )}
            </Card>
          </div>

          {/* Por forma de pagamento */}
          <div style={{ padding: "16px 20px 0" }}>
            <SecaoTitulo>Por forma de pagamento</SecaoTitulo>
            <Card style={{ padding: "4px 16px" }}>
              {porPagamento.map(([nome, valor], i) => (
                <div
                  key={nome}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderTop: i === 0 ? "none" : "1px solid var(--linha)",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      background: "var(--surface-sunken)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon
                      name={iconePagamento(nome)}
                      size={18}
                      color="var(--ink)"
                      strokeWidth={2}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--ink)",
                      }}
                    >
                      {nome}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <BarraProgresso
                        valor={valor}
                        max={porPagamento[0][1]}
                        cor="var(--primary)"
                        altura={6}
                      />
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "var(--ink)",
                      }}
                    >
                      {fmtBRLCompacto(valor, ocultar)}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "var(--muted)",
                        marginTop: 2,
                      }}
                    >
                      {((valor / total) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* Ranking de categorias */}
          <div style={{ padding: "16px 20px 0" }}>
            <SecaoTitulo>Top categorias</SecaoTitulo>
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
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--ink)",
                        }}
                      >
                        {d.nome}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <BarraProgresso
                          valor={d.valor}
                          max={dados[0].valor}
                          cor={d.cor}
                          altura={6}
                        />
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: "var(--ink)",
                        }}
                      >
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

          {/* Maiores gastos do mês */}
          <div style={{ padding: "16px 20px 0" }}>
            <SecaoTitulo>Maiores gastos do mês</SecaoTitulo>
            <Card style={{ padding: "4px 16px" }}>
              {maioresGastos.map((t, i) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderTop: i === 0 ? "none" : "1px solid var(--linha)",
                  }}
                >
                  <CatChip catId={t.categoria} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--ink)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {t.descricao}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        fontWeight: 600,
                      }}
                    >
                      {t.data.slice(8, 10)}/{t.data.slice(5, 7)} ·{" "}
                      {CATEGORIAS[t.categoria]?.nome}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "var(--ink)",
                    }}
                  >
                    {fmtBRL(t.valor, ocultar)}
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </>
      )}

      {/* Atalho para orçamentos */}
      <div className={spanAll} style={{ padding: "16px 20px 0" }}>
        <Card
          onClick={() => irPara("orcamentos")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: "linear-gradient(135deg, #FFF3E2, #FFE0EC)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon
              name="target"
              size={22}
              color="var(--primary)"
              strokeWidth={2.2}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1416" }}>
              Acompanhar orçamentos
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#6B5560",
                fontWeight: 600,
                marginTop: 2,
              }}
            >
              Veja onde está perto do limite
            </div>
          </div>
          <Icon
            name="chevron-right"
            size={18}
            color="#1A1416"
            strokeWidth={2.4}
          />
        </Card>
      </div>
    </div>
  );
}

function StatCard({ rotulo, valor, extra, extraCor }) {
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
          color: "var(--ink)",
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
