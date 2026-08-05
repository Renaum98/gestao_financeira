// CardSaldo.jsx — card principal do Dashboard (gasto/orçamento/restante de um
// mês). Auto-contido: recalcula os agregados do mês recebido em vez de
// reaproveitar os do mês ativo, simplificando o uso no carrossel.

import React from "react";
import { fmtBRL, fmtBRLCompacto, rotuloMesT, MESES } from "../../data.js";
import { SeletorMes } from "../../ui/common.jsx";
import { calcularSaldoMes } from "../../lib/saldo-mes.js";
import { mesAnteriorDe } from "../../lib/orcamento.js";
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

  return (
    <div
      className="card-saldo"
      style={{
        background:
          "linear-gradient(135deg, var(--primary) 0%, var(--primary-2) 50%, var(--primary) 100%)",
        backgroundSize: "200% 200%",
        color: "#fff",
        borderRadius: 28,
        padding: 22,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 4px 12px color-mix(in oklab, var(--primary) 10%, transparent)",
      }}
    >
      <div
        aria-hidden="true"
        className="card-saldo__brilho"
        style={{
          position: "absolute",
          top: 0,
          left: "-40%",
          width: "60%",
          height: "100%",
          background:
            "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.10) 50%, transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        className="card-saldo__bolha card-saldo__bolha--a"
        style={{
          position: "absolute",
          right: -40,
          top: -40,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
        }}
      />
      <div
        aria-hidden="true"
        className="card-saldo__bolha card-saldo__bolha--b"
        style={{
          position: "absolute",
          right: 30,
          bottom: -60,
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
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
          position: "relative",
        }}
      >
        {fmtBRL(total)}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 6,
          position: "relative",
        }}
      >
        {totalAnt > 0 && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.18)",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span>{delta >= 0 ? "▲" : "▼"}</span>
            <span>{Math.abs(delta).toFixed(1)}%</span>
            <span style={{ opacity: 0.8, fontWeight: 600 }}>{t("vs. mês anterior")}</span>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: "1px solid rgba(255,255,255,0.18)",
          display: "flex",
          justifyContent: "space-between",
          position: "relative",
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
              color: restante >= 0 ? "#D9F5C8" : "#FFD0D9",
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
            position: "relative",
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
              letterSpacing: 0.4,
              textTransform: "uppercase",
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
                color: restanteParceiro >= 0 ? "#D9F5C8" : "#FFD0D9",
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
              borderRadius: 12,
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
                letterSpacing: 0.3,
                textTransform: "uppercase",
              }}
            >
              {t("Disponível juntos")}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: disponivelConjunto >= 0 ? "#D9F5C8" : "#FFD0D9",
                letterSpacing: "-0.01em",
              }}
            >
              {fmtBRL(Math.abs(disponivelConjunto))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// No mobile o carrossel monta um CardSaldo por mês com histórico, e cada um
// varre a lista inteira de transações (o mês do card e o anterior). Sem memo,
// qualquer render do Dashboard repetia isso vezes o número de meses — o custo
// crescia a cada mês de uso. Todas as props aqui são referências estáveis
// (nada de lambda inline), então a comparação rasa do memo resolve.
export const CardSaldo = React.memo(CardSaldoBase);
