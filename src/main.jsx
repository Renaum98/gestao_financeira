// main.jsx — ponto de entrada Vite.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app.jsx';
import { lerIdiomaSalvo, traduzir } from './lib/i18n.jsx';
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

// ─── Só em pé no celular ───
// O manifest pede `orientation: 'portrait'`, o que trava o PWA instalado no
// Android. O iOS ignora o manifest e o Safari não tem `screen.orientation.lock`,
// então lá não há como travar de verdade: com o celular deitado, um aviso cobre
// o app pedindo pra girar de volta. Quem decide quando ele aparece é o CSS
// (.aviso-retrato, layout.css); aqui só se cria o elemento e se acerta o idioma
// do texto a cada vez que o celular deita.
const avisoRetrato = document.createElement('div');
avisoRetrato.className = 'aviso-retrato';
avisoRetrato.setAttribute('role', 'alert');
avisoRetrato.innerHTML =
  '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/></svg><p></p>';
document.body.appendChild(avisoRetrato);

const celularDeitado = window.matchMedia(
  '(orientation: landscape) and (max-height: 500px) and (pointer: coarse)'
);
const textoAvisoRetrato = () => {
  avisoRetrato.querySelector('p').textContent = traduzir(
    lerIdiomaSalvo(),
    'Gire o celular para usar o app'
  );
};
textoAvisoRetrato();
celularDeitado.addEventListener('change', (e) => {
  if (e.matches) textoAvisoRetrato();
});

// Safari iOS ignora user-scalable=no — bloqueamos gestos de pinch e
// o double-tap zoom diretamente nos eventos do documento.
['gesturestart', 'gesturechange', 'gestureend'].forEach((evt) => {
  document.addEventListener(evt, (e) => e.preventDefault(), { passive: false });
});
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
// Aqui havia um terceiro guarda: um `touchmove` não-passivo no documento que
// cancelava o gesto com dois dedos. Ele saiu porque cobrava caro e não cobria
// nada de novo.
//
// O caro: um listener não-passivo de touchmove no documento desliga a rolagem
// em thread separada. A cada movimento do dedo, em QUALQUER tela, o compositor
// tinha que esperar o JavaScript decidir se ia cancelar antes de rolar um
// pixel — a rolagem "grudenta" que aparece primeiro em aparelho fraco.
//
// O que não cobria: o pinch já é barrado duas vezes. No Android/Chrome pelo
// `touch-action: pan-x pan-y` do html/body (base.css), e no Safari iOS — o que
// ignora o user-scalable=no — pelos três `gesture*` logo acima, que são
// justamente os eventos que a Apple dispara no pinch.
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
