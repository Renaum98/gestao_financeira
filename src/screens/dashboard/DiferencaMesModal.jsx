// DiferencaMesModal.jsx — modal de virada de mês. No primeiro acesso de um
// mês novo, mostra quanto sobrou (ou faltou) no mês anterior e pergunta se o
// usuário quer trazer essa diferença pro mês atual (soma se sobrou, vira
// dívida se faltou). A escolha fica em preferences.carryover[mesAtual].

import { fmtBRL } from "../../data.js";
import { Icon } from "../../ui/icons.jsx";
import { ModalOverlay } from "../../ui/modal-base.jsx";
import { COR_POS, COR_NEG } from "../../lib/colors.js";
import { useT } from "../../lib/i18n.jsx";

export function DiferencaMesModal({ nomeMesAnt, valor, ocultar, onTrazer, onIgnorar }) {
  const t = useT();
  const sobrou = valor >= 0;
  const cor = sobrou ? COR_POS : COR_NEG;

  return (
    <ModalOverlay
      onClose={onIgnorar}
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
          background: "color-mix(in oklab, " + cor + " 16%, transparent)",
          margin: "0 auto 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={sobrou ? "arrow-left" : "arrow-right"} size={26} color={cor} strokeWidth={2.4} />
      </div>

      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em", textAlign: "center" }}>
        {t("Diferença de {mes}", { mes: nomeMesAnt })}
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginTop: 6, textAlign: "center", lineHeight: 1.45 }}>
        {sobrou
          ? t("Em {mes} você fechou com sobra. Quer trazer esse valor pro mês atual?", { mes: nomeMesAnt })
          : t("Em {mes} você gastou mais que o orçamento. Quer trazer essa diferença como dívida do mês atual?", { mes: nomeMesAnt })}
      </div>

      <div
        style={{
          marginTop: 14,
          padding: "14px",
          borderRadius: 14,
          background: "color-mix(in oklab, " + cor + " 10%, transparent)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.4 }}>
          {sobrou ? t("Sobrou") : t("Faltou")}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: cor, marginTop: 2, letterSpacing: "-0.02em" }}>
          {sobrou ? "+" : "−"}{fmtBRL(Math.abs(valor), ocultar)}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button
          onClick={onIgnorar}
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
          {t("Agora não")}
        </button>
        <button
          onClick={onTrazer}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: 14,
            border: "none",
            background: cor,
            color: "#fff",
            fontSize: 14,
            fontWeight: 800,
            fontFamily: "inherit",
            cursor: "pointer",
            boxShadow: "0 4px 14px color-mix(in oklab, " + cor + " 32%, transparent)",
          }}
        >
          {t("Trazer")}
        </button>
      </div>
    </ModalOverlay>
  );
}
