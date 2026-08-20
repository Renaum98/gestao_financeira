// onboarding.jsx — Tour animado com as principais funcionalidades.
//
// Estrutura enxuta: abertura + 3 pilares (lançar, analisar, planejar) + fim.
//
// Sobre as animações: o que faz um movimento parecer natural aqui não é a
// duração, é (1) ele vir da direção pra onde o usuário está indo, (2) as partes
// da tela entrarem escalonadas em vez de tudo junto, e (3) as curvas imitarem
// peso — acelerar caindo, desacelerar chegando. Por isso vários keyframes
// abaixo declaram `animation-timing-function` DENTRO dos passos: uma curva só
// pro ciclo inteiro faz moeda cair e quicar no mesmo ritmo, que é o que
// entregava a animação como animação.
//
// Classes `.tour-*` existem pra o bloco de prefers-reduced-motion no fim do
// KEYFRAMES conseguir desligar cada família de movimento sem apagar conteúdo.

import React from 'react';
import { MESES } from '../data.js';
import { Icon } from '../ui/icons.jsx';
import { MiniCartao } from './cartoes/CardCartao.jsx';
import { COR_AVISO } from '../lib/colors.js';
import { simboloMoeda } from '../lib/moeda.js';
import { useT } from '../lib/i18n.jsx';

