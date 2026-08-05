// tema.js — resolve claro/escuro a partir da preferência salva.
//
// O modo guardado pode ser "claro", "escuro" ou "sistema"; nesse último caso
// quem manda é o prefers-color-scheme do SO. Vive aqui, e não no app.jsx, porque
// a tela de Aparência também precisa saber o tema ativo pra desenhar o seletor
// de cor com as cores que a paleta realmente vai render no tema atual.

import React from "react";

export function sistemaPrefereDark() {
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
