// LinhaPush.jsx — linha discreta, abaixo do TopBar, que aparece quando este
// aparelho está assinado pra push: diz que os lembretes chegam com o app
// fechado e oferece um teste. O teste existe porque o cron manda uma vez por
// dia — sem ele, saber se o push funciona seria esperar até amanhã.

import React from 'react';
import { Icon } from '../../ui/icons.jsx';
import { useT, useLang } from '../../lib/i18n.jsx';
import { sincronizarPush, enviarPushDeTeste } from '../../lib/push.js';
import { COR_NEG } from '../../lib/colors.js';

export function LinhaPush({ permissao }) {
  const t = useT();
  const lang = useLang();
  const [ativo, setAtivo] = React.useState(false);
  // 'idle' | 'enviando' | 'ok' | 'erro'
  const [teste, setTeste] = React.useState('idle');

  // `sincronizarPush`, e não uma consulta direta à assinatura: logo depois
  // de conceder a permissão a assinatura ainda está sendo criada (pelo
  // disparo local), e a chamada aqui é o mesmo memo — espera terminar.
  React.useEffect(() => {
    let vivo = true;
    sincronizarPush().then((id) => {
      if (vivo) setAtivo(!!id);
    });
    return () => {
      vivo = false;
    };
  }, [permissao]);

  // O "Enviado"/"Falhou" some sozinho depois de um instante.
  React.useEffect(() => {
    if (teste !== 'ok' && teste !== 'erro') return;
    const id = setTimeout(() => setTeste('idle'), 4000);
    return () => clearTimeout(id);
  }, [teste]);

  if (!ativo) return null;

  const testar = async () => {
    if (teste === 'enviando') return;
    setTeste('enviando');
    const r = await enviarPushDeTeste(lang);
    setTeste(r && r.enviadas > 0 ? 'ok' : 'erro');
  };

  const rotulo =
    teste === 'enviando' ? t('Enviando…')
    : teste === 'ok' ? t('Enviado')
    : teste === 'erro' ? t('Falhou')
    : t('Testar');

  return (
    <div
      style={{
        padding: '4px var(--pad-x) 0',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        color: 'var(--muted)',
        fontWeight: 600,
      }}
    >
      <Icon name="bell" size={14} color="var(--primary)" strokeWidth={2.4} />
      <span style={{ flex: 1, minWidth: 0 }}>{t('Lembretes por push ativos neste aparelho')}</span>
      <button
        onClick={testar}
        disabled={teste === 'enviando'}
        style={{
          background: 'none',
          border: 'none',
          padding: '4px 0',
          color: teste === 'erro' ? COR_NEG : 'var(--primary)',
          fontSize: 12,
          fontWeight: 800,
          cursor: teste === 'enviando' ? 'default' : 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {rotulo}
      </button>
    </div>
  );
}
