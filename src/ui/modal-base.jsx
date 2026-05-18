// modal-base.jsx — overlay + dialog padrão usado por todos os modais.
//
// Centraliza: backdrop com blur, animação fadeIn/scaleIn, fechar ao clicar
// fora, role="dialog"/aria-modal. Cada modal só se preocupa com o conteúdo
// interno e passa props pra ajustar tamanho/padding/scroll.
//
// IMPORTANTE: o overlay é portalizado em `document.body`. Sem portal, o
// `position: fixed` do overlay ficaria contido por ancestrais que usam
// `transform`/`will-change: transform` (ex.: `.page-transition`), o que
// faz o modal abrir centralizado em relação ao wrapper longo da página
// (não à viewport) e obrigaria o usuário a rolar pra cima.

import React from 'react';
import { createPortal } from 'react-dom';

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
  // Trava o scroll do body enquanto o modal está aberto, pra não cair no
  // caso de a página por baixo continuar rolando ao abrir o modal.
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const overlay = (
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

  // Em SSR/ambientes sem document, devolve inline (não deve acontecer aqui).
  if (typeof document === 'undefined') return overlay;
  return createPortal(overlay, document.body);
}
