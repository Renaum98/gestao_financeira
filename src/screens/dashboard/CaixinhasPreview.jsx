// CaixinhasPreview.jsx — prévia das primeiras caixinhas no Dashboard. Só
// aparece quando há pelo menos uma.

import { CardCaixinha } from "../caixinhas.jsx";
import { useT } from "../../lib/i18n.jsx";
import { caixinhasVisiveis } from "../../lib/caixinhas.js";

export function CaixinhasPreview({ caixinhas: todas, irPara }) {
  const t = useT();
  const caixinhas = caixinhasVisiveis(todas);
  if (caixinhas.length === 0) return null;

  return (
    <div style={{ padding: "var(--esp-secao) var(--pad-x) 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 4px var(--esp-titulo)",
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
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--esp-pilha)" }}>
        {caixinhas.slice(0, 3).map((cx) => (
          <CardCaixinha
            key={cx.id}
            cx={cx}
            onClick={() => irPara("caixinha", { id: cx.id })}
          />
        ))}
      </div>
    </div>
  );
}
