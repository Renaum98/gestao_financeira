// onboarding.jsx — Tour animado com as principais funcionalidades.
//
// Estrutura enxuta: abertura + 3 pilares (lançar, analisar, planejar) + fim.
// Animações mantidas no mesmo nível visual do tour anterior.

import React from 'react';
import { Icon } from '../ui/icons.jsx';
import { COR_AVISO } from '../lib/colors.js';
import { useT } from '../lib/i18n.jsx';

export function Onboarding({ onFim }) {
  const t = useT();
  const [slide, setSlide] = React.useState(0);
  const slides = [
    {
      id: 'welcome',
      cor1: '#D6C5FF', cor2: '#9B7BFF',
      titulo: t('Suas finanças,\nfinalmente claras'),
      subtitulo: t('Tenha controle completo em poucos minutos por mês.'),
      Ilustracao: IlustracaoBoasVindas,
    },
    {
      id: 'lancar',
      cor1: '#FFD7B5', cor2: '#FF9B6E',
      titulo: t('Lance gastos\ne entradas'),
      subtitulo: t('Categorize ou marque como recorrente — tudo em segundos.'),
      Ilustracao: IlustracaoAdd,
    },
    {
      id: 'analisar',
      cor1: '#C8F0DC', cor2: '#3FCB9A',
      titulo: t('Veja para onde\nseu dinheiro vai'),
      subtitulo: t('Gráficos, evolução mensal e comparações automáticas.'),
      Ilustracao: IlustracaoAnalise,
    },
    {
      id: 'planejar',
      cor1: '#FCE7A8', cor2: COR_AVISO,
      titulo: t('Planeje e guarde\npara suas metas'),
      subtitulo: t('Defina orçamentos e crie caixinhas pra alcançar seus objetivos.'),
      Ilustracao: IlustracaoPlanejar,
    },
    {
      id: 'done',
      cor1: '#E2D8FF', cor2: '#6E4FF6',
      titulo: t('Tudo pronto.\nVamos começar?'),
      subtitulo: t('Você pode rever este tour em Perfil → Refazer tour.'),
      Ilustracao: IlustracaoPronto,
    },
  ];
  const s = slides[slide];
  const ultimo = slide === slides.length - 1;
  const Ilustracao = s.Ilustracao;

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', paddingTop: 60,
    }}>
      <style>{KEYFRAMES}</style>

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 20px' }}>
        {!ultimo && (
          <button onClick={onFim} style={{
            background: 'transparent', border: 'none', color: 'var(--muted)',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}>{t('Pular')}</button>
        )}
      </div>

      <div
        key={s.id}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '0 30px', textAlign: 'center',
          animation: 'slideEntra .4s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div style={{
          width: 240, height: 240, borderRadius: 60,
          background: `linear-gradient(135deg, ${s.cor1}, ${s.cor2})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
          boxShadow: `0 24px 48px ${s.cor2}55`,
        }}>
          <div style={{
            position: 'absolute', top: -30, left: -30, width: 110, height: 110,
            borderRadius: '50%', background: 'rgba(255,255,255,0.22)',
            animation: 'flutua 4s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', bottom: -20, right: -20, width: 70, height: 70,
            borderRadius: '50%', background: 'rgba(255,255,255,0.16)',
            animation: 'flutua 4s ease-in-out infinite reverse',
          }} />
          <Ilustracao cor={s.cor2} />
        </div>

        <div style={{
          fontSize: 28, fontWeight: 800, color: 'var(--ink)',
          letterSpacing: '-0.03em', marginTop: 36, whiteSpace: 'pre-line',
          lineHeight: 1.15,
          animation: 'subir .5s .1s both cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          {s.titulo}
        </div>
        <div style={{
          fontSize: 15, color: 'var(--muted)', fontWeight: 500,
          marginTop: 12, lineHeight: 1.45, maxWidth: 360,
          animation: 'subir .5s .2s both cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          {s.subtitulo}
        </div>
      </div>

      <div style={{ padding: '0 20px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              aria-label={t('Ir para slide {n}', { n: i + 1 })}
              style={{
                width: i === slide ? 22 : 6, height: 6, borderRadius: 3,
                background: i === slide ? 'var(--primary)' : 'var(--linha)',
                transition: 'all .25s', border: 'none', padding: 0,
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
        <button
          onClick={() => (ultimo ? onFim() : setSlide(slide + 1))}
          style={{
            width: '100%', padding: '16px', borderRadius: 16,
            background: 'var(--ink)', color: 'var(--bg)', border: 'none',
            fontSize: 15, fontWeight: 800, cursor: 'pointer',
            letterSpacing: '-0.01em', fontFamily: 'inherit',
          }}
        >
          {ultimo ? t('Começar') : t('Continuar')}
        </button>
      </div>
    </div>
  );
}

const KEYFRAMES = `
@keyframes slideEntra {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes subir {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes flutua {
  0%, 100% { transform: translate(0, 0); }
  50%      { transform: translate(8px, -8px); }
}
@keyframes pulsa {
  0%, 100% { transform: scale(1);    opacity: 1; }
  50%      { transform: scale(0.92); opacity: 0.85; }
}
@keyframes brilha {
  0%, 100% { transform: scale(0.6); opacity: 0; }
  50%      { transform: scale(1);   opacity: 1; }
}
@keyframes contador {
  from { transform: translateY(8px); opacity: 0; }
  to   { transform: translateY(0);   opacity: 1; }
}
@keyframes toggleSwap {
  0%, 45%   { transform: translateX(0); }
  50%, 95%  { transform: translateX(calc(100% + 4px)); }
  100%      { transform: translateX(0); }
}
@keyframes moedaCai {
  0%   { transform: translateY(-80px) rotate(-20deg); opacity: 0; }
  20%  { opacity: 1; }
  60%  { transform: translateY(20px) rotate(10deg); }
  80%  { transform: translateY(14px) rotate(0deg); }
  100% { transform: translateY(18px) rotate(0deg); opacity: 0; }
}
@keyframes barraEnche {
  from { width: 0%; }
  to   { width: var(--pct, 70%); }
}
@keyframes checkDesenha {
  from { stroke-dashoffset: 60; }
  to   { stroke-dashoffset: 0; }
}
@keyframes confete {
  0%   { transform: translate(0, 0) scale(0); opacity: 0; }
  20%  { opacity: 1; transform: translate(var(--x), var(--y)) scale(1); }
  100% { transform: translate(var(--xf), var(--yf)) scale(0.6); opacity: 0; }
}
`;

// ───────── Ilustrações ─────────

function IlustracaoBoasVindas({ cor }) {
  return (
    <div style={{
      position: 'relative', width: 120, height: 120,
      animation: 'pulsa 2.4s ease-in-out infinite',
    }}>
      <div style={{
        width: 120, height: 120, borderRadius: 36, background: 'var(--card)',
        boxShadow: '0 12px 28px rgba(0,0,0,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 56, fontWeight: 800, color: cor, letterSpacing: '-0.04em',
      }}>$</div>
      {[
        { top: -6, left: -10, delay: 0 },
        { top: -14, right: 4, delay: 0.5 },
        { bottom: -8, right: -10, delay: 1 },
        { bottom: 2, left: -12, delay: 1.6 },
      ].map((p, i) => (
        <div key={i} style={{
          position: 'absolute', ...p,
          animation: `brilha 2s ${p.delay}s ease-in-out infinite`,
        }}>
          <Icon name="sparkle" size={18} color="#fff" strokeWidth={2.4} />
        </div>
      ))}
    </div>
  );
}

function IlustracaoAdd({ cor }) {
  const t = useT();
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    const alvo = 8990;
    let v = 0;
    const id = setInterval(() => {
      v += Math.max(50, Math.floor((alvo - v) / 8));
      if (v >= alvo) { v = alvo; clearInterval(id); }
      setVal(v);
    }, 40);
    return () => clearInterval(id);
  }, []);
  const reais = Math.floor(val / 100);
  const cent = String(val % 100).padStart(2, '0');

  return (
    <div style={{
      width: 200, background: 'var(--card)', borderRadius: 18,
      padding: 14, boxShadow: '0 10px 28px rgba(0,0,0,0.12)',
    }}>
      {/* Toggle Saída/Entrada animado */}
      <div style={{
        position: 'relative', display: 'flex',
        background: 'var(--card-2)', borderRadius: 10, padding: 3,
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          position: 'absolute', top: 3, left: 3, bottom: 3,
          width: 'calc(50% - 3px)', borderRadius: 8, background: cor,
          animation: 'toggleSwap 4s ease-in-out infinite',
        }} />
        <div style={{
          flex: 1, textAlign: 'center', padding: '6px 0',
          fontSize: 11, fontWeight: 800, color: 'var(--ink)', position: 'relative',
        }}>{t('Saída')}</div>
        <div style={{
          flex: 1, textAlign: 'center', padding: '6px 0',
          fontSize: 11, fontWeight: 800, color: 'var(--ink)', position: 'relative',
        }}>{t('Entrada')}</div>
      </div>

      {/* Valor */}
      <div style={{ textAlign: 'center', padding: '14px 0 6px' }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: 'var(--muted)',
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>{t('Valor')}</div>
        <div style={{
          fontSize: 30, fontWeight: 800, color: 'var(--ink)',
          letterSpacing: '-0.03em', marginTop: 2, fontVariantNumeric: 'tabular-nums',
        }}>
          <span style={{ fontSize: 16, color: 'var(--muted)', marginRight: 4 }}>R$</span>
          {reais},{cent}
        </div>
      </div>

      {/* Categorias mini */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4 }}>
        {['#FF9B6E', '#5DA8FF', '#9B7BFF', '#3FCB9A'].map((c, i) => (
          <div key={i} style={{
            width: 22, height: 22, borderRadius: 7, background: `${c}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: `contador .4s ${0.1 * i}s both`,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function IlustracaoAnalise({ cor }) {
  // Pizza animada com 4 fatias preenchendo em sequência.
  const fatias = [
    { cor: '#FF9B6E', pct: 35, off: 0 },
    { cor: '#5DA8FF', pct: 25, off: 35 },
    { cor: '#9B7BFF', pct: 22, off: 60 },
    { cor: cor, pct: 18, off: 82 },
  ];
  const R = 38;
  const C = 2 * Math.PI * R;

  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      <svg viewBox="0 0 100 100" width={140} height={140}>
        {fatias.map((f, i) => {
          const len = (f.pct / 100) * C;
          return (
            <circle
              key={i}
              cx="50" cy="50" r={R} fill="none"
              stroke={f.cor} strokeWidth={14} strokeLinecap="butt"
              strokeDasharray={`${len} ${C}`}
              strokeDashoffset={-((f.off / 100) * C)}
              transform="rotate(-90 50 50)"
              style={{
                opacity: 0,
                animation: `subir .5s ${0.15 * i}s both`,
                transformOrigin: 'center',
              }}
            />
          );
        })}
        <circle cx="50" cy="50" r={26} fill="var(--card)" />
        <text
          x="50" y="54" textAnchor="middle"
          fontSize="14" fontWeight="800" fill="var(--ink)"
          style={{ animation: 'contador .5s .8s both' }}
        >R$3,4k</text>
      </svg>
    </div>
  );
}

function IlustracaoPlanejar({ cor }) {
  // Combina o cofrinho (caixinhas) com uma barra de progresso (orçamento) —
  // representa visualmente as duas funcionalidades de planejamento.
  const t = useT();
  return (
    <div style={{ position: 'relative', width: 180, height: 160 }}>
      {/* Moedas caindo (looping) */}
      {[0, 0.7, 1.4].map((delay, i) => (
        <div key={i} style={{
          position: 'absolute', top: 0, left: 78, width: 22, height: 22,
          borderRadius: '50%',
          background: `linear-gradient(135deg, #FFE9A8, ${COR_AVISO})`,
          boxShadow: '0 4px 10px rgba(224,138,0,0.4), inset 0 -2px 0 rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 11, color: '#7a4a00',
          animation: `moedaCai 2.2s ${delay}s infinite ease-in`,
        }}>
          $
        </div>
      ))}

      {/* Cofre */}
      <div style={{
        position: 'absolute', top: 36, left: '50%', transform: 'translateX(-50%)',
        width: 120, height: 80, borderRadius: '50% 50% 30% 30% / 45% 45% 35% 35%',
        background: 'var(--card)', boxShadow: '0 12px 28px rgba(0,0,0,0.16)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="piggy" size={50} color={cor} strokeWidth={2.2} />
        {/* Slot */}
        <div style={{
          position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
          width: 26, height: 5, borderRadius: 3, background: 'var(--linha)',
        }} />
      </div>

      {/* Barra de progresso do orçamento — embaixo do cofre */}
      <div style={{
        position: 'absolute', bottom: 6, left: 4, right: 4,
        background: 'var(--card)', borderRadius: 12, padding: '8px 12px',
        boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 9, fontWeight: 700, color: 'var(--muted)', marginBottom: 4,
        }}>
          <span>{t('Meta')}</span>
          <span>70%</span>
        </div>
        <div style={{
          height: 6, background: 'var(--card-2)', borderRadius: 4, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', background: `linear-gradient(90deg, ${cor}, ${cor}AA)`,
            borderRadius: 4, width: '0%',
            animation: 'barraEnche 1.4s .3s forwards cubic-bezier(0.22, 1, 0.36, 1)',
            ['--pct']: '70%',
          }} />
        </div>
      </div>
    </div>
  );
}

function IlustracaoPronto({ cor }) {
  // Checkmark sendo desenhado + confetes.
  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      {/* Confetes */}
      {[
        { x: '-50px', y: '-30px', xf: '-70px', yf: '60px', delay: 0.2, c: '#FF9B6E' },
        { x: '40px', y: '-40px', xf: '60px', yf: '50px', delay: 0.4, c: '#5DA8FF' },
        { x: '-30px', y: '40px', xf: '-50px', yf: '90px', delay: 0.6, c: '#3FCB9A' },
        { x: '50px', y: '30px', xf: '70px', yf: '80px', delay: 0.8, c: '#FFD93B' },
        { x: '0px', y: '-50px', xf: '20px', yf: '70px', delay: 1.0, c: '#FF7AA8' },
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute', top: '50%', left: '50%', width: 10, height: 10,
          borderRadius: 3, background: c.c,
          animation: `confete 1.8s ${c.delay}s ease-out infinite`,
          ['--x']: c.x, ['--y']: c.y, ['--xf']: c.xf, ['--yf']: c.yf,
        }} />
      ))}

      {/* Círculo do check */}
      <div style={{
        width: 120, height: 120, borderRadius: '50%', background: 'var(--card)',
        boxShadow: '0 14px 32px rgba(0,0,0,0.16)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '10px auto',
      }}>
        <svg width={64} height={64} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill={cor} opacity="0.15" />
          <path
            d="M7 12.5l3.2 3.2L17 8.5"
            stroke={cor} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={60} strokeDashoffset={60}
            style={{ animation: 'checkDesenha .7s .15s forwards cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </svg>
      </div>
    </div>
  );
}
