// onboarding.jsx — Tour animado com as principais features.

import React from 'react';
import { Icon } from '../ui/icons.jsx';

export function Onboarding({ onFim }) {
  const [slide, setSlide] = React.useState(0);
  const slides = [
    {
      id: 'welcome',
      cor1: '#D6C5FF', cor2: '#9B7BFF',
      titulo: 'Suas finanças,\nfinalmente claras',
      subtitulo: 'Em poucos minutos por mês, você passa a saber exatamente para onde seu dinheiro vai.',
      Ilustracao: IlustracaoBoasVindas,
    },
    {
      id: 'add',
      cor1: '#FFD7B5', cor2: '#FF9B6E',
      titulo: 'Adicione gastos\ne entradas em segundos',
      subtitulo: 'Marque se é saída ou entrada, escolha a categoria, parcele em até 24× — tudo na mesma tela.',
      Ilustracao: IlustracaoAdd,
    },
    {
      id: 'categorias',
      cor1: '#C8F0DC', cor2: '#3FCB9A',
      titulo: 'Veja para onde\nseu dinheiro vai',
      subtitulo: 'Gráficos por categoria, comparação com o mês anterior e tendência diária do quanto você gasta.',
      Ilustracao: IlustracaoCategorias,
    },
    {
      id: 'orcamento',
      cor1: '#FFD3DD', cor2: '#FF7AA8',
      titulo: 'Defina limites\nque fazem sentido',
      subtitulo: 'Crie um orçamento total ou por categoria.',
      Ilustracao: IlustracaoOrcamento,
    },
    {
      id: 'caixinhas',
      cor1: '#FCE7A8', cor2: '#E08A00',
      titulo: 'Guarde dinheiro\ncom propósito',
      subtitulo: 'Crie caixinhas para metas.',
      Ilustracao: IlustracaoCaixinhas,
    },
    {
      id: 'recorrentes',
      cor1: '#D0E4FF', cor2: '#5DA8FF',
      titulo: 'Recorrências\nautomáticas',
      subtitulo: 'Marque uma cobrança como recorrente e ela aparece nos próximos 12 meses, sem você precixar lembrar.',
      Ilustracao: IlustracaoRecorrentes,
    },
    {
      id: 'done',
      cor1: '#E2D8FF', cor2: '#6E4FF6',
      titulo: 'Tudo pronto.\nVamos começar?',
      subtitulo: 'Você pode rever este tour a qualquer momento em Perfil → Refazer tour.',
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
          }}>Pular</button>
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
              aria-label={`Ir para slide ${i + 1}`}
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
          {ultimo ? 'Começar' : 'Continuar'}
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
@keyframes preencherFatia {
  from { stroke-dashoffset: var(--len, 251); }
  to   { stroke-dashoffset: var(--off, 0); }
}
@keyframes barraSobe {
  from { transform: scaleY(0); }
  to   { transform: scaleY(1); }
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
@keyframes calendarioDestaca {
  0%, 100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(110,79,246,0.0); }
  50%      { transform: scale(1.12); box-shadow: 0 0 0 8px rgba(110,79,246,0.18); }
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
        }}>Saída</div>
        <div style={{
          flex: 1, textAlign: 'center', padding: '6px 0',
          fontSize: 11, fontWeight: 800, color: 'var(--ink)', position: 'relative',
        }}>Entrada</div>
      </div>

      {/* Valor */}
      <div style={{ textAlign: 'center', padding: '14px 0 6px' }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: 'var(--muted)',
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>Valor</div>
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

function IlustracaoCategorias({ cor }) {
  // Pizza animada com 4 fatias preenchendo em sequência
  const fatias = [
    { cor: '#FF9B6E', pct: 35, off: 0 },
    { cor: '#5DA8FF', pct: 25, off: 35 },
    { cor: '#9B7BFF', pct: 22, off: 60 },
    { cor: cor, pct: 18, off: 82 },
  ];
  const R = 38;
  const C = 2 * Math.PI * R; // ≈ 238.7

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

function IlustracaoOrcamento({ cor }) {
  return (
    <div style={{
      width: 220, background: 'var(--card)', borderRadius: 18,
      padding: 16, boxShadow: '0 10px 28px rgba(0,0,0,0.12)',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Orçamento mensal
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 2, letterSpacing: '-0.02em' }}>
        R$ 4.500,00
      </div>
      {/* Barra principal preenchendo */}
      <div style={{
        marginTop: 12, height: 10, background: 'var(--card-2)',
        borderRadius: 10, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', background: `linear-gradient(90deg, ${cor}, ${cor}AA)`,
          borderRadius: 10, width: '0%',
          animation: 'barraEnche 1.2s .2s forwards cubic-bezier(0.22, 1, 0.36, 1)',
          ['--pct']: '68%',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>
        <span>Gasto R$ 3,1k</span><span>68%</span>
      </div>

      {/* Sub-barras por categoria */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { c: '#FF9B6E', pct: '80%', nome: 'Alimentação' },
          { c: '#9B7BFF', pct: '55%', nome: 'Lazer' },
          { c: '#5DA8FF', pct: '40%', nome: 'Transporte' },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, animation: `subir .4s ${0.4 + i * 0.1}s both` }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: row.c }} />
            <div style={{ flex: 1, height: 5, background: 'var(--card-2)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: row.c, borderRadius: 4,
                width: '0%', animation: `barraEnche 1s ${0.5 + i * 0.15}s forwards cubic-bezier(0.22, 1, 0.36, 1)`,
                ['--pct']: row.pct,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IlustracaoCaixinhas({ cor }) {
  return (
    <div style={{ position: 'relative', width: 160, height: 140 }}>
      {/* Moedas caindo (looping) */}
      {[0, 0.7, 1.4].map((delay, i) => (
        <div key={i} style={{
          position: 'absolute', top: 0, left: 64, width: 24, height: 24,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFE9A8, #E08A00)',
          boxShadow: '0 4px 10px rgba(224,138,0,0.4), inset 0 -2px 0 rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 12, color: '#7a4a00',
          animation: `moedaCai 2.2s ${delay}s infinite ease-in`,
        }}>
          $
        </div>
      ))}

      {/* Cofre */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: 130, height: 90, borderRadius: '50% 50% 30% 30% / 45% 45% 35% 35%',
        background: 'var(--card)', boxShadow: '0 12px 28px rgba(0,0,0,0.16)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="piggy" size={56} color={cor} strokeWidth={2.2} />
        {/* Slot */}
        <div style={{
          position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
          width: 28, height: 5, borderRadius: 3, background: 'var(--linha)',
        }} />
      </div>

      {/* Barra de progresso meta */}
      <div style={{
        position: 'absolute', bottom: -14, left: 12, right: 12, height: 6,
        background: 'var(--card-2)', borderRadius: 6, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', background: cor, borderRadius: 6, width: '0%',
          animation: 'barraEnche 1.6s .3s forwards cubic-bezier(0.22, 1, 0.36, 1)',
          ['--pct']: '62%',
        }} />
      </div>
    </div>
  );
}

function IlustracaoRecorrentes({ cor }) {
  // Mini-calendário com dias destacados em cada mês
  return (
    <div style={{
      width: 180, background: 'var(--card)', borderRadius: 16,
      padding: 14, boxShadow: '0 10px 28px rgba(0,0,0,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon name="history" size={18} color={cor} strokeWidth={2.4} />
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>Netflix · R$ 39,90</div>
      </div>

      {/* 3 mini-calendários representando meses */}
      <div style={{ display: 'flex', gap: 6 }}>
        {['Mai', 'Jun', 'Jul'].map((mes, mi) => (
          <div key={mi} style={{
            flex: 1, background: 'var(--card-2)', borderRadius: 10, padding: '6px 4px',
            animation: `subir .4s ${0.15 * mi}s both`,
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textAlign: 'center', marginBottom: 4 }}>
              {mes}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2 }}>
              {Array.from({ length: 15 }, (_, i) => i).map((d) => {
                const destacado = d === 7;
                return (
                  <div key={d} style={{
                    width: '100%', aspectRatio: '1',
                    borderRadius: 3,
                    background: destacado ? cor : 'transparent',
                    animation: destacado
                      ? `calendarioDestaca 2.4s ${0.6 + mi * 0.3}s infinite`
                      : 'none',
                  }} />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IlustracaoPronto({ cor }) {
  // Checkmark sendo desenhado + confetes
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
