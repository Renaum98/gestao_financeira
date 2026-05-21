// SecaoTerminando.jsx — parcelamentos na última parcela (liberam orçamento).

import React from 'react';
import { fmtBRL } from '../../data.js';
import { CatChip } from '../../ui/icons.jsx';
import { Card } from '../../ui/common.jsx';
import { COR_POS } from '../../lib/colors.js';
import { NotifItem, Secao } from './parts.jsx';
import { diasAte, rotuloPrazo } from './utils.js';

export function SecaoTerminando({ terminando, ocultar, ehLida, marcarLida }) {
  if (terminando.length === 0) return null;

  return (
    <Secao titulo="Parcelamentos terminando" subtitulo="Em breve liberam espaço no seu orçamento">
      <Card style={{ padding: '4px 16px' }}>
        {terminando.map((tx, i) => {
          const n = diasAte(tx.data);
          return (
            <NotifItem
              key={tx.id}
              primeiro={i === 0}
              lida={ehLida(tx.id)}
              onClick={() => marcarLida(tx.id)}
              leading={<CatChip catId={tx.categoria} size={42} />}
              titulo={tx.descricao}
              subtitulo={
                <>
                  Última parcela {rotuloPrazo(n).toLowerCase()} · {tx.parcelas.total}×{' '}
                  {fmtBRL(tx.parcelas.valorTotal, ocultar)}
                </>
              }
              trailing={
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: COR_POS,
                    background: `color-mix(in oklab, ${COR_POS} 14%, transparent)`,
                    padding: '4px 8px',
                    borderRadius: 8,
                    letterSpacing: '-0.01em',
                    flexShrink: 0,
                  }}
                >
                  {tx.parcelas.atual}/{tx.parcelas.total}
                </div>
              }
            />
          );
        })}
      </Card>
    </Secao>
  );
}
