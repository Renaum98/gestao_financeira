// Gera o logo e os ícones PNG do PWA a partir do vetor (src/ui/logo-geometria.js),
// que é o mesmo desenho que a tela de login mostra. Rasterizar do vetor em vez de
// reamostrar um PNG antigo mantém o app inteiro com um logo só: mexeu no vetor,
// roda isso e os ícones acompanham.
//
// Tudo sai com fundo branco e sem transparência: o iOS não aplica fundo por trás
// do apple-touch-icon, e canto transparente vira preto lá.
//
// Uso: npm run icons

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  LADO, HASTE, PONTA, ESPESSURA, RAIO, COR_BARRA, GRADIENTE, BARRAS, MASCARA, OCUPACAO,
} from '../src/ui/logo-geometria.js';

const here = dirname(fileURLToPath(import.meta.url));
const publico = join(here, '..', 'public');

// Mesmo desenho do componente, montado como texto. `caixa` é o viewBox: o
// enquadramento muda entre a medição e o corte final, o resto não.
const svg = (caixa) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${caixa}">
  <defs>
    <linearGradient id="g" gradientUnits="userSpaceOnUse"
      x1="${GRADIENTE.x1}" y1="${GRADIENTE.y1}" x2="${GRADIENTE.x2}" y2="${GRADIENTE.y2}">
      <stop offset="0" stop-color="${GRADIENTE.de}"/>
      <stop offset="1" stop-color="${GRADIENTE.ate}"/>
    </linearGradient>
    <mask id="m">
      <rect x="-${LADO}" y="-${LADO}" width="${LADO * 3}" height="${LADO * 3}" fill="#fff"/>
      <path d="${MASCARA.abaixo}" fill="#000"/>
      ${MASCARA.contorno.map((c) => `<path d="${c.d}" fill="none" stroke="#000" stroke-width="${c.espessura}"/>`).join('\n      ')}
    </mask>
  </defs>
  <g mask="url(#m)" fill="${COR_BARRA}">
    ${BARRAS.map((b) => `<rect x="${b.x}" y="${b.y}" width="${b.largura}" height="${b.altura}" rx="${RAIO}"/>`).join('\n    ')}
  </g>
  <path d="${HASTE}" fill="none" stroke="url(#g)" stroke-width="${ESPESSURA}"
        stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${PONTA}" fill="url(#g)"/>
</svg>`;

// Onde o desenho começa e termina de fato. Medido em vez de calculado porque as
// pontas arredondadas da seta transbordam os pontos da linha do meio, e é o
// contorno visível que precisa ficar centrado.
const limites = async () => {
  const { data, info } = await sharp(Buffer.from(svg(`0 0 ${LADO} ${LADO}`)))
    .resize(LADO, LADO)
    .flatten({ background: '#ffffff' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let x0 = info.width, x1 = -1, y0 = info.height, y1 = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 3;
      if (data[i] > 234 && data[i + 1] > 234 && data[i + 2] > 234) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return { x0, x1, y0, y1 };
};

const { x0, x1, y0, y1 } = await limites();
const largura = x1 - x0 + 1;
const altura = y1 - y0 + 1;
// Tela quadrada em que o desenho ocupa OCUPACAO da largura, centrado nos dois eixos.
const tela = largura / OCUPACAO;
const caixa = `${x0 - (tela - largura) / 2} ${y0 - (tela - altura) / 2} ${tela} ${tela}`;

const saidas = [
  { name: 'logo.png', size: LADO },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  // Sem zona de segurança: hoje é uma cópia do icon-512, como sempre foi. O
  // Android recorta o maskable num círculo de 80% do lado, e com o desenho a
  // 76% as quinas ficam de fora. Pra valer como maskable ele precisaria de
  // OCUPACAO por volta de 0,62 — o que encolhe o logo na tela inicial.
  { name: 'icon-maskable-512.png', size: 512 },
];

for (const { name, size } of saidas) {
  await sharp(Buffer.from(svg(caixa)))
    .resize(size, size)
    .flatten({ background: '#ffffff' })
    .png({ compressionLevel: 9 })
    .toFile(join(publico, name));
  console.log(`  ✓ public/${name} (${size}×${size})`);
}
