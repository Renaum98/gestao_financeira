// ProximasVencer.jsx — lista das recorrentes/parcelas a vencer nos próximos
// dias. Tocar numa conta abre o ContaProximaModal (gerido pelo Dashboard).

import { MESES_CURTO, fmtBRL } from "../../data.js";
import { Icon } from "../../ui/icons.jsx";
import { Card } from "../../ui/common.jsx";
import { COR_NEG } from "../../lib/colors.js";
import { vibrar } from "../../lib/haptics.js";
import { useT } from "../../lib/i18n.jsx";

export function ProximasVencer({ proximas, ocultar, irPara, onSelecionar, ehDesktop }) {
  const t = useT();
  if (proximas.length === 0) return null;

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
          {t("Próximas a vencer")}
        </div>
        <button
          onClick={() => irPara("recorrentes")}
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
          {t("Ver tudo →")}
        </button>
      </div>
      <Card style={{ padding: "4px 16px" }}>
        {proximas.map((tx, i) => {
          const [, mm, dd] = tx.data.split("-").map(Number);
          const diasAte = Math.ceil(
            (new Date(tx.data + "T12:00:00") - new Date()) / (1000 * 60 * 60 * 24),
          );
          const urgente = diasAte <= 3;
          const rotuloPrazo =
            diasAte <= 0 ? t("Hoje") : diasAte === 1 ? t("Amanhã") : t("Em {n} dias", { n: diasAte });
          return (
            <div
              key={tx.id}
              onClick={() => {
                vibrar();
                onSelecionar(tx);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 0",
                borderTop: i === 0 ? "none" : "1px solid var(--linha)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: urgente
                    ? `color-mix(in oklab, ${COR_NEG} 12%, transparent)`
                    : "var(--surface-sunken)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: urgente ? COR_NEG : "var(--ink)",
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {dd}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: urgente ? COR_NEG : "var(--muted)",
                    marginTop: 2,
                    textTransform: "uppercase",
                  }}
                >
                  {t(MESES_CURTO[mm - 1])}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--ink)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {tx.descricao}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: urgente ? COR_NEG : "var(--muted)",
                    fontWeight: 600,
                    marginTop: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {rotuloPrazo}
                  <span style={{ opacity: 0.5 }}>·</span>
                  {tx.parcelas ? (
                    <span>
                      {t("Parcela {atual}/{total}", { atual: tx.parcelas.atual, total: tx.parcelas.total })}
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <Icon
                        name="history"
                        size={10}
                        color={urgente ? COR_NEG : "var(--muted)"}
                        strokeWidth={2.4}
                      />
                      {t("Mensal")}
                    </span>
                  )}
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
                {fmtBRL(tx.valor, ocultar)}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
