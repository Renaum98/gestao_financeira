// HistoricoDepositos.jsx — lista de depósitos/saques da caixinha, com origem e
// marca de quem fez (em caixinha compartilhada).

import { fmtBRL } from "../../data.js";
import { Icon } from "../../ui/icons.jsx";
import { COR_NEG, COR_NEG_FUNDO } from "../../lib/colors.js";
import { Card } from "../../ui/common.jsx";
import { rotuloDataCurtoT } from "./utils.js";
import { useT } from "../../lib/i18n.jsx";

export function HistoricoDepositos({ depositos, cx, ocultar, entradas, caixinhasCompartilhadas, usuario, partnerNome }) {
  const tr = useT();
  return (
    <>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: 0.4,
          padding: "24px 4px 8px",
        }}
      >
        {depositos.length === 0
          ? tr("Nenhum depósito ainda")
          : (depositos.length === 1
              ? tr("{n} depósito", { n: depositos.length })
              : tr("{n} depósitos", { n: depositos.length }))}
      </div>
      {depositos.length > 0 && (
        <Card style={{ padding: "4px 16px" }}>
          {depositos.map((d, i) => {
            const ehSaque = d.tipo === "saque" || d.valor < 0;
            let labelOrigem = tr("Do orçamento");
            if (ehSaque) {
              labelOrigem = tr("Resgatado para entradas");
              // Rendimento que saiu junto neste resgate (e deixou de render).
              if (d.rendimentoRealizado > 0.005) {
                labelOrigem += tr(" · levou {x} de rendimento", {
                  x: fmtBRL(d.rendimentoRealizado, ocultar),
                });
              }
            } else if (d.tipo === "inicial") {
              labelOrigem = tr("Saldo inicial");
            } else if (d.origem?.tipo === "entrada") {
              let desc = d.origem.descricao;
              if (!desc && d.origem.entradaId) {
                desc = entradas.find((t) => t.id === d.origem.entradaId)?.descricao;
              }
              labelOrigem = tr("Da entrada: {desc}", { desc: desc || tr("removida") });
            }
            // Só mostra "feito por" se for caixinha compartilhada e tiver tag.
            const feitoPorParceiro =
              caixinhasCompartilhadas && d.feitoPor && d.feitoPor !== usuario?.uid;
            const inicialFeitoPor = feitoPorParceiro
              ? (partnerNome?.trim()[0] || "?").toUpperCase()
              : null;
            return (
              <div
                key={d.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 0",
                  borderTop: i === 0 ? "none" : "1px solid var(--linha)",
                }}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      background: ehSaque ? COR_NEG_FUNDO : `${cx.cor}22`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      name={ehSaque ? "minus" : "plus"}
                      size={16}
                      color={ehSaque ? COR_NEG : cx.cor}
                      strokeWidth={2.4}
                    />
                  </div>
                  {feitoPorParceiro && (
                    <div
                      title={partnerNome ? tr("Por {nome}", { nome: partnerNome }) : tr("Pelo parceiro")}
                      style={{
                        position: "absolute",
                        right: -3,
                        bottom: -3,
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        background: "var(--card)",
                        border: "2px solid var(--bg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 8,
                        fontWeight: 800,
                        color: "var(--primary)",
                        letterSpacing: "-0.02em",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                      }}
                    >
                      {inicialFeitoPor}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: ehSaque ? COR_NEG : "var(--ink)" }}>
                    {ehSaque ? "− " : ""}
                    {fmtBRL(Math.abs(d.valor), ocultar)}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      fontWeight: 600,
                      marginTop: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {rotuloDataCurtoT(tr, d.data)} · {labelOrigem}
                    {feitoPorParceiro && partnerNome && (
                      <>
                        {" · "}
                        <span style={{ fontStyle: "italic" }}>{partnerNome}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </>
  );
}
