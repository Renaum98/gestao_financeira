// CarrosselSaldoMes.jsx — carrossel horizontal do card principal no mobile.
// Cada slide é o card renderizado para um mês diferente; swipe lateral troca o
// mês ativo via `setMes`. Ordem ascendente (mais antigo à esquerda) — swipe pra
// direita volta no tempo, swipe pra esquerda avança. Quando `mes` muda por fora
// (ex: SeletorMes dentro do card), o carrossel rola para o slide certo.
//
// Os slides laterais entram menores e vão crescendo até assumir o centro. É um
// efeito de POSIÇÃO e só: escala pura, sem giro 3D, sem profundidade e sem a
// inércia que lia a velocidade do gesto — isso tudo existiu aqui e saiu (ver
// 19a5fcd no histórico, se um dia voltar a fazer falta).
//
// A escala é ancorada na borda virada pro centro, não no meio do card (ver
// `origemX` em aplicarEscala). Ancorada no meio, encolher o vizinho puxaria a
// borda interna pra dentro e comeria a ESPIADA — justo a única coisa que avisa
// que dá pra arrastar. Ancorada na borda interna, o card encolhe pro lado de
// fora: a espiada fica intacta e a leitura vira "cresce vindo pro centro".
//
// A borda dos cards vizinhos fica de fora de propósito (ver ESPIADA): é o que
// avisa, sem texto nenhum, que dá pra arrastar pro lado — e por isso aqui não
// tem pontinho de paginação nenhum, seria dizer duas vezes a mesma coisa.

import React from "react";

// Quantos slides de cada lado do ativo têm o card renderizado de verdade. O
// resto mostra o esqueleto. Abaixar aperta mais a tela de entrada; subir dá mais
// folga pra swipes rápidos não cruzarem slide sem card.
const JANELA = 3;

// Os três números abaixo são um sistema fechado — mexer num mexe nos outros:
//
//     PADDING_LATERAL = ESPIADA + ESPACO
//     largura do card ativo = 100vw − 2 × PADDING_LATERAL
//
// Quem manda na largura do card é a SOMA, não cada parcela. Então:
//   • crescer o gap sem tocar na espiada → o card encolhe 2px por px;
//   • manter a largura e crescer o gap → sai da espiada, px por px.
// A soma está em 44 (card = 100vw − 88px), que é a largura aprovada.

// Quanto do card vizinho fica de fora de cada lado, em px. É a "alça" visual do
// carrossel: sem ela o card ativo parece uma tela estática, e como aqui não tem
// pontinho de paginação, é a única coisa que avisa que dá pra arrastar. Abaixo
// de ~20px esse aviso começa a sumir.
const ESPIADA = 26;
// Respiro entre um card e o outro.
const ESPACO = 18;
// Padding lateral do scroller. Precisa bater com o flex-basis dos slides
// (100vw - 2×), senão o primeiro e o último slide não conseguem parar
// centralizados no snap.
const PADDING_LATERAL = ESPIADA + ESPACO;

