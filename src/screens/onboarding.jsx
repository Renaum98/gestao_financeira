// onboarding.jsx — Tour animado com as principais funcionalidades.
//
// Estrutura enxuta: abertura + 5 pilares (lançar, cartões, analisar, planejar)
// + fim.
//
// Sobre as animações: tudo aqui é anime.js, no espírito do Motion — molas em
// vez de durações fixas, partes que entram escalonadas, e o slide que sai
// ANTES de o próximo entrar (em vez de um aparecer por cima do outro). O que
// faz um movimento parecer natural é (1) ele vir da direção pra onde o usuário
// está indo, (2) as partes chegarem em sequência e (3) as curvas imitarem peso:
// acelerar caindo, desacelerar chegando, passar um pouco do ponto e assentar.
//
// Regra do JSX: o estilo escrito em cada elemento é o estado FINAL. As
// animações partem de um estado inicial posto por `utils.set` dentro do
// useLayoutEffect (antes da pintura, então não pisca) e chegam nele. Com isso,
// quem pede menos movimento ou usa o modo leve simplesmente não roda animação
// nenhuma e vê o conteúdo pronto. A exceção são as partículas (moedas,
// confete), cujo repouso seria uma pilha no centro: elas nascem invisíveis e só
// a animação as mostra.
//
// O anime.js entra por import direto: este arquivo já é um chunk carregado sob
// demanda (lazy em app.jsx), então ele não pesa na abertura do app.

import React from 'react';
import { animate, createScope, spring, stagger, utils } from 'animejs';
import { MESES } from '../data.js';
import { Icon } from '../ui/icons.jsx';
import { MiniCartao } from './cartoes/CardCartao.jsx';
import { COR_AVISO, COR_POS } from '../lib/colors.js';
import { simboloMoeda } from '../lib/moeda.js';
import { modoLeve, semMovimento } from '../lib/anime.js';
import { useT } from '../lib/i18n.jsx';

const parado = () => semMovimento() || modoLeve();

// Molas nomeadas, pra o tour inteiro falar a mesma língua.
const MOLA = {
  // Palco e textos: chega firme, quase sem repique.
  suave: () => spring({ bounce: 0.18, duration: 650 }),
  // Quadro e peças que "pousam": passa do ponto e volta.
  pulo: () => spring({ bounce: 0.42, duration: 800 }),
  // Pequenas coisas que estalam (chips, botão).
  estalo: () => spring({ bounce: 0.5, duration: 550 }),
};

