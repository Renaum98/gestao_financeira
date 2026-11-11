// vidro-formas.js — o movimento das formas atrás do card de saldo em vidro.
//
// Cada forma tem um estado (posição, escala, giro e os 8 raios do contorno) e,
// a cada trecho, sorteia um estado novo e vai até ele com uma curva suave. Os
// raios mudando separados é o que deforma o contorno: a forma deixa de ser
// círculo e passa a ondular como uma ameba. Ao chegar, sorteia o próximo, então
// o movimento nunca se repete.
//
// O anime.js anima um objeto simples com os números, e o onUpdate escreve
// transform e border-radius na forma. Assim não dependemos de ele interpolar
// strings com vários números (os 8 raios).
//
// Só o card do centro do carrossel anima. Os vizinhos ficam parados onde
// estavam e continuam dali quando chegam ao centro — sem salto. Quem diz qual é
// o do centro é a classe `carrossel-saldo__face--ativa` na face (escrita em
// CarrosselSaldoMes); fora do carrossel (desktop) o card é o único e anima
// sempre.
//
// O anime.js vem sob demanda (lib/anime.js); até ele chegar, as formas ficam
// paradas no contorno inicial. No modo leve as formas nem aparecem
// (components.css) e o anime.js nem é pedido; com "reduzir movimento" no
// sistema elas ficam paradas.
import { anime, carregarAnime, modoLeve, semMovimento } from "../lib/anime.js";

// Quanto cada forma pode se afastar da origem, em fração do próprio tamanho.
const DESLOCA = 0.28;
const ESCALA = [0.85, 1.15];
const GIRO = 40; // graus, pra cada lado
const RAIO = [28, 72]; // % de cada um dos 8 raios
// Cada trecho dura entre 6 e 11 s: devagar o bastante pra não chamar atenção.
const DURACAO = [6000, 11000];

const sortear = (min, max) => min + Math.random() * (max - min);

const estadoNovo = () => ({
  x: sortear(-DESLOCA, DESLOCA),
  y: sortear(-DESLOCA, DESLOCA),
  s: sortear(...ESCALA),
  g: sortear(-GIRO, GIRO),
  r0: sortear(...RAIO), r1: sortear(...RAIO), r2: sortear(...RAIO), r3: sortear(...RAIO),
  r4: sortear(...RAIO), r5: sortear(...RAIO), r6: sortear(...RAIO), r7: sortear(...RAIO),
});

function pintar(el, e) {
  const w = el.offsetWidth;
  el.style.transform =
    `translate(${(e.x * w).toFixed(1)}px, ${(e.y * w).toFixed(1)}px) ` +
    `rotate(${e.g.toFixed(1)}deg) scale(${e.s.toFixed(3)})`;
  el.style.borderRadius =
    `${e.r0.toFixed(1)}% ${e.r1.toFixed(1)}% ${e.r2.toFixed(1)}% ${e.r3.toFixed(1)}% / ` +
    `${e.r4.toFixed(1)}% ${e.r5.toFixed(1)}% ${e.r6.toFixed(1)}% ${e.r7.toFixed(1)}%`;
}

// Liga o movimento nas formas de um card em vidro. Devolve a função de limpeza.
export function iniciarFormas(container) {
  if (!container || modoLeve()) return () => {};
  const formas = [...container.querySelectorAll(".card-vidro__forma")];
  // Cada forma já nasce num contorno sorteado, parada: mesmo sem movimento
  // (ou antes do anime.js chegar) o fundo não é um punhado de círculos.
  const estados = formas.map((el) => {
    const e = estadoNovo();
    pintar(el, e);
    return e;
  });
  if (semMovimento()) return () => {};

  const face = container.closest(".carrossel-saldo__face");
  const ativo = () => !face || face.classList.contains("carrossel-saldo__face--ativa");

  let vivo = true;
  const anims = new Map(); // forma → trecho em andamento
  const esperando = new Set(); // formas que pararam entre trechos fora do centro

  const passo = (el, i) => {
    if (!vivo) return;
    const lib = anime();
    if (!lib || !ativo()) {
      esperando.add(i);
      return;
    }
    anims.set(
      el,
      lib.animate(estados[i], {
        ...estadoNovo(),
        duration: sortear(...DURACAO),
        ease: "inOutSine",
        onUpdate: () => pintar(el, estados[i]),
        onComplete: () => passo(el, i),
      }),
    );
  };

  carregarAnime()
    .then(() => {
      if (vivo) formas.forEach(passo);
    })
    .catch(() => {});

  // Card saiu ou chegou ao centro: pausa ou retoma os trechos em andamento, e
  // dá a partida nas formas que tinham parado entre um trecho e outro.
  let obs = null;
  if (face) {
    obs = new MutationObserver(() => {
      const a = ativo();
      anims.forEach((an) => (a ? an.play() : an.pause()));
      if (a) {
        const fila = [...esperando];
        esperando.clear();
        fila.forEach((i) => passo(formas[i], i));
      }
    });
    obs.observe(face, { attributes: true, attributeFilter: ["class"] });
  }

  return () => {
    vivo = false;
    obs?.disconnect();
    anims.forEach((an) => an.pause());
    anims.clear();
  };
}
