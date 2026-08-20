// desktop.js — a única fonte da verdade sobre "isto é desktop".
//
// O corte é decidido aqui, em JS, e não em @media espalhada pelo CSS: com duas
// fontes de verdade o mobile acaba pegando regra de desktop na virada de um
// breakpoint que ninguém lembrava de sincronizar. Quem precisa decidir em CSS
// usa `.desktop-shell` (no <main>) ou `.em-desktop` (no <html>, para o que é
// portalizado em document.body — modais e o botão de voltar).

import React from "react";

const CONSULTA = "(min-width: 900px)";

export function useEhDesktop() {
  const [ehDesktop, setEhDesktop] = React.useState(
    () => typeof window !== "undefined" && window.matchMedia(CONSULTA).matches,
  );
  React.useEffect(() => {
    const mq = window.matchMedia(CONSULTA);
    const handler = (e) => setEhDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  // Idempotente: vários componentes podem usar o hook e todos escrevem o mesmo.
  React.useEffect(() => {
    document.documentElement.classList.toggle("em-desktop", ehDesktop);
  }, [ehDesktop]);
  return ehDesktop;
}
