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
// A abertura do app é o caso em que nem skeleton nem spinner servem: ali não há
// interface anterior pra prometer nem ação em curso pra acompanhar — o app está
// nascendo. Pra isso existe o `<SplashLogo />`, o logo do app se desenhando.
//
// API:
//   <SplashLogo />      — splash da abertura (ver app.jsx)
//   <LoaderTela />      — skeleton de tela cheia (Suspense, troca de tela)
//   <Loader size={32} /> — spinner inline (botões, ações)
//   <Skeleton w h r />  — bloco primitivo, para compor skeletons custom

import { useEffect, useState } from 'react';
import { LogoAzulejo } from './logo-animado.jsx';

// Quanto dura a entrada do logo, do primeiro traço até o fim do eco que o
// estouro dispara. A linha do tempo inteira está em components.css, ao lado das
// animações; se ela mudar lá, este número muda aqui. Hoje o eco é o último a
// terminar, e termina exatamente neste 1.6s — encurtar aqui cortaria o fade
// dele pela metade.
//
// É o único trecho da abertura que cobra tempo de todo mundo: enquanto ele
// corre, o app já está pronto e esperando. Foi 1.3s enquanto o eco durava
// 0.33s, e subiu quando ele precisou ficar visível.
const ENTRADA_MS = 1600;

// Com "prefers-reduced-motion" as animações do logo não rodam (components.css),
// e segurar a tela 1.3s num desenho parado seria atraso puro.
const semMovimento =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Segura o splash até a entrada do logo terminar.
//
// Sem isso a animação quase nunca chega ao fim: a sessão e os dados costumam
// voltar antes de 1.3s, e o logo some no meio do traço — o que se vê é um
// pisca-pisca, não uma abertura. `pedido` diz se o app ainda precisa do splash;
// o retorno diz se ele continua na tela.
//
// A trava vale pra primeira aparição do splash, que é a abertura do app. Sair e
// entrar de novo na mesma sessão não espera: ali o splash é a espera dos dados,
// não a abertura, e prender a tela seria inventar demora.
//
// `semTrava` desliga a espera sem tirar a animação — é o que o modo leve passa.
export function useSplashInteiro(pedido, semTrava = false) {
  const solto = semMovimento || semTrava;
  const [apareceu, setApareceu] = useState(false);
  const [terminou, setTerminou] = useState(solto);

  useEffect(() => {
    if (pedido) setApareceu(true);
  }, [pedido]);

  // Este depende só do `apareceu`, que sobe uma vez e não desce. Se dependesse
  // do `pedido`, o fim da carga faria a limpeza cancelar o timer antes dele
  // disparar — e o splash ficaria na tela pra sempre.
  useEffect(() => {
    if (!apareceu) return;
    // Solto no meio da espera (o modo leve pode ser ligado com o app aberto):
    // libera em vez de sair sem fazer nada, senão a trava ficaria de pé sem
    // ninguém pra derrubá-la.
    if (solto) {
      setTerminou(true);
      return;
    }
    const id = setTimeout(() => setTerminou(true), ENTRADA_MS);
    return () => clearTimeout(id);
  }, [apareceu, solto]);

  return pedido || (apareceu && !terminou);
}


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

// Splash da abertura: o logo sozinho no meio da tela, se desenhando com a mesma
// animação da entrada do login. Fica no ar enquanto o app decide a sessão e
// carrega os dados de quem já estava logado — quem não estava vai direto pro
// login, sem passar por aqui (o porquê está em app.jsx).
//
// A entrada nunca é cortada: quem monta o splash usa o `useSplashInteiro` pra
// mantê-lo na tela até ela acabar. Depois disso o logo entra no flutuar, que
// repete sozinho — uma espera mais longa não deixa quadro parado.
//
// O centro é o da área visível, não o da tela física. São duas correções, e a
// segunda é a que aparece no PWA instalado:
//
//   - `dvh` no lugar de `vh`: no navegador, 100vh mede a tela com as barras do
//     Chrome/Safari recolhidas, ou seja, mais alto do que se enxerga — o centro
//     de uma caixa dessas cai abaixo do centro do que está à vista;
//   - o recuo pelas `safe-area`: com `viewport-fit=cover` (index.html) a tela
//     do app instalado passa por baixo da barra de status e da barra de gestos,
//     e elas não têm a mesma altura. Centralizar na caixa inteira encosta o
//     logo pro lado da menor. Com `box-sizing: border-box` (base.css) o recuo
//     sai de dentro dos 100dvh, e o flex centraliza no que sobra — o miolo que
//     o usuário realmente vê.
export function SplashLogo({ label = 'Carregando' }) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      style={{
        minHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}
    >
      {/* O eco precisa nascer no centro do azulejo, não no centro da caixa: com
          as `safe-area` descontadas em cima e embaixo em alturas diferentes,
          os dois centros não coincidem. Por isso ele é irmão do azulejo dentro
          de um invólucro do tamanho dele, e não um filho da tela — assim o
          `position: absolute` dele se ancora no logo. A animação está em
          components.css, junto do estouro de onde ela sai. */}
      <div style={{ position: 'relative', display: 'flex' }}>
        <div aria-hidden="true" className="splash-eco" />
        <LogoAzulejo size={104} />
      </div>
    </div>
  );
}

// Skeleton "tela cheia": imita topo + card grande + linhas de lista.
// Usado como fallback de Suspense pra qualquer screen.
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
          padding: 'var(--pad-top, 16px) var(--pad-x) 12px',
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
      <div style={{ padding: '8px var(--pad-x) 0' }}>
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
      <div style={{ padding: '20px var(--pad-x) 0' }}>
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
