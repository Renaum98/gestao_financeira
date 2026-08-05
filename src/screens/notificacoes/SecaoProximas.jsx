// SecaoProximas.jsx — cobranças (recorrentes/parcelas) nos próximos 7 dias.

import { MESES_CURTO, fmtBRL } from '../../data.js';
import { Card } from '../../ui/common.jsx';
import { COR_NEG } from '../../lib/colors.js';
import { NotifItem, Secao } from './parts.jsx';
import { diasAte, rotuloPrazoT } from './utils.js';
import { useT } from '../../lib/i18n.jsx';

export function SecaoProximas({ proximas, ehLida, marcarLida }) {
  const t = useT();
  if (proximas.length === 0) return null;

  return (
    <Secao titulo={t("Próximas a vencer")} subtitulo={t("Cobranças nos próximos 7 dias")}>
      <Card style={{ padding: '4px 16px' }}>
        {proximas.map((tx, i) => {
          const [, mm, dd] = tx.data.split('-').map(Number);
          const n = diasAte(tx.data);
          const urgente = n <= 3 && !ehLida(tx.id);
          return (
            <NotifItem
              key={tx.id}
              primeiro={i === 0}
              lida={ehLida(tx.id)}
              onClick={() => marcarLida(tx.id)}
              leading={
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: urgente
                      ? `color-mix(in oklab, ${COR_NEG} 12%, transparent)`
                      : 'var(--surface-sunken)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: urgente ? COR_NEG : 'var(--ink)',
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {dd}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: urgente ? COR_NEG : 'var(--muted)',
                      marginTop: 2,
                      textTransform: 'uppercase',
                    }}
                  >
                    {t(MESES_CURTO[mm - 1])}
                  </div>
                </div>
              }
              titulo={tx.descricao}
              subtituloCor={urgente ? COR_NEG : undefined}
              subtitulo={
                <>
                  {rotuloPrazoT(t, n)}
                  <span style={{ opacity: 0.5 }}>·</span>
                  {tx.parcelas ? t('Parcela {atual}/{total}', { atual: tx.parcelas.atual, total: tx.parcelas.total }) : t('Mensal')}
                </>
              }
              trailing={
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                  {fmtBRL(tx.valor)}
                </div>
              }
            />
          );
        })}
      </Card>
    </Secao>
  );
}
