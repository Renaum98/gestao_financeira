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
import { LogoAzulejo } from '../ui/logo-animado.jsx';
import { vibrar } from '../lib/haptics.js';
import { COR_POS, COR_NEG } from '../lib/colors.js';
import { useT } from '../lib/i18n.jsx';
import {
  msRestantes,
  registrarTentativa,
  limparTentativas,
  formatarEspera,
  ACAO_LOGIN,
  ACAO_CADASTRO,
  ACAO_RECUPERAR,
} from '../lib/rate-limit-auth.js';

const EMAIL_OK = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e || '').trim());
const SENHA_OK = (s) => (s || '').length >= 8 && /[a-zA-Z]/.test(s) && /[0-9]/.test(s);

// Erros que representam um palpite errado de credencial — os únicos que contam
// pra trava. `too-many-requests` entra porque é o próprio Firebase dizendo que
// já viu tentativas demais: seguimos o freio dele em vez de insistir.
const CODIGOS_DE_PALPITE = new Set([
  'auth/invalid-credential',
  'auth/wrong-password',
  'auth/user-not-found',
  'auth/too-many-requests',
]);

// Qual trava vale em cada modo da tela.
const ACAO_DO_MODO = {
  entrar: ACAO_LOGIN,
  cadastrar: ACAO_CADASTRO,
  recuperar: ACAO_RECUPERAR,
};

// Um formulário preenchido em menos de MS_MINIMO não foi preenchido por gente.
// Vale só pro cadastro: ali são três campos, e nem o gerenciador de senhas
// preenche nome + e-mail + senha nova em dois segundos. No login o contrário é
// comum — autofill e Enter fecham em menos de um segundo — e travar isso seria
// punir o uso normal.
const MS_MINIMO = 2500;

// O campo-armadilha. Fica fora da tela e sem foco possível, então ninguém que
// esteja de fato olhando a tela o preenche; um bot que varre os inputs do
// formulário e escreve em todos, sim. É a peneira mais barata que existe — pega
// só o robô preguiçoso, mas não custa nada e não atrapalha ninguém.
const NOME_ARMADILHA = 'sobrenome-do-meio';
const estiloArmadilha = {
  position: 'absolute',
  left: '-9999px',
  width: 1,
  height: 1,
  opacity: 0,
  pointerEvents: 'none',
};

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

