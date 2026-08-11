// FaturaCartao.jsx — ciclo da fatura do cartão no Dashboard.
//
// Mostra a fatura que ainda está aberta (acumulando compras) e a que já fechou
// e vence agora. É uma camada de LEITURA: nada aqui entra na conta do saldo do
// mês, que continua por competência (a compra abate o mês em que foi feita).
// O rodapé do card existe justamente pra deixar isso explícito.

import { MESES, fmtBRL } from "../../data.js";
import { Icon } from "../../ui/icons.jsx";
import { Card } from "../../ui/common.jsx";
import { COR_AVISO } from "../../lib/colors.js";
import { useT } from "../../lib/i18n.jsx";

// "2026-08" → "Agosto" (já traduzido).
function nomeMes(mes, t) {
  return t(MESES[Number(mes.slice(5, 7)) - 1]);
}

// "2026-08-25" → "25/08"
function diaMes(dataISO) {
  return `${dataISO.slice(8, 10)}/${dataISO.slice(5, 7)}`;
}

function LinhaFatura({ titulo, legenda, valor, destaque }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: destaque
            ? `color-mix(in oklab, ${COR_AVISO} 14%, transparent)`
            : "var(--surface-sunken)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon
          name="card"
          size={18}
          color={destaque ? COR_AVISO : "var(--muted)"}
          strokeWidth={2.2}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{titulo}</div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: destaque ? COR_AVISO : "var(--muted)",
            marginTop: 2,
          }}
        >
          {legenda}
        </div>
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: "var(--ink)",
          letterSpacing: "-0.01em",
        }}
      >
        {fmtBRL(valor)}
      </div>
    </div>
  );
}

export function FaturaCartao({ faturas, irPara, ehDesktop }) {
  const t = useT();
  if (!faturas) return null;
  const { aberta, fechada } = faturas;
  // Sem nenhuma compra no cartão nos dois ciclos, o card só ocuparia espaço.
  if (!fechada && !(aberta.total > 0)) return null;

  return (
    <div className={ehDesktop ? "col-span-all" : undefined} style={{ padding: "16px 20px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 4px 6px",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
          {t("Fatura do cartão")}
        </div>
        <button
          onClick={() => irPara("orcamentos")}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--primary)",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            padding: 0,
          }}
        >
          {t("Ajustar →")}
        </button>
      </div>
      <Card style={{ padding: "4px 16px 12px" }}>
        {fechada && (
          <LinhaFatura
            destaque
            titulo={t("Fatura de {mes}", { mes: nomeMes(fechada.mes, t) })}
            legenda={t("Fechada · vence em {mes}", { mes: nomeMes(fechada.vence, t) })}
            valor={fechada.total}
          />
        )}
        <div style={{ borderTop: fechada ? "1px solid var(--linha)" : "none" }}>
          <LinhaFatura
            titulo={t("Fatura de {mes}", { mes: nomeMes(aberta.mes, t) })}
            legenda={t("Aberta · fecha {data} · vence em {mes}", {
              data: diaMes(aberta.fecha),
              mes: nomeMes(aberta.vence, t),
            })}
            valor={aberta.total}
          />
        </div>
        <div
          style={{
            marginTop: 2,
            paddingTop: 10,
            borderTop: "1px solid var(--linha)",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--muted)",
            lineHeight: 1.45,
          }}
        >
          {t("Não entra no saldo do mês: cada compra já abateu o mês em que foi feita.")}
        </div>
      </Card>
    </div>
  );
}
