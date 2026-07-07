// CabecalhoCaixinha.jsx — cartão colorido do topo do detalhe: total juntado,
// bloco de rendimento (se investimento) e barra de progresso da meta.

import { fmtBRL, fmtBRLCompacto } from "../../data.js";
import { Icon } from "../../ui/icons.jsx";
import { useT } from "../../lib/i18n.jsx";

export function CabecalhoCaixinha({ cx, ocultar, atual, rendimento, comRendimento, pct }) {
  const t = useT();
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${cx.cor}, ${cx.cor}CC)`,
        color: "#fff",
        borderRadius: 24,
        padding: 22,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -40,
          top: -40,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.10)",
        }}
      />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: "rgba(255,255,255,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="piggy" size={20} color="#fff" strokeWidth={2.2} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>{cx.nome}</div>
        </div>

        <div style={{ marginTop: 14, fontSize: 12, fontWeight: 600, opacity: 0.85 }}>
          {t("Você já juntou")}
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em" }}>
          {fmtBRL(comRendimento, ocultar)}
        </div>

        {cx.rendimentoAtivo && (
          <div
            style={{
              marginTop: 12,
              padding: "12px 14px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.16)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.22)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name="chart" size={15} color="#fff" strokeWidth={2.4} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    opacity: 0.85,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  {t("Já rendeu")}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em", marginTop: 1 }}>
                  {fmtBRL(rendimento, ocultar)}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 10, fontWeight: 700, opacity: 0.85, lineHeight: 1.3 }}>
              <div>{t("{x}% do CDI", { x: Number(cx.rendimentoCDI).toFixed(0) })}</div>
              <div style={{ opacity: 0.8 }}>{t("Principal {x}", { x: fmtBRL(atual, ocultar) })}</div>
            </div>
          </div>
        )}

        {cx.meta > 0 && (
          <>
            <div
              style={{
                marginTop: 12,
                height: 8,
                background: "rgba(255,255,255,0.2)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <div style={{ width: `${pct}%`, height: "100%", background: "#fff", transition: "width .3s ease" }} />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 6,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <span style={{ opacity: 0.9 }}>{t("Meta {x}", { x: fmtBRLCompacto(cx.meta, ocultar) })}</span>
              <span>{pct.toFixed(0)}%</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
