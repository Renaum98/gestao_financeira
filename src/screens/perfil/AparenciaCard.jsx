// AparenciaCard.jsx — escolha de tema (sistema/claro/escuro) e cor de destaque.

import React from "react";
import { PALETAS } from "../../data.js";
import { Card } from "../../ui/common.jsx";
import { vibrar } from "../../lib/haptics.js";
import { useT } from "../../lib/i18n.jsx";

export function AparenciaCard({ preferences, setPreferences }) {
  const t = useT();
  return (
    <Card style={{ padding: 16 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: 0.4,
          paddingBottom: 12,
        }}
      >
        {t("Aparência")}
      </div>
      <div style={{ padding: "8px 0 4px" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 10 }}>{t("Tema")}</div>
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: 4,
            borderRadius: 12,
            background: "var(--card-2)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          {[
            { id: "sistema", label: t("Sistema") },
            { id: "claro", label: t("Claro") },
            { id: "escuro", label: t("Escuro") },
          ].map((opt) => {
            const sel = (preferences.modo || "sistema") === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  vibrar();
                  setPreferences({ modo: opt.id });
                }}
                style={{
                  flex: 1,
                  padding: "8px 8px",
                  borderRadius: 10,
                  border: "none",
                  background: sel ? "var(--card)" : "transparent",
                  color: sel ? "var(--ink)" : "var(--muted)",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: sel ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                  transition: "background .15s",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ padding: "12px 0 4px" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 10 }}>
          {t("Cor de destaque")}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {PALETAS.map((p) => {
            const sel = preferences.paleta === p.primary;
            return (
              <button
                key={p.primary}
                onClick={() => {
                  vibrar();
                  setPreferences({ paleta: p.primary });
                }}
                title={p.nome}
                className={`swatch-raised${sel ? " is-selected" : ""}`}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  background: `linear-gradient(135deg, ${p.primary}, ${p.primary2})`,
                  color: p.primary,
                }}
              />
            );
          })}
        </div>
      </div>
    </Card>
  );
}
