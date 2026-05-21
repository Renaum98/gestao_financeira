// parts.jsx — primitivos de layout das notificações: item genérico (3 colunas)
// e o cabeçalho de seção.

import React from 'react';

// Item de notificação genérico: 3 colunas (leading | titulo+subtitulo | trailing).
// Padroniza padding, divisor entre linhas e estado de "lida" (opacidade reduzida).
// Usado pelas 4 listas estáticas (orçamento, próximas, terminando, recsRevisar);
// convites e eventos de parceria têm UI dedicada com botões.
export function NotifItem({
  leading,
  titulo,
  subtitulo,
  subtituloCor,
  trailing,
  primeiro = false,
  lida = false,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 0',
        borderTop: primeiro ? 'none' : '1px solid var(--linha)',
        cursor: lida ? 'default' : onClick ? 'pointer' : 'default',
        opacity: lida ? 0.5 : 1,
        transition: 'opacity .2s',
      }}
    >
      {leading}
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
          {titulo}
        </div>
        {subtitulo && (
          <div
            style={{
              fontSize: 11,
              color: subtituloCor || 'var(--muted)',
              fontWeight: 600,
              marginTop: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {subtitulo}
          </div>
        )}
      </div>
      {trailing}
    </div>
  );
}

export function Secao({ titulo, subtitulo, acao, children }) {
  return (
    <div style={{ padding: '4px 20px 0', marginTop: 18 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          padding: '0 4px 8px',
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>{titulo}</div>
          {subtitulo && (
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginTop: 2 }}>
              {subtitulo}
            </div>
          )}
        </div>
        {acao}
      </div>
      {children}
    </div>
  );
}

// Botão "Ajustar/Gerenciar →" usado no cabeçalho de algumas seções.
export function LinkAcao({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 'none',
        color: 'var(--primary)',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        padding: 0,
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}
