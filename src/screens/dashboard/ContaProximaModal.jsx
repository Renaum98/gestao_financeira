// ContaProximaModal.jsx — modal acionado ao tocar numa conta de "Próximas a
// vencer", permitindo marcá-la como paga.

import React from "react";
import { CATEGORIAS, fmtBRL } from "../../data.js";
import { Icon } from "../../ui/icons.jsx";
import { ModalOverlay } from "../../ui/modal-base.jsx";
import { COR_POS } from "../../lib/colors.js";

export function ContaProximaModal({ tx, ocultar, onFechar, onMarcarPago }) {
  const [, mm, dd] = tx.data.split("-").map(Number);
  const cat = CATEGORIAS[tx.categoria] || CATEGORIAS.outros;
  const diasAte = Math.ceil(
    (new Date(tx.data + "T12:00:00") - new Date()) / (1000 * 60 * 60 * 24),
  );
  const rotuloPrazo =
    diasAte <= 0
      ? "Vence hoje"
      : diasAte === 1
        ? "Vence amanhã"
        : `Vence em ${diasAte} dias`;

  return (
    <ModalOverlay
      onClose={onFechar}
      maxWidth={380}
      scrollable={false}
      center
      borderRadius={24}
      padding="22px 22px 18px"
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          background: "color-mix(in oklab, var(--primary) 14%, transparent)",
          margin: "0 auto 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="calendar" size={26} color="var(--primary)" strokeWidth={2.2} />
      </div>

      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
        {tx.descricao}
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginTop: 4 }}>
        {dd}/{String(mm).padStart(2, "0")} · {cat.nome}
      </div>

      <div
        style={{
          marginTop: 14,
          padding: "12px 14px",
          borderRadius: 14,
          background: "var(--card-2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            Valor
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", marginTop: 2 }}>
            {fmtBRL(tx.valor, ocultar)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            Prazo
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginTop: 2 }}>
            {rotuloPrazo}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button
          onClick={onFechar}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: 14,
            border: "none",
            background: "var(--card-2)",
            color: "var(--ink)",
            fontSize: 14,
            fontWeight: 800,
            fontFamily: "inherit",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          Fechar
        </button>
        <button
          onClick={onMarcarPago}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: 14,
            border: "none",
            background: COR_POS,
            color: "#fff",
            fontSize: 14,
            fontWeight: 800,
            fontFamily: "inherit",
            cursor: "pointer",
            boxShadow: "0 4px 14px color-mix(in oklab, " + COR_POS + " 32%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Icon name="check" size={16} color="#fff" strokeWidth={2.6} />
          Marcar como pago
        </button>
      </div>
    </ModalOverlay>
  );
}
