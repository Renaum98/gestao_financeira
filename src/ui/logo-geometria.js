// logo-geometria.js — os números do logo, num lugar só.
//
// Quem desenha o logo são dois consumidores que não se falam: o componente da
// tela (ui/logo-animado.jsx) e o gerador dos PNGs do PWA
// (scripts/generate-icons.mjs). Enquanto o vetor vivia só no componente, mexer
// no desenho deixava os ícones do app para trás — foi exatamente o que
// aconteceu quando as barras ganharam o topo arredondado. Com os números aqui,
// mudar o logo muda os dois; o que sobra é rodar `npm run icons`.
//
// A geometria foi medida no logo.png original em resolução cheia, e o vetor
// bate com ele dentro de 0 a 2px em 1600 — não é um desenho aproximado.

export const LADO = 1600;

// Linha do meio da seta: cauda → vértice do "V" → dentro da ponta (o corte da
// haste fica escondido sob o triângulo, então os dois se fundem sem emenda).
export const HASTE = 'M212 978L713 1235L1270 728';
export const PONTA = 'M1411 599L1131 660L1324 874Z';

export const ESPESSURA = 115; // espessura da faixa da seta
export const RAIO = 56;       // topo das barras e cap da seta: o mesmo raio

export const COR_BARRA = '#721D78';
export const GRADIENTE = {
  // Roxo → magenta na diagonal. Os extremos param antes das pontas da seta (a
  // cauda e o bico são chapados no original), então o eixo começa e termina
  // fora da figura e o `pad` do gradiente faz o resto.
  x1: 681, y1: 272, x2: 1259, y2: 503,
  de: '#4C1765', ate: '#C3087D',
};

// As barras descem bem abaixo do necessário — quem decide o pé é a máscara.
export const BARRAS = [
  { x: 393, y: 750, largura: 178, altura: 700 },
  { x: 607, y: 510, largura: 180, altura: 940 },
  { x: 824, y: 298, largura: 178, altura: 1152 },
];

// Preto esconde: a faixa da seta engrossada (a haste mais o contorno branco dos
// dois lados) e todo o espaço abaixo dela. É o que dá às barras o pé diagonal,
// sem precisar calcular onde cada uma termina.
//
// São dois traços e não um só porque o contorno branco do original não tem a
// mesma espessura nos dois trechos: 43 na descida e 34.5 na subida. Com um
// valor único o pé das barras erra 4px de um lado e 6px do outro. Cada traço
// passa do vértice do "V" pra que a quina não fique com uma fresta entre eles.
export const MASCARA = {
  abaixo: 'M212 978L713 1235L1270 728L1600 728L1600 1600L0 1600L0 978Z',
  contorno: [
    { d: 'M212 978L829 1294', espessura: 201 },
    { d: 'M617 1323L1270 728', espessura: 184 },
  ],
};

// Quanto da largura da tela quadrada o desenho ocupa, centrado. É o
// enquadramento que os PNGs do PWA já tinham (76,25%) — mantido pra que os
// ícones novos fiquem do mesmo tamanho que os antigos na tela inicial.
export const OCUPACAO = 0.7625;
