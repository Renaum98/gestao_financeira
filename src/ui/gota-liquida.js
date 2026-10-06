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

// Seguindo o dedo no arraste. Aqui o alvo muda a cada pointermove, e reiniciar
// uma animação a cada evento jogaria fora a velocidade que a gota já tinha — o
// movimento sairia aos trancos. Então cada borda é uma mola integrada quadro a
// quadro, que só troca de alvo e continua com o embalo que tinha.
// k = rigidez, c = amortecimento. A frente quase crítica (2√k ≈ 60) vai firme;
// a de trás, solta e abaixo do crítico (2√k ≈ 39), atrasa e balança.
const DEDO_FRENTE = { k: 900, c: 48 };
const DEDO_TRAS = { k: 380, c: 24 };
const ACHATA_MIN = 0.78;
const INCHA_MAX = 1.08;

export function criarGota(el) {
  carregarAnime();
  const g = { l: 0, r: 0 };
  let base = 0; // largura de repouso contra a qual o esticão é medido; 0 = sem achatar
  let anims = [];
  let alvo = null;
  let segue = null; // { tl, tr, vl, vr, t, raf, soltando } enquanto segue o dedo e ao soltar

  const pintar = () => {
    const w = Math.max(0, g.r - g.l);
    const estica = base ? w / base : 1;
    const sy = Math.min(INCHA_MAX, Math.max(ACHATA_MIN, 1 - (estica - 1) * ACHATA));
    el.style.width = `${w}px`;
    el.style.transform = `translateX(${g.l}px) scaleY(${sy})`;
  };

  const parar = () => {
    if (segue) {
      cancelAnimationFrame(segue.raf);
      segue = null;
    }
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

  const passoDedo = (agora) => {
    const s = segue;
    if (!s) return;
    const dt = Math.min(0.032, Math.max(0, (agora - s.t) / 1000));
    s.t = agora;
    // a borda do lado pra onde a gota está indo é a da frente
    const indo = Math.sign((s.tl + s.tr) / 2 - (g.l + g.r) / 2);
    const [mL, mR] = indo < 0 ? [DEDO_FRENTE, DEDO_TRAS] : indo > 0 ? [DEDO_TRAS, DEDO_FRENTE] : [DEDO_FRENTE, DEDO_FRENTE];
    s.vl += (mL.k * (s.tl - g.l) - mL.c * s.vl) * dt;
    s.vr += (mR.k * (s.tr - g.r) - mR.c * s.vr) * dt;
    g.l += s.vl * dt;
    g.r += s.vr * dt;
    // soltou o dedo e as duas bordas assentaram: crava no encaixe e encerra
    if (
      s.soltando &&
      Math.abs(s.tl - g.l) < 0.5 && Math.abs(s.tr - g.r) < 0.5 &&
      Math.abs(s.vl) < 12 && Math.abs(s.vr) < 12
    ) {
      const l = s.tl;
      const w = s.tr - s.tl;
      segue = null;
      alvo = null;
      el.classList.remove("is-escorrendo");
      g.l = l;
      g.r = l + w;
      base = w;
      pintar();
      return;
    }
    pintar();
    s.raf = requestAnimationFrame(passoDedo);
  };

  // Gota (já bolha, de diâmetro d) indo atrás do dedo. Chamado a cada
  // pointermove; só o primeiro liga o laço, os outros trocam o alvo. Termina no
  // escorrer/colocar/parar seguinte, que é o que o soltar do dedo chama.
  const seguir = (centro, d) => {
    if (semMovimento()) {
      colocar(centro - d / 2, d);
      return;
    }
    if (segue) {
      segue.tl = centro - d / 2;
      segue.tr = centro + d / 2;
      return;
    }
    parar();
    ler();
    base = d;
    el.classList.add("is-escorrendo");
    segue = { tl: centro - d / 2, tr: centro + d / 2, vl: 0, vr: 0, t: performance.now(), raf: 0 };
    segue.raf = requestAnimationFrame(passoDedo);
  };

  // O dedo soltou: em vez de recomeçar outra animação (que partiria do repouso
  // e cortaria o embalo do arraste), as mesmas molas do seguir só trocam o alvo
  // pro encaixe da aba e levam a gota até lá, abrindo da bolha pro formato dela.
  // Sem arraste em curso, cai no escorrer de sempre.
  const soltar = (l, w) => {
    if (!segue) return escorrer(l, w);
    segue.tl = l;
    segue.tr = l + w;
    segue.soltando = true;
    base = w;
    // a troca de aba logo depois pede o mesmo destino ao escorrer: não reinicia
    alvo = { l, w };
    return true;
  };

  return { colocar, escorrer, seguir, soltar, parar };
}
