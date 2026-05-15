// modal-base.jsx — overlay + dialog padrão usado por todos os modais.
//
// Centraliza: backdrop com blur, animação fadeIn/scaleIn, fechar ao clicar
// fora, role="dialog"/aria-modal. Cada modal só se preocupa com o conteúdo
// interno e passa props pra ajustar tamanho/padding/scroll.

import React from 'react';

export function ModalOverlay({
  onClose,
  children,
  maxWidth = 420,
  padding = '16px 20px 22px',
  borderRadius = 28,
  // Quando `scrollable` (default), o dialog limita a altura à viewport e
  // permite rolagem interna — apropriado pra forms longos. Modais curtos
  // (confirmar, instalar PWA) passam scrollable={false}.
  scrollable = true,
  // textAlign: 'center' no dialog (útil pra modais informativos).
  center = false,
  // Estilos extras (mesclados ao final).
  dialogStyle,
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, height: '100dvh', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        background: 'rgba(20, 16, 24, 0.45)',
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        animation: 'fadeIn .28s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%',
          maxWidth,
          ...(scrollable && {
            maxHeight: 'calc(100dvh - 40px)',
            overflowY: 'auto',
          }),
          background: 'var(--bg)',
          borderRadius,
          padding,
          boxShadow: '0 24px 60px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.08)',
          animation: 'scaleIn .34s cubic-bezier(0.22, 1, 0.36, 1)',
          ...(center && { textAlign: 'center' }),
          ...dialogStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}
