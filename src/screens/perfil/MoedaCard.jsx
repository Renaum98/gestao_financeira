// MoedaCard.jsx — escolha da moeda de exibição (símbolo/formato, sem conversão).

import React from "react";
import { Card } from "../../ui/common.jsx";
import { vibrar } from "../../lib/haptics.js";
import { useT } from "../../lib/i18n.jsx";
import { MOEDAS, MOEDAS_SUPORTADAS } from "../../lib/moeda.js";

export function MoedaCard({ preferences, setPreferences }) {
  const t = useT();
  const atual = preferences.moeda || "BRL";
  return (
    <Card style={{ padding: 16 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: 0.4,
          paddingBottom: 4,
        }}
      >
        {t("Moeda")}
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, paddingBottom: 12, lineHeight: 1.4 }}>
        {t("Muda apenas o símbolo e o formato — sem conversão de câmbio.")}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {MOEDAS_SUPORTADAS.map((cod) => {
          const m = MOEDAS[cod];
          const sel = atual === cod;
          return (
            <button
              key={cod}
              onClick={() => {
                vibrar();
                setPreferences({ moeda: cod });
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                borderRadius: 12,
                border: sel ? "1.5px solid var(--primary)" : "1.5px solid var(--linha)",
                background: sel ? "color-mix(in oklab, var(--primary) 8%, transparent)" : "var(--card)",
                color: "var(--ink)",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                transition: "background .15s, border-color .15s",
              }}
            >
              <span style={{ fontSize: 18 }}>{m.flag}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: sel ? "var(--primary)" : "var(--ink)" }}>
                  {m.codigo} <span style={{ fontWeight: 600 }}>{m.simbolo}</span>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--muted)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {t(m.nome)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
