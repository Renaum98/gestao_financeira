// DiferencaMesModal.jsx — modal de virada de mês. No primeiro acesso de um
// mês novo, mostra quanto sobrou (ou faltou) no mês anterior e pergunta se o
// usuário quer trazer essa diferença pro mês atual (soma se sobrou, vira
// dívida se faltou). A escolha fica em preferences.carryover[mesAtual].

import { fmtBRL } from "../../data.js";
import { ModalOverlay } from "../../ui/modal-base.jsx";
import { BotoesDialogo, IconeDialogo, TituloDialogo } from "../../ui/form-lista.jsx";
import { COR_POS, COR_NEG } from "../../lib/colors.js";
import { useT } from "../../lib/i18n.jsx";

export function DiferencaMesModal({ nomeMesAnt, valor, onTrazer, onIgnorar }) {
  const t = useT();
  const sobrou = valor >= 0;
  const cor = sobrou ? COR_POS : COR_NEG;

  return (
    <ModalOverlay
      onClose={onIgnorar}
      maxWidth={380}
      scrollable={false}
      center
      padding="22px 20px 18px"
    >
      <IconeDialogo icone={sobrou ? "arrow-left" : "arrow-right"} cor={cor} />
      <TituloDialogo
        titulo={t("Diferença de {mes}", { mes: nomeMesAnt })}
        mensagem={sobrou
          ? t("Em {mes} você fechou com sobra. Quer trazer esse valor pro mês atual?", { mes: nomeMesAnt })
          : t("Em {mes} você gastou mais que o orçamento. Quer trazer essa diferença como dívida do mês atual?", { mes: nomeMesAnt })}
      />

      {/* O valor em destaque, no mesmo tom do ícone. */}
      <div
        style={{
          marginTop: 14,
          padding: "10px 14px",
          borderRadius: "var(--raio-bloco)",
          background: "color-mix(in oklab, " + cor + " 10%, transparent)",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>
          {sobrou ? t("Sobrou") : t("Faltou")}
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: cor,
            marginTop: 1,
            letterSpacing: "-0.03em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {sobrou ? "+" : "−"}{fmtBRL(Math.abs(valor))}
        </div>
      </div>

      <BotoesDialogo
        cancelar={{ texto: t("Agora não"), onClick: onIgnorar }}
        confirmar={{ texto: t("Trazer"), onClick: onTrazer, cor }}
      />
    </ModalOverlay>
  );
}
