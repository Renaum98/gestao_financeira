// CarrosselSaldoMes.jsx — carrossel horizontal do card principal no mobile.
// Cada slide é o card renderizado para um mês diferente; swipe lateral troca o
// mês ativo via `setMes`. Ordem ascendente (mais antigo à esquerda) — swipe pra
// direita volta no tempo, swipe pra esquerda avança. Quando `mes` muda por fora
// (ex: SeletorMes dentro do card), o carrossel rola para o slide certo.
//
// Os slides laterais giram pra dentro em 3D, como se estivessem presos na
// superfície de um cilindro que roda com o dedo: quem sai do centro vai
// tombando pro fundo, esmaecendo junto.
//
// O efeito tem DUAS entradas, e é a segunda que dá a sensação de movimento:
//   posição — onde o card está em relação ao centro da tela;
//   arrasto — quão rápido e pra que lado a rolagem está indo agora.
// A posição sozinha descreve uma persiana: cada card sempre com a mesma cara no
// mesmo lugar, indo e voltando idêntico. O arrasto acrescenta o que só existe
// entre dois frames — os cards deitam pro lado contrário ao da corrida e a roda
// recua um pouco, e isso escorre de volta ao zero quando tudo para. Por isso um
// laço de rAF contínuo (ver `passo`) em vez de um rAF por evento de scroll:
// velocidade não se mede num frame só, e o efeito precisa continuar vivo depois
// que o dedo sai, enquanto a inércia da rolagem ainda corre.
//
// A borda dos cards vizinhos fica de fora de propósito (ver ESPIADA): é o que
// avisa, sem texto nenhum, que dá pra arrastar pro lado — e por isso aqui não
// tem pontinho de paginação nenhum, seria dizer duas vezes a mesma coisa.

import React from "react";

// Quantos slides de cada lado do ativo têm o card renderizado de verdade. O
// resto mostra o esqueleto. Abaixar aperta mais a tela de entrada; subir dá mais
// folga pra swipes rápidos não cruzarem slide sem card.
const JANELA = 3;

// Quanto do card vizinho fica de fora de cada lado, em px. É a "alça" visual do
// carrossel: sem ela o card ativo parece uma tela estática. Sobe isso e o card
// ativo aperta o conteúdo; abaixa e a dica de swipe some.
const ESPIADA = 30;
// Respiro entre um card e o outro. Sai da largura do card ativo, não da
// espiada: PADDING_LATERAL cresce junto pra a beirada do vizinho continuar
// aparecendo os mesmos ESPIADA px.
const ESPACO = 18;
// Padding lateral do scroller = espiada + espaço. Precisa bater com o
// flex-basis dos slides (100vw - 2×), senão o primeiro e o último slide não
// conseguem parar centralizados no snap.
const PADDING_LATERAL = ESPIADA + ESPACO;
// Estado dos slides totalmente deslocados (os que só aparecem de canto). O
// encolhimento é quase todo de perspectiva (PROFUNDIDADE) e não de scale — o
// scale achata igual em tudo, a profundidade encolhe de verdade.
const ESCALA_MIN = 0.98;
const OPACIDADE_MIN = 0.58;
// Quantos px pra trás o slide totalmente deslocado se afunda.
const PROFUNDIDADE = 70;
// Giro em Y do slide totalmente deslocado. É o que dá o efeito de roda; acima
// de ~45° a face vira quase um risco e a borda visível some.
const GIRO_MAX = 38;
// Distância do olho até o plano dos cards. Menor = perspectiva mais dramática.
const PERSPECTIVA = 1100;

