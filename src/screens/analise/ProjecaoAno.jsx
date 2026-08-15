// ProjecaoAno.jsx — card de projeção do ANO INTEIRO no topo da Análise. De
// propósito NÃO depende do mês selecionado na tela: o seletor manda nos blocos
// abaixo, aqui a foto é sempre o ano corrente.
//
// Abre recolhido: só "Projeção anual" e o total. O detalhe (entradas, gastos,
// barra) vem no clique — mesmo padrão dos anos do Histórico.
//
// A conta do ano:
//   esperado = Σ (orçamento do mês + entradas do mês), janeiro a dezembro
//   sobra    = esperado − gastos do ano
// Ou seja: o orçamento de cada mês é dinheiro que se espera ter, não gasto
// previsto. Os gastos que descem dele são os reais — o que já foi lançado,
// incluindo parcelas com data futura.
//
// Entradas de um mês = as já lançadas + as agendadas (recorrentes do tipo
// entrada) que ainda não viraram tx naquele mês. O "ainda não viraram tx" evita
// contar duas vezes: o gerador de recorrentes lança as do mês atual pra trás, e
// cada tx gerada carrega `recorrenteId`.

import React from "react";
import {
  fmtBRL,
  totalEntradas,
  totalGeral,
  txDoMes,
  valorRecNoMes,
} from "../../data.js";
import { Card } from "../../ui/common.jsx";
import { Expansivel } from "../../ui/expansivel.jsx";
import { Icon } from "../../ui/icons.jsx";
import { calcOrcBaseAtual, obterOrcBaseDoMes } from "../../lib/orcamento.js";
import { COR_POS as VERDE, COR_NEG as VERMELHO } from "../../lib/colors.js";
import { vibrar } from "../../lib/haptics.js";
import { useT } from "../../lib/i18n.jsx";

export function calcularProjecaoAno({ ano, txs, recorrentes, preferences, mesAtual }) {
  let orcamentoAno = 0;
  let entradasAno = 0;
  let gastosAno = 0;

  for (let i = 1; i <= 12; i++) {
    const mes = `${ano}-${String(i).padStart(2, "0")}`;
    const txMes = txDoMes(txs, mes);

    orcamentoAno += obterOrcBaseDoMes(mes, preferences, mesAtual);
    gastosAno += totalGeral(txMes);

    // Entradas já lançadas no mês.
    entradasAno += totalEntradas(txMes);

    // Entradas agendadas que ainda não foram lançadas (meses à frente).
    if (mes < mesAtual) continue;
    const jaLancadas = new Set(
      txMes.filter((t) => t.recorrenteId).map((t) => t.recorrenteId),
    );
    for (const r of recorrentes) {
      if (r.tipo !== "entrada") continue;
      if (r.inicio && mes < r.inicio) continue;
      if (r.fim && mes > r.fim) continue;
      if (jaLancadas.has(r.id)) continue;
      entradasAno += valorRecNoMes(r, mes);
    }
  }

  const esperado = orcamentoAno + entradasAno;
  return {
    orcamentoAno,
    entradasAno,
    gastosAno,
    esperado,
    sobra: esperado - gastosAno,
    orcMensal: calcOrcBaseAtual(preferences),
  };
}

function Linha({ rotulo, valor, cor }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "9px 0",
      }}
    >
      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)" }}>{rotulo}</span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: cor || "var(--ink)",
          letterSpacing: "-0.01em",
        }}
      >
        {valor}
      </span>
    </div>
  );
}

export function ProjecaoAno({ txs, recorrentes = [], preferences, mesAtual, spanAll }) {
  const t = useT();
  const ano = Number(mesAtual.slice(0, 4));
  const [aberto, setAberto] = React.useState(false);

  const { orcamentoAno, entradasAno, gastosAno, esperado, sobra, orcMensal } = React.useMemo(
    () => calcularProjecaoAno({ ano, txs, recorrentes, preferences, mesAtual }),
    [ano, txs, recorrentes, preferences, mesAtual],
  );

  // Barra: quanto do total esperado do ano os gastos já comeram.
  const pctGasto =
    esperado > 0 ? Math.min(100, (gastosAno / esperado) * 100) : gastosAno > 0 ? 100 : 0;

  const alternar = () => {
    vibrar();
    setAberto((v) => !v);
  };

  return (
    <div className={spanAll} style={{ padding: "0 20px 12px" }}>
      <Card style={{ padding: "2px 16px" }}>
        <div
          onClick={alternar}
          role="button"
          tabIndex={0}
          aria-expanded={aberto}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              alternar();
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 0",
            cursor: "pointer",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>
              {t("Projeção anual")}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>
              {ano}
            </div>
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: sobra >= 0 ? VERDE : VERMELHO,
              letterSpacing: "-0.02em",
            }}
          >
            {sobra < 0 && "−"}
            {fmtBRL(Math.abs(sobra))}
          </div>
          <span
            className="chevron-expansivel"
            style={{
              display: "inline-flex",
              transform: aberto ? "rotate(180deg)" : "none",
            }}
          >
            <Icon name="chevron-down" size={18} color="var(--muted)" strokeWidth={2} />
          </span>
        </div>

        <Expansivel aberto={aberto}>
          <div style={{ borderTop: "1px solid var(--linha)", padding: "12px 0 14px" }}>
              <div
                style={{
                  height: 6,
                  borderRadius: 999,
                  background: "var(--linha)",
                  overflow: "hidden",
                }}
              >
                <div
                  className="projecao-barra"
                  style={{
                    width: aberto ? `${pctGasto}%` : "0%",
                    height: "100%",
                    borderRadius: 999,
                    background: VERMELHO,
                  }}
                />
              </div>

              <div style={{ marginTop: 8 }}>
                <Linha rotulo={t("Orçamento do ano")} valor={fmtBRL(orcamentoAno)} />
                <Linha rotulo={t("Entradas no ano")} valor={fmtBRL(entradasAno)} cor={VERDE} />
                <Linha rotulo={t("Total esperado")} valor={fmtBRL(esperado)} />
                <Linha rotulo={t("Gastos no ano")} valor={fmtBRL(gastosAno)} cor={VERMELHO} />
              </div>

              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: "var(--muted)",
                  lineHeight: 1.45,
                  marginTop: 4,
                }}
              >
                {orcMensal > 0
                  ? t("orçamento de {x}/mês nos 12 meses + entradas agendadas", {
                      x: fmtBRL(orcMensal),
                    })
                  : t("sem orçamento definido — só as entradas contam")}
              </div>
          </div>
        </Expansivel>
      </Card>
    </div>
  );
}
