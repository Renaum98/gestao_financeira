// login.jsx — Tela de boas-vindas + entrar com Google.

import React from 'react';
import { entrarComGoogle } from '../lib/firebase.js';

export function LoginScreen() {
  const [carregando, setCarregando] = React.useState(false);
  const [erro, setErro] = React.useState('');

  const entrar = async () => {
    setErro('');
    setCarregando(true);
    try {
      await entrarComGoogle();
      // Se for popup, onAuthStateChanged dispara em seguida.
      // Se for redirect, a página recarrega — esse estado é descartado.
    } catch (err) {
      console.error(err);
      const msg = err?.code === 'auth/popup-closed-by-user'
        ? ''
        : 'Não foi possível entrar. Tente novamente.';
      setErro(msg);
      setCarregando(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      padding: 'max(48px, env(safe-area-inset-top)) 28px max(40px, env(safe-area-inset-bottom))',
      background: 'var(--bg)',
    }}>
      <div />

      {/* Identidade do app */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
        <div style={{
          width: 96, height: 96, borderRadius: 32,
          background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 16px 36px rgba(110,79,246,0.30)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -20, left: -20, width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.18)' }} />
          <div style={{ position: 'absolute', bottom: -16, right: -10, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
          <div style={{
            fontSize: 56, fontWeight: 800, color: '#fff',
            letterSpacing: '-0.05em', lineHeight: 1, position: 'relative',
          }}>F</div>
        </div>

        <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.03em', marginTop: 8 }}>
          Financeiro
        </div>
        <div style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 500, maxWidth: 300, lineHeight: 1.45 }}>
          Suas finanças no bolso. Acompanhe gastos, defina orçamentos e crie caixinhas para metas.
        </div>
      </div>

      {/* Botão Google */}
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <button
          onClick={entrar}
          disabled={carregando}
          style={{
            width: '100%', padding: '14px 18px', borderRadius: 16, border: 'none',
            background: 'var(--card)', color: 'var(--ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            fontSize: 15, fontWeight: 800, fontFamily: 'inherit',
            cursor: carregando ? 'default' : 'pointer',
            opacity: carregando ? 0.7 : 1,
            boxShadow: '0 4px 14px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
            transition: 'transform .1s, opacity .15s',
          }}
        >
          {carregando ? <SpinnerLocal /> : <GoogleLogo />}
          <span>{carregando ? 'Entrando…' : 'Entrar com Google'}</span>
        </button>

        {erro && (
          <div style={{ fontSize: 12, fontWeight: 700, color: '#D63A55', textAlign: 'center' }}>
            {erro}
          </div>
        )}

        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, textAlign: 'center', lineHeight: 1.45, maxWidth: 280, marginTop: 8 }}>
          Usamos sua conta Google só para identificar e sincronizar seus dados. Não compartilhamos nada.
        </div>
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function SpinnerLocal() {
  return (
    <div style={{
      width: 18, height: 18, border: '2.5px solid var(--linha)',
      borderTopColor: 'var(--primary)', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  );
}
