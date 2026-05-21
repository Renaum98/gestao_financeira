// SecaoOrcamento.jsx — alertas das categorias com orçamento estourado ou perto
// do limite.

import React from 'react';
import { CATEGORIAS, fmtBRL } from '../../data.js';
import { CatChip } from '../../ui/icons.jsx';
import { Card } from '../../ui/common.jsx';
import { COR_NEG, COR_AVISO } from '../../lib/colors.js';
import { NotifItem, Secao, LinkAcao } from './parts.jsx';

export function SecaoOrcamento({ orcEstourados, orcProximos, ocultar, irPara, ehLida, marcarLida }) {
  if (orcEstourados.length === 0 && orcProximos.length === 0) return null;

  return (
    <Secao
      titulo="Orçamento por categoria"
      subtitulo="Alertas das categorias com orçamento definido"
      acao={<LinkAcao onClick={() => irPara('orcamentos')}>Ajustar →</LinkAcao>}
    >
      <Card style={{ padding: '4px 16px' }}>
        {[...orcEstourados, ...orcProximos].map((a, i) => {
          const cat = CATEGORIAS[a.catId] || CATEGORIAS.outros;
          const estourou = a.pct > 100;
          const cor = estourou ? COR_NEG : COR_AVISO;
          return (
            <NotifItem
              key={a.id}
              primeiro={i === 0}
              lida={ehLida(a.id)}
              onClick={() => marcarLida(a.id)}
              leading={<CatChip catId={a.catId} size={42} />}
              titulo={estourou ? `${cat.nome} estourou o orçamento` : `${cat.nome} chegando ao limite`}
              subtituloCor={cor}
              subtitulo={
                <>
                  {fmtBRL(a.gasto, ocultar)} de {fmtBRL(a.orc, ocultar)}
                  <span style={{ opacity: 0.5, padding: '0 4px' }}>·</span>
                  {Math.round(a.pct)}%
                </>
              }
              trailing={
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: cor,
                    background: `color-mix(in oklab, ${cor} 14%, transparent)`,
                    padding: '4px 8px',
                    borderRadius: 8,
                    flexShrink: 0,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {Math.round(a.pct)}%
                </div>
              }
            />
          );
        })}
      </Card>
    </Secao>
  );
}
