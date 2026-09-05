// tema.js — resolve claro/escuro a partir da preferência salva.
//
// O modo guardado pode ser "claro", "escuro" ou "sistema"; nesse último caso
// quem manda é o prefers-color-scheme do SO. Vive aqui, e não no app.jsx, porque
// a tela de Aparência também precisa saber o tema ativo pra desenhar o seletor
// de cor com as cores que a paleta realmente vai render no tema atual.

import React from "react";

// A aparência escolhida vive em `preferences` (nuvem), que só chega depois do
// login e da primeira leitura do Firestore. Até lá o app já está na tela — hoje
// mais do que antes, porque o splash da abertura segura a animação do logo — e
// pintaria tudo na paleta padrão pra só então trocar de cor na frente do
// usuário. O espelho no localStorage evita isso: a última aparência conhecida
// deste aparelho vale desde o primeiro quadro. Mesma ideia do idioma (i18n.jsx)
// e da moeda (moeda.js).
const CHAVE_PALETA = "paleta";
const CHAVE_MODO = "modo";

export function lerAparenciaSalva() {
  try {
    return {
      paleta: localStorage.getItem(CHAVE_PALETA),
      modo: localStorage.getItem(CHAVE_MODO),
    };
  } catch {
    return { paleta: null, modo: null }; // localStorage indisponível (modo privado)
  }
}

export function salvarAparencia(paleta, modo) {
  try {
    if (paleta) localStorage.setItem(CHAVE_PALETA, paleta);
    if (modo) localStorage.setItem(CHAVE_MODO, modo);
  } catch {
    /* localStorage indisponível (modo privado) — ignora */
  }
}

function sistemaPrefereDark() {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function ehTemaEscuro(modo) {
  const m = modo || "sistema";
  return m === "escuro" || (m === "sistema" && sistemaPrefereDark());
}

// Versão reativa: resolve o tema e re-renderiza quando o SO troca de esquema com
// o modo em "sistema". Sem isso a tela aberta ficaria mostrando as cores do tema
// anterior até alguém navegar.
export function useTemaEscuro(modo) {
  const [escuro, setEscuro] = React.useState(() => ehTemaEscuro(modo));
  React.useEffect(() => {
    setEscuro(ehTemaEscuro(modo));
    if ((modo || "sistema") !== "sistema" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setEscuro(ehTemaEscuro(modo));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [modo]);
  return escuro;
}