// Campo de senha com botão olho pra mostrar/esconder o que está sendo digitado.
// Reaproveita o `inputStyle` base e adiciona padding extra à direita pra não
// sobrepor o ícone.
function CampoSenha({ label, value, onChange, ...props }) {
  const t = useT();
  const [mostrar, setMostrar] = React.useState(false);
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, paddingLeft: 2 }}>{label}</div>
      <div style={{ position: 'relative' }}>
        <input
          {...props}
          type={mostrar ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          style={{ ...inputStyle, paddingRight: 44 }}
        />
        <button
          type="button"
          onClick={() => setMostrar((v) => !v)}
          aria-label={mostrar ? t('Esconder senha') : t('Mostrar senha')}
          aria-pressed={mostrar}
          tabIndex={-1}
          style={{
            position: 'absolute',
            right: 6, top: '50%', transform: 'translateY(-50%)',
            width: 36, height: 36, borderRadius: 10,
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--muted)',
          }}
        >
          <Icon name={mostrar ? 'eye-off' : 'eye'} size={18} strokeWidth={2} />
        </button>
      </div>
    </label>
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
      background: props.disabled ? 'var(--linha)' : 'var(--primary-degrade)',
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
  const t = useT();
  const [modo, setModo] = React.useState('entrar'); // 'entrar' | 'cadastrar' | 'recuperar'
  const [nome, setNome] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [senha, setSenha] = React.useState('');
  const [carregando, setCarregando] = React.useState(false);
  const [erro, setErro] = React.useState('');
  const [info, setInfo] = React.useState('');
  // Quanto falta pra destravar esta ação para este e-mail (0 = liberado).
  const [esperaMs, setEsperaMs] = React.useState(0);
  // Campo-armadilha: só bot escreve aqui.
  const [armadilha, setArmadilha] = React.useState('');
  // Quando o modo atual entrou na tela — base do tempo mínimo de preenchimento.
  const entradaEm = React.useRef(Date.now());

  const acao = ACAO_DO_MODO[modo];

  // Reavalia a cada segundo pra o contador andar sozinho e o botão liberar na
  // hora certa, sem depender de o usuário mexer em nada. Quando não há bloqueio
  // o valor continua 0 e o React nem re-renderiza.
  React.useEffect(() => {
    const atualizar = () => setEsperaMs(msRestantes(acao, email));
    atualizar();
    const id = setInterval(atualizar, 1000);
    return () => clearInterval(id);
  }, [acao, email]);

  const limpar = () => { setErro(''); setInfo(''); };
  const trocarModo = (m) => {
    setModo(m);
    setSenha('');
    setArmadilha('');
    entradaEm.current = Date.now();
    limpar();
  };

  const validar = () => {
    if (!EMAIL_OK(email)) return 'Digite um e-mail válido.';
    if (modo === 'recuperar') return null;
    if (modo === 'cadastrar' && !nome.trim()) return 'Digite seu nome.';
    if (!senha) return 'Digite a senha.';
    if (modo === 'cadastrar' && !SENHA_OK(senha))
      return 'A senha precisa ter ao menos 8 caracteres, com letras e números.';
    return null;
  };

  // `validar` e `msgErro` devolvem as strings em português (chaves do
  // dicionário); traduzimos no momento de exibir.

  const enviar = async (e) => {
    e?.preventDefault();
    limpar();

    // As duas peneiras de bot vêm antes de tudo, inclusive da validação: se for
    // robô, não gastamos nem uma chamada ao Firebase. A recusa usa a mensagem
    // genérica de propósito — dizer "você caiu na armadilha" é ensinar a
    // desviar dela.
    const suspeito =
      armadilha !== '' ||
      (modo === 'cadastrar' && Date.now() - entradaEm.current < MS_MINIMO);
    if (suspeito) { setErro(t('Algo deu errado. Tente novamente.')); return; }

    const v = validar();
    if (v) { setErro(t(v)); return; }

    const bloqueado = msRestantes(acao, email);
    if (bloqueado > 0) {
      setEsperaMs(bloqueado);
      setErro(t('Muitas tentativas. Aguarde {tempo}.', { tempo: formatarEspera(bloqueado) }));
      return;
    }

    // Cadastro e recuperação contam o envio aqui, antes da chamada: o que
    // limitamos nessas duas é o sucesso — uma conta criada, um e-mail enviado —
    // e não o erro. No login é o contrário, e a contagem fica no catch.
    if (modo !== 'entrar') setEsperaMs(registrarTentativa(acao, email));

    vibrar();
    setCarregando(true);
    try {
      if (modo === 'recuperar') {
        await redefinirSenha(email.trim());
        setInfo(t('Enviamos um link para redefinir sua senha. Confira seu e-mail.'));
      } else if (modo === 'cadastrar') {
        await criarConta(nome.trim(), email.trim(), senha);
        // onAuthStateChanged dispara → o app mostra a tela de verificação de e-mail.
      } else {
        await entrarFirebase(email.trim(), senha);
        limparTentativas(ACAO_LOGIN, email);
        // onAuthStateChanged dispara; se o e-mail não estiver confirmado,
        // o app mostra a tela de verificação.
      }
    } catch (err) {
      // Só conta como tentativa o que é palpite de credencial. Erro de rede ou
      // e-mail malformado não é ataque e não pode travar quem está sem sinal.
      if (modo === 'entrar' && CODIGOS_DE_PALPITE.has(err?.code)) {
        const restante = registrarTentativa(ACAO_LOGIN, email);
        setEsperaMs(restante);
        if (restante > 0) {
          setErro(t('Muitas tentativas. Aguarde {tempo}.', { tempo: formatarEspera(restante) }));
          setCarregando(false);
          return;
        }
      }
      setErro(t(msgErro(err?.code)));
      setCarregando(false);
    }
  };

  const travado = esperaMs > 0;
  const titulo = modo === 'cadastrar' ? 'Criar conta' : modo === 'recuperar' ? 'Recuperar senha' : 'Entrar';
  const subtitulo = modo === 'cadastrar'
    ? 'Crie sua conta para começar a organizar suas finanças.'
    : modo === 'recuperar'
      ? 'Digite seu e-mail e enviaremos um link para redefinir a senha.'
      : 'Bem-vindo de volta. Acesse sua conta.';

  return (
    <Casca>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
        <LogoAzulejo />
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.03em' }}>{t(titulo)}</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500, marginTop: 6, lineHeight: 1.45, maxWidth: 300 }}>{t(subtitulo)}</div>
        </div>
      </div>

      <form onSubmit={enviar} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Armadilha: escondida da tela e do teclado, e sem rótulo traduzido —
            o nome do campo é o que o bot lê. aria-hidden + tabIndex -1 mantêm
            leitor de tela e navegação por Tab longe dela. */}
        <input
          type="text"
          name={NOME_ARMADILHA}
          value={armadilha}
          onChange={(e) => setArmadilha(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={estiloArmadilha}
        />
        {modo === 'cadastrar' && (
          <Campo label={t("Nome")} type="text" autoComplete="name" placeholder={t("Como quer ser chamado(a)?")}
            value={nome} onChange={(e) => setNome(e.target.value)} />
        )}
        <Campo label={t("E-mail")} type="email" autoComplete="email" inputMode="email" placeholder="voce@email.com"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        {modo !== 'recuperar' && (
          <CampoSenha label={t("Senha")}
            autoComplete={modo === 'cadastrar' ? 'new-password' : 'current-password'}
            placeholder={modo === 'cadastrar' ? t('Mín. 8 caracteres, letras e números') : t('Sua senha')}
            value={senha} onChange={(e) => setSenha(e.target.value)} />
        )}
        {modo === 'cadastrar' && (
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, paddingLeft: 2, lineHeight: 1.4 }}>
            {t("Você receberá um e-mail de confirmação. A conta só é ativada depois que você clicar no link.")}
          </div>
        )}

        {erro && <div style={{ fontSize: 12.5, fontWeight: 700, color: COR_NEG }}>{erro}</div>}
        {info && <div style={{ fontSize: 12.5, fontWeight: 700, color: COR_POS }}>{info}</div>}

        <BotaoPrimario type="submit" disabled={carregando || travado}>
          {travado
            ? t('Aguarde {tempo}', { tempo: formatarEspera(esperaMs) })
            : carregando ? t('Aguarde…') : modo === 'cadastrar' ? t('Criar conta') : modo === 'recuperar' ? t('Enviar link') : t('Entrar')}
        </BotaoPrimario>

        {modo === 'entrar' && (
          <button type="button" onClick={() => trocarModo('recuperar')} style={linkStyle}>{t('Esqueci minha senha')}</button>
        )}
      </form>

      <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
        {modo === 'cadastrar' ? (
          <>{t('Já tem conta? ')}<button type="button" onClick={() => trocarModo('entrar')} style={linkInlineStyle}>{t('Entrar')}</button></>
        ) : modo === 'recuperar' ? (
          <button type="button" onClick={() => trocarModo('entrar')} style={linkInlineStyle}>{t('Voltar para o login')}</button>
        ) : (
          <>{t('Não tem conta? ')}<button type="button" onClick={() => trocarModo('cadastrar')} style={linkInlineStyle}>{t('Cadastre-se')}</button></>
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
  const t = useT();
  const [carregando, setCarregando] = React.useState(false);
  const [reenviando, setReenviando] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const [erro, setErro] = React.useState('');

  const jaConfirmei = async () => {
    setMsg(''); setErro(''); setCarregando(true);
    try {
      const u = await recarregarUsuario();
      if (u?.emailVerified) { vibrar(14); onAtualizar?.(u); }
      else setErro(t('Ainda não detectamos a confirmação. Abra o link do e-mail e tente de novo.'));
    } catch {
      setErro(t('Não foi possível verificar agora. Tente novamente.'));
    }
    setCarregando(false);
  };

  const reenviar = async () => {
    setMsg(''); setErro(''); setReenviando(true);
    try {
      await reenviarVerificacao();
      setMsg(t('E-mail de confirmação reenviado. Confira sua caixa de entrada (e o spam).'));
    } catch (err) {
      setErro(err?.code === 'auth/too-many-requests'
        ? t('Você pediu muitos e-mails. Aguarde alguns minutos.')
        : t('Não foi possível reenviar agora.'));
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
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{t('Confirme seu e-mail')}</div>
        <div style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500, marginTop: 8, lineHeight: 1.5 }}>
          {t('Enviamos um link de confirmação para')}{' '}
          <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{email}</span>{'. '}
          {t('Clique nele para ativar sua conta e depois volte aqui.')}
        </div>
      </div>

      {msg && <div style={{ fontSize: 12.5, fontWeight: 700, color: COR_POS, textAlign: 'center' }}>{msg}</div>}
      {erro && <div style={{ fontSize: 12.5, fontWeight: 700, color: COR_NEG, textAlign: 'center' }}>{erro}</div>}

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BotaoPrimario type="button" onClick={jaConfirmei} disabled={carregando}>
          {carregando ? t('Verificando…') : t('Já confirmei, entrar')}
        </BotaoPrimario>
        <button type="button" onClick={reenviar} disabled={reenviando} style={{
          width: '100%', padding: '12px', borderRadius: 14, border: '1.5px solid var(--linha)',
          background: 'var(--card)', color: 'var(--ink)', fontSize: 14, fontWeight: 700,
          cursor: reenviando ? 'default' : 'pointer', fontFamily: 'inherit',
        }}>{reenviando ? t('Reenviando…') : t('Reenviar e-mail')}</button>
        <button type="button" onClick={() => sairFirebase()} style={linkStyle}>{t('Usar outra conta')}</button>
      </div>
    </Casca>
  );
}
