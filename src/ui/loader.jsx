// loader.jsx — indicadores de carregamento do app.
//
// Filosofia: enquanto a tela busca dados, mostramos um **skeleton** que
// imita o esqueleto DAQUELA interface — a de Transações tem busca e chips, a de
// Análise tem gráficos, a de Perfil tem avatar. Isso reduz a sensação de "tela
// em branco" e a percepção de espera, porque o usuário já vê o contorno do que
// virá; um contorno genérico faz o contrário, e é o que havia aqui antes.
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
//   <LoaderTela tela="perfil" /> — skeleton de tela cheia (Suspense, troca de
//                        tela). `tela` é o destino da navegação: cada uma tem o
//                        seu contorno, ver "Skeletons por tela" lá embaixo.
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
// raio padrão é o de etiqueta: a maioria dos skeletons imita linha de texto.
function Skeleton({
  w = '100%',
  h = 16,
  r = 'var(--raio-etiqueta)',
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


// ─── Skeletons por tela ──────────────────────────────────────────────────────
//
// Por muito tempo existiu UM skeleton só — topo, card grande, lista — servindo
// de fallback pra qualquer tela. Ele acertava o Início e mentia em todo o
// resto: quem tocava em Perfil via um card de saldo se formando, quem abria
// Análise via linhas de transação que nunca chegavam, e a tela real entrava por
// cima de um contorno que não era o dela.
//
// Um skeleton que promete o que não vem é pior do que nenhum: o olho já começou
// a montar a interface errada e tem que refazer o trabalho quando o conteúdo
// aparece — que é exatamente a sensação de "carregou outra coisa".
//
// Então cada tela tem o seu, feito dos mesmos blocos: a mancha do skeleton
// segue a mancha do que vai nascer ali. As medidas saem das telas de verdade
// (TopBar, Card de raio 22, linha de lista com ícone de 42) — mexer lá pede
// conferir aqui. O que NÃO precisa bater é o conteúdo: quantas linhas a lista
// vai ter é justamente o que ainda não se sabe.

const PAD_X = { padding: '0 var(--pad-x)' };

// Fundo e sombra do <Card> (ui/common.jsx), repetidos aqui pra o loader não
// depender de um módulo que ele mesmo cobre enquanto carrega.
const CARD = {
  background: 'var(--card)',
  borderRadius: 'var(--raio-card)',
  padding: 18,
  boxShadow: '0 1px 2px rgba(20,16,24,0.04), 0 4px 12px rgba(20,16,24,0.03)',
};

function CardSkel({ children, style }) {
  return (
    <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 12, ...style }}>
      {children}
    </div>
  );
}

// TopBar. O vão de 36px à esquerda guarda o lugar do botão de voltar, que é
// fixo na viewport e não ocupa espaço no fluxo (ver common.jsx) — sem ele o
// título nasceria deslocado em relação ao da tela de verdade. `titulo={0}`
// serve às telas que abrem sem título (Perfil, Categoria).
function TopoSkel({ acao = false, titulo = 180 }) {
  return (
    <div style={{
      padding: 'var(--pad-top, 16px) var(--pad-x) 12px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', minHeight: 32,
      }}>
        <div style={{ width: 36 }} />
        {acao ? <Skeleton w={36} h={36} r="var(--raio-pilula)" /> : <div style={{ width: 36 }} />}
      </div>
      {titulo > 0 && <Skeleton w={titulo} h={28} r="var(--raio-etiqueta)" style={{ marginTop: 6 }} />}
    </div>
  );
}

