// categoria.jsx — Tela de detalhe de uma categoria

import React from "react";
import {
  CATEGORIAS,
  fmtBRL,
  fmtBRLCompacto,
  totalGeral,
  txDoMes,
} from "../data.js";
import { CatChip } from "../ui/icons.jsx";
import { Card, ItemTransacao, TopBar } from "../ui/common.jsx";
import { BarraProgresso } from "../ui/charts.jsx";

export function CategoriaScreen({ ctx, params }) {
  const { txs, mes, ocultar, irPara, voltar, orcamentos } = ctx;
  const cat = CATEGORIAS[params.catId];
  const txMes = txDoMes(txs, mes).filter((t) => t.categoria === params.catId);
  const total = totalGeral(txMes);
  const orc = orcamentos[params.catId] || 0;
  const pct = orc > 0 ? (total / orc) * 100 : 0;

  return (
    <div style={{ paddingBottom: 110 }}>
      <TopBar voltar={voltar} />
      <div style={{ padding: "4px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <CatChip catId={cat.id} size={56} />
          <div>
            <div
              style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}
            >
              Categoria
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "var(--ink)",
                letterSpacing: "-0.02em",
              }}
            >
              {cat.nome}
            </div>
          </div>
        </div>

        <Card style={{ marginTop: 18, padding: 20 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
            Gasto neste mês
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "var(--ink)",
              letterSpacing: "-0.02em",
              marginTop: 2,
            }}
          >
            {fmtBRL(total, ocultar)}
          </div>
          {orc > 0 && (
            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--muted)",
                  marginBottom: 6,
                }}
              >
                <span>Orçamento {fmtBRLCompacto(orc, ocultar)}</span>
                <span
                  style={{
                    color:
                      pct > 100 ? "#D63A55" : pct > 80 ? "#E08A00" : "#1B9E6A",
                    fontWeight: 800,
                  }}
                >
                  {pct.toFixed(0)}%
                </span>
              </div>
              <BarraProgresso
                valor={Math.min(total, orc)}
                max={orc}
                cor={pct > 100 ? "#D63A55" : cat.cor}
                altura={10}
              />
              {pct > 100 && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#D63A55",
                    fontWeight: 700,
                    marginTop: 6,
                  }}
                >
                  Você passou {fmtBRL(total - orc, ocultar)} do limite
                </div>
              )}
            </div>
          )}
        </Card>

        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: 0.4,
            padding: "20px 4px 8px",
          }}
        >
          {txMes.length} transações
        </div>
        <Card style={{ padding: "6px 16px" }}>
          {txMes.length === 0 && (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                color: "var(--muted)",
                fontSize: 13,
              }}
            >
              Nenhum gasto nesta categoria neste mês.
            </div>
          )}
          {txMes.map((tx, i) => (
            <div
              key={tx.id}
              style={{ borderTop: i === 0 ? "none" : "1px solid var(--linha)" }}
            >
              <ItemTransacao tx={tx} ocultar={ocultar} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
