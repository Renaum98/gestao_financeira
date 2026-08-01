// CarrosselSaldoMes.jsx — carrossel horizontal do card principal no mobile.
// Cada slide é o card renderizado para um mês diferente; swipe lateral troca o
// mês ativo via `setMes`. Ordem ascendente (mais antigo à esquerda) — swipe pra
// direita volta no tempo, swipe pra esquerda avança. Quando `mes` muda por fora
// (ex: SeletorMes dentro do card), o carrossel rola para o slide certo.
//
// Os slides laterais ficam progressivamente diminuídos/esmaecidos conforme a
// distância do centro do viewport, dando sensação de profundidade. O efeito é
// dirigido pelo scroll em tempo real via rAF — sem transição CSS, pra
// acompanhar o gesto sem lag.

import React from "react";

// Quantos slides de cada lado do ativo têm o card renderizado de verdade. O
// resto mostra o esqueleto. Abaixar aperta mais a tela de entrada; subir dá mais
// folga pra swipes rápidos não cruzarem slide sem card.
const JANELA = 3;

// Esqueleto do CardSaldo, exibido nos slides fora da janela. Repete o desenho do
// card — cabeçalho, valor grande, chip de variação e o rodapé em duas colunas —
// pra o swipe rápido mostrar a forma da informação que está vindo, em vez de um
// vazio. `.skeleton` (loaders.css) cuida do shimmer e do prefers-reduced-motion.
function EsqueletoCard() {
  return (
    <div
      aria-hidden="true"
      style={{
        height: "100%",
        minHeight: 168,
        borderRadius: 28,
        padding: 22,
        boxSizing: "border-box",
        background: "color-mix(in oklab, var(--ink) 5%, var(--card))",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="skeleton" style={{ width: 92, height: 13, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 116, height: 28, borderRadius: 999 }} />
      </div>
      <div className="skeleton" style={{ width: "62%", height: 36, borderRadius: 10, marginTop: 12 }} />
      <div className="skeleton" style={{ width: 132, height: 22, borderRadius: 999, marginTop: 8 }} />
      <div
        style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: "1px solid color-mix(in oklab, var(--ink) 10%, transparent)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div className="skeleton" style={{ width: 66, height: 11, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: 88, height: 15, borderRadius: 7, marginTop: 5 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div className="skeleton" style={{ width: 58, height: 11, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: 80, height: 15, borderRadius: 7, marginTop: 5 }} />
        </div>
      </div>
    </div>
  );
}

export function CarrosselSaldoMes({ todosMeses, mes, setMes, renderCard }) {
  const ref = React.useRef(null);
  const slideRefs = React.useRef([]);
  const mesesAsc = React.useMemo(() => [...todosMeses].reverse(), [todosMeses]);
  const idxAtivo = Math.max(0, mesesAsc.indexOf(mes));
  // Evita feedback loop: enquanto o scroll programático está rolando, não
  // chamamos setMes a partir do onScroll.
  const rolandoProgRef = React.useRef(false);
  const ultimoMesEnviado = React.useRef(mes);
  const primeiraVezRef = React.useRef(true);
  // Conjunto de meses do último posicionamento. Se ele muda (txs carregaram da
  // cache, ou o mês virou e entrou um slide novo), a recentralização é
  // estrutural — não um gesto do usuário — então posicionamos sem animação.
  const mesesKeyRef = React.useRef("");
  const rafRef = React.useRef(0);
  // Marca que a próxima mudança de idxAtivo veio do próprio swipe do usuário —
  // nesse caso o scroll-snap nativo já está centralizando, então o layoutEffect
  // NÃO deve disparar um scrollTo programático (que brigaria com o dedo).
  const mudouPorSwipeRef = React.useRef(false);

  // Altura reservada pros slides sem card. Sem ela, a altura da fileira passaria
  // a ser ditada só pelos cards renderizados e mudaria conforme a janela desliza
  // (os cards variam de altura: entradas, diferença do mês, bloco do parceiro).
  // Só cresce, nunca encolhe, então converge no primeiro card mais alto e para.
  const [alturaSlide, setAlturaSlide] = React.useState(0);
  React.useLayoutEffect(() => {
    const s = slideRefs.current[idxAtivo];
    const card = s?.firstElementChild;
    if (!card) return;
    // offsetHeight ignora o scale aplicado por aplicarEfeitos — é a caixa real
    const h = card.offsetHeight;
    if (h > alturaSlide) setAlturaSlide(h);
  });

  const aplicarEfeitos = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const centro = el.scrollLeft + el.clientWidth / 2;
    // Lê TODA a geometria antes de escrever qualquer estilo. Intercalado, cada
    // leitura de offsetLeft depois de um write forçava o navegador a recalcular
    // o layout — um reflow síncrono por slide, e a conta cresce com o número de
    // meses. Separado em duas passadas, é um layout só.
    const medidas = [];
    for (const s of slideRefs.current) {
      if (!s) continue;
      medidas.push({ s, centroSlide: s.offsetLeft + s.clientWidth / 2, largura: s.clientWidth });
    }
    for (const { s, centroSlide, largura } of medidas) {
      // distância normalizada: 0 = centralizado, 1 = totalmente deslocado
      const d = Math.min(1, Math.abs(centroSlide - centro) / largura);
      const op = 1 - d * 0.45; // até 0.55 de opacidade nos extremos
      const scale = 1 - d * 0.14; // scale-down até 14% nos slides laterais
      s.style.opacity = op.toFixed(3);
      s.style.transform = `scale(${scale.toFixed(3)})`;
    }
  }, []);

  // Centraliza o slide ativo. Em primeiro render usa "auto" pra evitar flash;
  // depois usa "smooth" pra acompanhar mudanças via SeletorMes.
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // O conjunto de meses mudou desde o último posicionamento? (txs carregaram,
    // mês virou). Nesse caso a recentralização não é um gesto do usuário —
    // posicionamos instantaneamente, sem o scroll animado atravessando meses.
    const mesesKey = mesesAsc.join(",");
    const conjuntoMudou = mesesKey !== mesesKeyRef.current;
    mesesKeyRef.current = mesesKey;
    // Mudança disparada pelo swipe do usuário: o snap nativo já centraliza.
    // Só atualizamos os efeitos e saímos, sem scrollTo programático.
    if (mudouPorSwipeRef.current) {
      mudouPorSwipeRef.current = false;
      primeiraVezRef.current = false;
      aplicarEfeitos();
      return;
    }
    const slide = slideRefs.current[idxAtivo];
    if (!slide) return;
    const alvo = slide.offsetLeft - (el.clientWidth - slide.clientWidth) / 2;
    if (Math.abs(el.scrollLeft - alvo) >= 2) {
      rolandoProgRef.current = true;
      // "smooth" só quando o usuário troca de mês pelo SeletorMes (mesmo
      // conjunto de slides). Primeiro posicionamento ou mudança de conjunto
      // (carga/virada de mês) vão de "instant".
      // IMPORTANTE: "instant" (não "auto"). O container tem scroll-behavior:
      // smooth no CSS, e behavior "auto" no scrollTo respeita o CSS — ou seja,
      // animaria mesmo assim. "instant" ignora o CSS e salta de fato.
      const semAnimacao = primeiraVezRef.current || conjuntoMudou;
      el.scrollTo({ left: alvo, behavior: semAnimacao ? "instant" : "smooth" });
      primeiraVezRef.current = false;
      const t = setTimeout(() => {
        rolandoProgRef.current = false;
        aplicarEfeitos();
      }, 500);
      aplicarEfeitos();
      return () => clearTimeout(t);
    }
    primeiraVezRef.current = false;
    aplicarEfeitos();
  }, [idxAtivo, aplicarEfeitos, mesesAsc]);

  const onScroll = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      aplicarEfeitos();
      if (rolandoProgRef.current) return;
      const el = ref.current;
      if (!el) return;
      const centro = el.scrollLeft + el.clientWidth / 2;
      let maisPerto = idxAtivo;
      let menorDist = Infinity;
      slideRefs.current.forEach((c, i) => {
        if (!c) return;
        const cc = c.offsetLeft + c.clientWidth / 2;
        const d = Math.abs(cc - centro);
        if (d < menorDist) {
          menorDist = d;
          maisPerto = i;
        }
      });
      const novo = mesesAsc[maisPerto];
      if (novo && novo !== ultimoMesEnviado.current) {
        ultimoMesEnviado.current = novo;
        mudouPorSwipeRef.current = true;
        setMes(novo);
      }
    });
  }, [mesesAsc, setMes, idxAtivo, aplicarEfeitos]);

  React.useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      className="carrossel-saldo"
      style={{
        display: "flex",
        justifyContent: "safe center",
        overflowX: "auto",
        overflowY: "hidden",
        scrollSnapType: "x mandatory",
        // smooth aplica-se a scrolls programáticos (scrollTo) — usado quando
        // SeletorMes muda o mês por fora do swipe.
        scrollBehavior: "smooth",
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorX: "contain",
        // padding lateral = (viewport - slide_width) / 2, sintonizado com o
        // flex-basis abaixo (100vw - 56) → 28px de cada lado pra permitir que
        // o primeiro/último slide consigam ser centralizados pelo snap.
        padding: "4px 28px 0",
        gap: 12,
      }}
    >
      {mesesAsc.map((m, i) => {
        const dist = Math.abs(i - idxAtivo);
        // `will-change` e `backface-visibility` promovem o slide a camada de
        // composição própria. Em todos os slides isso significava uma camada por
        // mês de histórico (e parcelamentos jogam meses futuros na lista), todas
        // recriadas quando a aba volta a ficar visível. Só os vizinhos do slide
        // ativo chegam a se mover no gesto, então só eles precisam da promoção.
        const perto = dist <= 1;
        // Fora da janela o slide continua existindo, com a mesma largura e
        // altura, mostrando o esqueleto no lugar do card. Assim o card caro (que
        // varre a lista de transações e rende ~300 linhas de markup) some da
        // entrada da tela sem que a geometria do scroll mude: tirar os meses da
        // lista encolheria o container e faria o scroll saltar quando eles
        // voltassem.
        const naJanela = dist <= JANELA;
        // O shimmer é uma animação infinita: deixá-la em todos os meses traria
        // de volta o custo que a janela acabou de tirar. Só os slides logo além
        // da janela ganham esqueleto — são os únicos que um swipe alcança antes
        // de a janela se atualizar. Mais longe que isso, caixa vazia mesmo.
        const comEsqueleto = dist <= JANELA + 2;
        return (
          <div
            key={m}
            ref={(node) => {
              slideRefs.current[i] = node;
            }}
            style={{
              flex: "0 0 calc(100vw - 56px)",
              minHeight: alturaSlide || undefined,
              scrollSnapAlign: "center",
              // sem scrollSnapStop: "always" — permite gestos rápidos
              // atravessarem mais de um slide sem travar
              willChange: perto ? "opacity, transform" : "auto",
              transformOrigin: "center center",
              // Sem transition: opacity/transform são reescritos a cada frame de
              // scroll por aplicarEfeitos (via rAF), então o efeito acompanha o
              // dedo 1:1. Uma transition aqui só adicionaria lag perseguindo o
              // gesto. O snap nativo continua emitindo scroll até assentar, então
              // o estado final também fica suave sem transição.
              backfaceVisibility: perto ? "hidden" : undefined,
            }}
          >
            {naJanela ? renderCard(m) : comEsqueleto ? <EsqueletoCard /> : null}
          </div>
        );
      })}
    </div>
  );
}
