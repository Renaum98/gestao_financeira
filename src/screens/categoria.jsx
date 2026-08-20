// categoria.jsx — Tela de detalhe de uma categoria

import {
  CATEGORIAS,
  fmtBRL,
  fmtBRLCompacto,
  totalGeral,
  txDoMes,
} from "../data.js";
import { COR_POS, COR_NEG, COR_AVISO } from "../lib/colors.js";
import { CatChip } from "../ui/icons.jsx";
import { Card, ItemTransacao, TopBar } from "../ui/common.jsx";
import { BarraProgresso } from "../ui/charts.jsx";
import { useT } from "../lib/i18n.jsx";

export function CategoriaScreen({ ctx, params }) {
  const { txs, mes, voltar, orcamentos } = ctx;
  const tr = useT();
  const cat = CATEGORIAS[params.catId];
  const txMes = txDoMes(txs, mes).filter((t) => t.categoria === params.catId);
  const total = totalGeral(txMes);
  const orc = orcamentos[params.catId] || 0;
  const pct = orc > 0 ? (total / orc) * 100 : 0;

  return (
    <div style={{ paddingBottom: "var(--pad-bottom)" }}>
      <TopBar voltar={voltar} />
      <div style={{ padding: "4px var(--pad-x) 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <CatChip catId={cat.id} size={56} />
          <div>
            <div
              style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}
            >
              {tr("Categoria")}
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "var(--ink)",
                letterSpacing: "-0.02em",
              }}
            >
              {tr(cat.nome)}
            </div>
          </div>
        </div>

        <Card style={{ marginTop: 18, padding: 20 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
            {tr("Gasto neste mês")}
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
            {fmtBRL(total)}
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
                <span>{tr("Orçamento {x}", { x: fmtBRLCompacto(orc) })}</span>
                <span
                  style={{
                    color:
                      pct > 100 ? COR_NEG : pct > 80 ? COR_AVISO : COR_POS,
                    fontWeight: 800,
                  }}
                >
                  {pct.toFixed(0)}%
                </span>
              </div>
              <BarraProgresso
                valor={Math.min(total, orc)}
                max={orc}
                cor={pct > 100 ? COR_NEG : cat.cor}
                altura={10}
              />
              {pct > 100 && (
                <div
                  style={{
                    fontSize: 11,
                    color: COR_NEG,
                    fontWeight: 700,
                    marginTop: 6,
                  }}
                >
                  {tr("Você passou {x} do limite", { x: fmtBRL(total - orc) })}
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
          {tr("{count} transações", { count: txMes.length })}
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
              {tr("Nenhum gasto nesta categoria neste mês.")}
            </div>
          )}
          {txMes.map((tx, i) => (
            <div
              key={tx.id}
              style={{ borderTop: i === 0 ? "none" : "1px solid var(--linha)" }}
            >
              <ItemTransacao tx={tx} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
