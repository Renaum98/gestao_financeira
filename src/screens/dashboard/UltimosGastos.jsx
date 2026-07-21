// UltimosGastos.jsx — resumo dos gastos recentes do mês (somente os MEUS; txs
// do parceiro ficam na aba de Transações por opção de UX).

import { ItemTransacao, Card } from "../../ui/common.jsx";
import { useT } from "../../lib/i18n.jsx";

export function UltimosGastos({ recentes, ocultar, irPara, guardadoTx = {} }) {
  const t = useT();
  return (
    <div style={{ padding: "16px 20px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 4px 6px",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
          {t("Últimos gastos")}
        </div>
        <button
          onClick={() => irPara("gastos")}
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
          {t("Ver todos →")}
        </button>
      </div>
      <Card style={{ padding: "6px 16px" }}>
        {recentes.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            {t("Sem gastos neste mês.")}
          </div>
        )}
        {recentes.map((tx, i) => (
          <div key={tx.id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--linha)" }}>
            <ItemTransacao
              tx={tx}
              ocultar={ocultar}
              guardado={guardadoTx[tx.id]}
              onClick={() => irPara("gastos")}
            />
          </div>
        ))}
      </Card>
    </div>
  );
}
