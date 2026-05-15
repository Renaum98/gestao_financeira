// main.jsx — ponto de entrada Vite.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app.jsx';
import './styles.css';

// ─── PWA: descoberta agressiva de versão nova ───
// O vite-plugin-pwa está com `registerType: 'autoUpdate'` + `skipWaiting`,
// então no momento que o navegador descobre que tem SW novo ele já ativa.
// O problema é DESCOBRIR — em PWA standalone (iOS/Android tela inicial), o
// navegador raramente re-fetcha index.html sozinho, então um deploy novo pode
// demorar dias pra aparecer.
//
// Aqui forçamos a checagem em três momentos:
//   1) Logo após o registro inicial (`immediate: true`).
//   2) Periodicamente a cada 60 min enquanto o app está aberto.
//   3) Toda vez que o app volta a ficar visível (usuário tira do background).
//
// Quando uma versão nova é detectada, recarregamos a página — o `skipWaiting`
// no SW garante que a próxima carga já vai ser dos arquivos novos.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Versão nova pronta. Recarrega pra ela assumir.
    updateSW(true);
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;
    // Checagem periódica enquanto o app está aberto.
    setInterval(() => {
      registration.update().catch(() => {});
    }, 60 * 60 * 1000); // 1h
    // Volta do background → checa imediatamente.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        registration.update().catch(() => {});
      }
    });
  },
});

// Safari iOS ignora user-scalable=no — bloqueamos gestos de pinch e
// o double-tap zoom diretamente nos eventos do documento.
['gesturestart', 'gesturechange', 'gestureend'].forEach((evt) => {
  document.addEventListener(evt, (e) => e.preventDefault(), { passive: false });
});
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });
// Ctrl/⌘ + roda do mouse no desktop também ativa zoom — bloqueia.
document.addEventListener('wheel', (e) => {
  if (e.ctrlKey) e.preventDefault();
}, { passive: false });
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) {
    e.preventDefault();
  }
  // Bloqueia atalhos de cópia/recorte/seleção fora de campos de texto.
  if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'a'].includes(e.key.toLowerCase())) {
    const alvo = e.target;
    const ehCampo =
      alvo &&
      (alvo.tagName === 'INPUT' ||
        alvo.tagName === 'TEXTAREA' ||
        alvo.isContentEditable);
    if (!ehCampo) e.preventDefault();
  }
});

// Bloqueia copy/cut/menu-de-contexto fora de inputs.
const ehCampoTexto = (alvo) =>
  alvo &&
  (alvo.tagName === 'INPUT' ||
    alvo.tagName === 'TEXTAREA' ||
    alvo.isContentEditable);
['copy', 'cut'].forEach((evt) => {
  document.addEventListener(evt, (e) => {
    if (!ehCampoTexto(e.target)) e.preventDefault();
  });
});
document.addEventListener('contextmenu', (e) => {
  if (!ehCampoTexto(e.target)) e.preventDefault();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
