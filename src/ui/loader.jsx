// loader.jsx — indicadores de carregamento do app.
//
// Filosofia: enquanto a tela busca dados, mostramos um **skeleton** que
// imita o esqueleto da interface (top bar, card principal, linhas de lista).
// Isso reduz a sensação de "tela em branco" e a percepção de espera,
// porque o usuário já vê o contorno do que virá.
//
// Para casos pontuais em que skeleton não faz sentido (ex.: dentro de um
// botão ou durante uma ação destrutiva), use o `<Loader />` — um spinner
// CSS pequeno e neutro.
//
// Estilos vivem em `styles.css` (procure por `.skeleton` e `.spinner`)
// pra que o CSS não seja re-injetado a cada render.
//
// API:
//   <LoaderTela />      — skeleton de tela cheia (Splash, Suspense, auth pendente)
//   <Loader size={32} /> — spinner inline (botões, ações)
//   <Skeleton w h r />  — bloco primitivo, para compor skeletons custom

import React from 'react';

// Bloco primitivo. width/height aceitam número (px) ou string (CSS).
// radius padrão segue o "card" do app.
function Skeleton({
  w = '100%',
  h = 16,
  r = 8,
  style,
}) {
  return (
    <div
      className="skeleton"
      style={{
        width: typeof w === 'number' ? `${w}px` : w,
        height: typeof h === 'number' ? `${h}px` : h,
        borderRadius: r,
        ...style,
      }}
    />
  );
}

// Spinner CSS inline — usado em ações pontuais (ex.: "Apagando seus dados").
export function Loader({ size = 24, label = 'Carregando' }) {
  return (
    <div
      className="spinner"
      role="status"
      aria-label={label}
      style={{ width: size, height: size }}
    />
  );
}

// Skeleton "tela cheia": imita topo + card grande + linhas de lista.
// Usado como Splash e como fallback de Suspense pra qualquer screen.
export function LoaderTela({ label = 'Carregando' }) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        paddingBottom: 'var(--pad-bottom, 24px)',
      }}
    >
      {/* TopBar */}
      <div
        style={{
          padding: 'var(--pad-top, 16px) 20px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 32,
          }}
        >
          <Skeleton w={36} h={36} r={18} />
          <Skeleton w={36} h={36} r={18} />
        </div>
        <Skeleton w={180} h={28} r={8} style={{ marginTop: 6 }} />
      </div>

      {/* Card principal (saldo / resumo) */}
      <div style={{ padding: '8px 20px 0' }}>
        <div
          style={{
            padding: 20,
            background: 'var(--card)',
            borderRadius: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          <Skeleton w={120} h={12} r={6} />
          <Skeleton w={'60%'} h={28} r={8} />
          <div style={{ display: 'flex', gap: 12 }}>
            <Skeleton w={'100%'} h={48} r={12} />
            <Skeleton w={'100%'} h={48} r={12} />
          </div>
        </div>
      </div>

      {/* Lista — algumas linhas tipo "transação" */}
      <div style={{ padding: '20px 20px 0' }}>
        <Skeleton w={140} h={14} r={6} style={{ marginBottom: 12 }} />
        <div
          style={{
            background: 'var(--card)',
            borderRadius: 20,
            padding: '6px 16px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 0',
                borderTop: i === 0 ? 'none' : '1px solid var(--linha)',
              }}
            >
              <Skeleton w={36} h={36} r={18} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skeleton w={'70%'} h={13} r={6} />
                <Skeleton w={'40%'} h={11} r={6} />
              </div>
              <Skeleton w={72} h={14} r={6} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
