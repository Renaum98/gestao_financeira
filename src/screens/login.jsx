// login.jsx — Tela de login/cadastro por e-mail e senha + tela de verificação de e-mail.

import React from 'react';
import {
  criarConta,
  entrar as entrarFirebase,
  reenviarVerificacao,
  recarregarUsuario,
  redefinirSenha,
  sair as sairFirebase,
} from '../lib/firebase.js';
import { Icon } from '../ui/icons.jsx';
import { vibrar } from '../lib/haptics.js';

const EMAIL_OK = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e || '').trim());
const SENHA_OK = (s) => (s || '').length >= 8 && /[a-zA-Z]/.test(s) && /[0-9]/.test(s);

function msgErro(code) {
  switch (code) {
    case 'auth/invalid-email': return 'E-mail inválido.';
    case 'auth/missing-password': return 'Digite a senha.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use': return 'Já existe uma conta com esse e-mail.';
    case 'auth/weak-password': return 'Senha muito fraca (mínimo 8 caracteres).';
    case 'auth/too-many-requests': return 'Muitas tentativas. Tente novamente em alguns minutos.';
    case 'auth/network-request-failed': return 'Sem conexão. Verifique sua internet.';
    default: return 'Algo deu errado. Tente novamente.';
  }
}

const inputStyle = {
  width: '100%', padding: '13px 14px', borderRadius: 14, border: '1.5px solid var(--linha)',
  background: 'var(--card)', outline: 'none', fontSize: 15, fontWeight: 600,
  color: 'var(--ink)', fontFamily: 'inherit', boxSizing: 'border-box',
};

function Campo({ label, ...props }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, paddingLeft: 2 }}>{label}</div>
      <input {...props} style={inputStyle} />
    </label>
  );
}

function Logo({ size = 84 }) {
  return (
    <>
      <style>{`
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); box-shadow: 0 16px 36px color-mix(in oklab, var(--primary) 30%, transparent); }
          50%      { transform: translateY(-8px); box-shadow: 0 24px 44px color-mix(in oklab, var(--primary) 26%, transparent); }
        }
        @media (prefers-reduced-motion: reduce) {
          .login-logo-float { animation: none !important; transform: none !important; }
        }
      `}</style>
      <div className="login-logo-float" style={{
        width: size, height: size, borderRadius: size * 0.34,
        background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 16px 36px color-mix(in oklab, var(--primary) 30%, transparent)',
        position: 'relative', overflow: 'hidden', flexShrink: 0,
        animation: 'logoFloat 3.6s ease-in-out infinite',
        willChange: 'transform',
      }}>
        <div style={{ position: 'absolute', top: -18, left: -18, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.18)' }} />
        <div style={{ fontSize: size * 0.6, fontWeight: 800, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1, position: 'relative' }}>F</div>
      </div>
    </>
  );
}

function Casca({ children }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 22,
      padding: 'max(40px, env(safe-area-inset-top)) 24px max(32px, env(safe-area-inset-bottom))',
      background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        {children}
      </div>
    </div>
  );
}

function BotaoPrimario({ children, ...props }) {
  return (
    <button {...props} style={{
      width: '100%', padding: '14px 18px', borderRadius: 14, border: 'none',
      background: props.disabled ? 'var(--linha)' : 'linear-gradient(135deg, var(--primary), var(--primary-2))',
      color: props.disabled ? 'var(--muted)' : '#fff',
      fontSize: 15, fontWeight: 800, fontFamily: 'inherit',
      cursor: props.disabled ? 'default' : 'pointer',
      boxShadow: props.disabled ? 'none' : '0 8px 20px color-mix(in oklab, var(--primary) 28%, transparent)',
      transition: 'opacity .15s',
    }}>{children}</button>
  );
}

