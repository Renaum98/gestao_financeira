// EstadoVazio.jsx — placeholder "Tudo em dia" quando não há notificações.

import { Icon } from '../../ui/icons.jsx';
import { Card } from '../../ui/common.jsx';
import { useT } from '../../lib/i18n.jsx';

export function EstadoVazio() {
  const t = useT();
  return (
    <div style={{ padding: '4px var(--pad-x) 0' }}>
      <Card style={{ padding: 28, textAlign: 'center' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            background: 'color-mix(in oklab, var(--primary) 14%, transparent)',
            margin: '0 auto 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="bell" size={26} color="var(--primary)" strokeWidth={2.2} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>{t('Tudo em dia')}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, marginTop: 6, lineHeight: 1.4 }}>
          {t('Sem contas a vencer nos próximos dias.')}
        </div>
      </Card>
    </div>
  );
}
