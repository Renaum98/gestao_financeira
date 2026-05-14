// main.jsx — ponto de entrada Vite.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app.jsx';
import './styles.css';

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
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
