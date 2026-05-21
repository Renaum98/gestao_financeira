// UltimosGastos.jsx — resumo dos gastos recentes do mês (somente os MEUS; txs
// do parceiro ficam na aba de Transações por opção de UX).

import React from "react";
import { ItemTransacao, Card } from "../../ui/common.jsx";

export function UltimosGastos({ recentes, ocultar, irPara }) {
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
          Últimos gastos
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
          Ver todos →
        </button>
      </div>
      <Card style={{ padding: "6px 16px" }}>
        {recentes.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            Sem gastos neste mês.
          </div>
        )}
        {recentes.map((tx, i) => (
          <div key={tx.id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--linha)" }}>
            <ItemTransacao tx={tx} ocultar={ocultar} onClick={() => irPara("gastos")} />
          </div>
        ))}
      </Card>
    </div>
  );
}