// Tamanho do slide totalmente deslocado, em fração do slide central. É a força
// do efeito e o único número a mexer pra calibrar: 1 desliga, quanto menor mais
// dramático. Como a escala é uniforme, o vizinho encolhe também na altura.
const ESCALA_MIN = 0.88;

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
  // Um rAF por frame, não um por evento de scroll (que chegam vários por frame).
  const pendenteRef = React.useRef(false);
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
    const face = slideRefs.current[idxAtivo]?.firstElementChild;
    if (!face) return;
    // offsetHeight ignora o transform aplicado por aplicarEscala — é a caixa
    // real, então a altura medida não encolhe junto com o efeito.
    const h = face.offsetHeight;
    if (h > alturaSlide) setAlturaSlide(h);
  });

  // Escala de cada slide conforme a distância até o centro da tela.
  const aplicarEscala = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const centro = el.scrollLeft + el.clientWidth / 2;
    // Lê TODA a geometria antes de escrever qualquer estilo. Intercalado, cada
    // leitura de offsetLeft depois de um write força o navegador a recalcular o
    // layout — um reflow síncrono por slide, e a conta cresce com o número de
    // meses. Separado em duas passadas, é um layout só.
    // Mede o slide (caixa de layout, nunca transformada) e escreve na face
    // (filha única, é ela que escala).
    const medidas = [];
    for (const s of slideRefs.current) {
      const face = s?.firstElementChild;
      if (!face) continue;
      medidas.push({ face, centroSlide: s.offsetLeft + s.clientWidth / 2, largura: s.clientWidth });
    }
    for (const { face, centroSlide, largura } of medidas) {
      // com sinal: -1 = encostado à esquerda, 0 = centrado, +1 = à direita
      const pos = Math.max(-1, Math.min(1, (centroSlide - centro) / largura));
      const d = Math.abs(pos);
      // Smoothstep em vez de rampa reta: perto do centro o card quase não reage
      // e o encolhimento acelera no meio do caminho. A rampa linear dá o ar de
      // persiana andando em passo constante.
      const q = d * d * (3 - 2 * d);
      const escala = 1 - q * (1 - ESCALA_MIN);
      // A âncora CAMINHA com o card: 50% quando centrado, indo até a borda
      // virada pro centro conforme ele se afasta (pos=+1, card à direita → 0%,
      // que é a borda esquerda dele). Assim o card encolhe pro lado de fora e a
      // espiada sobrevive. Interpolada em vez de fixa nas bordas, não há salto
      // ao cruzar o centro.
      const origemX = 50 - 50 * pos;
      face.style.transformOrigin = `${origemX.toFixed(1)}% center`;
      face.style.transform = `scale(${escala.toFixed(4)})`;
    }
  }, []);

  // Centraliza o slide ativo. Em primeiro render usa "instant" pra evitar flash;
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
    // Nada a fazer, sem scrollTo programático.
    if (mudouPorSwipeRef.current) {
      mudouPorSwipeRef.current = false;
      primeiraVezRef.current = false;
      aplicarEscala();
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
        aplicarEscala();
      }, 500);
      aplicarEscala();
      return () => clearTimeout(t);
    }
    primeiraVezRef.current = false;
    aplicarEscala();
  }, [idxAtivo, mesesAsc, aplicarEscala]);

  // Qual slide está mais perto do centro agora — é ele quem define o mês ativo.
  const sincronizarMes = React.useCallback(() => {
    const el = ref.current;
    if (!el || rolandoProgRef.current) return;
    const centro = el.scrollLeft + el.clientWidth / 2;
    let maisPerto = idxAtivo;
    let menorDist = Infinity;
    slideRefs.current.forEach((s, i) => {
      if (!s) return;
      const cc = s.offsetLeft + s.clientWidth / 2;
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
  }, [idxAtivo, mesesAsc, setMes]);

  // Um frame do gesto: repinta a escala e vê se o mês ativo mudou. Os eventos
  // de scroll chegam vários por frame, então o rAF é o que garante uma passada
  // só — e ela acontece no momento certo, junto do paint.
  const passo = React.useCallback(() => {
    pendenteRef.current = false;
    aplicarEscala();
    sincronizarMes();
  }, [aplicarEscala, sincronizarMes]);

  const onScroll = React.useCallback(() => {
    if (pendenteRef.current) return;
    pendenteRef.current = true;
    rafRef.current = requestAnimationFrame(passo);
  }, [passo]);

  React.useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  // O scroll é o único gatilho do efeito, então uma mudança de layout sem gesto
  // nenhum — girar o aparelho, a barra do navegador sumindo (muda 100vw), o
  // teclado abrindo — deixaria os cards com a escala da largura antiga até o
  // usuário tocar na tela.
  //
  // Escreve só na face (filha), e transform não altera layout, então o callback
  // não consegue mudar o tamanho do que está sendo observado: sem risco do loop
  // de ResizeObserver.
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => aplicarEscala());
    ro.observe(el);
    return () => ro.disconnect();
  }, [aplicarEscala]);

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
        // flex-basis dos slides — ver PADDING_LATERAL/ESPIADA lá em cima.
        padding: `4px ${PADDING_LATERAL}px 0`,
        gap: ESPACO,
      }}
    >
      {mesesAsc.map((m, i) => {
        const dist = Math.abs(i - idxAtivo);
        // `will-change` promove a face a camada de composição própria. Em todas
        // elas isso significaria uma camada por mês de histórico (e
        // parcelamentos jogam meses futuros na lista), todas recriadas quando a
        // aba volta a ficar visível. Só as vizinhas da ativa chegam a se mexer
        // durante o gesto, então só elas precisam da promoção.
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
            className="carrossel-saldo__slide"
            ref={(node) => {
              slideRefs.current[i] = node;
            }}
            style={{
              flex: `0 0 calc(100vw - ${PADDING_LATERAL * 2}px)`,
              minHeight: alturaSlide || undefined,
              scrollSnapAlign: "center",
              // sem scrollSnapStop: "always" — permite gestos rápidos
              // atravessarem mais de um slide sem travar
            }}
          >
            {/* A face existe por dois motivos: estica o card até a altura da
                fileira (minHeight vale pro slide, então sem isto o card mais
                baixo flutuaria numa caixa alta) e é ela que recebe o transform
                — nunca o slide, que é o alvo do snap. */}
            <div
              className="carrossel-saldo__face"
              style={{
                height: "100%",
                willChange: perto ? "transform" : "auto",
                // transform/transformOrigin ficam por conta de aplicarEscala —
                // não declarar aqui pra o React não reescrever por cima do que
                // o rAF acabou de calcular.
                // Sem transition: são reescritos a cada frame do scroll, então
                // o efeito acompanha o dedo 1:1. Uma transition aqui só criaria
                // lag perseguindo o gesto; o snap nativo continua emitindo
                // scroll até assentar, então o final também fica suave.
              }}
            >
              {naJanela ? renderCard(m) : comEsqueleto ? <EsqueletoCard /> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
