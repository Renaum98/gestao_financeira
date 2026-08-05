// logo-animado.jsx — o logo do app em vetor, com a animação de entrada.
//
// O desenho em si (pontos, cores, raios) mora em logo-geometria.js, que os
// ícones do PWA também usam — ver o porquê lá. Aqui fica só como ele vira SVG e
// o que ganha classe pra a animação (components.css).
//
// O que o PNG tem de raster virou três formas: as barras, a haste da seta —
// que é uma polilinha de espessura constante, e por isso vira um `stroke` em
// vez de um contorno fechado, o que deixa ela se desenhar sozinha com
// stroke-dashoffset, como os ícones da tab bar — e a ponta, um triângulo.
//
// No original um contorno branco separa a seta das barras. Aqui isso não é
// desenhado: a máscara recorta as barras na borda desse contorno e apaga tudo
// que fica abaixo da seta — o vão branco é o próprio fundo aparecendo, e nada
// precisa ser pintado por cima na ordem certa.

import React from 'react';
import {
  LADO, HASTE, PONTA, ESPESSURA, RAIO, COR_BARRA, GRADIENTE, BARRAS, MASCARA,
} from './logo-geometria.js';

export function LogoAnimado({ animar = true, titulo }) {
  // O useId do React 18 devolve algo como ":r0:", e dois-pontos em `url(#...)`
  // não é referência válida — some com eles antes de usar como id.
  const id = React.useId().replace(/:/g, '');
  const grad = `${id}-grad`;
  const corte = `${id}-corte`;
  const cls = (base) => (animar ? base : undefined);

  return (
    <svg
      viewBox={`0 0 ${LADO} ${LADO}`}
      className="logo-svg"
      role={titulo ? 'img' : 'presentation'}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      <defs>
        <linearGradient
          id={grad}
          gradientUnits="userSpaceOnUse"
          x1={GRADIENTE.x1} y1={GRADIENTE.y1} x2={GRADIENTE.x2} y2={GRADIENTE.y2}
        >
          <stop offset="0" stopColor={GRADIENTE.de} />
          <stop offset="1" stopColor={GRADIENTE.ate} />
        </linearGradient>

        <mask id={corte}>
          <rect width={LADO} height={LADO} fill="#fff" />
          <path d={MASCARA.abaixo} fill="#000" />
          {MASCARA.contorno.map((c) => (
            <path key={c.d} d={c.d} fill="none" stroke="#000" strokeWidth={c.espessura} />
          ))}
        </mask>
      </defs>

      {/* O rx arredonda os quatro cantos das barras, mas só os de cima
          aparecem: os de baixo ficam muito depois do corte da máscara. */}
      <g mask={`url(#${corte})`} fill={COR_BARRA}>
        {BARRAS.map((b, i) => (
          <rect
            key={b.x}
            className={cls(`logo-barra logo-barra-${i + 1}`)}
            x={b.x} y={b.y} width={b.largura} height={b.altura} rx={RAIO}
          />
        ))}
      </g>

      {/* Cauda e "V" arredondados no mesmo raio do topo das barras (RAIO é
          metade da espessura da faixa, que é justamente o raio do cap). A ponta
          continua em bico — é o bico que faz a seta apontar. O join redondo só
          afeta a quina de fora do "V"; a de dentro segue reta, então a máscara
          continua valendo. */}
      <path
        className={cls('logo-haste')}
        d={HASTE}
        fill="none"
        stroke={`url(#${grad})`}
        strokeWidth={ESPESSURA}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="100"
      />
      <path className={cls('logo-ponta')} d={PONTA} fill={`url(#${grad})`} />
    </svg>
  );
}
