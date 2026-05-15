// loader.jsx — loader oficial do app.
//
// Forma orgânica viva que respira: o border-radius e a escala oscilam num
// loop suave (~3.4s), sem nenhum estado "fixo". As bordas usam tons mais
// escuros pra dar profundidade.
//
// Estilos vivem em `styles.css` (procure por `.finca-loader`) pra que o CSS
// não seja re-injetado a cada render do componente.
//
// Use sempre que precisar de um indicador de carregamento:
//   <Loader />               — tamanho padrão (56px)
//   <Loader size={32} />     — inline em botões/etiquetas
//   <LoaderTela />           — variante "tela cheia" pra Suspense/Splash

import React from 'react';

export function Loader({ size = 56, label = 'Carregando' }) {
  return (
    <div
      className="finca-loader"
      role="status"
      aria-label={label}
      style={{ width: size, height: size }}
    >
      <div className="finca-loader__blob" />
    </div>
  );
}

// Variante usada quando o loader precisa ocupar a tela inteira (auth pendente,
// Suspense fallback de página inteira, etc.).
export function LoaderTela({ label }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}
    >
      <Loader size={72} label={label} />
    </div>
  );
}