// Linhas no formato do ItemTransacao: ícone, duas linhas de texto, valor à
// direita. As larguras variam por linha de propósito — quatro barras do mesmo
// tamanho parecem uma tabela, não texto.
function LinhasSkel({ n = 4, icone = 42, r = 14, valor = 64 }) {
  return (
    <CardSkel style={{ padding: '4px 16px', gap: 0 }}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
          borderTop: i === 0 ? 'none' : '1px solid var(--linha)',
        }}>
          <Skeleton w={icone} h={icone} r={r} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton w={`${56 + ((i * 13) % 24)}%`} h={13} r="var(--raio-miudo)" />
            <Skeleton w={`${30 + ((i * 7) % 14)}%`} h={11} r="var(--raio-miudo)" />
          </div>
          {valor > 0 && <Skeleton w={valor} h={14} r="var(--raio-miudo)" />}
        </div>
      ))}
    </CardSkel>
  );
}

// Linhas de configuração (Perfil): ícone pequeno, um rótulo, nada à direita.
function LinhasConfigSkel({ n = 5 }) {
  return (
    <CardSkel style={{ padding: '4px 16px', gap: 0 }}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0',
          borderTop: i === 0 ? 'none' : '1px solid var(--linha)',
        }}>
          <Skeleton w={20} h={20} r="var(--raio-miudo)" />
          <Skeleton w={`${38 + ((i * 17) % 28)}%`} h={13} r="var(--raio-miudo)" />
        </div>
      ))}
    </CardSkel>
  );
}

// Carrossel de chips (filtros). Sem rolagem: é um contorno, não um controle.
function ChipsSkel({ larguras }) {
  return (
    <div style={{
      display: 'flex', gap: 6, padding: '2px var(--pad-x) 4px', overflow: 'hidden',
    }}>
      {larguras.map((w, i) => <Skeleton key={i} w={w} h={28} r="var(--raio-pilula)" />)}
    </div>
  );
}

// Barras de altura desigual — o contorno de um gráfico de evolução.
function BarrasSkel({ alturas }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
      {alturas.map((h, i) => <Skeleton key={i} w={'100%'} h={h} r="var(--raio-etiqueta)" />)}
    </div>
  );
}

