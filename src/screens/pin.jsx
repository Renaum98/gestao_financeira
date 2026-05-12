// pin.jsx — Tela de PIN (definir na 1ª vez, ou desbloquear nas próximas).

import React from 'react';
import { hasPin, setPin, verifyPin } from '../lib/pin.js';

export function PinScreen({ onUnlock, modoTroca = false, onCancelarTroca }) {
  // Estados:
  // - 'criar'    → primeira definição (ou troca)
  // - 'confirmar'→ digitando o PIN de novo para confirmar
  // - 'verificar'→ desbloqueio normal
  const inicial = modoTroca || !hasPin() ? 'criar' : 'verificar';
  const [etapa, setEtapa] = React.useState(inicial);
  const [pin1, setPin1] = React.useState('');
  const [pin2, setPin2] = React.useState('');
  const [erro, setErro] = React.useState('');
  const [shake, setShake] = React.useState(false);

  const pinAtual = etapa === 'confirmar' ? pin2 : pin1;
  const setPinAtual = etapa === 'confirmar' ? setPin2 : setPin1;

  const titulo = etapa === 'criar'
    ? (modoTroca ? 'Defina um novo PIN' : 'Crie um PIN de 4 dígitos')
    : etapa === 'confirmar' ? 'Confirme o PIN' : 'Digite seu PIN';
  const subtitulo = etapa === 'criar'
    ? 'Você vai usar esse PIN sempre que abrir o app.'
    : etapa === 'confirmar' ? 'Digite o mesmo PIN novamente.'
    : 'Digite o PIN para desbloquear o Finça.';

  const tremer = () => { setShake(true); setTimeout(() => setShake(false), 400); };

  const digitar = (n) => {
    if (pinAtual.length >= 4) return;
    setErro('');
    const novo = pinAtual + n;
    setPinAtual(novo);
    if (novo.length === 4) setTimeout(() => avancar(novo), 120);
  };

  const apagar = () => {
    setErro('');
    setPinAtual(pinAtual.slice(0, -1));
  };

  const avancar = async (valor) => {
    if (etapa === 'criar') {
      setEtapa('confirmar');
    } else if (etapa === 'confirmar') {
      if (valor !== pin1) {
        setErro('Os PINs não coincidem. Tente de novo.');
        tremer();
        setPin1(''); setPin2(''); setEtapa('criar');
        return;
      }
      await setPin(valor);
      onUnlock();
    } else {
      const ok = await verifyPin(valor);
      if (!ok) {
        setErro('PIN incorreto.');
        tremer();
        setPin1('');
        return;
      }
      onUnlock();
    }
  };

  const teclas = ['1','2','3','4','5','6','7','8','9','','0','del'];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      padding: 'max(40px, env(safe-area-inset-top)) 24px max(28px, env(safe-area-inset-bottom))',
      background: 'var(--bg)',
    }}>
      <div style={{ height: 12 }} />

      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 36,
          background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 28px rgba(110,79,246,0.25)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="11" width="16" height="10" rx="2.5"/>
            <path d="M8 11V8a4 4 0 018 0v3"/>
          </svg>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{titulo}</div>
        <div style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500, maxWidth: 280 }}>{subtitulo}</div>
      </div>

      {/* Bolinhas */}
      <div style={{
        display: 'flex', gap: 16, justifyContent: 'center',
        transform: shake ? 'translateX(0)' : 'translateX(0)',
        animation: shake ? 'shake .4s' : 'none',
      }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 16, height: 16, borderRadius: 8,
            background: i < pinAtual.length ? 'var(--primary)' : 'transparent',
            border: `2px solid ${i < pinAtual.length ? 'var(--primary)' : '#D9D2DE'}`,
            transition: 'all .15s',
          }} />
        ))}
      </div>

      <div style={{ minHeight: 22, fontSize: 13, color: '#D63A55', fontWeight: 700 }}>
        {erro}
      </div>

      {/* Teclado numérico */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14,
        width: '100%', maxWidth: 320,
      }}>
        {teclas.map((t, i) => {
          if (t === '') return <div key={i} />;
          if (t === 'del') {
            return (
              <button key={i} onClick={apagar} style={tecladoEstilo('apagar')}>
                <Icon14 name="backspace" />
              </button>
            );
          }
          return (
            <button key={i} onClick={() => digitar(t)} style={tecladoEstilo()}>
              {t}
            </button>
          );
        })}
      </div>

      {modoTroca && (
        <button onClick={onCancelarTroca} style={{
          background: 'transparent', border: 'none', color: 'var(--muted)',
          fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: 12,
        }}>Cancelar</button>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}

function tecladoEstilo(variant) {
  return {
    height: 64, borderRadius: 32, border: 'none',
    background: variant === 'apagar' ? 'transparent' : 'var(--card)',
    color: 'var(--ink)', fontSize: 26, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: variant === 'apagar' ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
}

function Icon14({ name }) {
  if (name === 'backspace') {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 5H9l-6 7 6 7h12a2 2 0 002-2V7a2 2 0 00-2-2z"/>
        <path d="M14 9l-4 6M10 9l4 6"/>
      </svg>
    );
  }
  return null;
}
