// ProjecaoAno.jsx — card de projeção do ANO INTEIRO no topo da Análise. De
// propósito NÃO depende do mês selecionado na tela: o seletor manda nos blocos
// abaixo, aqui a foto é sempre o ano corrente.
//
// É o card de destaque da Análise — mesmo <CardDestaque> do card de saldo do
// Início e do orçamento mensal, com as pastilhas translúcidas de sempre. Sobre
// o roxo, sobra e déficit trocam o verde/vermelho da UI clara pelos tons
// COR_POS_SOBRE / COR_NEG_SOBRE, os mesmos do "Restante" lá.
//
// Abre recolhido: rótulo, ano e o valor da sobra. O detalhe (barra, entradas,
// gastos) vem no clique — mesmo padrão dos anos do Histórico.
//
// A conta do ano:
//   esperado = Σ (orçamento do mês + entradas do mês), janeiro a dezembro
//   sobra    = esperado − gastos do ano
// Ou seja: o orçamento de cada mês é dinheiro que se espera ter, não gasto
// previsto. Os gastos que descem dele são os reais — o que já foi lançado,
// incluindo parcelas com data futura.
//
// O orçamento é lido mês a mês, não "o de hoje × 12": `obterOrcBaseDoMes` usa o
// histórico de vigência, então um aumento feito em agosto vale de agosto (e do
// mês anterior, julho) em diante, e junho pra trás mantém o valor antigo.
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
import { CardDestaque } from "../../ui/card-destaque.jsx";
import { Expansivel } from "../../ui/expansivel.jsx";
import { Icon } from "../../ui/icons.jsx";
import { calcOrcBaseAtual, obterOrcBaseDoMes } from "../../lib/orcamento.js";
import { COR_POS_SOBRE, COR_NEG_SOBRE, COR_NEG_SOBRE_FORTE } from "../../lib/colors.js";
import { vibrar } from "../../lib/haptics.js";
import { useT } from "../../lib/i18n.jsx";

function calcularProjecaoAno({ ano, txs, recorrentes, preferences, mesAtual }) {
  let orcamentoAno = 0;
  let entradasAno = 0;
  let gastosAno = 0;
  // O orçamento pode mudar no meio do ano; guardamos o primeiro mês pra saber
  // se houve variação e ajustar a legenda do card.
  let orcPrimeiroMes = null;
  let orcVariou = false;

  for (let i = 1; i <= 12; i++) {
    const mes = `${ano}-${String(i).padStart(2, "0")}`;
    const txMes = txDoMes(txs, mes);

    const orcMes = obterOrcBaseDoMes(mes, preferences, mesAtual);
    if (orcPrimeiroMes === null) orcPrimeiroMes = orcMes;
    else if (orcMes !== orcPrimeiroMes) orcVariou = true;
    orcamentoAno += orcMes;
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
    orcVariou,
  };
}

// Uma linha do detalhe. `destaque` marca o subtotal (Total esperado) com uma
// pastilha translúcida — é o resultado da soma logo acima, não mais um item
// dela.
function Linha({ rotulo, valor, cor, destaque }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: destaque ? "10px 12px" : "9px 2px",
        margin: destaque ? "4px 0" : 0,
        borderRadius: destaque ? 12 : 0,
        background: destaque ? "rgba(255,255,255,0.12)" : undefined,
      }}
    >
      <span style={{ fontSize: 12.5, fontWeight: 600, opacity: destaque ? 0.95 : 0.8 }}>
        {rotulo}
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: destaque ? 800 : 700,
          color: cor || "#fff",
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

  const { orcamentoAno, entradasAno, gastosAno, esperado, sobra, orcMensal, orcVariou } =
    React.useMemo(
      () => calcularProjecaoAno({ ano, txs, recorrentes, preferences, mesAtual }),
      [ano, txs, recorrentes, preferences, mesAtual],
    );

  // Barra: quanto do total esperado do ano os gastos já comeram.
  const pctGasto =
    esperado > 0 ? Math.min(100, (gastosAno / esperado) * 100) : gastosAno > 0 ? 100 : 0;
  const estourou = sobra < 0;

  const alternar = () => {
    vibrar();
    setAberto((v) => !v);
  };

  return (
    <div className={spanAll} style={{ padding: "0 var(--pad-x) 12px" }}>
      <CardDestaque
        style={{
          borderRadius: 28,
          boxShadow: "0 4px 12px color-mix(in oklab, var(--primary) 10%, transparent)",
        }}
      >
        {/* Só o cabeçalho e o valor comandam o abre-fecha; o detalhe fica fora
            do alvo, senão um clique perdido nele fecharia o card recém-aberto. */}
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
          style={{ cursor: "pointer" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, opacity: 0.85 }}>
              {t("Projeção anual")}
            </div>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.18)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.2,
              }}
            >
              {ano}
            </span>
            <span
              className="chevron-expansivel"
              style={{ display: "inline-flex", transform: aberto ? "rotate(180deg)" : "none" }}
            >
              <Icon name="chevron-down" size={18} color="rgba(255,255,255,0.85)" strokeWidth={2} />
            </span>
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: estourou ? COR_NEG_SOBRE : COR_POS_SOBRE,
            }}
          >
            {estourou && "−"}
            {fmtBRL(Math.abs(sobra))}
          </div>
          <div style={{ marginTop: 2, fontSize: 11.5, fontWeight: 600, opacity: 0.8 }}>
            {estourou ? t("acima do previsto no ano") : t("sobra prevista no ano")}
          </div>
        </div>

        <Expansivel aberto={aberto}>
          <div
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <div
              style={{
                height: 8,
                borderRadius: 8,
                background: "rgba(255,255,255,0.2)",
                overflow: "hidden",
              }}
            >
              <div
                className="projecao-barra"
                style={{
                  width: aberto ? `${pctGasto}%` : "0%",
                  height: "100%",
                  borderRadius: 8,
                  background: estourou ? COR_NEG_SOBRE_FORTE : "#fff",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span>{t("Gasto: {x}", { x: fmtBRL(gastosAno) })}</span>
              <span style={{ opacity: 0.85 }}>
                {t("{pct}% utilizado", { pct: pctGasto.toFixed(0) })}
              </span>
            </div>

            <div style={{ marginTop: 10 }}>
              <Linha rotulo={t("Orçamento do ano")} valor={fmtBRL(orcamentoAno)} />
              <Linha rotulo={t("Entradas no ano")} valor={fmtBRL(entradasAno)} cor={COR_POS_SOBRE} />
              <Linha rotulo={t("Total esperado")} valor={fmtBRL(esperado)} destaque />
              <Linha rotulo={t("Gastos no ano")} valor={fmtBRL(gastosAno)} cor={COR_NEG_SOBRE} />
            </div>

            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                opacity: 0.75,
                lineHeight: 1.45,
                marginTop: 6,
              }}
            >
              {orcMensal <= 0
                ? t("sem orçamento definido — só as entradas contam")
                : orcVariou
                  ? t("orçamento de cada mês do ano + entradas agendadas")
                  : t("orçamento de {x}/mês nos 12 meses + entradas agendadas", {
                      x: fmtBRL(orcMensal),
                    })}
            </div>
          </div>
        </Expansivel>
      </CardDestaque>
    </div>
  );
}
