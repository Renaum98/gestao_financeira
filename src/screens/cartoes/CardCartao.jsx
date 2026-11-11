// CardCartao.jsx — um cartão da lista de cartões, desenhado como cartão.
//
// Mostra quanto está comprometido da fatura e o quanto disso já comeu o
// limite. Os valores são leitura pura (lib/fatura.js): nenhum
// deles entra na conta do saldo do mês.

import React from "react";
import { fmtBRL, fmtBRLCompacto, MESES_CURTO } from "../../data.js";
import { COR_NEG, COR_AVISO, COR_POS } from "../../lib/colors.js";
import { corDoCartao, corTextoSobre, faixaDoUso } from "../../lib/cartoes.js";
import { useT } from "../../lib/i18n.jsx";

// Cor da faixa de uso do limite. Sem limite informado não há faixa.
export function corDaFaixa(pct) {
  const faixa = faixaDoUso(pct);
  if (faixa === "estourado") return COR_NEG;
  if (faixa === "aperto") return COR_AVISO;
  if (faixa === "meio") return "var(--primary)";
  return COR_POS;
}

// Miniatura na cor do cartão. É um desenho genérico — a tarja e o par de
// círculos —, nunca a marca de ninguém: o app não guarda número nem bandeira,
// e não se propõe a imitar o cartão físico.
//
// Os detalhes por cima seguem a luminância da cor: num cartão amarelo o branco
// sumiria, então eles viram escuros.
export function MiniCartao({ cor }) {
  const claro = corTextoSobre(cor) === "#FFFFFF";
  const tinta = (a) => (claro ? `rgba(255,255,255,${a})` : `rgba(20,16,24,${a})`);
  return (
    <div
      aria-hidden
      style={{
        width: 62,
        height: 42,
        borderRadius: "var(--raio-etiqueta)",
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${cor}, color-mix(in oklab, ${cor} 72%, #000))`,
        boxShadow: "0 2px 6px rgba(20,16,24,0.18)",
      }}
    >
      {/* tarja/chip */}
      <div
        style={{
          position: "absolute",
          top: 9,
          left: 8,
          width: 12,
          height: 9,
          borderRadius: 2.5,
          background: tinta(0.5),
        }}
      />
      {/* par de círculos, no canto de cima */}
      <div style={{ position: "absolute", top: 8, right: 8, display: "flex" }}>
        <div style={{ width: 11, height: 11, borderRadius: "var(--raio-pilula)", background: tinta(0.55) }} />
        <div
          style={{ width: 11, height: 11, borderRadius: "var(--raio-pilula)", marginLeft: -4, background: tinta(0.3) }}
        />
      </div>
      {/* linhas do relevo */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: 8,
          width: 30,
          height: 4,
          borderRadius: 2,
          background: tinta(0.35),
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: 42,
          width: 12,
          height: 4,
          borderRadius: 2,
          background: tinta(0.2),
        }}
      />
    </div>
  );
}

// "Fecha em 5 dias · vence em 15 dias", na faixa de assinatura do verso.
// Sem vencimento informado, só o fechamento.
function contagem(verso, t) {
  const quando = (n, hoje, amanha, emN) => (n <= 0 ? t(hoje) : n === 1 ? t(amanha) : t(emN, { n }));
  const fecha = quando(verso.diasFecha, "Fecha hoje", "Fecha amanhã", "Fecha em {n} dias");
  if (verso.diasVence === null) return fecha;
  return `${fecha} · ${quando(verso.diasVence, "vence hoje", "vence amanhã", "vence em {n} dias")}`;
}

// Arrastar pra girar (só no toque): quantos graus o cartão gira por pixel de
// dedo, a partir de quanto movimento o gesto vira giro (antes disso ainda pode
// ser um toque ou a rolagem da tela), e a volta ao soltar.
const GRAUS_POR_PX = 0.55;
const LIMIAR_PX = 8;
const VOLTA = "transform .55s cubic-bezier(.3, 1.45, .45, 1)";

// Espessura do cartão, em px. Frente e verso ficam a meia espessura do centro,
// um de cada lado, e o miolo é preenchido por lâminas empilhadas no meio — de
// lado, elas formam a borda grossa. Sem isso, girando, o cartão tinha a
// finura de uma folha de papel. Um cartão de verdade tem menos de 1mm; aqui
// precisa de mais pra se ver na tela.
const ESPESSURA = 5;
const LAMINAS = 10;

