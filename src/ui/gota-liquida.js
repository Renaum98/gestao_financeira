// gota-liquida.js — o deslize "líquido" do indicador da tab bar.
//
// A sensação de líquido não vem da curva do deslize, vem de as duas bordas não
// andarem juntas: a da frente puxa, a de trás vem a reboque. No meio do caminho
// a gota estica e, pra parecer que o volume se conserva, afina na altura; quando
// a borda de trás alcança, ela encolhe passando do ponto e assenta com a mola.
// Uma transição CSS move a caixa inteira de uma vez, então isso não sai em CSS —
// cada borda aqui é uma mola do anime.js, e a largura é a distância entre elas.
//
// A aparência e a deformação do canto (@keyframes nav-gota) continuam no CSS;
// daqui sai só a geometria: width e transform, escritos direto no elemento.
//
// O anime.js vem sob demanda (lib/anime.js). Até ele chegar, a gota cai na
// transição CSS de sempre do .nav-indicador.
import { anime, carregarAnime, semMovimento } from "../lib/anime.js";

// Borda que puxa: mais firme e rápida. Borda que vem atrás: mais solta, chega
// depois e é a que dá o balanço na chegada.
const FRENTE = { bounce: 0.25, duration: 320 };
const TRAS = { bounce: 0.45, duration: 520 };
// Sem pra onde ir (a bolha do dedo voltando ao formato da aba): as duas bordas
// abrem juntas, com um pouco de repique.
const NO_LUGAR = { bounce: 0.4, duration: 420 };

// Quanto a gota afina pra cada 100% que estica, e os limites — passar disso
// deixa de parecer líquido e vira um risco.
const ACHATA = 0.35;
const ACHATA_MIN = 0.78;
const INCHA_MAX = 1.08;

export function criarGota(el) {
  carregarAnime();
  const g = { l: 0, r: 0 };
  let base = 0; // largura de repouso contra a qual o esticão é medido; 0 = sem achatar
  let anims = [];
  let alvo = null;

  const pintar = () => {
    const w = Math.max(0, g.r - g.l);
    const estica = base ? w / base : 1;
    const sy = Math.min(INCHA_MAX, Math.max(ACHATA_MIN, 1 - (estica - 1) * ACHATA));
    el.style.width = `${w}px`;
    el.style.transform = `translateX(${g.l}px) scaleY(${sy})`;
  };

  const parar = () => {
    anims.forEach((a) => a.cancel());
    anims = [];
    alvo = null;
    el.classList.remove("is-escorrendo");
  };

  // Parte de onde a gota está de fato na tela, não de onde ela "devia" estar:
  // ela pode estar no meio da transição CSS do segurar ou de outra mola.
  const ler = () => {
    const cs = getComputedStyle(el);
    const x = new DOMMatrix(cs.transform).m41;
    g.l = x;
    g.r = x + (parseFloat(cs.width) || 0);
  };

  const colocar = (l, w) => {
    parar();
    g.l = l;
    g.r = l + w;
    base = w;
    pintar();
  };

  // Devolve true se começou um deslize — quem chama dispara a deformação do
  // canto junto. Pedir de novo o mesmo destino no meio do caminho não reinicia
  // nada (o arraste solta a gota e logo depois a troca de aba pede o mesmo).
  const escorrer = (l, w) => {
    if (alvo && alvo.l === l && alvo.w === w) return false;
    if (semMovimento()) {
      colocar(l, w);
      return false;
    }
    const lib = anime();
    if (!lib) {
      colocar(l, w); // sem a classe is-escorrendo, quem anima é a transição CSS
      return true;
    }
    const { animate, spring } = lib;
    parar();
    ler();
    const dir = Math.sign(l - g.l);
    base = dir ? w : 0;
    alvo = { l, w };
    // tira a transição CSS de transform/width: quem move agora são as molas
    el.classList.add("is-escorrendo");

    const [molaL, molaR] =
      dir > 0 ? [TRAS, FRENTE] : dir < 0 ? [FRENTE, TRAS] : [NO_LUGAR, NO_LUGAR];
    let faltam = 2;
    const fim = () => {
      if (--faltam) return;
      anims = [];
      alvo = null;
      el.classList.remove("is-escorrendo");
      // assenta no valor exato e sem achatamento residual
      g.l = l;
      g.r = l + w;
      base = w;
      pintar();
    };
    anims = [
      animate(g, { l, ease: spring(molaL), onRender: pintar, onComplete: fim }),
      animate(g, { r: l + w, ease: spring(molaR), onRender: pintar, onComplete: fim }),
    ];
    return true;
  };

  return { colocar, escorrer, parar };
}
