// InsightsCard.jsx — card de "Insights do mês". Recebe a lista pronta de
// insights (calculada no Dashboard) e cuida da apresentação: rotação automática
// a cada 10s, indicadores de página e swipe manual (touch + pointer).

import React from "react";
import { Icon } from "../../ui/icons.jsx";
import { Card } from "../../ui/common.jsx";

export function InsightsCard({ insights, ehDesktop }) {
  const [insightIdx, setInsightIdx] = React.useState(0);

  React.useEffect(() => {
    setInsightIdx(0);
  }, [insights.length]);

  // Rotaciona a cada 10s. Se só houver 1, fica parado.
  React.useEffect(() => {
    if (insights.length <= 1) return;
    const id = setInterval(() => {
      setInsightIdx((i) => (i + 1) % insights.length);
    }, 10000);
    return () => clearInterval(id);
  }, [insights.length]);

  // Swipe manual — não interfere no auto-rotate.
  const swipeRef = React.useRef({ x: 0, y: 0, ativo: false });
  const irInsight = React.useCallback(
    (dir) => {
      if (insights.length <= 1) return;
      setInsightIdx((i) => (i + dir + insights.length) % insights.length);
    },
    [insights.length],
  );
  const onTouchStart = (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    swipeRef.current = { x: t.clientX, y: t.clientY, ativo: true };
  };
  const onTouchEnd = (e) => {
    const s = swipeRef.current;
    if (!s.ativo) return;
    swipeRef.current.ativo = false;
    const t = e.changedTouches?.[0];
    if (!t) return;
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      irInsight(dx < 0 ? 1 : -1);
    }
  };
  const onPointerDown = (e) => {
    if (e.pointerType === "touch") return; // touch já é tratado
    swipeRef.current = { x: e.clientX, y: e.clientY, ativo: true };
  };
  const onPointerUp = (e) => {
    const s = swipeRef.current;
    if (!s.ativo || e.pointerType === "touch") return;
    swipeRef.current.ativo = false;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      irInsight(dx < 0 ? 1 : -1);
    }
  };

  const insightAtual = insights[insightIdx] || null;
  if (!insightAtual) return null;

  return (
    <div className={ehDesktop ? "col-span-all" : undefined} style={{ padding: "16px 20px 0" }}>
      <Card
        style={{ padding: "14px 16px", touchAction: "pan-y", userSelect: "none" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                background: "color-mix(in oklab, var(--primary) 14%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="sparkle" size={14} color="var(--primary)" strokeWidth={2.4} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
              Insights do mês
            </div>
          </div>
          {insights.length > 1 && (
            <div style={{ display: "flex", gap: 4 }}>
              {insights.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setInsightIdx(i)}
                  aria-label={`Insight ${i + 1}`}
                  style={{
                    width: i === insightIdx ? 14 : 6,
                    height: 6,
                    borderRadius: 3,
                    border: "none",
                    padding: 0,
                    background:
                      i === insightIdx
                        ? "var(--primary)"
                        : "color-mix(in oklab, var(--ink) 14%, transparent)",
                    cursor: "pointer",
                    transition: "width .25s ease, background .25s ease",
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <div style={{ position: "relative", minHeight: 38 }}>
          <div
            key={insightIdx}
            className="insight-fade"
            style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: insightAtual.cor,
                marginTop: 6,
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.45,
                color: "var(--muted)",
                fontWeight: 500,
              }}
            >
              {insightAtual.texto}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