// --- inércia do gesto -------------------------------------------------------
// Velocidade (em larguras de viewport por frame de 16ms) que já conta como
// arrasto máximo. Num celular, um swipe decidido anda uns 50px por frame.
const VELOCIDADE_CHEIA = 0.15;
// Giro extra no auge do arrasto, somado ao da roda. É o que dá a leitura de
// direção: indo pra um lado os cards deitam pro outro, como quem é deixado
// pra trás.
const GIRO_ARRASTO = 13;
// Recuo extra da roda inteira no auge do arrasto.
const RECUO_ARRASTO = 55;
// Perseguição do arrasto até a velocidade medida. Sobe rápido (o dedo é quem
// manda) e desce devagar, pra a inclinação escorrer de volta ao parar em vez
// de desligar. É essa assimetria que dá o "peso" do movimento.
const SUBIDA_ARRASTO = 0.34;
const DESCIDA_ARRASTO = 0.11;

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
  // Estado do laço de animação. `arrasto` é a inclinação do gesto, entre -1 e
  // +1, com sinal = direção da rolagem. `vivo` evita empilhar rAF a cada evento
  // de scroll (eles chegam vários por frame). `comInercia` desliga só a parte
  // do movimento que o usuário não pediu — quem marcou "menos movimento" no
  // sistema continua com a roda, mas sem a deitada e o recuo do gesto.
  const cinetica = React.useRef(null);
  if (cinetica.current === null) {
    cinetica.current = {
      scrollAnt: 0,
      tAnt: 0,
      arrasto: 0,
      vivo: false,
      comInercia:
        typeof window !== "undefined" &&
        !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    };
  }
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
    // Inclinação vinda do gesto, não da posição: -1 arrastando pra um lado, +1
    // pro outro, 0 parado. É o que faz a roda parecer que TEM inércia.
    const arrasto = cinetica.current.arrasto;
    for (const { s, centroSlide, largura } of medidas) {
      // com sinal: -1 = encostado à esquerda, 0 = centrado, +1 = à direita
      const pos = Math.max(-1, Math.min(1, (centroSlide - centro) / largura));
      const d = Math.abs(pos);
      // Smoothstep em vez da rampa reta: perto do centro o card quase não
      // reage, e a queda pro fundo acelera no meio do caminho. Rampa linear é o
      // que dava o ar de persiana girando em passo constante.
      const q = d * d * (3 - 2 * d);
      const op = 1 - q * (1 - OPACIDADE_MIN);
      const escala = 1 - q * (1 - ESCALA_MIN);
      // A dobradiça CAMINHA com o card: 50% quando ele está centrado, indo até
      // a borda virada pro centro conforme ele se afasta. Fixa no meio, o giro
      // comprimia os dois lados e engolia a espiada; fixa na borda, ela pulava
      // de lado ao cruzar o centro e a inclinação do gesto (que existe também
      // no card do meio) saltava junto. Interpolada, não há salto nenhum.
      const origemX = 50 - 50 * pos;
      // Duas parcelas somadas: a da roda (onde o card está) e a do gesto (pra
      // onde ele está indo). rotateY(θ) manda o lado +X pro fundo, então quem
      // está à direita gira positivo — e, arrastando pra frente, todos deitam
      // um pouco pro lado de trás do movimento, inclusive o do meio.
      const giro = Math.sign(pos) * GIRO_MAX * q + arrasto * GIRO_ARRASTO;
      // Profundidade: o card lateral já fica pra trás, e no meio do arrasto a
      // roda inteira recua um pouco, como câmera que se afasta na corrida e
      // volta ao parar.
      const z = -(q * PROFUNDIDADE + Math.abs(arrasto) * RECUO_ARRASTO);
      s.style.opacity = op.toFixed(3);
      s.style.transformOrigin = `${origemX.toFixed(1)}% center`;
      s.style.transform =
        `translateZ(${z.toFixed(1)}px) rotateY(${giro.toFixed(2)}deg) scale(${escala.toFixed(3)})`;
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

  // Um frame do laço: mede quanto o scroll andou desde o frame anterior,
  // atualiza o arrasto e repinta.
  //
  // Antes era um rAF avulso por evento de scroll, e por isso o efeito só sabia
  // POSIÇÃO: parava de existir no instante em que o dedo soltava, mesmo com a
  // rolagem ainda correndo por inércia. O laço contínuo mede velocidade (que só
  // existe entre dois frames) e continua vivo até o arrasto zerar sozinho — é
  // daí que vem tanto a fluidez quanto a leitura de direção.
  const passo = React.useCallback(
    (ts) => {
      const el = ref.current;
      const c = cinetica.current;
      if (!el) {
        c.vivo = false;
        return;
      }
      const dt = c.tAnt ? Math.min(50, ts - c.tAnt) || 16 : 16;
      c.tAnt = ts;
      const andou = el.scrollLeft - c.scrollAnt;
      c.scrollAnt = el.scrollLeft;

      if (c.comInercia) {
        // px/ms → largura de viewport por frame de 16ms, saturando em ±1
        const largura = el.clientWidth || 1;
        const alvo = Math.max(
          -1,
          Math.min(1, ((andou / dt) * 16) / (largura * VELOCIDADE_CHEIA)),
        );
        const k = Math.abs(alvo) > Math.abs(c.arrasto) ? SUBIDA_ARRASTO : DESCIDA_ARRASTO;
        c.arrasto += (alvo - c.arrasto) * k;
        // Sem esse corte a perseguição exponencial nunca chega em zero e o laço
        // rodaria pra sempre atrás de um resto de 0.0001 grau.
        if (Math.abs(c.arrasto) < 0.003) c.arrasto = 0;
      }

      aplicarEfeitos();

      if (!rolandoProgRef.current) {
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
      }

      // Segue enquanto a rolagem andar ou sobrar inclinação pra escorrer.
      if (andou !== 0 || c.arrasto !== 0) {
        rafRef.current = requestAnimationFrame(passo);
      } else {
        c.vivo = false;
        c.tAnt = 0;
      }
    },
    [aplicarEfeitos, idxAtivo, mesesAsc, setMes],
  );

  const onScroll = React.useCallback(() => {
    const c = cinetica.current;
    if (c.vivo) return; // o laço já está de pé; não precisa de outro rAF
    const el = ref.current;
    if (!el) return;
    c.vivo = true;
    c.tAnt = 0;
    c.scrollAnt = el.scrollLeft;
    rafRef.current = requestAnimationFrame(passo);
  }, [passo]);

  React.useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      cinetica.current.vivo = false;
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
        // Ponto de fuga fixo no meio do viewport (a perspectiva é medida
        // contra a caixa do container, não contra o conteúdo rolado), então
        // os cards passam pela mesma "frente" da roda ao cruzar o centro.
        perspective: `${PERSPECTIVA}px`,
        perspectiveOrigin: "50% 50%",
        // padding lateral = (viewport - slide_width) / 2, sintonizado com o
        // flex-basis dos slides — ver PADDING_LATERAL/ESPIADA lá em cima.
        padding: `4px ${PADDING_LATERAL}px 0`,
        gap: ESPACO,
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
              willChange: perto ? "opacity, transform" : "auto",
              // transform/transformOrigin/opacity ficam por conta de
              // aplicarEfeitos — não declarar aqui pra o React não reescrever
              // por cima do que o rAF acabou de calcular.
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
