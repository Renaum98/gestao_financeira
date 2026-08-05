// barra-offline.jsx — a faixa fixa no topo enquanto o aparelho está sem
// internet, e o aviso que ela abre quando o usuário tenta gravar mesmo assim.
//
// Substituiu um modal. O modal parava tudo pra dizer "não deu", exigia um
// "Entendi" e sumia sem deixar rastro — então na tentativa seguinte a pessoa
// levava o mesmo susto. A faixa fica: enquanto estiver ali, o motivo da recusa
// está visível, e a tentativa de gravar só precisa chamar atenção pra ela em vez
// de reapresentar o problema do zero.

import React from "react";
import { Icon } from "./icons.jsx";
import { COR_AVISO } from "../lib/colors.js";
import { useT } from "../lib/i18n.jsx";

// Altura da faixa recolhida, sem contar a safe area. É o que o EspaçoBarraOffline
// reserva no fluxo.
export const ALTURA_FAIXA = 30;

// Quanto tempo o detalhe fica aberto antes de recolher sozinho. Longo o
// bastante pra ler as duas frases sem correr, curto o bastante pra não virar
// moradia permanente no topo da tela.
const MS_ABERTO = 6000;

// Abaixo do Z_MODAL (que é quase o máximo de 32 bits) e acima da tab bar, que é
// 40: a faixa cobre a UI normal, mas um modal aberto continua por cima dela.
const Z_BARRA = 60;

export function BarraOffline({ offline, tentativa }) {
  const t = useT();
  const [aberta, setAberta] = React.useState(false);

  // Cada tentativa de gravar offline chega como um número novo, então repetir a
  // ação reabre — e reinicia a contagem — mesmo com o detalhe já na tela.
  React.useEffect(() => {
    if (!tentativa || !offline) return;
    setAberta(true);
    const id = setTimeout(() => setAberta(false), MS_ABERTO);
    return () => clearTimeout(id);
  }, [tentativa, offline]);

  // Voltou a internet: não há mais nada a explicar.
  React.useEffect(() => {
    if (!offline) setAberta(false);
  }, [offline]);

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={() => setAberta((v) => !v)}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: Z_BARRA,
        background: COR_AVISO,
        color: "#fff",
        paddingTop: "env(safe-area-inset-top)",
        cursor: "pointer",
        // fora da tela quando online, pra descida e subida serem animadas
        transform: offline ? "translateY(0)" : "translateY(-100%)",
        // O translate tira a faixa do lugar, mas ela continua sendo um elemento
        // pintado e clicável em cima de tudo — e subindo por baixo da safe area
        // sobrava uma tira colorida no topo. Some de verdade quando online.
        visibility: offline ? "visible" : "hidden",
        pointerEvents: offline ? "auto" : "none",
        // A visibilidade não anima: ela só troca no fim da subida (senão a faixa
        // sumiria de uma vez, sem animação) e volta na hora na descida.
        transition: offline
          ? "transform .32s cubic-bezier(.45,.1,.35,1), visibility 0s"
          : "transform .32s cubic-bezier(.45,.1,.35,1), visibility 0s linear .32s",
        boxShadow: "0 2px 12px rgba(20,16,24,0.18)",
      }}
    >
      <div
        style={{
          height: ALTURA_FAIXA,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "-0.01em",
        }}
      >
        <Icon name="lock" size={14} color="#fff" strokeWidth={2.4} />
        {t("Sem conexão · somente leitura")}
      </div>

      {/* 0fr → 1fr abre exatamente na altura do texto. Com max-height eu teria
          que chutar um número: baixo demais corta a frase traduzida, alto demais
          deixa a animação com uma folga morta no fim. */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: aberta ? "1fr" : "0fr",
          transition: "grid-template-rows .34s cubic-bezier(.45,.1,.35,1)",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div
            style={{
              padding: "0 18px 12px",
              fontSize: 12.5,
              lineHeight: 1.45,
              fontWeight: 600,
              textAlign: "center",
              color: "rgba(255,255,255,0.95)",
            }}
          >
            {t("Não é possível adicionar ou editar transações offline.")}
          </div>
        </div>
      </div>
    </div>
  );
}

// Reserva no fluxo a altura da faixa recolhida — a faixa é fixa e sairia por
// cima do conteúdo. O detalhe expandido NÃO entra na conta de propósito: ele é
// passageiro, e empurrar a tela inteira pra baixo por 6 segundos incomodaria
// mais do que sobrepor.
export function EspacoBarraOffline({ offline }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height: offline ? `calc(${ALTURA_FAIXA}px + env(safe-area-inset-top))` : 0,
        transition: "height .32s cubic-bezier(.45,.1,.35,1)",
      }}
    />
  );
}
