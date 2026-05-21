// SecaoRecorrencias.jsx — recorrências sem cobrança gerada para o próximo mês.

import React from 'react';
import { CATEGORIAS, MESES_CURTO, fmtBRL } from '../../data.js';
import { CatChip } from '../../ui/icons.jsx';
import { Card } from '../../ui/common.jsx';
import { NotifItem, Secao, LinkAcao } from './parts.jsx';

export function SecaoRecorrencias({ recsRevisar, ocultar, irPara, ehLida, marcarLida }) {
  if (recsRevisar.length === 0) return null;

  return (
    <Secao
      titulo="Recorrências para revisar"
      subtitulo="Cobranças não geradas para o próximo mês. Cancele ou continue."
      acao={<LinkAcao onClick={() => irPara('recorrentes')}>Gerenciar →</LinkAcao>}
    >
      <Card style={{ padding: '4px 16px' }}>
        {recsRevisar.map((r, i) => {
          const cat = CATEGORIAS[r.categoria] || CATEGORIAS.outros;
          const [ay, am] = (r.ultimoMesGerado || '').split('-');
          const ultimo = ay && am ? `${MESES_CURTO[parseInt(am, 10) - 1]}/${ay.slice(2)}` : '—';
          return (
            <NotifItem
              key={r.id}
              primeiro={i === 0}
              lida={ehLida(r.id)}
              onClick={() => marcarLida(r.id)}
              leading={<CatChip catId={r.categoria} size={42} />}
              titulo={r.descricao}
              subtitulo={`${cat.nome} · última cobrança em ${ultimo}`}
              trailing={
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                  {fmtBRL(r.valor, ocultar)}
                </div>
              }
            />
          );
        })}
      </Card>
    </Secao>
  );
}
