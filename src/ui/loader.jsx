// loader.jsx — loader oficial do app.
//
// Forma orgânica que respira (border-radius animado) e, no meio do ciclo,
// se "concretiza" numa silhueta quase quadrada onde a letra F aparece em
// fade+scale. Depois volta a se dissolver no blob. Loop suave em ~3.4s.
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
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.6),
      }}
    >
      <div className="finca-loader__blob">
        <span className="finca-loader__letter">F</span>
      </div>
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
