// anime.js — o anime.js sob demanda.
//
// Ele só dá acabamento a movimentos (a gota da tab bar, o balanço dos cards do
// carrossel); nada depende dele pra funcionar. Importado direto, seriam ~13 kB gz
// no chunk da abertura, então chega depois, num chunk à parte. Quem usa pede
// cedo com carregarAnime() e, até ele chegar, segue sem a mola.
let lib = null;
let pedido = null;

export const carregarAnime = () =>
  (pedido ??= import("animejs").then(({ animate, spring }) => {
    lib = { animate, spring };
  }));

// null enquanto não carregou
export const anime = () => lib;

export const semMovimento = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Modo leve (lib/leve.js): as molas saem e o movimento volta pro CSS simples.
// Lido do atributo no <html> a cada uso porque a preferência pode mudar com o
// app aberto (Perfil → Desempenho).
export const modoLeve = () => document.documentElement.hasAttribute("data-leve");
