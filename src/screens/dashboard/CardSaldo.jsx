// CardSaldo.jsx — card principal do Dashboard (gasto/orçamento/restante de um
// mês). Auto-contido: recalcula os agregados do mês recebido em vez de
// reaproveitar os do mês ativo, simplificando o uso no carrossel.

import React from "react";
import { fmtBRL, fmtBRLCompacto, rotuloMesT, MESES } from "../../data.js";
import { SeletorMes } from "../../ui/common.jsx";
import { CardDestaque } from "../../ui/card-destaque.jsx";
import { COR_POS_SOBRE, COR_NEG_SOBRE } from "../../lib/colors.js";
import { calcularSaldoMes } from "../../lib/saldo-mes.js";
import { mesAnteriorDe } from "../../lib/datas.js";
import { useT } from "../../lib/i18n.jsx";

function CardSaldoBase({
  mesCard,
  todosMeses,
  txs,
  partnerTxs,
  preferences,
  caixinhas,
  meuUid,
  partnerUid,
  orcBaseParceiro,
  setMes,
  ehCompartilhado,
  partnerNome,
}) {
  const t = useT();
  const {
    total,
    totalAnt,
    mesAnt,
    entradasDisponiveis,
    entradasGuardadas,
    delta,
    orcTotal,
    restante,
    carryover,
    totalParceiro,
    orcTotalParceiro,
    restanteParceiro,
    disponivelConjunto,
    temEntrada,
  } = React.useMemo(
    () =>
      calcularSaldoMes(mesCard, {
        txs,
        partnerTxs,
        todosMeses,
        preferences,
        caixinhas,
        meuUid,
        partnerUid,
        orcBaseParceiro,
      }),
    [mesCard, txs, partnerTxs, todosMeses, preferences, caixinhas, meuUid, partnerUid, orcBaseParceiro],
  );

  // Nome do mês de onde veio a diferença (mês anterior a este card).
  const nomeMesAnt = t(MESES[Number(mesAnteriorDe(mesCard).split("-")[1]) - 1]);
  // Nome do mês da comparação de gasto — o anterior com lançamento, que pode
  // não ser o de calendário (ver `mesAnt` em calcularSaldoMes).
  const nomeMesComparado = mesAnt ? t(MESES[Number(mesAnt.slice(5, 7)) - 1]) : "";
  const pctDelta = Math.abs(delta).toFixed(0);

  return (
    <CardDestaque
      style={{
        padding: 22,
        boxShadow: "0 4px 12px color-mix(in oklab, var(--primary) 10%, transparent)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.85 }}>
          {t("Gasto em {mes}", { mes: rotuloMesT(t, mesCard) })}
        </div>
        <SeletorMes mes={mesCard} setMes={setMes} todosMeses={todosMeses} />
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: "-0.03em",
        }}
      >
        {fmtBRL(total)}
      </div>

      {/* A comparação vem em frase, como na Análise, e nomeia o mês com que
          compara. Só o "x% a mais/menos" leva cor. */}
      {totalAnt > 0 && (
        <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600, opacity: 0.9 }}>
          {pctDelta === "0" ? (
            t("o mesmo que {mes}", { mes: nomeMesComparado })
          ) : (
            <>
              <span style={{ fontWeight: 700, color: delta > 0 ? COR_NEG_SOBRE : COR_POS_SOBRE }}>
                {delta > 0 ? t("{pct}% a mais", { pct: pctDelta }) : t("{pct}% a menos", { pct: pctDelta })}
              </span>{" "}
              {t("que {mes}", { mes: nomeMesComparado })}
            </>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: "1px solid rgba(255,255,255,0.18)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 600 }}>{t("Orçamento")}</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
            {fmtBRL(orcTotal)}
          </div>
          {/* Só o que ainda dá pra gastar: entradas guardadas em caixinha
              saíram do bolso do mês e não entram nessa linha. */}
          {temEntrada && (
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85, marginTop: 2 }}>
              +{fmtBRL(entradasDisponiveis)} {t("entradas")}
            </div>
          )}
          {entradasGuardadas > 0.005 && (
            <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.7, marginTop: 2 }}>
              {fmtBRL(entradasGuardadas)} {t("guardado em caixinhas")}
            </div>
          )}
          {carryover !== 0 && (
            <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.7, marginTop: 2 }}>
              {t("Diferença de {mes}", { mes: nomeMesAnt })}:{" "}
              {carryover > 0 ? "+" : "−"}
              {fmtBRL(Math.abs(carryover))}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 600 }}>
            {restante >= 0 ? t("Restante") : t("Acima do orçamento")}
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              marginTop: 2,
              color: restante >= 0 ? COR_POS_SOBRE : COR_NEG_SOBRE,
            }}
          >
            {fmtBRL(Math.abs(restante))}
          </div>
        </div>
      </div>

      {ehCompartilhado && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px dashed rgba(255,255,255,0.22)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 10,
              fontWeight: 700,
              opacity: 0.78,
            }}
          >
            <span>{partnerNome || t("Parceiro")}</span>
            <span style={{ opacity: 0.85 }}>
              {fmtBRLCompacto(totalParceiro)} {t("gasto")}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
              fontSize: 11,
              fontWeight: 600,
              opacity: 0.85,
            }}
          >
            <span>{t("Orçamento")} {fmtBRLCompacto(orcTotalParceiro)}</span>
            <span
              style={{
                color: restanteParceiro >= 0 ? COR_POS_SOBRE : COR_NEG_SOBRE,
                fontWeight: 700,
              }}
            >
              {restanteParceiro >= 0 ? t("Resta ") : t("Acima ")}
              {fmtBRLCompacto(Math.abs(restanteParceiro))}
            </span>
          </div>

          <div
            style={{
              marginTop: 10,
              padding: "8px 12px",
              borderRadius: "var(--raio-controle)",
              background: "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                opacity: 0.9,
              }}
            >
              {t("Disponível juntos")}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: disponivelConjunto >= 0 ? COR_POS_SOBRE : COR_NEG_SOBRE,
                letterSpacing: "-0.01em",
              }}
            >
              {fmtBRL(Math.abs(disponivelConjunto))}
            </span>
          </div>
        </div>
      )}
    </CardDestaque>
  );
}

// No mobile o carrossel monta um CardSaldo por mês com histórico, e cada um
// varre a lista inteira de transações (o mês do card e o anterior). Sem memo,
// qualquer render do Dashboard repetia isso vezes o número de meses — o custo
// crescia a cada mês de uso. Todas as props aqui são referências estáveis
// (nada de lambda inline), então a comparação rasa do memo resolve.
export const CardSaldo = React.memo(CardSaldoBase);