// O cartão da lista, em tamanho de cartão: proporção de cartão de verdade
// (85,6 x 54 mm, cerca de 1,586), na cor dele, com as informações por cima —
// nome e fechamento em cima, a fatura e o limite embaixo. Os enfeites (chip e
// par de círculos) são os mesmos da miniatura, maiores; nada de número nem
// bandeira.
//
// Tudo por cima segue a luminância da cor (branco no escuro, quase preto no
// amarelo). A barra de uso vai na tinta do texto, não na cor da faixa: num
// cartão vermelho ou laranja o vermelho e o âmbar de alerta sumiriam. Quem
// carrega o alerta é a etiqueta da porcentagem, branca com o texto na cor da
// faixa — legível em qualquer cartão.
//
// No celular dá pra arrastar o cartão de lado e ele gira em torno do eixo
// vertical, seguindo o dedo. Ao soltar ele encaixa na face mais próxima: volta
// pra frente ou fica virado, mostrando o verso (ver o comentário dele, lá
// embaixo). O arraste vertical continua rolando a tela
// (touch-action: pan-y), e um arraste não conta como toque — só o toque abre
// a edição. Mouse e caneta seguem só com o clique.
export function CardCartao({ cartao, uso, verso, onClick }) {
  const t = useT();
  const dia = cartao.diaFechamento || 0;
  const corFaixa = corDaFaixa(uso.pct);
  const corCartao = corDoCartao(cartao);
  const texto = corTextoSobre(corCartao);
  const claro = texto === "#FFFFFF";
  const tinta = (a) => (claro ? `rgba(255,255,255,${a})` : `rgba(20,16,24,${a})`);
  const fundo = `linear-gradient(135deg, ${corCartao}, color-mix(in oklab, ${corCartao} 70%, #000))`;

  const giroRef = React.useRef(null);
  const angulo = React.useRef(0); // ângulo em repouso: 0 (frente) ou ±180 (verso)
  const gesto = React.useRef(null);
  const arrastou = React.useRef(false);

  const girar = (graus, transicao) => {
    const el = giroRef.current;
    if (!el) return;
    el.style.transition = transicao;
    el.style.transform = `rotateY(${graus}deg)`;
  };

  const aoApontar = (e) => {
    if (e.pointerType !== "touch") return;
    arrastou.current = false;
    gesto.current = { x0: e.clientX, y0: e.clientY, ativo: false, graus: angulo.current };
  };

  const aoMover = (e) => {
    const g = gesto.current;
    if (!g) return;
    const dx = e.clientX - g.x0;
    const dy = e.clientY - g.y0;
    if (!g.ativo) {
      if (Math.abs(dx) < LIMIAR_PX && Math.abs(dy) < LIMIAR_PX) return;
      // Mais vertical que horizontal: é a rolagem da tela, não um giro.
      if (Math.abs(dy) > Math.abs(dx)) {
        gesto.current = null;
        return;
      }
      g.ativo = true;
      arrastou.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    g.graus = angulo.current + dx * GRAUS_POR_PX;
    girar(g.graus, "none");
  };

  const aoSoltar = () => {
    const g = gesto.current;
    gesto.current = null;
    if (!g?.ativo) return;
    // Encaixa na face mais próxima (múltiplo de 180) e guarda só o lado —
    // frente ou verso —, pra o ângulo não crescer sem fim volta após volta.
    const alvo = Math.round(g.graus / 180) * 180;
    girar(alvo, VOLTA);
    angulo.current = (((alvo / 180) % 2) + 2) % 2 === 1 ? 180 : 0;
    const el = giroRef.current;
    if (el) {
      const fim = () => {
        el.removeEventListener("transitionend", fim);
        girar(angulo.current, "none");
      };
      el.addEventListener("transitionend", fim);
    }
  };

  const aoClicar = () => {
    if (arrastou.current) {
      arrastou.current = false;
      return;
    }
    onClick?.();
  };

  const face = {
    position: "absolute",
    inset: 0,
    borderRadius: "var(--raio-card)",
    overflow: "hidden",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    background: fundo,
    color: texto,
    boxShadow: "0 10px 24px -10px rgba(20,16,24,0.45), 0 2px 6px rgba(20,16,24,0.12)",
  };
  // As lâminas do miolo: a cor do cartão escurecida, como a borda de um
  // plástico grosso — mais escura no meio, mais clara rente às faces.
  const laminas = Array.from({ length: LAMINAS - 1 }, (_, i) => {
    const z = -ESPESSURA / 2 + ((i + 1) * ESPESSURA) / LAMINAS;
    const meio = 1 - Math.abs(z) / (ESPESSURA / 2); // 1 no centro, 0 nas faces
    return (
      <div
        key={i}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "var(--raio-card)",
          background: `color-mix(in oklab, ${corCartao} ${Math.round(72 - meio * 22)}%, #000)`,
          transform: `translateZ(${z.toFixed(2)}px)`,
        }}
      />
    );
  });
  const brilho = (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(115deg, transparent 30%, ${tinta(0.1)} 48%, transparent 66%)`,
        pointerEvents: "none",
      }}
    />
  );

  return (
    <div
      onClick={aoClicar}
      onPointerDown={aoApontar}
      onPointerMove={aoMover}
      onPointerUp={aoSoltar}
      onPointerCancel={aoSoltar}
      className="clicavel"
      role="button"
      aria-label={cartao.nome}
      style={{
        position: "relative",
        aspectRatio: "1.586",
        cursor: "pointer",
        perspective: 1000,
        touchAction: "pan-y",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <div
        ref={giroRef}
        style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", willChange: "transform" }}
      >
        {laminas}

        {/* Frente */}
        <div
          style={{
            ...face,
            transform: `translateZ(${ESPESSURA / 2}px)`,
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {brilho}

          {/* Topo: nome e fechamento à esquerda, o par de círculos à direita. O
              app não guarda número nem bandeira, então o que situa o cartão é o
              ciclo. */}
          <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {cartao.nome}
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.8, marginTop: 2 }}>
                {dia > 0 ? t("Fecha dia {dia}", { dia }) : t("Fecha no último dia do mês")}
              </div>
            </div>
            <div aria-hidden style={{ display: "flex", flexShrink: 0 }}>
              <div style={{ width: 26, height: 26, borderRadius: "var(--raio-pilula)", background: tinta(0.5) }} />
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "var(--raio-pilula)",
                  marginLeft: -10,
                  background: tinta(0.28),
                }}
              />
            </div>
          </div>

          {/* chip */}
          <div
            aria-hidden
            style={{
              position: "relative",
              marginTop: 14,
              width: 34,
              height: 25,
              borderRadius: 6,
              background: tinta(0.42),
            }}
          />

          {/* Base: o valor da fatura e o limite; a barra de uso por último. */}
          <div style={{ position: "relative", marginTop: "auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                  {fmtBRL(uso.usado)}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.85, marginTop: 3 }}>
                  {uso.temLimite
                    ? t("{disponivel} livres de {limite}", {
                        disponivel: fmtBRL(uso.disponivel),
                        limite: fmtBRL(uso.limite),
                      })
                    : t("Sem limite informado")}
                </div>
              </div>
              {uso.temLimite && (
                <div
                  style={{
                    flexShrink: 0,
                    padding: "3px 8px",
                    borderRadius: "var(--raio-pilula)",
                    background: "rgba(255,255,255,0.94)",
                    color: corFaixa,
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {uso.pct.toFixed(0)}%
                </div>
              )}
            </div>
            {uso.temLimite && (
              <div
                style={{
                  marginTop: 10,
                  height: 6,
                  borderRadius: "var(--raio-pilula)",
                  background: tinta(0.25),
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(uso.pct, 100)}%`,
                    height: "100%",
                    borderRadius: "var(--raio-pilula)",
                    background: tinta(0.92),
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Verso: só o que a frente não mostra (calculado em ListaCartoes).
            Tarja magnética em cima; na faixa de assinatura, quanto falta pro
            fechamento e pro vencimento; no meio, o que já está nas próximas
            três faturas (as parcelas); embaixo, os recorrentes do cartão. */}
        <div
          aria-hidden
          style={{
            ...face,
            transform: `rotateY(180deg) translateZ(${ESPESSURA / 2}px)`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {brilho}
          <div style={{ position: "relative", marginTop: 18, height: 32, background: "rgba(20,16,24,0.82)" }} />
          <div
            style={{
              position: "relative",
              margin: "12px 20px 0",
              padding: "6px 12px",
              borderRadius: 6,
              background: "rgba(255,255,255,0.88)",
              color: "#1A1416",
              fontSize: 12.5,
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {verso ? contagem(verso, t) : cartao.nome}
          </div>

          {verso && (
            <>
              <div style={{ position: "relative", padding: "12px 20px 0" }}>
                <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>{t("Já nas próximas faturas")}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  {verso.proximas.map((f) => (
                    <div key={f.mes} style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, opacity: 0.75 }}>
                        {t(MESES_CURTO[Number(f.rotulo.slice(5, 7)) - 1])}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.01em" }}>
                        {f.total > 0.005 ? fmtBRLCompacto(f.total) : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div
                style={{
                  position: "relative",
                  marginTop: "auto",
                  padding: "0 20px 16px",
                  fontSize: 11.5,
                  fontWeight: 600,
                  opacity: 0.9,
                }}
              >
                {verso.recorrentes.n === 0
                  ? t("Sem recorrentes neste cartão")
                  : verso.recorrentes.n === 1
                    ? t("1 recorrente · {x}/mês", { x: fmtBRL(verso.recorrentes.total) })
                    : t("{n} recorrentes · {x}/mês", {
                        n: verso.recorrentes.n,
                        x: fmtBRL(verso.recorrentes.total),
                      })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
