// CardLembranca.jsx — estado da meta: concluída, vencida, sem prazo ou
// sugestão de quanto guardar por período.

import { fmtBRL } from "../../data.js";
import { Icon } from "../../ui/icons.jsx";
import { COR_POS, COR_NEG, COR_POS_FUNDO, COR_NEG_FUNDO } from "../../lib/colors.js";
import { Card } from "../../ui/common.jsx";
import { rotuloDataCurtoT } from "./utils.js";
import { useT } from "../../lib/i18n.jsx";

export function CardLembranca({ lembranca, ocultar }) {
  const t = useT();
  if (!lembranca) return null;

  return (
    <Card style={{ marginTop: 14, padding: 16, display: "flex", alignItems: "flex-start", gap: 12 }}>
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          flexShrink: 0,
          background: lembranca.completo
            ? COR_POS_FUNDO
            : lembranca.vencido
              ? COR_NEG_FUNDO
              : "color-mix(in oklab, var(--primary) 14%, transparent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          name={lembranca.completo ? "check" : lembranca.vencido ? "bell" : "target"}
          size={18}
          color={lembranca.completo ? COR_POS : lembranca.vencido ? COR_NEG : "var(--primary)"}
          strokeWidth={2.4}
        />
      </div>
      <div style={{ flex: 1 }}>
        {lembranca.completo ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 800, color: COR_POS }}>{t("Meta alcançada! 🎉")}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, marginTop: 2 }}>
              {t("Você juntou tudo. Hora de aproveitar.")}
            </div>
          </>
        ) : lembranca.vencido ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 800, color: COR_NEG }}>{t("Prazo vencido")}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, marginTop: 2 }}>
              {t("Ainda faltam {x}. Reajuste a data ou a meta.", { x: fmtBRL(lembranca.faltam, ocultar) })}
            </div>
          </>
        ) : lembranca.semData ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>
              {t("Faltam {x}", { x: fmtBRL(lembranca.faltam, ocultar) })}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, marginTop: 2 }}>
              {t("Sem prazo definido. Edite a caixinha para receber uma sugestão de quanto guardar por mês.")}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>
              {lembranca.tipo === "mensal"
                ? t("Guarde {x} por mês", { x: fmtBRL(lembranca.valor, ocultar) })
                : lembranca.tipo === "semanal"
                  ? t("Guarde {x} por semana", { x: fmtBRL(lembranca.valor, ocultar) })
                  : t("Guarde {x} por dia", { x: fmtBRL(lembranca.valor, ocultar) })}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, marginTop: 2 }}>
              {lembranca.dias === 1
                ? t("Para chegar em {data} ({n} dia restante).", { data: rotuloDataCurtoT(t, lembranca.dataMeta), n: lembranca.dias })
                : t("Para chegar em {data} ({n} dias restantes).", { data: rotuloDataCurtoT(t, lembranca.dataMeta), n: lembranca.dias })}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