// ── Início: saudação, card de saldo (o bloco mais alto do app), insights e os
// últimos gastos.
function SkelInicio() {
  return (
    <>
      <div style={{
        padding: 'var(--pad-top, 16px) var(--pad-x) 12px',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', minHeight: 32,
        }}>
          <Skeleton w={96} h={13} r="var(--raio-miudo)" />
          {/* Sino e avatar */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Skeleton w={36} h={36} r="var(--raio-pilula)" />
            <Skeleton w={36} h={36} r="var(--raio-pilula)" />
          </div>
        </div>
        <Skeleton w={150} h={28} r="var(--raio-etiqueta)" style={{ marginTop: 6 }} />
      </div>

      <div style={{ padding: '4px var(--pad-x) 0' }}>
        <CardSkel style={{ borderRadius: 'var(--raio-superficie)', padding: 22, gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Skeleton w={120} h={13} r="var(--raio-miudo)" />
            <Skeleton w={96} h={38} r="var(--raio-pilula)" />
          </div>
          <Skeleton w={'55%'} h={34} r="var(--raio-etiqueta)" />
          <Skeleton w={150} h={12} r="var(--raio-miudo)" />
          <Skeleton w={'100%'} h={8} r="var(--raio-pilula)" />
          <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
            <Skeleton w={'100%'} h={44} r="var(--raio-bloco)" />
            <Skeleton w={'100%'} h={44} r="var(--raio-bloco)" />
          </div>
        </CardSkel>
      </div>

      <div style={{
        padding: 'var(--esp-secao) var(--pad-x) 0',
        display: 'flex', flexDirection: 'column', gap: 'var(--esp-secao)',
      }}>
        <CardSkel style={{ gap: 10 }}>
          <Skeleton w={110} h={12} r="var(--raio-miudo)" />
          <Skeleton w={'86%'} h={13} r="var(--raio-miudo)" />
          <Skeleton w={'58%'} h={13} r="var(--raio-miudo)" />
        </CardSkel>
        <Skeleton w={'100%'} h={40} r="var(--raio-bloco)" />
      </div>

      <div style={{ padding: 'var(--esp-secao) var(--pad-x) 0' }}>
        <Skeleton w={130} h={14} r="var(--raio-miudo)" style={{ marginBottom: 12 }} />
        <LinhasSkel n={3} />
      </div>
    </>
  );
}

// ── Transações: resumo + seletor de mês, busca, chips de filtro e a lista.
function SkelTransacoes() {
  return (
    <>
      <TopoSkel acao titulo={190} />
      <div style={{
        ...PAD_X, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton w={118} h={13} r="var(--raio-miudo)" />
          <Skeleton w={152} h={13} r="var(--raio-miudo)" />
        </div>
        <Skeleton w={96} h={38} r="var(--raio-pilula)" />
      </div>
      <div style={{ padding: 'var(--esp-secao) var(--pad-x) 0' }}>
        <Skeleton w={'100%'} h={40} r="var(--raio-bloco)" />
      </div>
      <div style={{ padding: '10px 0 0' }}>
        <ChipsSkel larguras={[62, 84, 90, 72, 66]} />
      </div>
      <div style={{ padding: 'var(--esp-secao) var(--pad-x) 0' }}>
        <LinhasSkel n={5} />
      </div>
    </>
  );
}

// ── Análise: projeção do ano, seletor de mês à direita e a pilha de gráficos.
function SkelAnalise() {
  return (
    <>
      <TopoSkel titulo={140} />
      <div style={{ padding: '4px var(--pad-x) 0' }}>
        <CardSkel style={{ gap: 10 }}>
          <Skeleton w={130} h={12} r="var(--raio-miudo)" />
          <Skeleton w={'48%'} h={24} r="var(--raio-etiqueta)" />
          <Skeleton w={'100%'} h={8} r="var(--raio-pilula)" />
        </CardSkel>
      </div>
      <div style={{
        padding: 'var(--esp-secao) var(--pad-x) var(--esp-titulo)', display: 'flex', justifyContent: 'flex-end',
      }}>
        <Skeleton w={96} h={38} r="var(--raio-pilula)" />
      </div>
      <div style={{ ...PAD_X, display: 'flex', flexDirection: 'column', gap: 'var(--esp-secao)' }}>
        <CardSkel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skeleton w={72} h={11} r="var(--raio-miudo)" />
                <Skeleton w={'68%'} h={18} r="var(--raio-miudo)" />
              </div>
            ))}
          </div>
        </CardSkel>
        {/* Pizza por categoria: o disco e a legenda ao lado */}
        <CardSkel style={{ gap: 14 }}>
          <Skeleton w={120} h={13} r="var(--raio-miudo)" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Skeleton w={132} h={132} r="var(--raio-pilula)" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} w={`${82 - i * 13}%`} h={11} r="var(--raio-miudo)" />
              ))}
            </div>
          </div>
        </CardSkel>
        <CardSkel style={{ gap: 14 }}>
          <Skeleton w={140} h={13} r="var(--raio-miudo)" />
          <BarrasSkel alturas={[52, 88, 40, 104, 68, 96]} />
        </CardSkel>
      </div>
    </>
  );
}

