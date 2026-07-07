// MaioresGastos.jsx — top 5 saídas do mês.

import { CATEGORIAS, fmtBRL } from "../../data.js";
import { CatChip } from "../../ui/icons.jsx";
import { Card } from "../../ui/common.jsx";
import { SecaoTitulo } from "./SecaoTitulo.jsx";
import { useT } from "../../lib/i18n.jsx";

export function MaioresGastos({ maioresGastos, ocultar }) {
  const tr = useT();
  return (
    <div style={{ padding: "16px 20px 0" }}>
      <SecaoTitulo>{tr("Maiores gastos do mês")}</SecaoTitulo>
      <Card style={{ padding: "4px 16px" }}>
        {maioresGastos.map((t, i) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 0",
              borderTop: i === 0 ? "none" : "1px solid var(--linha)",
            }}
          >
            <CatChip catId={t.categoria} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--ink)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {t.descricao}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>
                {t.data.slice(8, 10)}/{t.data.slice(5, 7)} · {tr(CATEGORIAS[t.categoria]?.nome || "Outros")}
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>
              {fmtBRL(t.valor, ocultar)}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