// ─── Tela de login / cadastro ───
export function LoginScreen() {
  const [modo, setModo] = React.useState('entrar'); // 'entrar' | 'cadastrar' | 'recuperar'
  const [nome, setNome] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [senha, setSenha] = React.useState('');
  const [carregando, setCarregando] = React.useState(false);
  const [erro, setErro] = React.useState('');
  const [info, setInfo] = React.useState('');

  const limpar = () => { setErro(''); setInfo(''); };
  const trocarModo = (m) => { setModo(m); setSenha(''); limpar(); };

  const validar = () => {
    if (!EMAIL_OK(email)) return 'Digite um e-mail válido.';
    if (modo === 'recuperar') return null;
    if (modo === 'cadastrar' && !nome.trim()) return 'Digite seu nome.';
    if (!senha) return 'Digite a senha.';
    if (modo === 'cadastrar' && !SENHA_OK(senha))
      return 'A senha precisa ter ao menos 8 caracteres, com letras e números.';
    return null;
  };

  const enviar = async (e) => {
    e?.preventDefault();
    limpar();
    const v = validar();
    if (v) { setErro(v); return; }
    vibrar();
    setCarregando(true);
    try {
      if (modo === 'recuperar') {
        await redefinirSenha(email.trim());
        setInfo('Enviamos um link para redefinir sua senha. Confira seu e-mail.');
      } else if (modo === 'cadastrar') {
        await criarConta(nome.trim(), email.trim(), senha);
        // onAuthStateChanged dispara → o app mostra a tela de verificação de e-mail.
      } else {
        await entrarFirebase(email.trim(), senha);
        // onAuthStateChanged dispara; se o e-mail não estiver confirmado,
        // o app mostra a tela de verificação.
      }
    } catch (err) {
      setErro(msgErro(err?.code));
      setCarregando(false);
    }
  };

  const titulo = modo === 'cadastrar' ? 'Criar conta' : modo === 'recuperar' ? 'Recuperar senha' : 'Entrar';
  const subtitulo = modo === 'cadastrar'
    ? 'Crie sua conta para começar a organizar suas finanças.'
    : modo === 'recuperar'
      ? 'Digite seu e-mail e enviaremos um link para redefinir a senha.'
      : 'Bem-vindo de volta. Acesse sua conta.';

  return (
    <Casca>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
        <Logo />
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.03em' }}>{titulo}</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500, marginTop: 6, lineHeight: 1.45, maxWidth: 300 }}>{subtitulo}</div>
        </div>
      </div>

      <form onSubmit={enviar} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {modo === 'cadastrar' && (
          <Campo label="Nome" type="text" autoComplete="name" placeholder="Como quer ser chamado(a)?"
            value={nome} onChange={(e) => setNome(e.target.value)} />
        )}
        <Campo label="E-mail" type="email" autoComplete="email" inputMode="email" placeholder="voce@email.com"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        {modo !== 'recuperar' && (
          <Campo label="Senha" type="password"
            autoComplete={modo === 'cadastrar' ? 'new-password' : 'current-password'}
            placeholder={modo === 'cadastrar' ? 'Mín. 8 caracteres, letras e números' : 'Sua senha'}
            value={senha} onChange={(e) => setSenha(e.target.value)} />
        )}
        {modo === 'cadastrar' && (
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, paddingLeft: 2, lineHeight: 1.4 }}>
            Você receberá um e-mail de confirmação. A conta só é ativada depois que você clicar no link.
          </div>
        )}

        {erro && <div style={{ fontSize: 12.5, fontWeight: 700, color: '#D63A55' }}>{erro}</div>}
        {info && <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1B9E6A' }}>{info}</div>}

        <BotaoPrimario type="submit" disabled={carregando}>
          {carregando ? 'Aguarde…' : modo === 'cadastrar' ? 'Criar conta' : modo === 'recuperar' ? 'Enviar link' : 'Entrar'}
        </BotaoPrimario>

        {modo === 'entrar' && (
          <button type="button" onClick={() => trocarModo('recuperar')} style={linkStyle}>Esqueci minha senha</button>
        )}
      </form>

      <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
        {modo === 'cadastrar' ? (
          <>Já tem conta? <button type="button" onClick={() => trocarModo('entrar')} style={linkInlineStyle}>Entrar</button></>
        ) : modo === 'recuperar' ? (
          <button type="button" onClick={() => trocarModo('entrar')} style={linkInlineStyle}>Voltar para o login</button>
        ) : (
          <>Não tem conta? <button type="button" onClick={() => trocarModo('cadastrar')} style={linkInlineStyle}>Cadastre-se</button></>
        )}
      </div>
    </Casca>
  );
}

const linkStyle = {
  background: 'transparent', border: 'none', color: 'var(--muted)',
  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'center', padding: 4,
};
const linkInlineStyle = {
  background: 'transparent', border: 'none', color: 'var(--primary)',
  fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', padding: 0,
};

// ─── Tela "confirme seu e-mail" (usuário logado mas sem verificação) ───
export function VerifyEmailScreen({ email, onAtualizar }) {
  const [carregando, setCarregando] = React.useState(false);
  const [reenviando, setReenviando] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const [erro, setErro] = React.useState('');

  const jaConfirmei = async () => {
    setMsg(''); setErro(''); setCarregando(true);
    try {
      const u = await recarregarUsuario();
      if (u?.emailVerified) { vibrar(14); onAtualizar?.(u); }
      else setErro('Ainda não detectamos a confirmação. Abra o link do e-mail e tente de novo.');
    } catch {
      setErro('Não foi possível verificar agora. Tente novamente.');
    }
    setCarregando(false);
  };

  const reenviar = async () => {
    setMsg(''); setErro(''); setReenviando(true);
    try {
      await reenviarVerificacao();
      setMsg('E-mail de confirmação reenviado. Confira sua caixa de entrada (e o spam).');
    } catch (err) {
      setErro(err?.code === 'auth/too-many-requests'
        ? 'Você pediu muitos e-mails. Aguarde alguns minutos.'
        : 'Não foi possível reenviar agora.');
    }
    setReenviando(false);
  };

  return (
    <Casca>
      <div style={{
        width: 72, height: 72, borderRadius: 22, background: 'color-mix(in oklab, var(--primary) 12%, transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="mail" size={32} color="var(--primary)" strokeWidth={2} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Confirme seu e-mail</div>
        <div style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500, marginTop: 8, lineHeight: 1.5 }}>
          Enviamos um link de confirmação para{' '}
          <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{email}</span>.
          Clique nele para ativar sua conta e depois volte aqui.
        </div>
      </div>

      {msg && <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1B9E6A', textAlign: 'center' }}>{msg}</div>}
      {erro && <div style={{ fontSize: 12.5, fontWeight: 700, color: '#D63A55', textAlign: 'center' }}>{erro}</div>}

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BotaoPrimario type="button" onClick={jaConfirmei} disabled={carregando}>
          {carregando ? 'Verificando…' : 'Já confirmei, entrar'}
        </BotaoPrimario>
        <button type="button" onClick={reenviar} disabled={reenviando} style={{
          width: '100%', padding: '12px', borderRadius: 14, border: '1.5px solid var(--linha)',
          background: 'var(--card)', color: 'var(--ink)', fontSize: 14, fontWeight: 700,
          cursor: reenviando ? 'default' : 'pointer', fontFamily: 'inherit',
        }}>{reenviando ? 'Reenviando…' : 'Reenviar e-mail'}</button>
        <button type="button" onClick={() => sairFirebase()} style={linkStyle}>Usar outra conta</button>
      </div>
    </Casca>
  );
}
