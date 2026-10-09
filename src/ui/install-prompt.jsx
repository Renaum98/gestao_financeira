// install-prompt.jsx — Modal que convida o usuário a instalar o PWA quando
// está navegando no mobile/web (e ainda não instalou). Inclui atalho de
// instalação (beforeinstallprompt) para Android/Chrome e instruções para iOS.

import React from 'react';
import { Icon } from './icons.jsx';
import { ModalOverlay } from './modal-base.jsx';
import { Linha, ListaAgrupada, TituloDialogo } from './form-lista.jsx';
import { vibrar } from '../lib/haptics.js';
import { useT } from '../lib/i18n.jsx';

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
  const tr = useT();
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

  // Botões empilhados: aqui a ação principal pesa mais que a de sair, e o
  // texto dos dois é longo demais pra dividir a linha.
  const botao = (primario) => ({
    width: '100%', minHeight: 46, padding: '12px 16px', borderRadius: 'var(--raio-pilula)',
    border: 'none',
    background: primario ? 'var(--primary-degrade)' : 'var(--card-2)',
    color: primario ? '#fff' : 'var(--ink)',
    fontSize: primario ? 15 : 14, fontWeight: primario ? 800 : 700, fontFamily: 'inherit',
    cursor: 'pointer',
    boxShadow: primario
      ? '0 8px 20px color-mix(in oklab, var(--primary) 30%, transparent)'
      : '0 1px 2px rgba(0,0,0,0.06)',
  });

  return (
    <ModalOverlay
      onClose={onDispensar}
      maxWidth={380}
      padding="24px 20px 18px"
      scrollable={false}
      center
      >
        {/* O mesmo ícone que a instalação vai colocar na tela inicial — e o
            mesmo azulejo branco do login. É a promessa da tela: o usuário
            precisa reconhecer depois o que viu aqui. */}
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          margin: '0 auto 14px',
          background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 28px color-mix(in oklab, var(--primary) 32%, transparent)',
          position: 'relative', overflow: 'hidden',
        }}>
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt=""
            aria-hidden="true"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        </div>

        {!instrucoesIOS ? (
          <>
            <TituloDialogo
              titulo={tr("Instale o MyCounts")}
              mensagem={tr("O app instalado abre mais rápido, funciona offline e tem desempenho melhor que o navegador. Você ganha um ícone na tela inicial e uma experiência sem barras de endereço.")}
            />

            <ListaAgrupada style={{ marginTop: 14, textAlign: 'left' }}>
              {[
                { ico: 'sparkle', txt: tr('Abre instantaneamente, como um app nativo.') },
                { ico: 'check',   txt: tr('Funciona mesmo com internet instável.') },
                { ico: 'home',    txt: tr('Ícone na tela inicial, sem barras do navegador.') },
              ].map((b, i) => (
                <Linha
                  key={b.ico}
                  divisoria={i > 0}
                  inicio={<Icon name={b.ico} size={17} color="var(--primary)" strokeWidth={2.4} />}
                >
                  <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.35 }}>
                    {b.txt}
                  </span>
                </Linha>
              ))}
            </ListaAgrupada>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>
              <button onClick={acaoInstalar} style={botao(true)}>{tr("Instalar app")}</button>
              <button onClick={onDispensar} style={botao(false)}>{tr("Continuar no navegador")}</button>
            </div>
          </>
        ) : (
          <>
            <TituloDialogo
              titulo={tr("Como instalar no iPhone")}
              mensagem={tr("No Safari, toque no botão de Compartilhar e depois em \"Adicionar à Tela de Início\".")}
            />

            <ListaAgrupada style={{ marginTop: 14, textAlign: 'left' }}>
              {[
                '1. Toque no ícone de Compartilhar na barra inferior do Safari.',
                '2. Role e selecione "Adicionar à Tela de Início".',
                '3. Confirme em "Adicionar" no canto superior direito.',
              ].map((linha, i) => (
                <Linha key={i} divisoria={i > 0}>
                  <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4 }}>
                    {tr(linha)}
                  </span>
                </Linha>
              ))}
            </ListaAgrupada>

            <button onClick={onDispensar} style={{ ...botao(true), marginTop: 18 }}>{tr("Entendi")}</button>
          </>
        )}
    </ModalOverlay>
  );
}
