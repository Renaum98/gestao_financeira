// EvolucaoMeses.jsx — barras de gasto total nos últimos 6 meses, com a linha
// de tendência por cima. Tocar numa barra troca o mês selecionado.

import { fmtBRL, fmtBRLCompacto } from "../../data.js";
import { Card } from "../../ui/common.jsx";
import { SecaoTitulo } from "./SecaoTitulo.jsx";
import { useT } from "../../lib/i18n.jsx";

// Espaço acima das barras pro valor da barra mais alta, e abaixo pro rótulo
// do mês. A linha de tendência é desenhada só na faixa entre os dois, que é
// onde as barras vivem.
const TOPO = 16;
const ROTULO = 12;
const ROTULO_GAP = 6;

// Reta de mínimos quadrados sobre os meses com gasto. Os meses zerados do
// começo ficam de fora: antes do primeiro lançamento o app não era usado, e
// contá-los puxaria a reta pra cima como se o gasto tivesse disparado.
// Devolve null com menos de dois pontos — uma reta por um ponto só não diz nada.
function calcTendencia(evolucao) {
  const inicio = evolucao.findIndex((e) => e.total > 0);
  if (inicio < 0) return null;
  const pts = evolucao.slice(inicio).map((e) => e.total);
  const n = pts.length;
  if (n < 2) return null;
  const mx = (n - 1) / 2;
  const my = pts.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let den = 0;
  pts.forEach((v, i) => {
    num += (i - mx) * (v - my);
    den += (i - mx) ** 2;
  });
  const incl = num / den;
  return {
    inicio,
    fim: evolucao.length - 1,
    de: Math.max(my - incl * mx, 0),
    ate: Math.max(my + incl * mx, 0),
    porMes: incl,
  };
}

export function EvolucaoMeses({ evolucao, maxEvol, mediaEvol, mes, setMes }) {
  const t = useT();
  const tend = calcTendencia(evolucao);
  // A reta pode passar da barra mais alta (tendência subindo forte); a escala
  // abre espaço pra ela não sair do gráfico.
  const escala = Math.max(maxEvol, tend?.de || 0, tend?.ate || 0);
  const n = evolucao.length;
  const yDe = (v) => 100 - (v / escala) * 100;

  return (
    <div style={{ padding: "var(--esp-secao) var(--pad-x) 0" }}>
      <SecaoTitulo>{t("Evolução (6 meses)")}</SecaoTitulo>
      <Card className="card-cheio">
        <div
          className="grafico-barras"
          style={{
            display: "flex",
            height: 130 + TOPO,
            paddingTop: TOPO,
            position: "relative",
          }}
        >
          {evolucao.map((e) => {
            const h = Math.max((e.total / escala) * 100, 2);
            const atual = e.key === mes;
            return (
              <div
                key={e.key}
                onClick={() => setMes(e.key)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <div style={{ flex: 1, width: "100%", position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: `calc(${h}% + 4px)`,
                      textAlign: "center",
                      fontSize: 9,
                      fontWeight: 700,
                      color: "var(--muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {e.total > 0 ? fmtBRLCompacto(e.total) : ""}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "calc(100% - 8px)",
                      maxWidth: 34,
                      height: `${h}%`,
                      borderRadius: "var(--raio-miudo)",
                      background: atual
                        ? "linear-gradient(180deg, var(--primary), var(--primary-2))"
                        : "var(--surface-sunken)",
                      transition: "height .2s",
                    }}
                  />
                </div>
                <div
                  style={{
                    marginTop: ROTULO_GAP,
                    height: ROTULO,
                    lineHeight: `${ROTULO}px`,
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

          {tend && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: TOPO,
                bottom: ROTULO + ROTULO_GAP,
                pointerEvents: "none",
              }}
            >
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${n * 100} 100`}
                preserveAspectRatio="none"
                style={{ display: "block", overflow: "visible" }}
              >
                <line
                  x1={(tend.inicio + 0.5) * 100}
                  y1={yDe(tend.de)}
                  x2={(tend.fim + 0.5) * 100}
                  y2={yDe(tend.ate)}
                  stroke="var(--ink)"
                  strokeOpacity={0.55}
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          )}
        </div>
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--linha)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            columnGap: 16,
            rowGap: 4,
            fontSize: 12,
            fontWeight: 600,
            color: "var(--muted)",
            textAlign: "center",
          }}
        >
          <span>{t("Média mensal: {x}", { x: fmtBRL(mediaEvol) })}</span>
          {tend && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <svg width="16" height="2" aria-hidden style={{ flexShrink: 0 }}>
                <line
                  x1="0"
                  y1="1"
                  x2="16"
                  y2="1"
                  stroke="var(--ink)"
                  strokeOpacity={0.55}
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                />
              </svg>
              {t("Tendência: {x}/mês", {
                x: `${tend.porMes >= 0 ? "+" : "−"}${fmtBRL(Math.abs(tend.porMes))}`,
              })}
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
