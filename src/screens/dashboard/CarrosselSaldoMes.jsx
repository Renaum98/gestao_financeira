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
        // `will-change` e `backface-visibility` promovem o slide a camada de
        // composição própria. Em todos os slides isso significava uma camada por
        // mês de histórico (e parcelamentos jogam meses futuros na lista), todas
        // recriadas quando a aba volta a ficar visível. Só os vizinhos do slide
        // ativo chegam a se mover no gesto, então só eles precisam da promoção.
        const perto = Math.abs(i - idxAtivo) <= 1;
        return (
          <div
            key={m}
            ref={(node) => {
              slideRefs.current[i] = node;
            }}
            style={{
              flex: "0 0 calc(100vw - 56px)",
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
            {renderCard(m)}
          </div>
        );
      })}
    </div>
  );
}
