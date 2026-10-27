// ResumoMes.jsx — resumo do mês no topo da Análise, num card só.
//
// Antes eram quatro indicadores do mesmo tamanho numa grade 2×2, e nenhum era
// a manchete. Agora o total gasto é a manchete, a comparação com o mês
// anterior vem em frase, e o resto desce pra uma linha de rodapé.
//
// A barra de ritmo é o que junta os números: quanto do orçamento já foi contra
// quanto do mês já passou (o tique). Só no mês corrente o tique faz sentido —
// num mês fechado o mês inteiro passou, e num futuro ainda não começou.
// O preenchimento só muda de cor quando pede atenção: passou do orçamento
// (vermelho) ou está gastando mais rápido que o mês anda (laranja).

import { MESES, fmtBRL, fmtBRLCompacto } from "../../data.js";
import { Card } from "../../ui/common.jsx";
import { COR_POS, COR_NEG, COR_AVISO } from "../../lib/colors.js";
import { useT } from "../../lib/i18n.jsx";

// Folga antes de acusar "acima do ritmo": no começo do mês um gasto grande
// isolado (aluguel, mercado do mês) adianta a barra sem querer dizer nada.
const FOLGA_RITMO = 5;

export function ResumoMes({
  total,
  diffTotal,
  mesAnterior,
  mediaDia,
  diasDecorridos,
  diasMes,
  ehMesAtual,
  ehPassado,
  txCount,
  restante,
  orcTotal,
  spanAll,
}) {
  const t = useT();
  const temOrc = orcTotal > 0;
  const pctGasto = temOrc ? (total / orcTotal) * 100 : 0;
  const pctMes = (diasDecorridos / diasMes) * 100;
  const estourou = temOrc && restante < 0;
  const acimaDoRitmo = ehMesAtual && !estourou && pctGasto > pctMes + FOLGA_RITMO;
  const corBarra = estourou ? COR_NEG : acimaDoRitmo ? COR_AVISO : "var(--primary)";

  const nomeMesAnt = mesAnterior ? t(MESES[Number(mesAnterior.slice(5, 7)) - 1]) : "";
  const pctDiff = diffTotal !== null ? Math.abs(diffTotal).toFixed(0) : null;

  const rodape = [
    temOrc && {
      texto: estourou
        ? t("{x} acima do orçamento", { x: fmtBRLCompacto(-restante) })
        : ehPassado
          ? t("Sobrou {x}", { x: fmtBRLCompacto(restante) })
          : t("Sobram {x}", { x: fmtBRLCompacto(restante) }),
      cor: estourou ? COR_NEG : COR_POS,
    },
    { texto: t("{x}/dia", { x: fmtBRL(mediaDia) }) },
    { texto: txCount === 1 ? t("{n} lançamento", { n: txCount }) : t("{n} lançamentos", { n: txCount }) },
  ].filter(Boolean);

  return (
    <div className={spanAll} style={{ padding: "0 var(--pad-x)" }}>
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>{t("Você gastou")}</div>
        <div
          style={{
            marginTop: 4,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--ink)",
          }}
        >
          {fmtBRL(total)}
        </div>
        {pctDiff !== null && (
          <div style={{ marginTop: 2, fontSize: 12.5, fontWeight: 600, color: "var(--muted)" }}>
            {pctDiff === "0" ? (
              t("o mesmo que {mes}", { mes: nomeMesAnt })
            ) : (
              <>
                <span style={{ color: diffTotal > 0 ? COR_NEG : COR_POS }}>
                  {diffTotal > 0 ? t("{pct}% a mais", { pct: pctDiff }) : t("{pct}% a menos", { pct: pctDiff })}
                </span>{" "}
                {t("que {mes}", { mes: nomeMesAnt })}
              </>
            )}
          </div>
        )}

        {temOrc && (
          <div style={{ marginTop: 16 }}>
            <div style={{ position: "relative", padding: "3px 0" }}>
              <div
                style={{
                  height: 8,
                  borderRadius: "var(--raio-pilula)",
                  background: "var(--surface-sunken)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, pctGasto)}%`,
                    height: "100%",
                    borderRadius: "var(--raio-pilula)",
                    background: corBarra,
                  }}
                />
              </div>
              {ehMesAtual && (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${pctMes}%`,
                    width: 2,
                    marginLeft: -1,
                    borderRadius: 1,
                    background: "var(--ink)",
                    opacity: 0.55,
                  }}
                />
              )}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                marginTop: 6,
                fontSize: 11.5,
                fontWeight: 600,
                color: "var(--muted)",
              }}
            >
              <span style={{ color: estourou ? COR_NEG : acimaDoRitmo ? COR_AVISO : undefined }}>
                {t("{pct}% do orçamento", { pct: pctGasto.toFixed(0) })}
                {acimaDoRitmo && ` · ${t("acima do ritmo")}`}
              </span>
              {ehMesAtual && <span>{t("dia {d} de {n}", { d: diasDecorridos, n: diasMes })}</span>}
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px 0",
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid var(--linha)",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--muted)",
          }}
        >
          {rodape.map((item, i) => (
            <span key={i} style={{ whiteSpace: "nowrap" }}>
              {i > 0 && <span style={{ margin: "0 8px", opacity: 0.6 }}>·</span>}
              <span style={{ color: item.cor }}>{item.texto}</span>
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
