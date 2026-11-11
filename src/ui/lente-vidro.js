// lente-vidro.js — a refração do Liquid Glass na tab bar (em teste).
//
// No vidro da Apple, o que passa por trás de uma barra de vidro entorta nas
// beiradas, como numa lente grossa. É isso que dá a sensação de "paralaxe"
// quando a lista rola por baixo: um texto que encosta na borda já começa a se
// esticar e curvar ali, no instante em que a borda o toca.
//
// Na web isso sai de um filtro SVG de deslocamento usado DENTRO do
// backdrop-filter (`backdrop-filter: url(#lente) …`). O filtro lê um mapa — uma
// imagem do tamanho exato do elemento em que cada pixel diz de onde buscar o
// fundo naquele ponto (vermelho = eixo x, verde = eixo y, 128 = parado). O mapa
// é gerado aqui num canvas a partir do contorno arredondado. Se o elemento muda
// de tamanho, o mapa é refeito.
//
// O perfil da lente (ver `gerarMapa`): numa faixa junto da borda, o ponto a uma
// distância d da borda mostra o fundo que está a f(d) = faixa·(d/faixa)^CURVA,
// mais pra dentro. f(0) = 0 e f(faixa) = faixa, então o deslocamento é zero
// exatamente na borda e no fim da faixa — sem degrau em nenhum dos dois —, e
// como f cresce rápido no começo, a tirinha de fundo colada na borda se
// espalha pela faixa inteira. A primeira versão puxava o fundo com força
// máxima bem na borda: o que estava fora da barra e o que aparecia logo
// dentro não batiam, e um texto cruzando a borda aparecia cortado, com um
// degrau, em vez de dobrar.
//
// É a mesma técnica das bibliotecas (liquid-glass-react e afins); fazemos aqui
// porque elas embrulham o conteúdo num componente próprio e controlam o
// ponteiro, o que brigaria com a gota da tab bar.
//
// Só onde funciona: backdrop-filter com url() de filtro SVG só existe nos
// navegadores Chromium (Chrome, Edge, Chrome do Android). No Safari — inclusive
// todo navegador do iPhone, que por baixo é Safari — e no Firefox a barra fica
// com o vidro fosco de sempre. No modo leve também: o filtro é refeito a cada
// quadro de rolagem, e é exatamente esse custo que o modo leve existe pra tirar.
import { modoLeve } from "../lib/anime.js";

// Largura da faixa da borda que entorta, em px (padrão da barra).
const PADRAO = { borda: 30 };
// Expoente do perfil f(d): quanto menor, mais a tirinha da borda se espalha
// (curva mais forte). 1 seria nenhum efeito.
const CURVA = 0.4;
// Maior deslocamento do perfil, em fração da faixa: o máximo de x^CURVA − x.
const PICO = (() => {
  const x = CURVA ** (1 / (1 - CURVA));
  return x ** CURVA - x;
})();
// Mudando de tamanho a cada quadro (a gota esticando nas molas), o mapa não é
// refeito a cada quadro: o filtro estica o mapa que já tem e um novo só é
// desenhado quando o tamanho para de mudar por esse tempo.
const REFAZER_MAPA_MS = 120;

const NS = "http://www.w3.org/2000/svg";
let contador = 0;

// Chromium se identifica pelo userAgentData (o Chrome do iPhone não, porque é
// Safari por dentro — e é bom que não, ele não tem o recurso).
export function lenteSuportada() {
  const marcas = navigator.userAgentData?.brands;
  return !!marcas?.some((m) => m.brand === "Chromium");
}

