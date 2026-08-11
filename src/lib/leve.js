// leve.js — o "modo leve": o app abrindo mão de enfeite pra render mais rápido.
//
// O que ele desliga (e o que isso custa):
//   • o vidro da tab bar vira superfície sólida — o blur é refeito pela GPU a
//     cada quadro em que algo rola por baixo dele, e é o efeito mais caro que
//     temos ligado o tempo todo;
//   • o carrossel de meses vira o card único do desktop — some a montagem de um
//     card por mês; a troca de mês continua pelo seletor dentro do card, sem o
//     swipe;
//   • as transições de tela e a trava do splash encurtam;
//   • o prefetch dos chunks em idle não roda — cada aba baixa o seu na primeira
//     visita, com skeleton no meio do caminho;
//   • só a aba atual fica montada: as outras saem do DOM e voltam a custar
//     montagem, em troca da memória que num aparelho de 1–2 GB é o que faz o
//     navegador matar a página em segundo plano.
//
// Nada aqui é conserto de bug disfarçado de opção: tudo que dava pra corrigir
// sem cobrar nada do usuário foi corrigido pra todo mundo, fora deste módulo.

const CHAVE = "leve";

export const AUTO = "auto";
export const LIGADO = "sim";
export const DESLIGADO = "nao";

// O palpite do automático. Só sinais que o navegador entrega de graça:
//
//   • `saveData` é o usuário tendo pedido economia — não custa nada respeitar;
//   • `deviceMemory` é a leitura mais confiável de aparelho modesto, e existe
//     justamente onde os aparelhos modestos estão (Chrome/Android);
//   • `hardwareConcurrency` sozinho não serve de critério: o Safari do iPhone
//     devolve 4 num aparelho rápido, e cortar em "≤ 4 núcleos" jogaria todo
//     iPhone no modo leve. Ele só entra como desempate junto da memória.
//
// Onde nada disso existe (iOS, navegadores antigos), o automático fica em
// desligado — errar pra "app completo" é menos ruim do que tirar recurso de um
// aparelho que dava conta. Quem discordar tem os dois estados manuais.
const nav = typeof navigator === "undefined" ? null : navigator;
const memoria = nav?.deviceMemory;
const nucleos = nav?.hardwareConcurrency;

export const aparelhoModesto =
  !!nav &&
  (nav.connection?.saveData === true ||
    (typeof memoria === "number" &&
      (memoria <= 2 || (memoria <= 4 && typeof nucleos === "number" && nucleos <= 4))));

// Resolve os três estados da preferência num sim ou não.
export function ehLeve(escolha) {
  const v = escolha || AUTO;
  if (v === LIGADO) return true;
  if (v === DESLIGADO) return false;
  return aparelhoModesto;
}

// Espelho no localStorage, pelo mesmo motivo do idioma, da moeda e da paleta: a
// preferência da nuvem só chega depois do login, e o modo leve precisa valer já
// no primeiro quadro — inclusive na tela de login, que também tem o vidro e as
// animações.
export function lerLeveSalvo() {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null; // localStorage indisponível (modo privado)
  }
}

export function salvarLeve(escolha) {
  try {
    if (escolha) localStorage.setItem(CHAVE, escolha);
  } catch {
    /* localStorage indisponível (modo privado) — ignora */
  }
}
