// IdiomaCard.jsx — escolha do idioma do app (Português / Inglês).

import React from "react";
import { Card } from "../../ui/common.jsx";
import { vibrar } from "../../lib/haptics.js";
import { useT } from "../../lib/i18n.jsx";

const IDIOMAS = [
  { id: "pt", label: "Português", flag: "🇧🇷" },
  { id: "en", label: "English", flag: "🇺🇸" },
];

export function IdiomaCard({ preferences, setPreferences }) {
  const t = useT();
  const atual = preferences.idioma || "pt";
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
        {t("Idioma")}
      </div>
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
        {IDIOMAS.map((opt) => {
          const sel = atual === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => {
                vibrar();
                setPreferences({ idioma: opt.id });
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 15 }}>{opt.flag}</span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