// ── Perfil: avatar centralizado, nome, e-mail e os cards de configuração.
function SkelPerfil() {
  return (
    <>
      <TopoSkel titulo={0} />
      <div style={{
        ...PAD_X, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        <Skeleton w={88} h={88} r="var(--raio-pilula)" />
        <Skeleton w={140} h={18} r="var(--raio-etiqueta)" />
        <Skeleton w={182} h={12} r="var(--raio-miudo)" />
      </div>
      <div style={{
        padding: 'var(--esp-secao) var(--pad-x) 0',
        display: 'flex', flexDirection: 'column', gap: 'var(--esp-pilha)',
      }}>
        <CardSkel style={{ gap: 12 }}>
          <Skeleton w={100} h={13} r="var(--raio-miudo)" />
          <Skeleton w={'100%'} h={38} r="var(--raio-controle)" />
        </CardSkel>
        <LinhasConfigSkel n={5} />
        <LinhasConfigSkel n={3} />
      </div>
    </>
  );
}

// ── Orçamentos: o card do total mensal e as faixas por categoria, cada uma com
// a sua barra de progresso.
function SkelOrcamentos() {
  return (
    <>
      <TopoSkel titulo={200} />
      <div style={{ padding: '4px var(--pad-x) 0' }}>
        <CardSkel style={{ gap: 10 }}>
          <Skeleton w={130} h={12} r="var(--raio-miudo)" />
          <Skeleton w={'50%'} h={28} r="var(--raio-etiqueta)" />
          <Skeleton w={'100%'} h={8} r="var(--raio-pilula)" />
          <Skeleton w={160} h={11} r="var(--raio-miudo)" />
        </CardSkel>
      </div>
      <div style={{ padding: 'var(--esp-secao) var(--pad-x) 0' }}>
        <Skeleton w={150} h={14} r="var(--raio-miudo)" style={{ marginBottom: 12 }} />
        <CardSkel style={{ padding: '4px 16px', gap: 0 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              padding: '14px 0',
              borderTop: i === 0 ? 'none' : '1px solid var(--linha)',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Skeleton w={28} h={28} r="var(--raio-compacto)" />
                <Skeleton w={`${34 + ((i * 11) % 22)}%`} h={13} r="var(--raio-miudo)" />
                <div style={{ flex: 1 }} />
                <Skeleton w={70} h={12} r="var(--raio-miudo)" />
              </div>
              <Skeleton w={'100%'} h={7} r="var(--raio-pilula)" />
            </div>
          ))}
        </CardSkel>
      </div>
    </>
  );
}

// ── Caixinhas: os tiles, um por caixinha, e o botão de criar.
function SkelCaixinhas() {
  return (
    <>
      <TopoSkel titulo={170} />
      <div style={{ padding: '4px var(--pad-x) 0' }}>
        <div className="grade-tiles">
          {[0, 1, 2].map((i) => (
            <CardSkel key={i} style={{ gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Skeleton w={38} h={38} r="var(--raio-controle)" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton w={'62%'} h={14} r="var(--raio-miudo)" />
                  <Skeleton w={'40%'} h={11} r="var(--raio-miudo)" />
                </div>
              </div>
              <Skeleton w={'52%'} h={24} r="var(--raio-etiqueta)" />
              <Skeleton w={'100%'} h={8} r="var(--raio-pilula)" />
            </CardSkel>
          ))}
        </div>
        <Skeleton w={'100%'} h={48} r="var(--raio-bloco)" style={{ marginTop: 16 }} />
      </div>
    </>
  );
}

// ── Uma caixinha: o cabeçalho com o valor guardado, as ações e o histórico.
function SkelCaixinha() {
  return (
    <>
      <TopoSkel titulo={0} />
      <div style={{ padding: '4px var(--pad-x) 0' }}>
        <CardSkel style={{ borderRadius: 'var(--raio-superficie)', padding: 22, gap: 12, alignItems: 'center' }}>
          <Skeleton w={56} h={56} r="var(--raio-pilula)" />
          <Skeleton w={160} h={18} r="var(--raio-etiqueta)" />
          <Skeleton w={200} h={32} r="var(--raio-etiqueta)" />
          <Skeleton w={'100%'} h={8} r="var(--raio-pilula)" />
        </CardSkel>
        <div style={{ display: 'flex', gap: 10, marginTop: 'var(--esp-secao)' }}>
          <Skeleton w={'100%'} h={46} r="var(--raio-bloco)" />
          <Skeleton w={'100%'} h={46} r="var(--raio-bloco)" />
        </div>
        <Skeleton w={140} h={13} r="var(--raio-miudo)" style={{ margin: 'var(--esp-secao) 0 var(--esp-titulo)' }} />
        <LinhasSkel n={3} icone={36} r="var(--raio-controle)" valor={0} />
      </div>
    </>
  );
}

// ── Cartões: o resumo e as linhas de cartão dentro de um card só.
function SkelCartoes() {
  return (
    <>
      <TopoSkel titulo={150} />
      <div style={{ padding: '4px var(--pad-x) 0' }}>
        <CardSkel style={{ gap: 14 }}>
          <div style={{ display: 'flex', gap: 14 }}>
            {[0, 1].map((i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skeleton w={80} h={11} r="var(--raio-miudo)" />
                <Skeleton w={'70%'} h={20} r="var(--raio-miudo)" />
              </div>
            ))}
          </div>
          {[0, 1].map((i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              paddingTop: 14, borderTop: '1px solid var(--linha)',
            }}>
              {/* O retângulo do cartão, na proporção do CardCartao */}
              <Skeleton w={66} h={42} r="var(--raio-etiqueta)" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skeleton w={`${48 + i * 14}%`} h={13} r="var(--raio-miudo)" />
                <Skeleton w={'36%'} h={11} r="var(--raio-miudo)" />
              </div>
              <Skeleton w={70} h={14} r="var(--raio-miudo)" />
            </div>
          ))}
        </CardSkel>
        <Skeleton w={'100%'} h={48} r="var(--raio-bloco)" style={{ marginTop: 16 }} />
      </div>
    </>
  );
}

// ── Categoria: o card de resumo da categoria e as transações dela.
function SkelCategoria() {
  return (
    <>
      <TopoSkel titulo={0} />
      <div style={PAD_X}>
        <CardSkel style={{ padding: 20, gap: 12, alignItems: 'center' }}>
          <Skeleton w={52} h={52} r="var(--raio-pilula)" />
          <Skeleton w={140} h={16} r="var(--raio-etiqueta)" />
          <Skeleton w={180} h={28} r="var(--raio-etiqueta)" />
        </CardSkel>
        <div style={{ marginTop: 'var(--esp-secao)' }}>
          <LinhasSkel n={4} />
        </div>
      </div>
    </>
  );
}

// ── Histórico, Notificações, Recorrentes: um título de seção e uma lista. É
// também o fallback de qualquer tela sem skeleton próprio — erra menos do que
// prometer um card de saldo.
function SkelLista() {
  return (
    <>
      <TopoSkel titulo={175} />
      <div style={PAD_X}>
        <Skeleton w={130} h={13} r="var(--raio-miudo)" style={{ marginBottom: 12 }} />
        <LinhasSkel n={5} />
      </div>
    </>
  );
}

// ── Tour: a ilustração no meio, o texto embaixo e o botão no rodapé.
function SkelOnboarding() {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      padding: '0 30px',
    }}>
      <Skeleton w={240} h={240} r={60} />
      <Skeleton w={220} h={24} r="var(--raio-etiqueta)" style={{ marginTop: 12 }} />
      <Skeleton w={260} h={13} r="var(--raio-miudo)" />
      <Skeleton w={'100%'} h={50} r="var(--raio-bloco)" style={{ marginTop: 20, maxWidth: 360 }} />
    </div>
  );
}

const SKELETONS = {
  inicio: SkelInicio,
  gastos: SkelTransacoes,
  analise: SkelAnalise,
  perfil: SkelPerfil,
  orcamentos: SkelOrcamentos,
  caixinhas: SkelCaixinhas,
  caixinha: SkelCaixinha,
  cartoes: SkelCartoes,
  categoria: SkelCategoria,
  onboarding: SkelOnboarding,
};

// Skeleton de tela cheia — o fallback de Suspense na troca de tela. `tela` é o
// DESTINO da navegação (o mesmo id que o app usa pra rotear), então o contorno
// que aparece é o da tela que está chegando. Um id sem skeleton próprio cai na
// lista, que é o formato mais comum do app.
export function LoaderTela({ tela, label = 'Carregando' }) {
  const Conteudo = SKELETONS[tela] || SkelLista;
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
      <Conteudo />
    </div>
  );
}
