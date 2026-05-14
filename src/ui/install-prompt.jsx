// install-prompt.jsx — Modal que convida o usuário a instalar o PWA quando
// está navegando no mobile/web (e ainda não instalou). Inclui atalho de
// instalação (beforeinstallprompt) para Android/Chrome e instruções para iOS.

import React from 'react';
import { Icon } from './icons.jsx';
import { vibrar } from '../lib/haptics.js';

const DISMISS_KEY = 'finca.installPrompt.dismissedAt';
const DISMISS_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias

function ehStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function ehMobile() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const touch = (navigator.maxTouchPoints || 0) > 1;
  const tela = window.matchMedia?.('(max-width: 900px)').matches;
  return mobileUA || (touch && tela);
}

function ehIOS() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = React.useState(null);
  const [mostrar, setMostrar] = React.useState(false);

  React.useEffect(() => {
    if (ehStandalone()) return;
    if (!ehMobile()) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_DURATION_MS) return;

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setMostrar(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    // iOS não dispara beforeinstallprompt — exibe modal mesmo assim, com instruções.
    const timer = ehIOS() ? setTimeout(() => setMostrar(true), 800) : null;

    const onInstalled = () => {
      setMostrar(false);
      setDeferred(null);
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const instalar = React.useCallback(async () => {
    vibrar(14);
    if (deferred) {
      deferred.prompt();
      try { await deferred.userChoice; } catch {}
      setDeferred(null);
      setMostrar(false);
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
      return 'prompted';
    }
    return 'manual';
  }, [deferred]);

  const dispensar = React.useCallback(() => {
    vibrar();
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setMostrar(false);
  }, []);

  return {
    mostrar,
    temAtalho: !!deferred,
    plataformaIOS: ehIOS(),
    instalar,
    dispensar,
  };
}

export function InstallPromptModal({ temAtalho, plataformaIOS, onInstalar, onDispensar }) {
  const [instrucoesIOS, setInstrucoesIOS] = React.useState(false);

  const acaoInstalar = async () => {
    if (temAtalho) {
      await onInstalar();
    } else if (plataformaIOS) {
      setInstrucoesIOS(true);
    } else {
      await onInstalar();
    }
  };

  return (
    <div
      onClick={onDispensar}
      style={{
        position: 'fixed', inset: 0, height: '100dvh', zIndex: 200,
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
          width: '100%', maxWidth: 380,
          background: 'var(--bg)', borderRadius: 26,
          padding: '26px 22px 20px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.08)',
          animation: 'scaleIn .34s cubic-bezier(0.22, 1, 0.36, 1)',
          textAlign: 'center',
        }}
      >
        <div style={{
          width: 72, height: 72, borderRadius: 24,
          margin: '0 auto 16px',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 28px color-mix(in oklab, var(--primary) 32%, transparent)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -14, left: -14, width: 38, height: 38,
            borderRadius: '50%', background: 'rgba(255,255,255,0.18)',
          }} />
          <div style={{
            fontSize: 42, fontWeight: 800, color: '#fff',
            letterSpacing: '-0.05em', lineHeight: 1, position: 'relative',
          }}>F</div>
        </div>

        {!instrucoesIOS ? (
          <>
            <div style={{
              fontSize: 19, fontWeight: 800, color: 'var(--ink)',
              letterSpacing: '-0.02em',
            }}>Instale o Financeiro</div>

            <div style={{
              fontSize: 13.5, color: 'var(--muted)', fontWeight: 500,
              marginTop: 8, lineHeight: 1.5,
            }}>
              O app instalado abre mais rápido, funciona offline e tem desempenho
              melhor que o navegador. Você ganha um ícone na tela inicial e
              uma experiência sem barras de endereço.
            </div>

            <div style={{
              display: 'flex', flexDirection: 'column', gap: 8,
              margin: '18px 0 4px', textAlign: 'left',
            }}>
              {[
                { ico: 'sparkle', txt: 'Abre instantaneamente, como um app nativo.' },
                { ico: 'check',   txt: 'Funciona mesmo com internet instável.' },
                { ico: 'home',    txt: 'Ícone na tela inicial, sem barras do navegador.' },
              ].map((b) => (
                <div key={b.ico} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 12,
                  background: 'var(--surface-sunken)',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 14,
                    background: 'color-mix(in oklab, var(--primary) 14%, transparent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon name={b.ico} size={15} color="var(--primary)" strokeWidth={2.4} />
                  </div>
                  <div style={{
                    fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.35,
                  }}>{b.txt}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
              <button onClick={acaoInstalar} style={{
                width: '100%', padding: '14px 16px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
                color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: 'inherit',
                cursor: 'pointer',
                boxShadow: '0 8px 20px color-mix(in oklab, var(--primary) 30%, transparent)',
              }}>Instalar app</button>
              <button onClick={onDispensar} style={{
                width: '100%', padding: '12px', borderRadius: 14,
                border: '1.5px solid var(--linha)',
                background: 'var(--card)', color: 'var(--ink)',
                fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              }}>Continuar no navegador</button>
            </div>
          </>
        ) : (
          <>
            <div style={{
              fontSize: 19, fontWeight: 800, color: 'var(--ink)',
              letterSpacing: '-0.02em',
            }}>Como instalar no iPhone</div>
            <div style={{
              fontSize: 13.5, color: 'var(--muted)', fontWeight: 500,
              marginTop: 8, lineHeight: 1.5,
            }}>
              No Safari, toque no botão de Compartilhar e depois em
              "Adicionar à Tela de Início".
            </div>

            <div style={{
              display: 'flex', flexDirection: 'column', gap: 10,
              margin: '18px 0 4px', textAlign: 'left',
            }}>
              {[
                '1. Toque no ícone de Compartilhar na barra inferior do Safari.',
                '2. Role e selecione "Adicionar à Tela de Início".',
                '3. Confirme em "Adicionar" no canto superior direito.',
              ].map((t, i) => (
                <div key={i} style={{
                  padding: '10px 12px', borderRadius: 12,
                  background: 'var(--surface-sunken)',
                  fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4,
                }}>{t}</div>
              ))}
            </div>

            <button onClick={onDispensar} style={{
              width: '100%', padding: '13px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
              color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
              cursor: 'pointer', marginTop: 16,
              boxShadow: '0 8px 20px color-mix(in oklab, var(--primary) 30%, transparent)',
            }}>Entendi</button>
          </>
        )}
      </div>
    </div>
  );
}