export function Onboarding({ onFim }) {
  const t = useT();
  const [slide, setSlide] = React.useState(0);
  // Direção da última navegação: o slide novo entra do lado pra onde o dedo
  // está levando. Sem isso, voltar pelo indicador parecia avançar.
  const [dir, setDir] = React.useState(1);
  const irParaSlide = (i) => {
    setDir(i >= slide ? 1 : -1);
    setSlide(i);
  };
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
      id: 'cartoes',
      cor1: '#BFDCFF', cor2: '#5DA8FF',
      titulo: t('Cada compra na\nfatura certa'),
      subtitulo: t('Acompanhe o limite e veja em qual fatura cada compra entra.'),
      Ilustracao: IlustracaoCartoes,
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 var(--pad-x)' }}>
        {!ultimo && (
          <button onClick={onFim} style={{
            background: 'transparent', border: 'none', color: 'var(--muted)',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}>{t('Pular')}</button>
        )}
      </div>

      {/* `key` remonta o palco a cada slide — é o que reinicia as entradas.
          O deslocamento lateral sai de `--de`, então a mesma animação serve
          pros dois sentidos. */}
      <div
        key={s.id}
        className="tour-palco"
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '0 30px', textAlign: 'center',
          ['--de']: dir > 0 ? '30px' : '-30px',
          animation: 'slideEntra .44s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        {/* O quadro entra um respiro depois do palco e cresce do 0.94: o
            conteúdo chega "de trás", não de lado junto com o resto. */}
        <div style={{
          width: 240, height: 240, borderRadius: 60,
          background: `linear-gradient(135deg, ${s.cor1}, ${s.cor2})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
          boxShadow: `0 24px 48px ${s.cor2}55`,
          animation: 'quadroEntra .55s .04s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}>
          <div className="tour-loop" style={{
            position: 'absolute', top: -30, left: -30, width: 110, height: 110,
            borderRadius: '50%', background: 'rgba(255,255,255,0.22)',
            animation: 'flutua 7s ease-in-out infinite',
          }} />
          <div className="tour-loop" style={{
            position: 'absolute', bottom: -20, right: -20, width: 70, height: 70,
            borderRadius: '50%', background: 'rgba(255,255,255,0.16)',
            animation: 'flutua 9s ease-in-out infinite reverse',
          }} />
          <Ilustracao cor={s.cor2} />
        </div>

        {/* Escalonamento curto (70 ms entre as partes): o suficiente pra ler
            como sequência, curto o bastante pra não parecer lento. */}
        <div style={{
          fontSize: 28, fontWeight: 800, color: 'var(--ink)',
          letterSpacing: '-0.03em', marginTop: 36, whiteSpace: 'pre-line',
          lineHeight: 1.15,
          animation: 'subir .5s .13s both cubic-bezier(0.22, 1, 0.36, 1)',
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

      <div style={{ padding: '0 var(--pad-x) 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => irParaSlide(i)}
              aria-label={t('Ir para slide {n}', { n: i + 1 })}
              style={{
                width: i === slide ? 22 : 6, height: 6, borderRadius: 3,
                background: i === slide ? 'var(--primary)' : 'var(--linha)',
                // Propriedades nomeadas em vez de `all`: a largura estica com a
                // mesma curva das entradas e a cor troca junto, sem arrastar
                // qualquer outra coisa que mude no meio do caminho.
                transition:
                  'width .34s cubic-bezier(0.22, 1, 0.36, 1), background-color .28s ease',
                border: 'none', padding: 0, cursor: 'pointer',
              }}
            />
          ))}
        </div>
        <button
          className="tour-botao"
          onClick={() => (ultimo ? onFim() : irParaSlide(slide + 1))}
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
/* Entrada do slide: só desliza no eixo do gesto e clareia. O scale(0.96) que
   havia aqui empilhava um zoom por cima do movimento lateral — dois movimentos
   simultâneos na mesma coisa é o que dava a sensação de "pulo". */
@keyframes slideEntra {
  from { opacity: 0; transform: translate3d(var(--de, 30px), 0, 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
}
@keyframes quadroEntra {
  from { opacity: 0; transform: scale(0.94); }
  to   { opacity: 1; transform: scale(1); }
}
/* O cartão chega deitado e se levanta — o giro é pequeno (6°) porque o que se
   quer é a sugestão de um objeto sendo posto na mesa, não um cambalhota. */
@keyframes cartaoEntra {
  from { opacity: 0; transform: translate3d(-8px, 6px, 0) rotate(-6deg); }
  to   { opacity: 1; transform: translate3d(0, 0, 0) rotate(0deg); }
}
@keyframes subir {
  from { opacity: 0; transform: translate3d(0, 10px, 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
}
/* Bolhas do fundo: ciclo longo e deslocamento pequeno. Curto e amplo lê como
   tremor; a intenção é o quadro respirar. */
@keyframes flutua {
  0%, 100% { transform: translate(0, 0); }
  50%      { transform: translate(6px, -7px); }
}
/* Respirar é crescer e voltar. A versão anterior encolhia até 0.92 e apagava
   junto — parecia o elemento recuando, não vivo. */
@keyframes pulsa {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.035); }
}
@keyframes brilha {
  0%, 100% { transform: scale(0.75) rotate(-8deg); opacity: 0; }
  50%      { transform: scale(1.05) rotate(6deg);  opacity: 1; }
}
@keyframes contador {
  from { transform: translate3d(0, 8px, 0); opacity: 0; }
  to   { transform: translate3d(0, 0, 0);   opacity: 1; }
}
/* Fatia da pizza: cresce no próprio arco (o dasharray sai de zero), em vez de
   ser empurrada de baixo. Um anel não chega deslizando — ele é desenhado. */
@keyframes fatiaCresce {
  from { stroke-dasharray: 0 var(--c); opacity: 0.35; }
  to   { stroke-dasharray: var(--len) var(--c); opacity: 1; }
}
/* Curva com folga (y > 1) no passo: o seletor passa do destino e assenta,
   como um controle de verdade sob o dedo. */
@keyframes toggleSwap {
  0%, 42%  { transform: translateX(0); animation-timing-function: cubic-bezier(.34, 1.45, .5, 1); }
  50%, 92% { transform: translateX(calc(100% + 4px)); animation-timing-function: cubic-bezier(.34, 1.45, .5, 1); }
  100%     { transform: translateX(0); }
}
/* Peso: acelera na queda (ease-in), amortece na batida, dá um quique curto e
   some. Antes o ciclo inteiro tinha uma curva só e a moeda descia como se
   estivesse pendurada num fio. */
@keyframes moedaCai {
  0%   { transform: translateY(-72px) rotate(-18deg); opacity: 0; animation-timing-function: cubic-bezier(.45, 0, .85, .6); }
  18%  { opacity: 1; }
  55%  { transform: translateY(18px) rotate(8deg); animation-timing-function: cubic-bezier(.2, .7, .4, 1); }
  72%  { transform: translateY(6px) rotate(3deg); animation-timing-function: cubic-bezier(.5, 0, .7, 1); }
  88%  { transform: translateY(15px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(15px) rotate(0deg); opacity: 0; }
}
@keyframes barraEnche {
  from { width: 0%; }
  to   { width: var(--pct, 70%); }
}
@keyframes checkDesenha {
  from { stroke-dashoffset: 60; }
  to   { stroke-dashoffset: 0; }
}
/* Confete: sai rápido, gira o tempo todo e cai desacelerando pro fim — o
   giro é o que separa "papel picado" de "quadrado se movendo". */
@keyframes confete {
  0%   { transform: translate(0, 0) scale(0) rotate(0deg); opacity: 0; animation-timing-function: cubic-bezier(.12, .8, .3, 1); }
  22%  { transform: translate(var(--x), var(--y)) scale(1) rotate(140deg); opacity: 1; animation-timing-function: cubic-bezier(.45, 0, .75, 1); }
  100% { transform: translate(var(--xf), var(--yf)) scale(0.65) rotate(430deg); opacity: 0; }
}

/* Resposta ao toque: o botão afunda um pouco enquanto o dedo está nele. */
.tour-botao { transition: transform .16s cubic-bezier(.22, 1, .36, 1); }
.tour-botao:active { transform: scale(0.975); }

/* Quem pediu menos movimento fica com o conteúdo, sem o movimento. As
   entradas somem (o estado final delas já é o normal da página); os laços
   decorativos param onde o repouso é uma pose válida; e as partículas, cujo
   repouso é uma pilha no centro, saem de cena. As duas linhas do fim
   destravam o que só existe como estado final de animação: sem elas, o check
   ficaria sem traço e a barra de meta, vazia. */
@media (prefers-reduced-motion: reduce) {
  .tour-palco, .tour-palco *, .tour-loop, .tour-botao { animation: none !important; }
  .tour-particula { display: none !important; }
  .tour-botao:active { transform: none; }
  .tour-check { stroke-dashoffset: 0 !important; }
  .tour-barra { width: var(--pct, 70%) !important; }
}
`;

// ───────── Ilustrações ─────────

function IlustracaoBoasVindas({ cor }) {
  return (
    <div className="tour-loop" style={{
      position: 'relative', width: 120, height: 120,
      animation: 'pulsa 3.6s ease-in-out infinite',
    }}>
      <div style={{
        width: 120, height: 120, borderRadius: 36, background: 'var(--card)',
        boxShadow: '0 12px 28px rgba(0,0,0,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 56, fontWeight: 800, color: cor, letterSpacing: '-0.04em',
      }}>$</div>
      {/* Atrasos irregulares (0 · 0,65 · 1,5 · 2,3): em intervalos iguais os
          quatro brilhos viram um metrônomo. */}
      {[
        { top: -6, left: -10, delay: 0 },
        { top: -14, right: 4, delay: 0.65 },
        { bottom: -8, right: -10, delay: 1.5 },
        { bottom: 2, left: -12, delay: 2.3 },
      ].map((p, i) => (
        <div key={i} className="tour-loop" style={{
          position: 'absolute', ...p,
          animation: `brilha 3.2s ${p.delay}s ease-in-out infinite`,
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
  // Contagem no relógio do navegador (rAF), e não num setInterval de 40 ms: o
  // intervalo fixo entrega ~25 quadros por segundo e a subida sai picotada. A
  // curva é a mesma das entradas — dispara e desacelera até o valor.
  React.useEffect(() => {
    const alvo = 8990;
    const duracao = 1100;
    const menosMovimento =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (menosMovimento) { setVal(alvo); return; }

    let quadro = 0;
    const inicio = performance.now();
    const passo = (agora) => {
      const p = Math.min(1, (agora - inicio) / duracao);
      const suave = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(alvo * suave));
      if (p < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
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
        <div className="tour-loop" style={{
          position: 'absolute', top: 3, left: 3, bottom: 3,
          width: 'calc(50% - 3px)', borderRadius: 8, background: cor,
          // Sem curva aqui: cada passo do keyframe traz a sua.
          animation: 'toggleSwap 4.4s infinite',
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
          <span style={{ fontSize: 16, color: 'var(--muted)', marginRight: 4 }}>
            {simboloMoeda()}
          </span>
          {reais},{cent}
        </div>
      </div>

      {/* Categorias mini */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4 }}>
        {['#FF9B6E', '#5DA8FF', '#9B7BFF', '#3FCB9A'].map((c, i) => (
          <div key={i} style={{
            width: 22, height: 22, borderRadius: 7, background: `${c}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: `contador .42s ${0.28 + 0.07 * i}s both cubic-bezier(0.22, 1, 0.36, 1)`,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Espelha a linha da tela de Cartões: a mesma miniatura (importada de lá, não
// redesenhada — cartão falso feito à mão aqui envelheceria sozinho quando o
// desenho de verdade mudasse), o valor comprometido, a barra de limite e o
// ciclo. O mês é o corrente, então o exemplo nunca aparece defasado.
function IlustracaoCartoes({ cor }) {
  const t = useT();
  const mesAtual = t(MESES[new Date().getMonth()]);

  return (
    <div style={{
      width: 200, background: 'var(--card)', borderRadius: 18,
      padding: 14, boxShadow: '0 10px 28px rgba(0,0,0,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          transformOrigin: 'left center',
          animation: 'cartaoEntra .55s .12s both cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          <MiniCartao cor={cor} />
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
          <div style={{
            fontSize: 19, fontWeight: 800, color: 'var(--ink)',
            letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
          }}>
            <span style={{ fontSize: 12, color: 'var(--muted)', marginRight: 3 }}>
              {simboloMoeda()}
            </span>
            1.240
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--muted)', marginTop: 1 }}>
            {t('Fecha dia {dia}', { dia: 8 })}
          </div>
        </div>
      </div>

      {/* Barra de limite — mesma leitura da tela: quanto da fatura aberta já
          comeu o limite. */}
      <div style={{
        height: 6, background: 'var(--card-2)', borderRadius: 4,
        overflow: 'hidden', marginTop: 12,
      }}>
        <div className="tour-barra" style={{
          height: '100%', background: `linear-gradient(90deg, ${cor}, ${cor}AA)`,
          borderRadius: 4, width: '0%',
          animation: 'barraEnche 1.1s .45s forwards cubic-bezier(0.22, 1, 0.36, 1)',
          ['--pct']: '62%',
        }} />
      </div>

      <div style={{
        marginTop: 10, display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 5, padding: '6px 10px',
        borderRadius: 999, background: 'var(--card-2)',
        animation: 'contador .45s .6s both cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        <Icon name="card" size={12} color="var(--muted)" strokeWidth={2.2} />
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>
          {t('Fatura de {mes}', { mes: mesAtual })}
        </span>
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
                // O keyframe lê estes dois: a fatia é desenhada de 0 até o
                // próprio comprimento. Sem a animação (menos movimento), o
                // dasharray inline já deixa a pizza inteira na tela.
                ['--len']: len,
                ['--c']: C,
                animation: `fatiaCresce .5s ${0.1 + 0.11 * i}s both cubic-bezier(0.22, 1, 0.36, 1)`,
              }}
            />
          );
        })}
        <circle cx="50" cy="50" r={26} fill="var(--card)" />
        <text
          x="50" y="54" textAnchor="middle"
          fontSize="14" fontWeight="800" fill="var(--ink)"
          style={{ animation: 'contador .5s .6s both cubic-bezier(0.22, 1, 0.36, 1)' }}
        >{simboloMoeda()}3,4k</text>
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
      {[0, 0.9, 1.9].map((delay, i) => (
        <div key={i} className="tour-particula" style={{
          position: 'absolute', top: 0, left: 78, width: 22, height: 22,
          borderRadius: '50%',
          background: `linear-gradient(135deg, #FFE9A8, ${COR_AVISO})`,
          boxShadow: '0 4px 10px rgba(224,138,0,0.4), inset 0 -2px 0 rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 11, color: '#7a4a00',
          // Sem curva no atalho: a queda, a batida e o quique têm cada um a
          // sua, declaradas nos passos do keyframe.
          animation: `moedaCai 2.8s ${delay}s infinite`,
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
          <div className="tour-barra" style={{
            height: '100%', background: `linear-gradient(90deg, ${cor}, ${cor}AA)`,
            borderRadius: 4, width: '0%',
            animation: 'barraEnche 1.1s .35s forwards cubic-bezier(0.22, 1, 0.36, 1)',
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
      {/* Atrasos fora de compasso e durações ligeiramente diferentes: cinco
          confetes no mesmo ritmo parecem um só, repetido. */}
      {[
        { x: '-50px', y: '-30px', xf: '-70px', yf: '60px', delay: 0.25, dur: 2.1, c: '#FF9B6E' },
        { x: '40px', y: '-40px', xf: '60px', yf: '50px', delay: 0.55, dur: 2.4, c: '#5DA8FF' },
        { x: '-30px', y: '40px', xf: '-50px', yf: '90px', delay: 0.95, dur: 2.2, c: '#3FCB9A' },
        { x: '50px', y: '30px', xf: '70px', yf: '80px', delay: 1.35, dur: 2.5, c: '#FFD93B' },
        { x: '0px', y: '-50px', xf: '20px', yf: '70px', delay: 1.7, dur: 2.3, c: '#FF7AA8' },
      ].map((c, i) => (
        <div key={i} className="tour-particula" style={{
          position: 'absolute', top: '50%', left: '50%', width: 10, height: 10,
          borderRadius: 3, background: c.c,
          animation: `confete ${c.dur}s ${c.delay}s infinite`,
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
            className="tour-check"
            d="M7 12.5l3.2 3.2L17 8.5"
            stroke={cor} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={60} strokeDashoffset={60}
            style={{ animation: 'checkDesenha .62s .2s forwards cubic-bezier(0.34, 1, 0.4, 1)' }}
          />
        </svg>
      </div>
    </div>
  );
}
