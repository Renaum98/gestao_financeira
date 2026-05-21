// ConviteItem.jsx — convite de conta compartilhada com botões aceitar/recusar.

import React from 'react';
import { COR_NEG } from '../../lib/colors.js';
import { aceitarConvite, recusarConvite } from '../../lib/partnership.js';

export function ConviteItem({ convite, meuUid, meuNome, meuEmail, primeiro }) {
  const [acao, setAcao] = React.useState(null); // 'aceitando' | 'recusando' | null
  const [erro, setErro] = React.useState('');
  const inicial = (convite.fromNome?.trim()[0] || '?').toUpperCase();

  const aceitar = async () => {
    setErro('');
    setAcao('aceitando');
    try {
      await aceitarConvite({ invite: convite, meuUid, meuNome, meuEmail });
      // O onSnapshot remove o convite da lista automaticamente.
    } catch (err) {
      setErro(err?.message || 'Não foi possível aceitar.');
      setAcao(null);
    }
  };

  const recusar = async () => {
    setErro('');
    setAcao('recusando');
    try {
      await recusarConvite(convite.id);
    } catch (err) {
      setErro('Não foi possível recusar.');
      setAcao(null);
    }
  };

  const ocupado = acao !== null;

  return (
    <div style={{ padding: '14px 0', borderTop: primeiro ? 'none' : '1px solid var(--linha)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            flexShrink: 0,
          }}
        >
          {inicial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--ink)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {convite.fromNome || 'Alguém'} te convidou
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--muted)',
              fontWeight: 600,
              marginTop: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {convite.fromEmail || 'Conta compartilhada'}
          </div>
        </div>
      </div>
      {erro && (
        <div style={{ fontSize: 12, fontWeight: 700, color: COR_NEG, marginTop: 8 }}>{erro}</div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          onClick={recusar}
          disabled={ocupado}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: 12,
            border: '1.5px solid var(--linha)',
            background: 'var(--card)',
            color: COR_NEG,
            fontSize: 13,
            fontWeight: 800,
            fontFamily: 'inherit',
            cursor: ocupado ? 'default' : 'pointer',
            opacity: acao === 'recusando' ? 0.6 : 1,
          }}
        >
          {acao === 'recusando' ? 'Recusando…' : 'Recusar'}
        </button>
        <button
          onClick={aceitar}
          disabled={ocupado}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
            color: '#fff',
            fontSize: 13,
            fontWeight: 800,
            fontFamily: 'inherit',
            cursor: ocupado ? 'default' : 'pointer',
            boxShadow: '0 4px 12px color-mix(in oklab, var(--primary) 28%, transparent)',
            opacity: acao === 'aceitando' ? 0.7 : 1,
          }}
        >
          {acao === 'aceitando' ? 'Aceitando…' : 'Aceitar'}
        </button>
      </div>
    </div>
  );
}
