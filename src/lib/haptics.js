// haptics.js — feedback tátil leve. Respeita "prefers-reduced-motion".
//
// Dois caminhos, porque não existe API única:
//   • Android/Chrome: Vibration API (`navigator.vibrate`).
//   • iOS/Safari: não tem `vibrate` e a Apple não vai expor. O que existe, a
//     partir do iOS 17.4, é o haptic nativo do `<input type="checkbox" switch>`
//     — ele dispara quando o switch alterna dentro de um gesto do usuário,
//     inclusive por `label.click()`. A cada `vibrar()` a gente cria um switch
//     escondido, clica e tira — o mesmo jeito da lib `ios-haptics`. Um switch
//     fixo, sempre na página, não deu toque nenhum no iPhone. É um truque; se a
//     Apple fechar a porta, o efeito só some, nada quebra.
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

// Switch novo a cada toque, no <head> e com display:none: não entra no layout,
// no foco nem no leitor de tela, e some logo depois do clique.
function toqueIOS() {
  if (typeof document === "undefined" || !document.head) return;
  const label = document.createElement("label");
  label.setAttribute("aria-hidden", "true");
  label.style.display = "none";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  label.appendChild(input);
  document.head.appendChild(label);
  label.click();
  document.head.removeChild(label);
}

export function vibrar(ms = 8) {
  if (semMovimento) return;
  try {
    if (temVibrate) {
      navigator.vibrate(ms);
      return;
    }
    // iOS não tem intensidade nem duração: é o toquezinho do switch, e só.
    if (ehIOS) toqueIOS();
  } catch {
    /* ignora — navegador sem suporte */
  }
}
