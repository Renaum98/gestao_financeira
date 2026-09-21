// haptics.js — feedback tátil leve. Respeita "prefers-reduced-motion".
//
// Dois caminhos, porque não existe API única:
//   • Android/Chrome: Vibration API (`navigator.vibrate`).
//   • iOS/Safari: não tem `vibrate` e a Apple não vai expor. O que existe, a
//     partir do iOS 17.4, é o haptic nativo do `<input type="checkbox" switch>`
//     — ele dispara quando o switch alterna dentro de um gesto do usuário,
//     inclusive por `label.click()`. A gente mantém um switch invisível e o
//     alterna a cada `vibrar()`. É um truque; se a Apple fechar a porta, o
//     efeito só some, nada quebra.
//
// Por depender de gesto, `vibrar()` precisa ser chamado direto no handler do
// toque (onClick, onPointerUp) — num setTimeout ou depois de um await o iOS
// ignora.

const semMovimento =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const temVibrate = typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

// iPhone/iPad, incluindo o iPad que se apresenta como Mac (Safari desktop
// mode) — o que o diferencia de um Mac de verdade é ter toque.
const ehIOS =
  typeof navigator !== "undefined" &&
  (/iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

let gatilhoIOS = null;

// Cria (uma vez) o switch escondido. Fora do fluxo e sem pointer-events pra
// não atrapalhar layout nem foco; `display:none` não serve porque o Safari
// não alterna elemento que não renderiza.
function obterGatilhoIOS() {
  if (gatilhoIOS) return gatilhoIOS;
  if (typeof document === "undefined" || !document.body) return null;
  const label = document.createElement("label");
  label.setAttribute("aria-hidden", "true");
  label.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  input.tabIndex = -1;
  label.appendChild(input);
  document.body.appendChild(label);
  gatilhoIOS = label;
  return label;
}

export function vibrar(ms = 8) {
  if (semMovimento) return;
  try {
    if (temVibrate) {
      navigator.vibrate(ms);
      return;
    }
    // iOS não tem intensidade nem duração: é o toquezinho do switch, e só.
    if (ehIOS) obterGatilhoIOS()?.click();
  } catch {
    /* ignora — navegador sem suporte */
  }
}
