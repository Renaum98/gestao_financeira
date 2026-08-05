// SecaoOrcamento.jsx — alertas das categorias com orçamento estourado ou perto
// do limite.

import { CATEGORIAS, fmtBRL } from '../../data.js';
import { CatChip } from '../../ui/icons.jsx';
import { Card } from '../../ui/common.jsx';
import { COR_NEG, COR_AVISO } from '../../lib/colors.js';
import { NotifItem, Secao, LinkAcao } from './parts.jsx';
import { useT } from '../../lib/i18n.jsx';

export function SecaoOrcamento({ orcEstourados, orcProximos, irPara, ehLida, marcarLida }) {
  const t = useT();
  if (orcEstourados.length === 0 && orcProximos.length === 0) return null;

  return (
    <Secao
      titulo={t("Orçamento por categoria")}
      subtitulo={t("Alertas das categorias com orçamento definido")}
      acao={<LinkAcao onClick={() => irPara('orcamentos')}>{t("Ajustar →")}</LinkAcao>}
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
              titulo={estourou ? t('{cat} estourou o orçamento', { cat: t(cat.nome) }) : t('{cat} chegando ao limite', { cat: t(cat.nome) })}
              subtituloCor={cor}
              subtitulo={
                <>
                  {t('{gasto} de {orc}', { gasto: fmtBRL(a.gasto), orc: fmtBRL(a.orc) })}
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