// Animações de um pedaço da tela, presas a ele: os seletores do `montar` só
// enxergam dentro do elemento da ref, e tudo é revertido quando ele desmonta
// (createScope do anime.js). `montar` pode devolver uma limpeza própria, pra o
// que o scope não conhece (timers). `deps` reinicia a cena.
function useCena(montar, deps = []) {
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    if (!ref.current || parado()) return;
    let limpar;
    const cena = createScope({ root: ref }).add(() => { limpar = montar(); });
    return () => {
      cena.revert();
      limpar?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

export function Onboarding({ onFim }) {
  const t = useT();
  const [slide, setSlide] = React.useState(0);
  // Direção da última navegação: o slide novo entra do lado pra onde o dedo
  // está levando. Sem isso, voltar pelo indicador parecia avançar. Ref porque
  // só a animação lê, e ela roda no efeito depois do render.
  const dir = React.useRef(1);
  const saindo = React.useRef(false);
  const palco = React.useRef(null);
  const pontos = React.useRef([]);
  const botao = React.useRef(null);

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

  // Saída antes da entrada: o palco atual escorrega pro lado oposto ao do
  // destino e apaga, rápido e acelerando (quem sai não precisa de mola), e só
  // então o slide troca. Cliques no meio da saída são ignorados.
  const irParaSlide = (i) => {
    if (i === slide || saindo.current) return;
    dir.current = i > slide ? 1 : -1;
    if (parado() || !palco.current) {
      setSlide(i);
      return;
    }
    saindo.current = true;
    animate(palco.current, {
      translateX: -dir.current * 48,
      opacity: 0,
      duration: 200,
      ease: 'inQuad',
      onComplete: () => {
        saindo.current = false;
        setSlide(i);
      },
    });
  };

  // Entrada do slide. O palco vem do lado do gesto; dentro dele o quadro pousa
  // com repique, as bolhas do fundo crescem e passam a boiar, e as linhas do
  // título e o subtítulo sobem uma a uma, saindo do desfoque. As ilustrações
  // cuidam da própria cena (cada uma tem seu useCena).
  React.useLayoutEffect(() => {
    const el = palco.current;
    if (!el || parado()) return;
    const cena = createScope({ root: palco }).add(() => {
      const d = dir.current;
      utils.set(el, { translateX: d * 60, opacity: 0 });
      utils.set('.m-quadro', { scale: 0.72, rotate: d * -8, opacity: 0 });
      utils.set('.m-bolha', { scale: 0 });
      utils.set('.m-texto', { translateY: 22, opacity: 0, filter: 'blur(5px)' });

      animate(el, { translateX: 0, opacity: 1, ease: MOLA.suave() });
      animate('.m-quadro', { scale: 1, rotate: 0, opacity: 1, delay: 40, ease: MOLA.pulo() });
      animate('.m-bolha', { scale: 1, delay: stagger(90, { start: 220 }), ease: MOLA.pulo() });
      // Boiar: ciclo longo e deslocamento pequeno. Curto e amplo lê como
      // tremor; a intenção é o quadro respirar.
      animate('.m-bolha', {
        translateX: 6,
        translateY: -7,
        duration: stagger(1400, { start: 3200 }),
        ease: 'inOutSine',
        loop: true,
        alternate: true,
      });
      animate('.m-texto', {
        translateY: 0,
        opacity: 1,
        filter: 'blur(0px)',
        delay: stagger(70, { start: 120 }),
        ease: MOLA.suave(),
      });
    });
    return () => cena.revert();
  }, [slide]);

  // Indicador: a pílula do slide atual estica e as outras encolhem, cada uma
  // numa mola. A largura é só do anime.js (o React não escreve `width` nos
  // pontos), senão o render já pintaria o destino e não haveria o que animar.
  React.useLayoutEffect(() => {
    pontos.current.forEach((p, i) => {
      if (!p) return;
      const w = i === slide ? 22 : 6;
      if (parado() || !p.style.width) p.style.width = `${w}px`;
      else animate(p, { width: w, ease: MOLA.estalo() });
    });
  }, [slide]);

  // Toque no botão: afunda enquanto o dedo está nele e volta com repique.
  const apertar = (fundo) => {
    if (parado() || !botao.current) return;
    animate(botao.current, fundo
      ? { scale: 0.96, duration: 120, ease: 'outQuad' }
      : { scale: 1, ease: MOLA.estalo() });
  };

  const linhas = s.titulo.split('\n');

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', paddingTop: 60, overflow: 'hidden',
    }}>
      <style>{CAMADAS}</style>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 var(--pad-x)' }}>
        {!ultimo && (
          <button onClick={onFim} style={{
            background: 'transparent', border: 'none', color: 'var(--muted)',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}>{t('Pular')}</button>
        )}
      </div>

      {/* `key` remonta o palco a cada slide — é o que reinicia as entradas. */}
      <div
        key={s.id}
        ref={palco}
        className="m-palco"
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '0 30px', textAlign: 'center',
        }}
      >
        <div className="m-quadro" style={{
          width: 240, height: 240, borderRadius: 60,
          background: `linear-gradient(135deg, ${s.cor1}, ${s.cor2})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
          boxShadow: `0 24px 48px ${s.cor2}55`,
        }}>
          <div className="m-bolha" style={{
            position: 'absolute', top: -30, left: -30, width: 110, height: 110,
            borderRadius: 'var(--raio-pilula)', background: 'rgba(255,255,255,0.22)',
          }} />
          <div className="m-bolha" style={{
            position: 'absolute', bottom: -20, right: -20, width: 70, height: 70,
            borderRadius: 'var(--raio-pilula)', background: 'rgba(255,255,255,0.16)',
          }} />
          <Ilustracao cor={s.cor2} />
        </div>

        {/* Uma linha do título por elemento: elas entram uma depois da outra. */}
        <div style={{
          fontSize: 28, fontWeight: 800, color: 'var(--ink)',
          letterSpacing: '-0.03em', marginTop: 36, lineHeight: 1.15,
        }}>
          {linhas.map((l, i) => (
            <div key={i} className="m-texto">{l}</div>
          ))}
        </div>
        <div className="m-texto" style={{
          fontSize: 15, color: 'var(--muted)', fontWeight: 500,
          marginTop: 12, lineHeight: 1.45, maxWidth: 360,
        }}>
          {s.subtitulo}
        </div>
      </div>

      {/* Rodapé com teto de largura: no celular não muda nada (a tela já é
          mais estreita), e no PC o botão não vira uma faixa de ponta a ponta. */}
      <div style={{
        padding: '0 var(--pad-x) 60px', width: '100%', maxWidth: 420,
        margin: '0 auto', boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
          {slides.map((_, i) => (
            <button
              key={i}
              ref={(el) => { pontos.current[i] = el; }}
              onClick={() => irParaSlide(i)}
              aria-label={t('Ir para slide {n}', { n: i + 1 })}
              style={{
                height: 6, borderRadius: 'var(--raio-pilula)',
                background: i === slide ? 'var(--primary)' : 'var(--linha)',
                // Só a cor é CSS; a largura é mola (efeito acima).
                transition: 'background-color .28s ease',
                border: 'none', padding: 0, cursor: 'pointer',
              }}
            />
          ))}
        </div>
        <button
          ref={botao}
          onClick={() => (ultimo ? onFim() : irParaSlide(slide + 1))}
          onPointerDown={() => apertar(true)}
          onPointerUp={() => apertar(false)}
          onPointerLeave={() => apertar(false)}
          onPointerCancel={() => apertar(false)}
          style={{
            width: '100%', padding: '16px', borderRadius: 'var(--raio-bloco)',
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

// Desempenho: o anime.js escreve transform/opacity no elemento a cada quadro,
// a partir do JS. Sem camada própria, cada quadro repinta o elemento — e aqui
// quase tudo carrega sombra grande e desfocada (quadro, cofre, círculo), que é
// a parte cara de pintar. `will-change` promove essas peças a camadas: o
// navegador pinta uma vez e só recompõe a posição, que é o que tirava o
// engasgo. O mesmo vale pro desfoque do texto (filter numa camada roda na
// GPU). A lista é só do que se mexe; promover tudo gastaria memória à toa.
//
// Pela mesma razão a saída do slide não desfoca: era um blur animado sobre o
// palco inteiro, a coisa mais cara da tela, por 200 ms a cada troca.
const CAMADAS = `
.m-palco, .m-quadro, .m-bolha, .m-respira, .m-cifrao, .m-brilho, .m-toggle,
.m-chip, .m-cartao, .m-valor, .m-fatura, .m-pizza, .m-total, .m-moeda,
.m-cofre, .m-cofre-corpo, .m-meta, .m-meta-normal, .m-meta-ok,
.m-meta-ok-icone, .m-confete, .m-circulo {
  will-change: transform, opacity;
}
.m-texto { will-change: transform, opacity, filter; }
`;

// ───────── Ilustrações ─────────
// Cada uma começa depois que o quadro pousou (~150–250 ms), pra não disputar
// atenção com a entrada do slide.

function IlustracaoBoasVindas({ cor }) {
  const ref = useCena(() => {
    utils.set('.m-cifrao', { scale: 0.4, rotate: -14, opacity: 0 });
    animate('.m-cifrao', { scale: 1, rotate: 0, opacity: 1, delay: 160, ease: MOLA.pulo() });
    // Respirar é crescer e voltar. Fica no invólucro, não no cartão, pra não
    // brigar com a mola da entrada pela mesma propriedade. (O invólucro é a
    // raiz da cena, e seletor do scope só enxerga dentro dela: vai pela ref.)
    animate(ref.current, {
      scale: 1.035, duration: 1800, delay: 900, ease: 'inOutSine', loop: true, alternate: true,
    });
    // Brilhos com atrasos irregulares: em intervalos iguais os quatro viram um
    // metrônomo.
    utils.set('.m-brilho', { scale: 0.6, opacity: 0 });
    animate('.m-brilho', {
      scale: [{ to: 1.1, duration: 700, ease: 'outBack(2)' }, { to: 0.6, duration: 900, ease: 'inQuad' }],
      rotate: [{ from: -10, to: 8, duration: 1600, ease: 'inOutSine' }],
      opacity: [{ to: 1, duration: 500 }, { to: 1, duration: 400 }, { to: 0, duration: 700 }],
      delay: (_, i) => [300, 950, 1800, 2600][i],
      loopDelay: 1400,
      loop: true,
    });
  });
  return (
    <div ref={ref} className="m-respira" style={{ position: 'relative', width: 120, height: 120 }}>
      <div className="m-cifrao" style={{
        width: 120, height: 120, borderRadius: 36, background: 'var(--card)',
        boxShadow: '0 12px 28px rgba(0,0,0,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 56, fontWeight: 800, color: cor, letterSpacing: '-0.04em',
      }}>$</div>
      {[
        { top: -6, left: -10 },
        { top: -14, right: 4 },
        { bottom: -8, right: -10 },
        { bottom: 2, left: -12 },
      ].map((p, i) => (
        <div key={i} className="m-brilho" style={{ position: 'absolute', ...p }}>
          <Icon name="sparkle" size={18} color="#fff" strokeWidth={2.4} />
        </div>
      ))}
    </div>
  );
}

function IlustracaoAdd({ cor }) {
  const t = useT();
  const valor = React.useRef(null);
  const ALVO = 8990;
  const fmt = (v) => `${Math.floor(v / 100)},${String(v % 100).padStart(2, '0')}`;

  const ref = useCena(() => {
    // Contagem: o valor sobe disparando e desacelera até o alvo. Escrito direto
    // no texto a cada quadro, sem re-render.
    const n = { v: 0 };
    if (valor.current) valor.current.textContent = fmt(0);
    animate(n, {
      v: ALVO,
      duration: 1300,
      delay: 200,
      ease: 'outExpo',
      onRender: () => { if (valor.current) valor.current.textContent = fmt(Math.round(n.v)); },
    });
    // Chips de categoria estalam um a um.
    utils.set('.m-chip', { scale: 0, opacity: 0 });
    animate('.m-chip', { scale: 1, opacity: 1, delay: stagger(70, { start: 380 }), ease: MOLA.estalo() });
    // O seletor Saída/Entrada troca sozinho, passando do destino e assentando
    // como um controle de verdade sob o dedo.
    animate('.m-toggle', {
      translateX: [
        { to: '100%', delay: 1500, duration: 650, ease: 'outBack(2.2)' },
        { to: '0%', delay: 1500, duration: 650, ease: 'outBack(2.2)' },
      ],
      loop: true,
    });
  });

  return (
    <div ref={ref} style={{
      width: 200, background: 'var(--card)', borderRadius: 18,
      padding: 14, boxShadow: '0 10px 28px rgba(0,0,0,0.12)',
    }}>
      <div style={{
        position: 'relative', display: 'flex',
        background: 'var(--controle-trilho)', borderRadius: 10, padding: 3,
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
      }}>
        <div className="m-toggle" style={{
          position: 'absolute', top: 3, left: 3, bottom: 3,
          width: 'calc(50% - 3px)', borderRadius: 8, background: cor,
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
          <span ref={valor}>{fmt(ALVO)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4 }}>
        {['#FF9B6E', '#5DA8FF', '#9B7BFF', '#3FCB9A'].map((c, i) => (
          <div key={i} className="m-chip" style={{
            width: 22, height: 22, borderRadius: 7, background: `${c}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: 'var(--raio-pilula)', background: c }} />
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

  const ref = useCena(() => {
    // O cartão chega deitado e se levanta — giro pequeno: a sugestão de um
    // objeto posto na mesa, não uma cambalhota.
    utils.set('.m-cartao', { translateX: -18, translateY: 10, rotate: -12, opacity: 0 });
    animate('.m-cartao', { translateX: 0, translateY: 0, rotate: 0, opacity: 1, delay: 150, ease: MOLA.pulo() });
    utils.set('.m-valor', { translateY: 10, opacity: 0 });
    animate('.m-valor', { translateY: 0, opacity: 1, delay: stagger(60, { start: 260 }), ease: MOLA.suave() });
    utils.set('.m-barra', { width: '0%' });
    animate('.m-barra', { width: '62%', delay: 420, duration: 1100, ease: 'outExpo' });
    utils.set('.m-fatura', { scale: 0.8, opacity: 0 });
    animate('.m-fatura', { scale: 1, opacity: 1, delay: 700, ease: MOLA.estalo() });
  });

  return (
    <div ref={ref} style={{
      width: 200, background: 'var(--card)', borderRadius: 18,
      padding: 14, boxShadow: '0 10px 28px rgba(0,0,0,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="m-cartao" style={{ transformOrigin: 'left center' }}>
          <MiniCartao cor={cor} />
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
          <div className="m-valor" style={{
            fontSize: 19, fontWeight: 800, color: 'var(--ink)',
            letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
          }}>
            <span style={{ fontSize: 12, color: 'var(--muted)', marginRight: 3 }}>
              {simboloMoeda()}
            </span>
            1.240
          </div>
          <div className="m-valor" style={{ fontSize: 9, fontWeight: 600, color: 'var(--muted)', marginTop: 1 }}>
            {t('Fecha dia {dia}', { dia: 8 })}
          </div>
        </div>
      </div>

      {/* Barra de limite — mesma leitura da tela: quanto da fatura aberta já
          comeu o limite. */}
      <div style={{
        height: 6, background: 'var(--controle-trilho)', borderRadius: 'var(--raio-pilula)',
        overflow: 'hidden', marginTop: 12,
      }}>
        <div className="m-barra" style={{
          height: '100%', background: `linear-gradient(90deg, ${cor}, ${cor}AA)`,
          borderRadius: 'var(--raio-pilula)', width: '62%',
        }} />
      </div>

      <div className="m-fatura" style={{
        marginTop: 10, display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 5, padding: '6px 10px',
        borderRadius: 'var(--raio-pilula)', background: 'var(--card-2)',
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
  // Pizza com 4 fatias desenhadas em sequência.
  const fatias = [
    { cor: '#FF9B6E', pct: 35, off: 0 },
    { cor: '#5DA8FF', pct: 25, off: 35 },
    { cor: '#9B7BFF', pct: 22, off: 60 },
    { cor: cor, pct: 18, off: 82 },
  ];
  const R = 38;
  const C = 2 * Math.PI * R;

  const ref = useCena(() => {
    // A pizza gira um quarto de volta enquanto as fatias são desenhadas no
    // próprio arco (o traço sai de zero) — um anel não chega deslizando, ele é
    // desenhado. O traço vai num objeto e é escrito no atributo a cada quadro.
    utils.set('.m-pizza', { rotate: -70, scale: 0.85 });
    animate('.m-pizza', { rotate: 0, scale: 1, delay: 120, ease: MOLA.pulo() });
    ref.current.querySelectorAll('.m-fatia').forEach((el, i) => {
      const len = (fatias[i].pct / 100) * C;
      const f = { l: 0 };
      el.setAttribute('stroke-dasharray', `0 ${C}`);
      animate(f, {
        l: len,
        delay: 160 + 120 * i,
        duration: 650,
        ease: 'outCubic',
        onRender: () => el.setAttribute('stroke-dasharray', `${f.l} ${C}`),
      });
    });
    utils.set('.m-total', { scale: 0.5, opacity: 0 });
    animate('.m-total', { scale: 1, opacity: 1, delay: 650, ease: MOLA.estalo() });
  });

  return (
    <div ref={ref} style={{ position: 'relative', width: 140, height: 140 }}>
      <svg className="m-pizza" viewBox="0 0 100 100" width={140} height={140}>
        {fatias.map((f, i) => {
          const len = (f.pct / 100) * C;
          return (
            <circle
              key={i}
              className="m-fatia"
              cx="50" cy="50" r={R} fill="none"
              stroke={f.cor} strokeWidth={14} strokeLinecap="butt"
              strokeDasharray={`${len} ${C}`}
              strokeDashoffset={-((f.off / 100) * C)}
              transform="rotate(-90 50 50)"
            />
          );
        })}
        <circle cx="50" cy="50" r={26} fill="var(--card)" />
        <g className="m-total" style={{ transformOrigin: '50px 50px' }}>
          <text
            x="50" y="54" textAnchor="middle"
            fontSize="14" fontWeight="800" fill="var(--ink)"
          >{simboloMoeda()}3,4k</text>
        </g>
      </svg>
    </div>
  );
}

function IlustracaoPlanejar({ cor }) {
  // Uma meta sendo cumprida: cada moeda que cai no cofre empurra a barra mais
  // 25%, e ao bater 100% a linha da meta vira o aviso de sucesso. Segura um
  // instante, zera e recomeça. Junta as duas funcionalidades de planejamento —
  // caixinha (o cofre) e meta/orçamento (a barra).
  //
  // Sem animação (menos movimento, modo leve), o JSX já é o desfecho: barra
  // cheia e o aviso de meta alcançada.
  const t = useT();
  const barra = React.useRef(null);
  const pct = React.useRef(null);
  const PASSOS = 4;

  const ref = useCena(() => {
    const raiz = ref.current;
    const moeda = raiz.querySelector('.m-moeda');
    const cofre = raiz.querySelector('.m-cofre-corpo');
    const normal = raiz.querySelector('.m-meta-normal');
    const ok = raiz.querySelector('.m-meta-ok');
    const okIcone = raiz.querySelector('.m-meta-ok-icone');

    const progresso = { v: 0 };
    const pintar = () => {
      const v = Math.round(progresso.v);
      barra.current.style.width = `${progresso.v}%`;
      pct.current.textContent = `${v}%`;
    };

    const timers = new Set();
    const depois = (fn, ms) => {
      const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
      timers.add(id);
    };

    let passo = 0;

    // Moeda: acelera caindo (inQuad), gira um pouco e some ao entrar na
    // fenda — é a fenda que "engole", não um fade no ar.
    const cair = () => {
      animate(moeda, {
        translateY: { from: -46, to: 30, duration: 620, ease: 'inQuad' },
        rotate: { from: -20, to: 10, duration: 620, ease: 'inQuad' },
        opacity: [
          { from: 0, to: 1, duration: 140 },
          { to: 1, duration: 360 },
          { to: 0, duration: 120 },
        ],
        onComplete: pousou,
      });
    };

    // O peso chegando: o cofre afunda e volta balançando, e a barra anda o
    // passo dela com o número contando junto.
    const pousou = () => {
      passo += 1;
      animate(cofre, {
        translateY: [{ to: 5, duration: 110, ease: 'outQuad' }, { to: 0, duration: 600, ease: 'outElastic(1, .4)' }],
        scaleX: [{ to: 1.06, duration: 110, ease: 'outQuad' }, { to: 1, duration: 600, ease: 'outElastic(1, .4)' }],
      });
      animate(progresso, {
        v: (passo / PASSOS) * 100,
        duration: 700,
        ease: 'outExpo',
        onRender: pintar,
      });
      if (passo < PASSOS) depois(cair, 380);
      else depois(sucesso, 650);
    };

    // 100%: a linha da meta encolhe e some, e o aviso de sucesso estala no
    // lugar dela, com o check girando pra dentro.
    const sucesso = () => {
      animate(normal, { opacity: 0, scale: 0.92, duration: 180, ease: 'inQuad' });
      animate(ok, { opacity: 1, scale: 1, delay: 120, ease: MOLA.estalo() });
      animate(okIcone, { rotate: 0, scale: 1, delay: 200, ease: MOLA.pulo() });
      depois(zerar, 2200);
    };

    const zerar = () => {
      animate(ok, { opacity: 0, scale: 0.9, duration: 200, ease: 'inQuad' });
      utils.set(okIcone, { rotate: -90, scale: 0.4 });
      animate(normal, { opacity: 1, scale: 1, delay: 160, ease: MOLA.suave() });
      animate(progresso, { v: 0, delay: 160, duration: 500, ease: 'inOutQuad', onRender: pintar });
      passo = 0;
      depois(cair, 900);
    };

    // Estado de partida: barra vazia, linha da meta à vista, aviso escondido.
    utils.set(normal, { opacity: 1 });
    utils.set(ok, { opacity: 0, scale: 0.85 });
    utils.set(okIcone, { rotate: -90, scale: 0.4 });
    pintar();
    utils.set('.m-cofre', { translateY: 16, scale: 0.85, opacity: 0 });
    animate('.m-cofre', { translateY: 0, scale: 1, opacity: 1, delay: 120, ease: MOLA.pulo() });
    utils.set('.m-meta', { translateY: 14, opacity: 0 });
    animate('.m-meta', { translateY: 0, opacity: 1, delay: 260, ease: MOLA.suave() });
    depois(cair, 650);

    // O revert do scope cuida das animações; os timers entre um passo e outro
    // morrem aqui, junto com a tela.
    return () => timers.forEach(clearTimeout);
  });

  return (
    <div ref={ref} style={{ position: 'relative', width: 180, height: 160 }}>
      {/* A moeda nasce invisível: sem animação, fica fora de cena em vez de
          parada no ar em cima do cofre. */}
      <div className="m-moeda" style={{
        position: 'absolute', top: 0, left: 79, width: 22, height: 22, opacity: 0,
        borderRadius: 'var(--raio-pilula)',
        background: `linear-gradient(135deg, #FFE9A8, ${COR_AVISO})`,
        boxShadow: '0 4px 10px rgba(224,138,0,0.4), inset 0 -2px 0 rgba(0,0,0,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 11, color: '#7a4a00',
      }}>
        $
      </div>

      {/* Cofre. Fica na frente da moeda: é ele que a esconde ao entrar. */}
      <div className="m-cofre" style={{
        position: 'absolute', top: 36, left: 30, width: 120, height: 80,
      }}>
        <div className="m-cofre-corpo" style={{
          width: 120, height: 80, borderRadius: '50% 50% 30% 30% / 45% 45% 35% 35%',
          background: 'var(--card)', boxShadow: '0 12px 28px rgba(0,0,0,0.16)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
          transformOrigin: 'center bottom',
        }}>
          <Icon name="piggy" size={50} color={cor} strokeWidth={2.2} />
          {/* Fenda */}
          <div style={{
            position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
            width: 26, height: 5, borderRadius: 3, background: 'var(--linha)',
          }} />
        </div>
      </div>

      {/* Meta — embaixo do cofre. Duas camadas no mesmo lugar: a barra em
          andamento e, por cima, o aviso de meta alcançada. */}
      <div className="m-meta" style={{
        position: 'absolute', bottom: 6, left: 4, right: 4, height: 36,
      }}>
        <div className="m-meta-normal" style={{
          position: 'absolute', inset: 0, opacity: 0,
          background: 'var(--card)', borderRadius: 12, padding: '8px 12px',
          boxShadow: '0 6px 18px rgba(0,0,0,0.08)', boxSizing: 'border-box',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 9, fontWeight: 700, color: 'var(--muted)', marginBottom: 4,
          }}>
            <span>{t('Meta')}</span>
            <span ref={pct} style={{ fontVariantNumeric: 'tabular-nums' }}>100%</span>
          </div>
          <div style={{
            height: 6, background: 'var(--controle-trilho)', borderRadius: 'var(--raio-pilula)', overflow: 'hidden',
          }}>
            <div ref={barra} style={{
              height: '100%', background: `linear-gradient(90deg, ${cor}, ${cor}AA)`,
              borderRadius: 'var(--raio-pilula)', width: '100%',
            }} />
          </div>
        </div>

        <div className="m-meta-ok" style={{
          position: 'absolute', inset: 0,
          background: COR_POS, borderRadius: 12,
          boxShadow: `0 8px 20px ${COR_POS}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '-0.01em',
        }}>
          <span className="m-meta-ok-icone" style={{ display: 'inline-flex' }}>
            <Icon name="check" size={15} color="#fff" strokeWidth={3} />
          </span>
          {t('Meta alcançada!')}
        </div>
      </div>
    </div>
  );
}

function IlustracaoPronto({ cor }) {
  const ref = useCena(() => {
    // O círculo pousa com repique e o check é desenhado logo depois.
    utils.set('.m-circulo', { scale: 0.4, opacity: 0 });
    animate('.m-circulo', { scale: 1, opacity: 1, delay: 120, ease: MOLA.pulo() });
    const check = ref.current.querySelector('.m-check');
    const d = { o: 60 };
    check.setAttribute('stroke-dashoffset', '60');
    animate(d, {
      o: 0,
      delay: 380,
      duration: 600,
      ease: 'outCubic',
      onRender: () => check.setAttribute('stroke-dashoffset', String(d.o)),
    });

    // Confete: estoura do centro rápido, gira o tempo todo e cai desacelerando
    // — o giro é o que separa "papel picado" de "quadrado se movendo". Cada
    // pedaço sorteia o próprio caminho a cada volta, então a chuva nunca se
    // repete igual.
    const timers = new Set();
    const depois = (fn, ms) => {
      const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
      timers.add(id);
    };
    ref.current.querySelectorAll('.m-confete').forEach((el, i) => {
      const voo = () => {
        if (!el.isConnected) return;
        const ang = Math.random() * Math.PI * 2;
        const raio = 50 + Math.random() * 30;
        const x = Math.cos(ang) * raio;
        const y = Math.sin(ang) * raio - 20;
        animate(el, {
          translateX: [{ from: 0, to: x, duration: 450, ease: 'outExpo' }, { to: x * 1.3, duration: 1500, ease: 'linear' }],
          translateY: [{ from: 0, to: y, duration: 450, ease: 'outExpo' }, { to: y + 90, duration: 1500, ease: 'inQuad' }],
          rotate: { from: 0, to: 360 + Math.random() * 360, duration: 1950, ease: 'linear' },
          scale: [{ from: 0, to: 1, duration: 300 }, { to: 0.6, duration: 1650 }],
          opacity: [{ from: 0, to: 1, duration: 200 }, { to: 1, duration: 1100 }, { to: 0, duration: 650 }],
          onComplete: () => depois(voo, 300 + Math.random() * 900),
        });
      };
      depois(voo, 500 + i * 140);
    });
    // O revert do scope cuida das animações, não dos timers entre um voo e
    // outro: esses morrem aqui, junto com a tela.
    return () => timers.forEach(clearTimeout);
  });

  return (
    <div ref={ref} style={{ position: 'relative', width: 140, height: 140 }}>
      {['#FF9B6E', '#5DA8FF', '#3FCB9A', '#FFD93B', '#FF7AA8', '#9B7BFF', '#FF9B6E', '#3FCB9A'].map((c, i) => (
        <div key={i} className="m-confete" style={{
          position: 'absolute', top: 'calc(50% - 5px)', left: 'calc(50% - 5px)', width: 10, height: 10,
          borderRadius: 3, background: c, opacity: 0,
        }} />
      ))}

      <div className="m-circulo" style={{
        width: 120, height: 120, borderRadius: 'var(--raio-pilula)', background: 'var(--card)',
        boxShadow: '0 14px 32px rgba(0,0,0,0.16)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '10px auto',
      }}>
        <svg width={64} height={64} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill={cor} opacity="0.15" />
          <path
            className="m-check"
            d="M7 12.5l3.2 3.2L17 8.5"
            stroke={cor} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={60} strokeDashoffset={0}
          />
        </svg>
      </div>
    </div>
  );
}