// Mapa de deslocamento de um retângulo arredondado w×h com raio r. `alcance` é
// o deslocamento que vale 127 no mapa (o feDisplacementMap anda até scale/2).
function gerarMapa(w, h, r, borda, alcance) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(w, h);
  const px = img.data;
  const mw = w / 2;
  const mh = h / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x + 0.5 - mw;
      const dy = y + 0.5 - mh;
      // Distância até a borda do retângulo arredondado (SDF), positiva dentro.
      const qx = Math.abs(dx) - (mw - r);
      const qy = Math.abs(dy) - (mh - r);
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const fora = Math.hypot(ox, oy);
      const dentro = -(fora + Math.min(Math.max(qx, qy), 0) - r);
      // Normal da borda mais próxima, apontando pra fora.
      let nx;
      let ny;
      if (qx > 0 && qy > 0 && fora > 0) {
        nx = ox / fora;
        ny = oy / fora;
      } else if (qx > qy) {
        nx = 1;
        ny = 0;
      } else {
        nx = 0;
        ny = 1;
      }
      nx *= Math.sign(dx) || 1;
      ny *= Math.sign(dy) || 1;
      // Perfil da lente: o ponto a `dentro` px da borda mostra o fundo a
      // f(dentro) px dela; o deslocamento é a diferença, pra dentro.
      let m = 0;
      if (dentro > 0 && dentro < borda) {
        const f = borda * (dentro / borda) ** CURVA;
        m = Math.min((f - dentro) / alcance, 1);
      }
      // Busca o fundo mais pra dentro (contra a normal).
      const i = (y * w + x) * 4;
      px[i] = 128 - 127 * nx * m;
      px[i + 1] = 128 - 127 * ny * m;
      px[i + 2] = 128;
      px[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

// Liga a lente num elemento (a barra de vidro ou a gota da aba ativa). O
// filtro em si entra pelo CSS, via `--lente`. Devolve a limpeza.
export function criarLente(el, opcoes = {}) {
  const { borda } = { ...PADRAO, ...opcoes };
  const alcance = Math.ceil(PICO * borda) + 1;
  if (!el || !lenteSuportada() || modoLeve()) return () => {};

  const id = `lente-vidro-${++contador}`;
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.style.position = "absolute";
  const filtro = document.createElementNS(NS, "filter");
  filtro.setAttribute("id", id);
  filtro.setAttribute("filterUnits", "userSpaceOnUse");
  filtro.setAttribute("color-interpolation-filters", "sRGB");
  filtro.setAttribute("x", "0");
  filtro.setAttribute("y", "0");
  const mapa = document.createElementNS(NS, "feImage");
  mapa.setAttribute("x", "0");
  mapa.setAttribute("y", "0");
  mapa.setAttribute("preserveAspectRatio", "none");
  mapa.setAttribute("result", "mapa");
  const deslocar = document.createElementNS(NS, "feDisplacementMap");
  deslocar.setAttribute("in", "SourceGraphic");
  deslocar.setAttribute("in2", "mapa");
  deslocar.setAttribute("scale", String(alcance * 2));
  deslocar.setAttribute("xChannelSelector", "R");
  deslocar.setAttribute("yChannelSelector", "G");
  filtro.append(mapa, deslocar);
  svg.append(filtro);
  document.body.append(svg);

  let w = 0;
  let h = 0;
  let espera = 0;
  const desenhar = () => {
    espera = 0;
    // Raio em % (a gota redonda usa 50%) vale sobre o lado menor.
    const raio = getComputedStyle(el).borderTopLeftRadius;
    const r0 = raio.endsWith("%") ? (parseFloat(raio) / 100) * Math.min(w, h) : parseFloat(raio) || 0;
    const r = Math.min(r0, h / 2, w / 2);
    mapa.setAttribute("href", gerarMapa(w, h, r, borda, alcance));
  };
  const medir = () => {
    const nw = Math.round(el.offsetWidth);
    const nh = Math.round(el.offsetHeight);
    if (!nw || !nh || (nw === w && nh === h)) return;
    const primeiro = !w;
    w = nw;
    h = nh;
    for (const no of [filtro, mapa]) {
      no.setAttribute("width", String(w));
      no.setAttribute("height", String(h));
    }
    if (primeiro) return desenhar();
    clearTimeout(espera);
    espera = setTimeout(desenhar, REFAZER_MAPA_MS);
  };
  medir();
  const ro = new ResizeObserver(medir);
  ro.observe(el);

  // O filtro entra pelo CSS (`.vidro-lente`), pra o modo leve conseguir
  // desligá-lo por cima se for ligado com o app aberto.
  el.style.setProperty("--lente", `url(#${id})`);
  el.classList.add("vidro-lente");

  return () => {
    clearTimeout(espera);
    ro.disconnect();
    el.classList.remove("vidro-lente");
    el.style.removeProperty("--lente");
    svg.remove();
  };
}
