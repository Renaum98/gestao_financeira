// CaixinhasPreview.jsx — prévia das primeiras caixinhas no Dashboard. Só
// aparece quando há pelo menos uma.

import React from "react";
import { CardCaixinha } from "../caixinhas.jsx";
import { useT } from "../../lib/i18n.jsx";

export function CaixinhasPreview({ caixinhas, ocultar, irPara }) {
  const t = useT();
  if (!caixinhas || caixinhas.length === 0) return null;

  return (
    <div style={{ padding: "20px 20px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 4px 8px",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{t("Caixinhas")}</div>
        <button
          onClick={() => irPara("caixinhas")}
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
          {t("Ver todas →")}
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {caixinhas.slice(0, 3).map((cx) => (
          <CardCaixinha
            key={cx.id}
            cx={cx}
            ocultar={ocultar}
            onClick={() => irPara("caixinha", { id: cx.id })}
          />
        ))}
      </div>
    </div>
  );
}
