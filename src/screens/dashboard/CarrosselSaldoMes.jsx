// CarrosselSaldoMes.jsx — carrossel horizontal do card principal no mobile.
// Cada slide é o card renderizado para um mês diferente; swipe lateral troca o
// mês ativo via `setMes`. Ordem ascendente (mais antigo à esquerda) — swipe pra
// direita volta no tempo, swipe pra esquerda avança. Quando `mes` muda por fora
// (ex: SeletorMes dentro do card), o carrossel rola para o slide certo.
//
// Os slides são planos: sem giro 3D, sem profundidade e sem inércia. O que
// existia aqui (roda em Y com dobradiça migrante e um laço de rAF medindo a
// velocidade do gesto) foi removido a pedido — se um dia voltar, o histórico
// tem em 19a5fcd. O que sobrou do laço é só a leitura de qual slide está no
// centro, que é o que decide o mês ativo.
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
const ESPACO = 24;
// Padding lateral do scroller = espiada + espaço. Precisa bater com o
// flex-basis dos slides (100vw - 2×), senão o primeiro e o último slide não
// conseguem parar centralizados no snap.
const PADDING_LATERAL = ESPIADA + ESPACO;

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
    const h = face.offsetHeight;
    if (h > alturaSlide) setAlturaSlide(h);
  });

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
      }, 500);
      return () => clearTimeout(t);
    }
    primeiraVezRef.current = false;
  }, [idxAtivo, mesesAsc]);

  // Qual slide está mais perto do centro agora — é ele quem define o mês ativo.
  // Roda no máximo uma vez por frame; sem transform em jogo, é só leitura de
  // offsetLeft/clientWidth (uma passada de layout, sem escrita nenhuma).
  const sincronizarMes = React.useCallback(() => {
    pendenteRef.current = false;
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

  const onScroll = React.useCallback(() => {
    if (pendenteRef.current) return;
    pendenteRef.current = true;
    rafRef.current = requestAnimationFrame(sincronizarMes);
  }, [sincronizarMes]);

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
        // flex-basis dos slides — ver PADDING_LATERAL/ESPIADA lá em cima.
        padding: `4px ${PADDING_LATERAL}px 0`,
        gap: ESPACO,
      }}
    >
      {mesesAsc.map((m, i) => {
        const dist = Math.abs(i - idxAtivo);
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
            {/* Esticar o card até a altura da fileira: como minHeight vale pro
                slide, sem isto o card mais baixo flutuaria numa caixa alta. */}
            <div className="carrossel-saldo__face" style={{ height: "100%" }}>
              {naJanela ? renderCard(m) : comEsqueleto ? <EsqueletoCard /> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
