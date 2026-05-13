// som.js — efeito sonoro curto gerado via Web Audio API (sem arquivos de áudio).

let ctx = null;

function getCtx() {
  try {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

// "Tick" curto e discreto — usado ao trocar de aba.
// Deve ser chamado a partir de um gesto do usuário (clique), senão o navegador bloqueia o áudio.
export function tocarClique() {
  if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
  const ac = getCtx();
  if (!ac) return;
  try {
    const t = ac.currentTime;
    const ganho = ac.createGain();
    ganho.connect(ac.destination);
    ganho.gain.setValueAtTime(0.0001, t);
    ganho.gain.exponentialRampToValueAtTime(0.05, t + 0.004);
    ganho.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

    const osc = ac.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(820, t);
    osc.frequency.exponentialRampToValueAtTime(330, t + 0.05);
    osc.connect(ganho);
    osc.start(t);
    osc.stop(t + 0.06);
  } catch {
    /* ignora — áudio indisponível */
  }
}
