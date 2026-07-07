// BannerPermissao.jsx — banner para ativar notificações nativas do sistema.

import { Icon } from '../../ui/icons.jsx';
import { useT } from '../../lib/i18n.jsx';

export function BannerPermissao({ permissao, onAtivar }) {
  const t = useT();
  return (
    <div style={{ padding: '4px 20px 0' }}>
      <div
        style={{
          padding: '14px 16px',
          borderRadius: 16,
          background:
            permissao === 'denied'
              ? 'var(--surface-sunken)'
              : 'color-mix(in oklab, var(--primary) 8%, var(--card))',
          border: '1px solid color-mix(in oklab, var(--primary) 18%, transparent)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="bell" size={18} color="#fff" strokeWidth={2.4} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>
            {permissao === 'denied' ? t('Notificações bloqueadas') : t('Receba lembretes no celular')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginTop: 2, lineHeight: 1.4 }}>
            {permissao === 'denied'
              ? t('Habilite nas configurações do navegador/sistema para receber lembretes.')
              : t('Avisamos quando uma conta estiver perto de vencer, mesmo com o app fechado.')}
          </div>
        </div>
        {permissao !== 'denied' && (
          <button
            onClick={onAtivar}
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
              color: '#fff',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
              flexShrink: 0,
              boxShadow: '0 4px 12px color-mix(in oklab, var(--primary) 28%, transparent)',
            }}
          >
            {t('Ativar')}
          </button>
        )}
      </div>
    </div>
  );
}
