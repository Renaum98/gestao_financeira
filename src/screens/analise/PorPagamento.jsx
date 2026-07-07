// PorPagamento.jsx — distribuição das saídas por forma de pagamento.

import { fmtBRLCompacto } from "../../data.js";
import { Icon, iconePagamento } from "../../ui/icons.jsx";
import { Card } from "../../ui/common.jsx";
import { BarraProgresso } from "../../ui/charts.jsx";
import { SecaoTitulo } from "./SecaoTitulo.jsx";
import { useT } from "../../lib/i18n.jsx";

export function PorPagamento({ porPagamento, total, ocultar }) {
  const t = useT();
  return (
    <div style={{ padding: "16px 20px 0" }}>
      <SecaoTitulo>{t("Por forma de pagamento")}</SecaoTitulo>
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
              <Icon name={iconePagamento(nome)} size={18} color="var(--ink)" strokeWidth={2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{t(nome)}</div>
              <div style={{ marginTop: 6 }}>
                <BarraProgresso valor={valor} max={porPagamento[0][1]} cor="var(--primary)" altura={6} />
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>
                {fmtBRLCompacto(valor, ocultar)}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", marginTop: 2 }}>
                {((valor / total) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
