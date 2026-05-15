// confirm-modal.jsx — Modal de confirmação reutilizável (destrutivo por padrão).

import React from 'react';
import { Icon } from './icons.jsx';
import { ModalOverlay } from './modal-base.jsx';
import { COR_NEG, COR_NEG_FUNDO } from '../lib/colors.js';

export function ConfirmModal({
  titulo,
  mensagem,
  textoConfirmar = 'Excluir',
  textoCancelar = 'Cancelar',
  icone = 'trash',
  destrutivo = true,
  onConfirmar,
  onCancelar,
}) {
  const corAcao = destrutivo ? COR_NEG : 'var(--primary)';
  const corFundoIcone = destrutivo ? COR_NEG_FUNDO : 'color-mix(in oklab, var(--primary) 14%, transparent)';

  return (
    <ModalOverlay
      onClose={onCancelar}
      maxWidth={360}
      padding="24px 22px 18px"
      borderRadius={24}
      scrollable={false}
      center
    >
      <div style={{
        width: 56, height: 56, borderRadius: 28,
        background: corFundoIcone,
        margin: '0 auto 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icone} size={26} color={corAcao} strokeWidth={2.2} />
      </div>

      <div style={{
        fontSize: 17, fontWeight: 800, color: 'var(--ink)',
        letterSpacing: '-0.02em',
      }}>{titulo}</div>

      {mensagem && (
        <div style={{
          fontSize: 13, color: 'var(--muted)', fontWeight: 500,
          marginTop: 6, lineHeight: 1.45,
        }}>{mensagem}</div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button onClick={onCancelar} style={{
          flex: 1, padding: '12px', borderRadius: 14, border: 'none',
          background: 'var(--card-2)', color: 'var(--ink)',
          fontSize: 14, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        }}>{textoCancelar}</button>
        <button onClick={onConfirmar} style={{
          flex: 1, padding: '12px', borderRadius: 14, border: 'none',
          background: corAcao, color: '#fff',
          fontSize: 14, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
          boxShadow: destrutivo ? '0 4px 14px rgba(214,58,85,0.32)' : '0 4px 14px color-mix(in oklab, var(--primary) 32%, transparent)',
        }}>{textoConfirmar}</button>
      </div>
    </ModalOverlay>
  );
}
