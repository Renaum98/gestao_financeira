// Gera os ícones PNG do PWA a partir de public/icon-source.svg (full-bleed, sem cantos).
// O iOS aplica sua própria máscara squircle no apple-touch-icon; por isso a arte precisa ir
// até a borda, sem transparência e sem cantos arredondados.
//
// Uso: node scripts/generate-icons.mjs

import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const src = readFileSync(join(root, 'public', 'icon-source.svg'));

const outputs = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-maskable-512.png', size: 512 },
];

for (const { name, size } of outputs) {
  await sharp(src, { density: 384 })
    .resize(size, size, { fit: 'cover' })
    .flatten({ background: '#6E4FF6' }) // sem transparência: evita borda branca no iOS
    .png({ compressionLevel: 9 })
    .toFile(join(root, 'public', name));
  console.log(`  ✓ public/${name} (${size}×${size})`);
}
