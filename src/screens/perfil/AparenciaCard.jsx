// AparenciaCard.jsx — escolha de tema (sistema/claro/escuro) e cor de destaque.

import React from "react";
import { PALETAS, coresDaPaleta } from "../../data.js";
import { Card } from "../../ui/common.jsx";
import { Icon } from "../../ui/icons.jsx";
import { Segmentado } from "./parts.jsx";
import { vibrar } from "../../lib/haptics.js";
import { useTemaEscuro } from "../../lib/tema.js";
import { useT } from "../../lib/i18n.jsx";

// A bolinha da paleta. `cor` já vem resolvida pro tema ativo — ver o comentário
// em `coresDaPaleta`. O degradê entre as duas é o que faz a Brasil aparecer
// como verde e amarelo aqui; nas outras o par são tons vizinhos e ele lê como
// cor chapada.
function Bolinha({ cor, tamanho = 24 }) {
  return (
    <span
      className="swatch-bolinha"
      aria-hidden="true"
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: tamanho / 2,
        background: `linear-gradient(135deg, ${cor.primary}, ${cor.primary2})`,
        flexShrink: 0,
      }}
    />
  );
}

// Seletor de cor de destaque. Era uma fila de bolinhas soltas, que passou a
// não caber numa linha de celular quando as paletas chegaram a oito — e que
// nunca disse o nome de nenhuma: o nome só existia no `title`, invisível no
// toque.
//
// É um select: a lista FLUTUA sobre o conteúdo, ancorada na caixa, em vez de
// empurrar o card pra baixo. Fecha ao escolher, ao clicar fora e no Esc.
//
// O Esc é um listener próprio, e não o `useFecharComEsc` dos modais: aquele se
// inscreve na pilha de overlays na montagem e só sai na desmontagem, e este
// seletor fica montado o tempo todo na tela de Perfil. Usá-lo deixaria
// `temOverlayAberto()` verdadeiro o tempo todo aqui, e o atalho "n" de nova
// transação (app.jsx) morreria calado enquanto o Perfil estivesse aberto.
//
// A caixa fechada imita o SelectPerfil (idioma, moeda) de propósito: os três
// controles ficam um embaixo do outro na tela de Perfil, e um deles com outra
// cara pareceria outro tipo de coisa. Mas não dá pra ser um <select> nativo:
// aquele não desenha uma bolinha de cor dentro da opção.
function SeletorPaleta({ paletaAtual, escuro, onEscolher, t }) {
  const [aberto, setAberto] = React.useState(false);
  const caixa = React.useRef(null);
  const atual = PALETAS.find((p) => p.primary === paletaAtual) || PALETAS[0];

  // Clique fora e Esc fecham. `pointerdown` e não `click`: o dedo que encosta
  // fora já conta, sem esperar o toque terminar, e assim a lista não fica
  // aberta atrás do próximo alvo que o usuário quis acertar. Os dois listeners
  // só existem enquanto ela está aberta.
  React.useEffect(() => {
    if (!aberto) return;
    const foraDaCaixa = (e) => {
      if (!caixa.current?.contains(e.target)) setAberto(false);
    };
    const aoTeclar = (e) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("pointerdown", foraDaCaixa);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("pointerdown", foraDaCaixa);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  const escolher = (p) => {
    vibrar();
    onEscolher(p.primary);
    setAberto(false);
  };

  return (
    <div ref={caixa} style={{ position: "relative" }}>
      <button
        onClick={() => {
          vibrar();
          setAberto((v) => !v);
        }}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-label={t("Cor de destaque")}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderRadius: 12,
          border: "none",
          background: "var(--card-2)",
          color: "var(--ink)",
          fontSize: 14,
          fontWeight: 700,
          fontFamily: "inherit",
          cursor: "pointer",
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        <Bolinha cor={coresDaPaleta(atual, escuro)} />
        <span style={{ flex: 1, textAlign: "left" }}>{t(atual.nome)}</span>
        <span
          className="chevron-expansivel"
          style={{ display: "inline-flex", transform: aberto ? "rotate(180deg)" : "none" }}
        >
          <Icon name="chevron-down" size={16} color="var(--muted)" strokeWidth={2.2} />
        </span>
      </button>

      {aberto && (
        <div
          className="select-painel"
          role="listbox"
          aria-label={t("Cor de destaque")}
          style={{
            // Flutua ancorada na caixa. O z-index é alto o bastante pra passar
            // por cima dos cards vizinhos do Perfil e baixo o bastante pra um
            // modal de verdade continuar por cima (ver Z_MODAL em modal-base).
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 30,
            // A cara de painel do app: canto redondo generoso, superfície de
            // card e uma sombra bem mais funda que a do card parado — é o que
            // faz a lista ler como algo que subiu, e não como mais um bloco.
            borderRadius: 18,
            background: "var(--card)",
            border: "1px solid var(--linha)",
            boxShadow: "0 14px 32px rgba(20,16,24,0.18), 0 3px 8px rgba(20,16,24,0.10)",
            // Teto pra a lista não crescer até sair da tela: com dez paletas
            // (linhas de ~42px) ela já passa disso e rola por dentro, como um
            // select faz. O corte respeita o canto redondo.
            maxHeight: 360,
            overflowY: "auto",
          }}
        >
          {PALETAS.map((p, i) => {
            // p.primary é a identidade da paleta (é o que fica salvo em
            // preferences.paleta); só a pintura muda com o tema.
            const sel = p.primary === paletaAtual;
            return (
              <button
                key={p.primary}
                role="option"
                aria-selected={sel}
                onClick={() => escolher(p)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  border: "none",
                  borderTop: i === 0 ? "none" : "1px solid var(--linha)",
                  background: "transparent",
                  color: sel ? "var(--primary)" : "var(--ink)",
                  fontSize: 14,
                  fontWeight: sel ? 800 : 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                <Bolinha cor={coresDaPaleta(p, escuro)} tamanho={22} />
                <span style={{ flex: 1, textAlign: "left" }}>{t(p.nome)}</span>
                {sel && <Icon name="check" size={16} color="var(--primary)" strokeWidth={2.6} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AparenciaCard({ preferences, setPreferences }) {
  const t = useT();
  // A bolinha tem que mostrar a cor que a paleta vai render AGORA: no escuro a
  // "Preto" vira prata, e desenhá-la preta seria uma bolinha invisível em cima
  // de um card escuro, prometendo uma cor que o app não aplica.
  const escuro = useTemaEscuro(preferences.modo);
  return (
    <Card style={{ padding: 16 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: 0.4,
          paddingBottom: 12,
        }}
      >
        {t("Aparência")}
      </div>
      <div style={{ padding: "8px 0 4px" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 10 }}>{t("Tema")}</div>
        <Segmentado
          ariaLabel={t("Tema")}
          valor={preferences.modo || "sistema"}
          onChange={(id) => setPreferences({ modo: id })}
          opcoes={[
            { id: "sistema", label: t("Sistema") },
            { id: "claro", label: t("Claro") },
            { id: "escuro", label: t("Escuro") },
          ]}
        />
      </div>
      <div style={{ padding: "12px 0 4px" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 10 }}>
          {t("Cor de destaque")}
        </div>
        <SeletorPaleta
          paletaAtual={preferences.paleta}
          escuro={escuro}
          onEscolher={(paleta) => setPreferences({ paleta })}
          t={t}
        />
      </div>
    </Card>
  );
}
