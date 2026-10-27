// revelar.js — entrada e saída sutis de cards e itens conforme a rolagem: o
// elemento aparece subindo quando entra na faixa visível da tela e some ao sair
// dela, pelo lado por onde saiu. Volta a entrar quantas vezes a rolagem passar.
//
// A faixa (GATILHO) é a tela sem uma tira em cima e outra embaixo. Com a tela
// inteira, entrada e saída aconteceriam na borda, onde ninguém está olhando: o
// card chegava ao meio com a animação já terminada e o efeito passava
// despercebido. Nas tiras, o que se vê é o elemento chegando e indo embora.
//
// O sentido acompanha a rolagem. Rolando pra baixo, o card entra subindo pela
// tira de baixo e sai subindo pela de cima; rolando pra cima, o contrário. Por
// isso o estado escondido guarda o lado: "abaixo" espera 20px mais baixo,
// "acima" 20px mais alto.
//
// O que já nasce dentro da faixa fica quieto: a troca de tela tem o `pageIn`
// dela (animations.css), e somar uma segunda entrada ali deixaria a tela nova
// mais lenta pra "abrir" — o engasgo que já deu trabalho tirar.
//
// Um observador só pra todos os elementos, e nenhuma leitura de layout nossa:
// quem diz onde cada um está é o aviso do IntersectionObserver. No primeiro
// aviso só escondemos o que está fora da janela, então não há piscada.
//
// A animação é só opacity e transform, as duas que o navegador anima sem
// refazer layout. A classe de transição fica só enquanto o elemento anda, pra
// não atropelar as transições próprias dele.
//
// Desligado no modo leve (lib/leve.js) e com "reduzir movimento" — nos dois o
// elemento nem chega a ser observado. O CSS repete a regra, pra cobrir quem
// liga um deles com a tela aberta.

import React from "react";

const ABAIXO = "revela-abaixo";
const ACIMA = "revela-acima";
const ANDA = "revela-anda";
const GATILHO = "-8% 0px -12% 0px";
// Vários entrando juntos (rolagem rápida) saem em escadinha, com teto: o
// quinto em diante entra junto do quarto, senão o último esperaria demais.
const DEGRAU_MS = 45;
const DEGRAUS = 4;
// Duração da transição (animations.css) mais o maior atraso, com folga.
const LIMPEZA_MS = 550 + DEGRAU_MS * DEGRAUS + 100;

// elemento → "novo" | "dentro" | ABAIXO | ACIMA
const estados = new WeakMap();
const limpezas = new WeakMap();
let observador = null;

function desligado() {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) return true;
  if (document.documentElement.hasAttribute("data-leve")) return true;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

// Troca o estado com transição. `atraso` só na entrada: a saída acompanha o
// dedo, sem esperar a vez.
function animar(el, estado, atraso = 0) {
  clearTimeout(limpezas.get(el));
  el.style.transitionDelay = atraso ? `${atraso}ms` : "";
  el.classList.add(ANDA);
  el.classList.remove(ABAIXO, ACIMA);
  if (estado !== "dentro") el.classList.add(estado);
  estados.set(el, estado);
  limpezas.set(
    el,
    setTimeout(() => {
      el.classList.remove(ANDA);
      el.style.transitionDelay = "";
    }, LIMPEZA_MS),
  );
}

function aoCruzar(entradas) {
  let ordem = 0;
  for (const e of entradas) {
    const el = e.target;
    const estado = estados.get(el);
    const caixa = e.boundingClientRect;

    if (estado === "novo") {
      // Primeiro aviso: só some o que está fora da JANELA (não da faixa) — um
      // card nas tiras já está à vista, e escondê-lo agora seria uma piscada.
      // Sem transição: ninguém está vendo.
      if (!e.isIntersecting && caixa.top >= window.innerHeight) {
        el.classList.add(ABAIXO);
        estados.set(el, ABAIXO);
      } else if (!e.isIntersecting && caixa.bottom <= 0) {
        el.classList.add(ACIMA);
        estados.set(el, ACIMA);
      } else {
        estados.set(el, "dentro");
      }
      continue;
    }

    if (e.isIntersecting && estado !== "dentro") {
      animar(el, "dentro", Math.min(ordem++, DEGRAUS) * DEGRAU_MS);
    } else if (!e.isIntersecting && estado === "dentro") {
      // Saiu pela tira de cima ou pela de baixo: o lado é o do meio do
      // elemento em relação ao meio da faixa.
      const meioFaixa = e.rootBounds
        ? (e.rootBounds.top + e.rootBounds.bottom) / 2
        : window.innerHeight / 2;
      animar(el, (caixa.top + caixa.bottom) / 2 < meioFaixa ? ACIMA : ABAIXO);
    }
  }
}

function parar(el) {
  clearTimeout(limpezas.get(el));
  estados.delete(el);
  observador?.unobserve(el);
}

function observar(el) {
  if (desligado()) return;
  // Dentro de modal, não: ele já entra com o scaleIn dele, e o conteúdo
  // rolando dentro do diálogo piscaria a cada volta.
  if (el.closest('[role="dialog"]')) return;
  observador ??= new IntersectionObserver(aoCruzar, { rootMargin: GATILHO });
  estados.set(el, "novo");
  observador.observe(el);
}

// Ref pra pendurar no elemento que deve entrar e sair com a rolagem.
export function useRevelar() {
  const atual = React.useRef(null);
  return React.useCallback((el) => {
    if (atual.current) parar(atual.current);
    atual.current = el;
    if (el) observar(el);
  }, []);
}
