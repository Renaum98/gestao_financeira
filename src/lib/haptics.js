// haptics.js — feedback tátil leve (Vibration API).
// Funciona no Android/Chrome; iOS/Safari não suporta e simplesmente ignora.
// Respeita "prefers-reduced-motion".

const semMovimento =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function vibrar(ms = 8) {
  if (semMovimento) return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* ignora — navegador sem suporte */
  }
}
