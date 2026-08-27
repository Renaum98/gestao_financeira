// app.jsx — Componente raiz: gateamento (PIN/auth), estado central, navegação.

import React from "react";
import {
  CATEGORIAS,
  ORDEM_CATS,
  PALETAS,
  coresDaPaleta,
  degradeDaPaleta, acharPaleta,
  heroDaPaleta,
  listarMeses,
  aplicarCategoriasCustom,
  novaCategoriaCustom,
  valorRecNoMes,
} from "./data.js";
import { Icon } from "./ui/icons.jsx";
import { IconeTab } from "./ui/icones-tab.jsx";
import { escutarAuth, sair as sairFirebase } from "./lib/firebase.js";
import { haviaSessao, lembrarSessao } from "./lib/sessao.js";
import { useCloudState } from "./lib/storage.js";
import {
  useConvitesRecebidos,
  useConvitesEnviados,
  useFinalizarPareamento,
  usePartnerData,
  useSharedCaixinhas,
  useLimparParceriaOrfa,
  desfazerParceria as desfazerParceriaFn,
} from "./lib/partnership.js";
import { chaveMes, dataISO, dataNoMes, hojeISO, mesCorrente, mesShift } from "./lib/datas.js";
import { vibrar } from "./lib/haptics.js";
import { ehTemaEscuro, lerAparenciaSalva, salvarAparencia } from "./lib/tema.js";
import { useEhDesktop } from "./lib/desktop.js";
import { ehLeve, lerLeveSalvo, salvarLeve, AUTO } from "./lib/leve.js";
import { estaOffline, useEstaOffline } from "./lib/conexao.js";
import { BarraOffline, EspacoBarraOffline, ALTURA_FAIXA } from "./ui/barra-offline.jsx";
import { useInstallPrompt, InstallPromptModal } from "./ui/install-prompt.jsx";
import { temOverlayAberto } from "./ui/modal-base.jsx";
import { LoaderTela, SplashLogo, useSplashInteiro } from "./ui/loader.jsx";
import { rendimentoRealizadoAoResgatar } from "./lib/selic.js";
import { ajustarGuardado } from "./lib/guardado-entradas.js";
import {
  novoCartao,
  aplicarPrimeiroCartaoEmTxs,
  aplicarPrimeiroCartaoEmRecorrentes,
  moverLancamentos,
  contarNoCartao,
  ehGastoNoCartao,
  ehRecorrenteNoCartao,
} from "./lib/cartoes.js";
import { I18nProvider, useT, lerIdiomaSalvo, salvarIdioma } from "./lib/i18n.jsx";
import { setMoedaAtiva, lerMoedaSalva, salvarMoeda } from "./lib/moeda.js";

// LoginScreen fica no bundle principal (primeira tela para deslogados).
// As demais telas e o modal são carregados sob demanda (code-splitting).
import { LoginScreen, VerifyEmailScreen } from "./screens/login.jsx";

const lazyNamed = (importar, nome) =>
  React.lazy(() => importar().then((m) => ({ default: m[nome] })));

const Onboarding        = lazyNamed(() => import("./screens/onboarding.jsx"), "Onboarding");
const DashboardScreen   = lazyNamed(() => import("./screens/dashboard.jsx"), "DashboardScreen");
const GastosScreen      = lazyNamed(() => import("./screens/gastos.jsx"), "GastosScreen");
const AnaliseScreen     = lazyNamed(() => import("./screens/analise.jsx"), "AnaliseScreen");
const CategoriaScreen   = lazyNamed(() => import("./screens/categoria.jsx"), "CategoriaScreen");
const OrcamentosScreen  = lazyNamed(() => import("./screens/orcamentos.jsx"), "OrcamentosScreen");
const HistoricoScreen   = lazyNamed(() => import("./screens/historico.jsx"), "HistoricoScreen");
const PerfilScreen      = lazyNamed(() => import("./screens/perfil.jsx"), "PerfilScreen");
const CaixinhasScreen   = lazyNamed(() => import("./screens/caixinhas.jsx"), "CaixinhasScreen");
const CaixinhaScreen    = lazyNamed(() => import("./screens/caixinhas.jsx"), "CaixinhaScreen");
const RecorrentesScreen = lazyNamed(() => import("./screens/recorrentes.jsx"), "RecorrentesScreen");
const CartoesScreen     = lazyNamed(() => import("./screens/cartoes.jsx"), "CartoesScreen");
const NotificacoesScreen= lazyNamed(() => import("./screens/notificacoes.jsx"), "NotificacoesScreen");
const AddExpenseModal   = lazyNamed(() => import("./modals/add-expense.jsx"), "AddExpenseModal");

const ONBOARDING_KEY = "finca.onboarded";

// Ações do ctx que gravam na nuvem. Ficam bloqueadas enquanto o aparelho está
// sem internet — ver src/lib/conexao.js pro porquê. Escritas automáticas (como
// o gerador de recorrentes) chamam cloud.* direto e não passam por aqui: elas são
// barradas silenciosamente no patchKey, sem incomodar o usuário com um aviso.
const ACOES_QUE_ESCREVEM = [
  "salvarTx",
  "excluirTx",
  "marcarTxPago",
  "setOrcamentos",
  "salvarCaixinha",
  "excluirCaixinha",
  "salvarCartao",
  "excluirCartao",
  "depositarCaixinha",
  "resgatarCaixinha",
  "cancelarRecorrente",
  "editarRecorrente",
  "adicionarCategoria",
  "excluirCategoria",
  "setPreferences",
  "dispensarNotifParceria",
  "desfazerParceria",
];

// Raio de repouso da "gota" da tab bar — igual nos quatro cantos.
// Acompanha o .nav-indicador em components.css.
const RAIO_GOTA = 20;

const ITENS_TAB = [
  { id: "inicio", icon: "home", label: "Início" },
  { id: "gastos", icon: "list", label: "Transações" },
  { id: "add", icon: "plus", label: "", destaque: true },
  { id: "analise", icon: "chart", label: "Análise" },
  { id: "perfil", icon: "user", label: "Perfil" },
];

// As telas que a tab bar alcança (o "add" é modal, não é tela). Qualquer outra
// é secundária: entra por cima, e no mobile a barra desce pra fora da tela —
// sem aba pra acender embaixo, quem leva de volta é só o botão do topo.
const ABAS = ITENS_TAB.filter((it) => !it.destaque).map((it) => it.id);

// Mede o botão ativo da tab bar e devolve onde o indicador (a "gota" de fundo)
// precisa parar. Como o indicador é um único elemento que se move, ele desliza
// de uma aba pra outra em vez de piscar de lugar.
function usePosicaoIndicador(tela, barraRef, itemRefs) {
  const [pos, setPos] = React.useState(null);

  React.useLayoutEffect(() => {
    const medir = () => {
      const btn = itemRefs.current[tela];
      const barra = barraRef.current;
      if (!btn || !barra) return setPos(null);
      setPos({
        left: btn.offsetLeft,
        top: btn.offsetTop,
        width: btn.offsetWidth,
        height: btn.offsetHeight,
      });
    };
    medir();
    // Rótulos traduzidos e rotação de tela mudam a largura dos itens.
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [tela, barraRef, itemRefs]);

  return pos;
}

function TabBar({ tela, irPara, abrirAdd }) {
  const t = useT();
  const barraRef = React.useRef(null);
  const itemRefs = React.useRef({});
  const indicadorRef = React.useRef(null);
  const pos = usePosicaoIndicador(tela, barraRef, itemRefs);
  const posAnterior = React.useRef(null);

  const dispararGota = React.useCallback(() => {
    const el = indicadorRef.current;
    if (!el) return;
    el.classList.remove("is-deslizando");
    void el.offsetWidth; // força o reflow pra o navegador reiniciar a animação
    el.classList.add("is-deslizando");
  }, []);

  // Reinicia a animação de deformação a cada troca de aba (só quando o
  // indicador realmente muda de lugar — não na primeira medição nem num resize).
  React.useLayoutEffect(() => {
    const antes = posAnterior.current;
    posAnterior.current = pos;
    if (!pos || !antes || antes.left === pos.left) return;
    dispararGota();
  }, [pos, dispararGota]);

  // ─── Arrastar a gota de uma aba pra outra (só no toque) ───
  // Enquanto o dedo está na tela a gota acompanha ele sem transição; ao soltar,
  // ela solta e escorre até a aba mais próxima com a mesma animação do toque.
  const arraste = React.useRef(null);
  const arrastou = React.useRef(false);

  const medirAbas = React.useCallback(() => {
    const barra = barraRef.current;
    if (!barra) return [];
    const base = barra.getBoundingClientRect().left;
    return Object.entries(itemRefs.current)
      .filter(([, el]) => el)
      .map(([id, el]) => ({
        id,
        left: el.offsetLeft,
        width: el.offsetWidth,
        centro: base + el.offsetLeft + el.offsetWidth / 2,
      }))
      .sort((a, b) => a.left - b.left);
  }, [barraRef, itemRefs]);

  // "Redondo" só existe em caixa quadrada: com 50% num retângulo de 107×51 sai
  // uma elipse. Então o círculo é a gota encolhida à própria altura, centrada em
  // cima do botão — só assim o 50% vira circunferência de verdade.
  const virarBolha = (el, left, width) => {
    const d = el.offsetHeight;
    el.style.width = `${d}px`;
    el.style.transform = `translateX(${left + (width - d) / 2}px)`;
    return d;
  };

  const encaixar = (el, left, width) => {
    el.style.width = `${width}px`;
    el.style.transform = `translateX(${left}px)`;
  };

  const aoApontar = (e) => {
    // "somente no mobile": mouse e caneta seguem só com o clique normal
    if (e.pointerType !== "touch" || !pos) return;
    const alvo = e.target.closest?.("[data-aba]");
    if (!alvo) return;
    const el = indicadorRef.current;
    arrastou.current = false;
    arraste.current = { x0: e.clientX, ativo: false, id: alvo.dataset.aba };
    // Dedo parado em cima da aba onde a gota está: ela vira bolha. Nas outras
    // não faz sentido — a gota não está lá pra reagir.
    if (el && alvo.dataset.aba === tela) {
      el.classList.add("is-segurando");
      virarBolha(el, pos.left, pos.width);
    }
  };

  const aoMover = (e) => {
    const a = arraste.current;
    const el = indicadorRef.current;
    if (!a || !el) return;

    if (!a.ativo) {
      if (Math.abs(e.clientX - a.x0) < 8) return; // ainda pode virar um toque
      a.ativo = true;
      a.abas = medirAbas();
      a.base = barraRef.current.getBoundingClientRect().left;
      arrastou.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      // a gota passa a estar sob o dedo, então vira bolha mesmo se o toque
      // tiver começado em outra aba
      el.classList.add("is-arrastando", "is-segurando");
      const daVez = a.abas.find((ab) => ab.id === tela) ?? a.abas[0];
      a.diametro = virarBolha(el, daVez.left, daVez.width);
    }

    const abas = a.abas;
    if (!abas.length) return;
    // a bolha fica centrada no dedo, presa entre os centros da primeira e da
    // última aba pra não escapar da barra
    const d = a.diametro;
    const primeira = abas[0];
    const ultima = abas[abas.length - 1];
    const minC = primeira.left + primeira.width / 2;
    const maxC = ultima.left + ultima.width / 2;
    const centro = Math.min(maxC, Math.max(minC, e.clientX - a.base));
    el.style.transform = `translateX(${centro - d / 2}px)`;

    const perto = abas.reduce((m, ab) =>
      Math.abs(ab.centro - e.clientX) < Math.abs(m.centro - e.clientX) ? ab : m
    );
    if (perto.id !== a.id) {
      a.id = perto.id;
      vibrar();
    }
  };

  const aoSoltar = (e) => {
    const a = arraste.current;
    const el = indicadorRef.current;
    arraste.current = null;
    if (!el) return;
    const eraBolha = el.classList.contains("is-segurando");
    el.classList.remove("is-segurando"); // soltou o dedo: a bolha se espalha

    if (!a || !a.ativo) {
      // foi só um toque parado: desfaz a bolha de volta no encaixe da aba
      if (eraBolha && pos) encaixar(el, pos.left, pos.width);
      return;
    }
    el.classList.remove("is-arrastando");
    // devolve a gota ao encaixe da aba escolhida; se for a mesma de onde saiu, o
    // React não re-renderiza, então largura e posição são repostas aqui na mão
    const destino = a.abas.find((ab) => ab.id === a.id);
    if (destino) encaixar(el, destino.left, destino.width);
    dispararGota();
    if (a.id !== tela) irPara(a.id);
    const barra = e.currentTarget;
    if (barra.hasPointerCapture?.(e.pointerId)) barra.releasePointerCapture(e.pointerId);
  };

  const aoCancelar = () => {
    const a = arraste.current;
    const el = indicadorRef.current;
    arraste.current = null;
    if (!el) return;
    el.classList.remove("is-segurando", "is-arrastando");
    if (pos) encaixar(el, pos.left, pos.width);
  };

  const itens = ITENS_TAB.map((it) => ({ ...it, label: t(it.label) }));
  // Tela secundária: a barra sai de cena (desce e apaga, ver .nav-dock). Ela
  // continua montada pra descer e voltar animada — e por isso some também dos
  // leitores de tela e da ordem de tabulação enquanto está fora.
  const visivel = ABAS.includes(tela);
  return (
    <div
      className={`nav-dock${visivel ? "" : " is-oculta"}`}
      aria-hidden={visivel ? undefined : true}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        padding: `8px 14px max(28px, env(safe-area-inset-bottom))`,
        background:
          "linear-gradient(180deg, transparent 0%, var(--bg) 92%)",
        pointerEvents: "none",
      }}
    >
      <div
        ref={barraRef}
        className="glass-surface"
        style={{
          maxWidth: 480,
          margin: "0 auto",
          borderRadius: 26,
          boxShadow:
            "0 10px 30px rgba(20,16,24,0.12), inset 0 1px 0 rgba(255,255,255,0.25)",
          padding: "6px 6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pointerEvents: "auto",
          position: "relative",
          // o arraste horizontal é nosso; a barra é fixa, não rola nada por baixo
          touchAction: "none",
        }}
        onPointerDown={aoApontar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoCancelar}
      >
        <div
          ref={indicadorRef}
          className="nav-indicador"
          aria-hidden="true"
          style={{
            // o raio de repouso desce daqui pra CSS (que o usa no estado parado
            // e no último quadro do @keyframes nav-gota): assim RAIO_GOTA é o
            // único lugar a mexer, e a gota nunca assenta num raio diferente do
            // botão que ela preenche
            "--raio-gota": `${RAIO_GOTA}px`,
            opacity: pos ? 1 : 0,
            top: pos?.top ?? 0,
            width: pos?.width ?? 0,
            height: pos?.height ?? 0,
            transform: `translateX(${pos?.left ?? 0}px)`,
          }}
        />
        {itens.map((it) => {
          const ativo = tela === it.id;
          if (it.destaque) {
            return (
              <button
                key={it.id}
                onClick={abrirAdd}
                aria-label={t("Nova transação")}
                tabIndex={visivel ? undefined : -1}
                className="nav-fab"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  border: "none",
                  background:
                    "var(--primary-degrade)",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "0 6px 16px color-mix(in oklab, var(--primary) 35%, transparent)",
                  transform: "translateY(-8px)",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <Icon name="plus" size={26} color="#fff" strokeWidth={2.6} />
              </button>
            );
          }
          return (
            <button
              key={it.id}
              onClick={() => {
                // um arraste que terminou aqui já navegou no pointerup
                if (arrastou.current) return void (arrastou.current = false);
                if (it.id !== tela) vibrar();
                irPara(it.id);
              }}
              aria-label={it.label}
              aria-current={ativo ? "page" : undefined}
              tabIndex={visivel ? undefined : -1}
              className="nav-btn"
              data-aba={it.id}
              ref={(el) => { itemRefs.current[it.id] = el; }}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                borderRadius: RAIO_GOTA,
                padding: "11px 4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // acima do indicador, que desliza por baixo dos ícones
                position: "relative",
                zIndex: 1,
              }}
            >
              {/* sem rótulo: o ícone sozinho identifica a aba. O IconeTab tem
                  classe em cada parte do desenho pra a CSS dar a cada aba a sua
                  própria animação quando ela vira a ativa (aria-current) */}
              <span className="nav-icone">
                <IconeTab
                  name={it.icon}
                  size={24}
                  color={ativo ? "var(--primary)" : "var(--muted)"}
                  strokeWidth={ativo ? 2.4 : 2}
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Palco das telas ───
// As 4 abas principais ficam montadas depois da primeira visita. Voltar pra uma
// delas deixa de reconstruir a tela inteira do zero — o que doía principalmente
// no Início, que orquestra 9 blocos e recalcula insights, notificações e saldo
// antes do primeiro pixel. As telas secundárias (categoria, histórico, ...) são
// visitas pontuais e continuam montando e desmontando.
const ABAS_VIVAS = {
  inicio: DashboardScreen,
  gastos: GastosScreen,
  analise: AnaliseScreen,
  perfil: PerfilScreen,
};

// Devolve sempre o MESMO elemento enquanto congelada. O React desiste de
// re-renderizar uma subárvore quando recebe um elemento idêntico ao anterior,
// então a aba escondida para de custar render sem precisar memoizar o ctx
// inteiro — que tem meia centena de campos e callbacks recriados a cada render.
// Ao voltar a ficar visível ela recebe o elemento novo e reflete os dados atuais.
function Congelada({ congelar, children }) {
  const ultimo = React.useRef(children);
  if (!congelar) ultimo.current = children;
  return ultimo.current;
}

function AreaDeTelas({ tela, params, ctx, secundaria, chaveTransicao }) {
  const vivas = React.useRef(new Set());
  const ehAba = Object.hasOwn(ABAS_VIVAS, tela);
  // No modo leve o conjunto guarda no máximo a aba atual: as outras saem do DOM
  // em vez de ficarem montadas e escondidas. É o item mais caro do modo em
  // termos de sensação — voltar numa aba passa a custar montagem — e o mais
  // valioso em aparelho de 1–2 GB, onde é a memória que faz o navegador matar a
  // página em segundo plano. Limpar aqui (e não só ignorar o conjunto) mantém o
  // estado honesto: desligar o modo não faz quatro abas nascerem de uma vez.
  if (ctx.leve) vivas.current.clear();
  if (ehAba) vivas.current.add(tela);

  // Sem a `key` que remontava tudo, a animação de entrada não reinicia sozinha:
  // reiniciamos na mão a cada troca, como se o nó fosse novo.
  const palco = React.useRef(null);
  // Trocar de params normalmente é navegar, e a animação deve tocar. A exceção é
  // o par mestre-detalhe do desktop: lá os params são só qual item está aberto,
  // e reanimar o palco inteiro faria a lista da esquerda piscar junto. Quem
  // monta o par passa uma chave que ignora os params.
  const assinatura = chaveTransicao ?? tela + JSON.stringify(params || {});
  React.useLayoutEffect(() => {
    const el = palco.current;
    // No modo leve não há animação pra reiniciar, e o `offsetWidth` abaixo é um
    // layout síncrono a cada navegação — justamente o que não se paga à toa num
    // aparelho fraco.
    if (!el || ctx.leve) return;
    el.classList.remove("page-transition");
    void el.offsetWidth; // força o reflow pra o navegador reiniciar a animação
    el.classList.add("page-transition");
  }, [assinatura, ctx.leve]);

  return (
    <div ref={palco} className="page-transition">
      <React.Suspense fallback={<LoaderTela />}>
        {[...vivas.current].map((id) => {
          const Tela = ABAS_VIVAS[id];
          const visivel = id === tela;
          return (
            <div key={id} style={visivel ? undefined : { display: "none" }}>
              <Congelada congelar={!visivel}>
                <Tela ctx={ctx} />
              </Congelada>
            </div>
          );
        })}
        {!ehAba && secundaria}
      </React.Suspense>
    </div>
  );
}

// ─── Sidebar (layout desktop) ───
const NAV_DESKTOP = [
  { id: "inicio", icon: "home", label: "Início" },
  { id: "gastos", icon: "list", label: "Transações" },
  { id: "analise", icon: "chart", label: "Análise" },
  { id: "orcamentos", icon: "target", label: "Orçamentos" },
  { id: "caixinhas", icon: "piggy", label: "Caixinhas" },
  { id: "cartoes", icon: "card", label: "Cartões" },
  { id: "recorrentes", icon: "history", label: "Recorrentes" },
  { id: "historico", icon: "calendar", label: "Histórico" },
  { id: "perfil", icon: "user", label: "Perfil" },
];

// Largura da coluna de conteúdo no desktop, por tela. O padrão estreito serve
// às telas que são uma lista só — esticá-las deixaria linhas longas demais pra
// ler. Quem tem layout próprio em colunas pede espaço e aparece aqui.
const LARGURA_DESKTOP = {
  inicio: 1080,
  analise: 1080,
  gastos: 1080,
  perfil: 1000,
  cartoes: 1000,
  caixinhas: 1000,
  orcamentos: 1000,
  historico: 940,
  recorrentes: 940,
  caixinha: 1100, // lista + detalhe lado a lado
};
const LARGURA_DESKTOP_PADRAO = 640;

// Telas de detalhe que, no desktop, aparecem AO LADO da lista de onde saíram em
// vez de substituí-la: a lista fica montada à esquerda e escolher outro item
// troca só o painel da direita. No mobile nada disso existe — lá o detalhe
// ocupa a tela inteira, como sempre.
//
// Só entra aqui o par em que a lista é curta o bastante pra caber numa coluna
// estreita E o detalhe é a tela inteira de um item dela.
const MESTRE_DE = {
  caixinha: { id: "caixinhas", Tela: CaixinhasScreen },
};

function Sidebar({ tela, irPara, abrirAdd, usuario, fotoPerfil }) {
  const t = useT();
  const navRef = React.useRef(null);
  const itemRefs = React.useRef({});
  // O desktop leva só o deslize: o indicador é o mesmo retângulo de antes, que
  // agora escorrega entre os itens em vez de reaparecer no lugar novo. Nada de
  // deformação no caminho — por isso não há classe de animação aqui.
  const pos = usePosicaoIndicador(tela, navRef, itemRefs);

  return (
    <aside
      className="glass-surface"
      style={{
        width: 248,
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
        borderTop: "none",
        borderBottom: "none",
        borderLeft: "none",
        display: "flex",
        flexDirection: "column",
        padding: "20px 14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "4px 10px 20px",
        }}
      >
        <span
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: "var(--ink)",
            letterSpacing: "-0.02em",
          }}
        >
          MyCounts
        </span>
      </div>

      <button
        onClick={abrirAdd}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          margin: "0 6px 14px",
          padding: "11px 12px",
          borderRadius: 14,
          border: "none",
          background:
            "var(--primary-degrade)",
          color: "#fff",
          fontSize: 14,
          fontWeight: 800,
          cursor: "pointer",
          fontFamily: "inherit",
          boxShadow:
            "0 6px 16px color-mix(in oklab, var(--primary) 30%, transparent)",
        }}
      >
        <Icon name="plus" size={18} color="#fff" strokeWidth={2.6} />
        {t("Nova Transação")}
      </button>

      <nav
        ref={navRef}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          position: "relative",
        }}
      >
        <div
          className="nav-indicador nav-indicador--v"
          aria-hidden="true"
          style={{
            opacity: pos ? 1 : 0,
            top: 0,
            width: pos?.width ?? 0,
            height: pos?.height ?? 0,
            transform: `translateY(${pos?.top ?? 0}px)`,
          }}
        />
        {NAV_DESKTOP.map((it) => {
          const ativo = tela === it.id;
          return (
            <button
              key={it.id}
              onClick={() => {
                if (it.id !== tela) vibrar();
                irPara(it.id);
              }}
              ref={(el) => { itemRefs.current[it.id] = el; }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: "transparent", // o fundo agora é o indicador que desliza
                color: ativo ? "var(--primary)" : "var(--ink)",
                fontSize: 14,
                fontWeight: ativo ? 800 : 600,
                fontFamily: "inherit",
                textAlign: "left",
                position: "relative",
                zIndex: 1,
              }}
            >
              <Icon
                name={it.icon}
                size={20}
                color={ativo ? "var(--primary)" : "var(--muted)"}
                strokeWidth={ativo ? 2.4 : 2}
              />
              {t(it.label)}
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {usuario && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px",
            borderRadius: 12,
            background: "var(--surface-sunken)",
          }}
        >
          {(fotoPerfil || usuario.photoURL) ? (
            <img
              src={fotoPerfil || usuario.photoURL}
              alt=""
              referrerPolicy="no-referrer"
              style={{ width: 30, height: 30, borderRadius: 15, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                background: "var(--primary)",
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--ink)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {usuario.displayName || usuario.email}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function aplicarTema(paleta, modo) {
  const root = document.documentElement;
  const pal = acharPaleta(paleta);
  const ehEscuro = ehTemaEscuro(modo);
  // Marca no <html> pra o CSS saber a direção de um realce: no tema claro um
  // hover escurece, no escuro clareia. As cores em si continuam vindo das
  // variáveis abaixo — a classe só diz de que lado estamos.
  root.classList.toggle("tema-escuro", ehEscuro);
  // Paletas podem ter variantes dark (a "Preto" vira prata pra continuar
  // visível contra o --bg escuro). Se não houver, usa a clara.
  const { primary, primary2 } = coresDaPaleta(pal, ehEscuro);
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--primary-2", primary2);
  // O degradê de destaque dos botões grandes, banners e avatares. Sai daqui, e
  // não de cada botão, porque nenhum deles sabe qual paleta está ativa; antes a
  // receita estava copiada em 22 lugares.
  root.style.setProperty("--primary-degrade", degradeDaPaleta(pal, ehEscuro));
  // O gradiente do card de destaque. Vem pronto de `heroDaPaleta`, que é quem
  // conhece as paradas e o porquê delas.
  root.style.setProperty("--primary-hero", heroDaPaleta(pal, ehEscuro));
  // O logo NÃO acompanha a cor de destaque. Ele já acompanhou, derivando três
  // tons próprios da paleta; com a lista de paletas crescendo, isso virou uma
  // marca que muda de cor a cada escolha do usuário, e a animação de abertura
  // — a primeira coisa que ele vê — nunca era a mesma duas vezes. Agora as
  // cores da marca valem sempre: os SVGs de ui/logo-animado.jsx trazem os
  // valores originais como fallback dos `var(--logo-*)`, então basta não
  // definir as variáveis.
  if (ehEscuro) {
    // Paleta dark calibrada para contraste WCAG AA:
    // - bg → card → card-2 formam uma escada clara de elevação
    // - ink quase branco; muted bem mais claro que antes (era 9B919A, contraste insuficiente)
    root.style.setProperty("--bg", "#13101A");
    root.style.setProperty("--card", "#1F1B26");
    root.style.setProperty("--card-2", "#2B2533");
    root.style.setProperty("--surface-sunken", "#0D0B12");
    root.style.setProperty("--ink", "#F4F0F2");
    root.style.setProperty("--muted", "#B8AEB6");
    root.style.setProperty("--linha", "rgba(255,255,255,0.08)");
    root.style.setProperty("color-scheme", "dark");
  } else {
    root.style.setProperty("--bg", "#FBF7F2");
    root.style.setProperty("--card", "#FFFFFF");
    root.style.setProperty("--card-2", "#FFFFFF");
    root.style.setProperty("--surface-sunken", "#F3EEE8");
    root.style.setProperty("--ink", "#1A1416");
    root.style.setProperty("--muted", "#8A7F84");
    root.style.setProperty("--linha", "rgba(20,16,24,0.06)");
    root.style.setProperty("color-scheme", "light");
  }
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", primary);
}

export function App() {
  // Auth: undefined = carregando, null = deslogado, objeto = usuário (verificado ou não)
  const [usuario, setUsuario] = React.useState(undefined);
  const [, forcarRender] = React.useReducer((n) => n + 1, 0); // re-renderiza após user.reload()
  // O palpite de sessão é gravado aqui, na única fonte que sabe a verdade — ver
  // lib/sessao.js pra o que ele serve e o quanto vale.
  React.useEffect(
    () =>
      escutarAuth((u) => {
        lembrarSessao(!!u);
        setUsuario(u);
      }),
    [],
  );

  // Só conecta ao Firestore quando o usuário existe E confirmou o e-mail
  // (não criamos os dados de quem ainda não verificou a conta).
  const verificado = !!usuario?.emailVerified;
  const uid = verificado ? usuario.uid : null;
  const cloud = useCloudState(uid);

  // Modo leve (lib/leve.js). Mesmo arranjo do tema, e pelo mesmo motivo: precisa
  // valer no primeiro quadro, antes da nuvem responder — a tela de login já tem
  // vidro e animação. Fica aqui em cima porque o splash logo abaixo já depende
  // dele.
  const leveEscolha = (cloud.ready && cloud.preferences.leve) || lerLeveSalvo() || AUTO;
  const leve = ehLeve(leveEscolha);

  // O splash da abertura, pedido em duas esperas seguidas: o auth decidindo se
  // há sessão e os dados de quem está logado chegando. Como o logo não remonta
  // entre uma e outra, as duas viram uma animação só.
  //
  // A primeira espera tem um problema de ovo e galinha: quem já estava logado
  // está vendo o app abrir e merece o splash, quem não estava vai direto pro
  // login — um splash antes dele seria só um flash a mais no caminho —, e é
  // justamente a resposta que falta que diz qual dos dois é. Daí o palpite do
  // `haviaSessao`. Quando ele erra (sessão expirada desde a última visita), o
  // splash dá lugar ao login assim que o auth responde.
  //
  // O `useSplashInteiro` é quem segura o splash até a animação do logo acabar,
  // mesmo que as duas esperas terminem antes disso — quase sempre terminam. No
  // modo leve ele não segura nada: ali o pedido é abrir logo, e num aparelho
  // fraco a abertura costuma passar de 1,3s por conta própria mesmo.
  const precisaSplash =
    (usuario === undefined && haviaSessao()) || (verificado && !cloud.ready);
  const mostrarSplash = useSplashInteiro(precisaSplash, leve);

  // Idioma ativo. Vem de preferences.idioma (sincronizado na nuvem); antes dos
  // dados carregarem — login, onboarding — usamos o último valor salvo no
  // localStorage pra abrir já no idioma certo.
  const idioma =
    (cloud.ready && cloud.preferences?.idioma) || lerIdiomaSalvo() || "pt";
  React.useEffect(() => {
    if (cloud.ready && cloud.preferences?.idioma) {
      salvarIdioma(cloud.preferences.idioma);
    }
  }, [cloud.ready, cloud.preferences?.idioma]);

  // Moeda de exibição (símbolo/formato, sem conversão de câmbio). Aplicada já no
  // render — antes das telas filhas — pra que fmtBRL leia o valor certo. Quando
  // preferences.moeda muda (estado React), o app re-renderiza e tudo atualiza.
  const moeda = (cloud.ready && cloud.preferences?.moeda) || lerMoedaSalva() || "BRL";
  setMoedaAtiva(moeda);
  React.useEffect(() => {
    if (cloud.ready && cloud.preferences?.moeda) {
      salvarMoeda(cloud.preferences.moeda);
    }
  }, [cloud.ready, cloud.preferences?.moeda]);

  // Conta compartilhada: escuta convites e finaliza o pareamento do meu lado
  // quando o convite que eu enviei é aceito (ver partnership.js).
  const convitesRecebidos = useConvitesRecebidos(uid);
  const convitesEnviados = useConvitesEnviados(uid);
  useFinalizarPareamento({
    uid,
    jaTenhoParceiro: !!cloud.partnerUid,
    enviados: convitesEnviados,
  });

  // Dados do parceiro (read-only). Só carrega quando há parceria firmada.
  const partner = usePartnerData(cloud.partnerUid);
  // Cada tx do parceiro recebe uma flag interna pra a UI saber renderizar
  // com o estilo "apagado" + badge da inicial dele.
  const partnerTxs = React.useMemo(
    () => (partner.txs || []).map((t) => ({ ...t, _parceiro: true })),
    [partner.txs],
  );

  // Caixinhas compartilhadas: quando há parceria, vivem em partnerships/{pId}.
  // Sem parceria, ficam no user doc como sempre (via cloud).
  const shared = useSharedCaixinhas({
    partnershipId: cloud.partnershipId,
    uid,
    partnerNome: cloud.partnerNome || partner.nome,
  });
  useLimparParceriaOrfa({
    uid,
    meuEmail: cloud.email,
    partnershipId: cloud.partnershipId,
    partnershipExiste: shared.existe,
    partnershipDesfeito: shared.desfeito,
  });

  // Mescla categorias personalizadas em CATEGORIAS/ORDEM_CATS antes de renderizar as telas.
  // Quando há parceria, mescla também as do parceiro pra que as txs dele rendam
  // a categoria certa (sem cair em "Outros").
  // Roda DURANTE o render (não em useEffect) porque os filhos leem CATEGORIAS
  // direto — se isso virasse efeito, o primeiro frame após uma categoria nova
  // do parceiro mostraria "Outros" antes de re-renderizar.
  if (cloud.categoriasCustom?.length) {
    aplicarCategoriasCustom(cloud.categoriasCustom);
  }
  if (partner.categoriasCustom?.length) {
    // `doParceiro: true` mantém o id no CATEGORIAS (para renderizar as txs
    // do parceiro com nome/cor certos), mas marca a entrada para que pickers,
    // filtros e orçamentos a omitam — categorias customizadas são pessoais
    // por conta. Ver `catsMinhas()` em data.js.
    aplicarCategoriasCustom(partner.categoriasCustom, { doParceiro: true });
  }

  const adicionarCategoria = React.useCallback(
    (nome, cor) => {
      const cat = novaCategoriaCustom(nome, cor);
      aplicarCategoriasCustom([cat]);
      cloud.setCategoriasCustom((atual) => [
        ...atual,
        { id: cat.id, nome: cat.nome, cor: cat.cor, corFundo: cat.corFundo },
      ]);
      return cat.id;
    },
    [cloud.setCategoriasCustom],
  );

  // Exclui uma categoria personalizada. Reatribui transações que a usavam pra
  // "outros" (pra não sumir do histórico) e remove o orçamento associado.
  // Categorias built-in não podem ser excluídas.
  const excluirCategoria = React.useCallback(
    (id) => {
      if (!id || !CATEGORIAS[id]?.custom) return;
      // Defesa: nunca deletar categoria do parceiro do meu lado.
      if (CATEGORIAS[id]?.doParceiro) return;
      // 1) Remove da lista persistida.
      cloud.setCategoriasCustom((atual) =>
        (atual || []).filter((c) => c.id !== id),
      );
      // 2) Remove do CATEGORIAS/ORDEM_CATS em memória pra não aparecer mais.
      delete CATEGORIAS[id];
      const idx = ORDEM_CATS.indexOf(id);
      if (idx >= 0) ORDEM_CATS.splice(idx, 1);
      // 3) Reatribui txs antigas pra "outros" (preserva histórico).
      cloud.setTxs((atual) =>
        (atual || []).map((t) =>
          t.categoria === id ? { ...t, categoria: "outros" } : t,
        ),
      );
      // 4) Limpa o orçamento associado, se houver.
      cloud.setOrcamentos((atual) => {
        if (!atual || !(id in atual)) return atual;
        const novo = { ...atual };
        delete novo[id];
        return novo;
      });
    },
    [cloud.setCategoriasCustom, cloud.setTxs, cloud.setOrcamentos],
  );

  // Aparência ativa. Mesmo arranjo do idioma e da moeda: manda a nuvem, e antes
  // dela chegar vale o espelho do localStorage — só que aqui o espelho pesa
  // mais, porque é ele que dá ao splash da abertura o fundo e o logo na cor
  // certa em vez de 1,3s na paleta padrão.
  //
  // O useMemo é pra ler o localStorage uma vez só: o espelho não muda por fora,
  // e este componente re-renderiza a cada mexida no app.
  const salva = React.useMemo(lerAparenciaSalva, []);
  const paleta =
    (cloud.ready && cloud.preferences.paleta) || salva.paleta || PALETAS[0].primary;
  const modo = (cloud.ready && cloud.preferences.modo) || salva.modo || "sistema";
  React.useEffect(() => {
    if (cloud.ready) salvarAparencia(paleta, modo);
  }, [cloud.ready, paleta, modo]);

  // Tema reativo às preferências. Quando modo === 'sistema', também escuta
  // mudanças do prefers-color-scheme do SO pra trocar light/dark on the fly.
  //
  // useLayoutEffect, e não useEffect, porque isto pinta a tela inteira: com o
  // efeito depois do paint dava pra ver um quadro na paleta padrão antes da
  // troca — de novo, algo que só o splash tornou visível.
  React.useLayoutEffect(() => {
    aplicarTema(paleta, modo);
    if (modo !== "sistema") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => aplicarTema(paleta, modo);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [paleta, modo]);

  // O atributo no <html> é o que liga as regras `[data-leve]` do CSS (o vidro e
  // as animações de transição). Do lado do JS o modo decide o carrossel, o
  // prefetch e quantas abas ficam montadas.
  React.useLayoutEffect(() => {
    document.documentElement.toggleAttribute("data-leve", leve);
  }, [leve]);
  React.useEffect(() => {
    if (cloud.ready) salvarLeve(leveEscolha);
  }, [cloud.ready, leveEscolha]);

  // Gerador de recorrentes: roda 1× quando o storage está pronto.
  // Para cada recorrência, gera as txs dos meses pulados entre ultimoMesGerado e hoje.
  const geradorRodou = React.useRef(false);
  React.useEffect(() => {
    if (!cloud.ready || geradorRodou.current) return;
    geradorRodou.current = true;
    const recs = cloud.recorrentes;
    if (!recs || recs.length === 0) return;

    const yyyymmHoje = mesCorrente();
    const novosTxs = [];
    let mutou = false;

    const recsAtualizadas = recs.map((r) => {
      if (!r.ultimoMesGerado || r.ultimoMesGerado >= yyyymmHoje) return r;
      // Se a recorrência tem fim definido e já passamos dele, não gera mais.
      if (r.fim && r.ultimoMesGerado >= r.fim) return r;
      let cur = r.ultimoMesGerado;
      const limite = r.fim && r.fim < yyyymmHoje ? r.fim : yyyymmHoje;
      while (cur < limite) {
        const yyyymm = mesShift(cur, 1);
        const data = dataNoMes(yyyymm, r.dia);
        novosTxs.push({
          id: `${r.id}-${yyyymm}`,
          tipo: r.tipo,
          descricao: r.descricao,
          categoria: r.categoria,
          pagamento: r.pagamento,
          valor: valorRecNoMes(r, yyyymm),
          data,
          recorrenteId: r.id,
        });
        cur = yyyymm;
      }
      mutou = true;
      return { ...r, ultimoMesGerado: cur };
    });

    if (mutou) {
      cloud.setTxs((atual) => {
        const existentes = new Set(atual.map((t) => t.id));
        const aAdicionar = novosTxs.filter((t) => !existentes.has(t.id));
        if (aAdicionar.length === 0) return atual;
        return [...aAdicionar, ...atual].sort((a, b) =>
          b.data.localeCompare(a.data),
        );
      });
      cloud.setRecorrentes(recsAtualizadas);
    }
  }, [cloud.ready]);

  const ehDesktop = useEhDesktop();

  // Atalho de teclado do desktop: "N" abre uma transação nova, o mesmo que o
  // botão do topo da sidebar. Não aparece escrito em lugar nenhum — é um extra
  // pra quem descobrir, não o caminho principal, que continua sendo o botão.
  React.useEffect(() => {
    if (!ehDesktop) return;
    const aoTeclar = (e) => {
      if (e.key !== "n" && e.key !== "N") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return; // Ctrl+N é do navegador
      if (temOverlayAberto()) return;
      // Digitando num campo, "n" é só a letra n.
      if (e.target?.matches?.('input, textarea, select, [contenteditable="true"]')) return;
      e.preventDefault();
      vibrar();
      setAddModal({});
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [ehDesktop]);
  const install = useInstallPrompt();

  // Prefetch dos chunks das telas quando o browser estiver ocioso. Como as
  // telas são carregadas com React.lazy (code-splitting), a PRIMEIRA visita a
  // cada aba precisaria baixar+parsear o chunk e parava no skeleton no meio da
  // navegação — a "engasgada" que só acontece na primeira vez. Aquecendo o
  // cache de módulos em idle, a navegação resolve na hora, sem flash.
  //
  // No modo leve não roda: são ~258 kB pra baixar e compilar, e a fatia de
  // ocioso que o `requestIdleCallback` dá num aparelho fraco é curta demais pra
  // isso caber sem disputar CPU com os primeiros toques do usuário. Lá cada aba
  // baixa a sua na primeira visita — depois o service worker já tem em cache.
  React.useEffect(() => {
    if (!cloud.ready || leve) return;
    const agendar =
      window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
    const cancelar = window.cancelIdleCallback || clearTimeout;
    const id = agendar(() => {
      import("./screens/dashboard.jsx");
      import("./screens/gastos.jsx");
      import("./screens/analise.jsx");
      import("./screens/perfil.jsx");
      import("./screens/orcamentos.jsx");
      import("./screens/historico.jsx");
      import("./screens/caixinhas.jsx");
      import("./screens/recorrentes.jsx");
      import("./screens/notificacoes.jsx");
      import("./modals/add-expense.jsx");
    });
    return () => cancelar(id);
  }, [cloud.ready, leve]);

  // Navegação local
  const [mes, setMes] = React.useState(chaveMes(new Date()));
  const [tela, setTela] = React.useState("inicio");
  const [params, setParams] = React.useState({});
  const [stack, setStack] = React.useState([]);

  // Ao logar (uid passa a ser válido), volta sempre para a tela "inicio".
  // Sem isto, quem desloga em "gastos"/"analise" volta para a mesma aba
  // ao logar novamente, porque o componente App nunca desmonta.
  React.useEffect(() => {
    if (uid) {
      setTela("inicio");
      setStack([]);
      setParams({});
    }
  }, [uid]);
  // Contador de tentativas de gravar sem internet. É número e não booleano de
  // propósito: tentar de novo com o aviso já aberto precisa reabrir e reiniciar
  // a contagem, e um `true` que já era `true` não dispararia efeito nenhum.
  const [tentativaOffline, setTentativaOffline] = React.useState(0);
  const offline = useEstaOffline();

  // Quanto a faixa de offline empurra o conteúdo pra baixo. Fica no <html> (e
  // não no <main>) porque quem lê essa medida é o botão de voltar, que é
  // portalizado em document.body — de dentro do <main> a variável não chegaria
  // nele. Sem isso, o botão fica escondido atrás da faixa justo quando não dá
  // pra gravar nada.
  React.useEffect(() => {
    const raiz = document.documentElement;
    raiz.style.setProperty(
      "--offset-topo",
      offline ? `calc(${ALTURA_FAIXA}px + env(safe-area-inset-top))` : "0px",
    );
  }, [offline]);
  const [addModal, setAddModal] = React.useState(null);
  const [onboarding, setOnboarding] = React.useState(
    () => !localStorage.getItem(ONBOARDING_KEY),
  );

  const finalizarOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setOnboarding(false);
  };

  const todosMeses = React.useMemo(() => listarMeses(cloud.txs), [cloud.txs]);
  const mesAnterior = React.useMemo(() => {
    const i = todosMeses.indexOf(mes);
    return i >= 0 && i < todosMeses.length - 1 ? todosMeses[i + 1] : null;
  }, [todosMeses, mes]);

  // Histórico do orçamento: quem carimba `preferences.orcBaseAt` é a tela de
  // Orçamentos, no momento em que o usuário salva um valor novo (ver
  // registrarMudancaOrcBase). Não há mais backfill na abertura do app: ele
  // preenchia meses antigos com o orçamento de HOJE, que agora reescreveria
  // justamente o histórico que queremos preservar.

  const irPara = (t, p = {}) => {
    vibrar();
    if (ABAS.includes(t)) {
      // Início e Transações sempre abrem no mês atual, salvo quando um mês
      // específico é passado (ex.: clicar num mês no Histórico).
      if (t === "inicio" || t === "gastos") {
        setMes(p.mes || chaveMes(new Date()));
      }
      setStack([]);
      setTela(t);
      setParams({});
    } else if (t === "add") {
      setAddModal(p);
    } else if (t === tela) {
      // Já estamos nesta tela: trocar de item (outra caixinha no painel do
      // desktop) é substituir o que está aberto, não empilhar mais um passo.
      // Sem isso, escolher cinco caixinhas seguidas custaria cinco voltas.
      setParams(p);
    } else {
      setStack([...stack, { tela, params }]);
      setTela(t);
      setParams(p);
    }
  };
  const voltar = () => {
    if (stack.length === 0) {
      setTela("inicio");
      setParams({});
      return;
    }
    const last = stack[stack.length - 1];
    setStack(stack.slice(0, -1));
    setTela(last.tela);
    setParams(last.params);
  };

  const salvarTx = (tx, editando) => {
    vibrar(14);
    const ehRec = tx.ehRecorrente;
    const recDia = tx.recDia;
    const recFim = tx.recFim;
    const recCresc = tx.recCresc; // reajuste composto por parcela (decimal) ou null
    delete tx.ehRecorrente; // flag de UI, não persistir
    delete tx.recDia;
    delete tx.recFim;
    delete tx.recCresc;

    const expandir = (base) => {
      if (!base.parcelas) {
        const { parcelas, ...rest } = base;
        return [rest];
      }
      const { total, valorTotal } = base.parcelas;
      const grupoId =
        base.parcelas.grupoId ||
        `gr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const valorPP = Math.round((valorTotal / total) * 100) / 100;
      const [ano, mesN, dia] = base.data.split("-").map(Number);
      const out = [];
      for (let i = 0; i < total; i++) {
        const dt = new Date(ano, mesN - 1 + i, dia);
        const yyyymmdd = dataISO(dt);
        out.push({
          id: `${grupoId}-${i + 1}`,
          descricao: base.descricao,
          categoria: base.categoria,
          pagamento: base.pagamento,
          ...(base.cartaoId && { cartaoId: base.cartaoId }),
          valor: valorPP,
          data: yyyymmdd,
          parcelas: { total, atual: i + 1, grupoId, valorTotal },
        });
      }
      return out;
    };

    // Se for recorrente, cria a recorrência E pré-gera 12 meses (1 ano).
    // A primeira tx (mês atual) mantém o id "tx-..."; as 11 seguintes usam "${recId}-${yyyymm}".
    if (ehRec) {
      const recId = `rec-${Date.now()}`;
      const [yy, mm, dd] = tx.data.split("-").map(Number);
      const inicioYYMM = `${yy}-${String(mm).padStart(2, "0")}`;
      const diaCfg = recDia || dd;
      // Quantidade de meses entre início e fim (inclusive). Garante pelo menos 1.
      const totalMeses = (() => {
        if (!recFim) return 12;
        const [fy, fm] = recFim.split("-").map(Number);
        const diff = (fy - yy) * 12 + (fm - mm) + 1;
        return Math.max(1, diff);
      })();
      tx = { ...tx, recorrenteId: recId };
      const cresc = recCresc || 0; // reajuste composto por parcela (decimal)
      // Recorrência "molde" usada por valorRecNoMes pra calcular cada parcela.
      const recMolde = {
        valor: tx.valor,
        valorBase: tx.valor,
        crescimento: cresc,
        inicio: inicioYYMM,
      };

      const txsRec = [];
      for (let i = 0; i < totalMeses; i++) {
        const yyyymm = mesShift(inicioYYMM, i);
        const data = dataNoMes(yyyymm, diaCfg);
        const valorMes = valorRecNoMes(recMolde, yyyymm);
        txsRec.push(
          i === 0
            ? { ...tx, data }
            : {
                id: `${recId}-${yyyymm}`,
                tipo: tx.tipo,
                descricao: tx.descricao,
                categoria: tx.categoria,
                pagamento: tx.pagamento,
                ...(tx.cartaoId && { cartaoId: tx.cartaoId }),
                valor: valorMes,
                data,
                recorrenteId: recId,
              },
        );
      }
      const ultimoMes = txsRec[txsRec.length - 1].data.slice(0, 7);

      cloud.setRecorrentes((atual) => [
        ...atual,
        {
          id: recId,
          tipo: tx.tipo,
          descricao: tx.descricao,
          categoria: tx.categoria,
          pagamento: tx.pagamento,
          ...(tx.cartaoId && { cartaoId: tx.cartaoId }),
          valor: tx.valor,
          dia: diaCfg,
          inicio: inicioYYMM,
          fim: recFim || null,
          ultimoMesGerado: ultimoMes,
          // Reajuste composto (financiamento): base + % por parcela.
          ...(cresc > 0 && {
            crescimento: cresc,
            valorBase: tx.valor,
            mesBase: inicioYYMM,
          }),
        },
      ]);

      cloud.setTxs((atual) => {
        if (inicioYYMM !== mes) setMes(inicioYYMM);
        return [...txsRec, ...atual].sort((a, b) =>
          b.data.localeCompare(a.data),
        );
      });
      if (!editando) setTela("gastos");
      return;
    }

    // Editar uma entrada pode deixar depósitos sem lastro (valor menor que o
    // guardado, ou descrição/data que tira a tx do grupo que bancava eles).
    if (editando) {
      const original = (cloud.txs || []).find((t) => t.id === tx.id);
      if (original?.tipo === "entrada" || tx.tipo === "entrada") {
        const depois = (cloud.txs || [])
          .filter((t) => t.id !== tx.id)
          .concat(expandir(tx));
        sincronizarGuardado(depois, original, tx);
      }
    }

    cloud.setTxs((atual) => {
      if (editando) {
        const original = atual.find((t) => t.id === tx.id);
        const grupoAntigo =
          original && original.parcelas ? original.parcelas.grupoId : null;
        const semGrupo = atual.filter(
          (t) =>
            t.id !== tx.id &&
            (!grupoAntigo || !t.parcelas || t.parcelas.grupoId !== grupoAntigo),
        );
        return [...semGrupo, ...expandir(tx)].sort((a, b) =>
          b.data.localeCompare(a.data),
        );
      }
      const novos = expandir(tx);
      const yyyymm = novos[0].data.slice(0, 7);
      if (yyyymm !== mes) setMes(yyyymm);
      return [...novos, ...atual].sort((a, b) => b.data.localeCompare(a.data));
    });
    if (!editando) setTela("gastos");
  };

  // Edita uma recorrência: atualiza o registro mestre E propaga apenas para as
  // txs do MÊS ATUAL EM DIANTE. Lançamentos de meses passados ficam intactos no
  // histórico (preservam o valor/categoria que estava em vigor na época). Se o
  // dia de vencimento mudar, recalcula a data das txs afetadas mantendo o
  // yyyymm original (com clamping pro último dia do mês).
  const editarRecorrente = (recId, dados) => {
    vibrar(14);
    const yyyymmHoje = mesCorrente();
    const recAntiga = cloud.recorrentes.find((r) => r.id === recId);
    // Financiamento com reajuste: ao mudar o valor, o novo valor passa a ser a
    // base ancorada no mês atual; as parcelas futuras seguem crescendo a partir
    // dela. Sem isso, editar o valor achataria o reajuste.
    const reancorar =
      recAntiga && recAntiga.crescimento && dados.valor !== undefined;
    const dadosFinais = reancorar
      ? { ...dados, valorBase: dados.valor, mesBase: yyyymmHoje }
      : dados;
    const recNova = recAntiga ? { ...recAntiga, ...dadosFinais } : null;
    cloud.setRecorrentes((atual) =>
      atual.map((r) => {
        if (r.id !== recId) return r;
        const nova = { ...r, ...dadosFinais };
        // cartaoId null é "tirar o cartão", não um valor a guardar.
        if (!nova.cartaoId) delete nova.cartaoId;
        return nova;
      }),
    );
    cloud.setTxs((atual) => {
      const novos = atual.map((t) => {
        if (t.recorrenteId !== recId) return t;
        if (t.data.slice(0, 7) < yyyymmHoje) return t; // passado: não mexe
        const nova = { ...t };
        if (dados.descricao !== undefined) nova.descricao = dados.descricao;
        if (dados.categoria !== undefined) nova.categoria = dados.categoria;
        if (dados.pagamento !== undefined) nova.pagamento = dados.pagamento;
        // null limpa o campo: a conta saiu do crédito, ou do cartão.
        if (dados.cartaoId !== undefined) {
          if (dados.cartaoId) nova.cartaoId = dados.cartaoId;
          else delete nova.cartaoId;
        }
        if (dados.valor !== undefined) {
          nova.valor =
            recNova && recNova.crescimento
              ? valorRecNoMes(recNova, t.data.slice(0, 7))
              : dados.valor;
        }
        if (dados.dia !== undefined) {
          nova.data = dataNoMes(t.data.slice(0, 7), dados.dia);
        }
        return nova;
      });
      return novos.sort((a, b) => b.data.localeCompare(a.data));
    });
  };

  // Marca uma tx como paga (some das "Próximas a vencer", continua no histórico).
  const marcarTxPago = (id) => {
    vibrar(14);
    const yyyymmdd = hojeISO();
    cloud.setTxs((atual) =>
      atual.map((t) => (t.id === id ? { ...t, pago: true, pagoEm: yyyymmdd } : t)),
    );
  };

  // Cancela a recorrência: remove apenas as txs futuras (do mês atual em diante).
  // Os lançamentos de meses passados ficam preservados no histórico.
  const cancelarRecorrente = (recId) => {
    const yyyymmHoje = mesCorrente();
    cloud.setRecorrentes((atual) => atual.filter((r) => r.id !== recId));
    cloud.setTxs((atual) =>
      atual.filter((t) => {
        if (t.recorrenteId !== recId) return true;
        return t.data.slice(0, 7) < yyyymmHoje; // mantém passados
      }),
    );
  };

  // Entrada que financiou depósitos em caixinhas: ao excluí-la ou editá-la, o
  // que ela não banca mais volta pra fora da caixinha. Sem isso o depósito fica
  // órfão — continua abatendo o orçamento do mês enquanto a entrada que o
  // compensava sumiu (ou encolheu), e o saldo fecha menor como se aquilo
  // tivesse virado gasto. Ver lib/guardado-entradas.
  const sincronizarGuardado = (txsDepois, txAntes, txDepois) => {
    const { detalhes } = ajustarGuardado(caixinhasAtivas, txsDepois, txAntes, txDepois);
    if (detalhes.length === 0) return;
    if (ehCompartilhado) {
      const { caixinhas: novas } = ajustarGuardado(shared.caixinhas, txsDepois, txAntes, txDepois);
      for (const d of detalhes) {
        const cx = novas.find((c) => c.id === d.id);
        if (cx) shared.salvarCaixinha({ id: cx.id, depositos: cx.depositos });
      }
    } else {
      cloud.setCaixinhas(
        (atual) => ajustarGuardado(atual, txsDepois, txAntes, txDepois).caixinhas,
      );
    }
  };

  const excluirTx = (id) => {
    const alvo = (cloud.txs || []).find((x) => x.id === id);
    if (alvo?.tipo === "entrada") {
      sincronizarGuardado((cloud.txs || []).filter((x) => x.id !== id), alvo, null);
    }
    cloud.setTxs((atual) => {
      const t = atual.find((x) => x.id === id);
      if (t && t.parcelas)
        return atual.filter(
          (x) => !x.parcelas || x.parcelas.grupoId !== t.parcelas.grupoId,
        );
      return atual.filter((x) => x.id !== id);
    });
  };

  // ─── Caixinhas ───
  // Quando há parceria, as caixinhas vivem em partnerships/{pId}.caixinhas e
  // são editadas pelos dois usuários. Caso contrário, ficam no user doc.
  const ehCompartilhado = !!cloud.partnershipId;
  const caixinhasAtivas = ehCompartilhado ? shared.caixinhas : cloud.caixinhas;

  const salvarCaixinha = (dados) => {
    if (ehCompartilhado) {
      shared.salvarCaixinha(dados);
      return;
    }
    cloud.setCaixinhas((atual) => {
      if (dados.id) {
        const { saldoInicial, ...resto } = dados;
        return atual.map((c) => (c.id === dados.id ? { ...c, ...resto } : c));
      }
      const { saldoInicial, ...resto } = dados;
      const hoje = hojeISO();
      // Valor que já existia na caixinha vira um depósito "inicial": soma ao
      // valor atual mas não abate o saldo do mês (guardadoNoMes o ignora).
      const depositos =
        saldoInicial > 0
          ? [{ id: `dp-${Date.now()}`, valor: saldoInicial, data: hoje, tipo: "inicial" }]
          : [];
      const nova = {
        id: `cx-${Date.now()}`,
        criadoEm: hoje,
        depositos,
        ...resto,
      };
      return [nova, ...atual];
    });
  };
  const excluirCaixinha = (id) => {
    if (ehCompartilhado) {
      shared.excluirCaixinha(id);
      return;
    }
    cloud.setCaixinhas((atual) => atual.filter((c) => c.id !== id));
  };
  const depositarCaixinha = (id, deposito) => {
    if (ehCompartilhado) {
      shared.depositarCaixinha(id, deposito);
      return;
    }
    cloud.setCaixinhas((atual) =>
      atual.map((c) =>
        c.id === id
          ? { ...c, depositos: [...(c.depositos || []), deposito] }
          : c,
      ),
    );
  };

  // Resgata um valor da caixinha: registra um "saque" na caixinha (valor
  // negativo, pra `valorAtual` continuar somando tudo) e cria uma entrada
  // do tipo "entrada" no mês atual, devolvendo o dinheiro pro orçamento.
  //
  // `rendimentoAtual` (opcional) é o rendimento projetado na hora do resgate —
  // a tela passa o valor que está exibindo. Gravamos no saque a fatia que saiu
  // junto (`rendimentoRealizado`) pra que o "Já rendeu" da caixinha zere: aquele
  // rendimento virou dinheiro na conta e não está mais rendendo ali.
  const resgatarCaixinha = (id, valor, rendimentoAtual = 0) => {
    const v = Number(valor);
    if (!v || v <= 0) return;
    const lista = caixinhasAtivas || [];
    const cx = lista.find((c) => c.id === id);
    if (!cx) return;
    const yyyymmdd = hojeISO();
    const txId = `tx-${Date.now()}`;
    const realizado = rendimentoRealizadoAoResgatar(cx, v, rendimentoAtual);
    const saque = {
      id: `dp-${Date.now()}`,
      valor: -v,
      data: yyyymmdd,
      tipo: "saque",
      txEntradaId: txId,
      ...(realizado > 0 && { rendimentoRealizado: realizado }),
    };

    if (ehCompartilhado) {
      shared.depositarCaixinha(id, saque);
    } else {
      cloud.setCaixinhas((atual) =>
        atual.map((c) =>
          c.id === id
            ? { ...c, depositos: [...(c.depositos || []), saque] }
            : c,
        ),
      );
    }

    vibrar(14);
    cloud.setTxs((atual) => {
      const yyyymm = yyyymmdd.slice(0, 7);
      if (yyyymm !== mes) setMes(yyyymm);
      return [
        {
          id: txId,
          tipo: "entrada",
          descricao: `Resgate: ${cx.nome}`,
          categoria: "outros",
          pagamento: "Pix",
          valor: v,
          data: yyyymmdd,
          caixinhaId: id,
        },
        ...atual,
      ].sort((a, b) => b.data.localeCompare(a.data));
    });
  };

  // ─── Cartões de crédito ───
  // Cartões são pessoais: ficam no user doc mesmo havendo parceria (diferente
  // das caixinhas). Ninguém reescreve lançamento do parceiro.
  //
  // A criação do PRIMEIRO cartão adota tudo que já foi lançado no crédito — a
  // regra combinada, ver o cabeçalho de lib/cartoes.js. O React agrupa os três
  // patches num render só, então cartões + txs + recorrentes saem numa escrita
  // única (ver o efeito de persistência em lib/storage.js).
  const salvarCartao = (dados) => {
    vibrar(14);
    if (dados.id) {
      cloud.setCartoes((atual) =>
        atual.map((c) => (c.id === dados.id ? { ...c, ...dados } : c)),
      );
      return;
    }
    const ehPrimeiro = (cloud.cartoes || []).length === 0;
    const cartao = novoCartao(dados);
    cloud.setCartoes((atual) => [...atual, cartao]);
    if (!ehPrimeiro) return;

    const txsNovas = aplicarPrimeiroCartaoEmTxs(cloud.txs, cartao.id);
    if (txsNovas) cloud.setTxs(txsNovas);
    const recNovas = aplicarPrimeiroCartaoEmRecorrentes(cloud.recorrentes, cartao.id);
    if (recNovas) cloud.setRecorrentes(recNovas);
  };

  // `destinoId` é o cartão pra onde vão os lançamentos do que está sendo
  // apagado; null solta pra "sem cartão", que devolve a tx ao estado genérico
  // de antes dos cartões. Quem pergunta é a tela (ModalApagarCartao).
  const excluirCartao = (id, destinoId = null) => {
    vibrar(14);
    cloud.setCartoes((atual) => atual.filter((c) => c.id !== id));
    // Só reescreve as listas que realmente têm lançamento nesse cartão — apagar
    // um cartão vazio não deve custar uma regravação de todo o histórico.
    const { txs: nTxs, recorrentes: nRec } = contarNoCartao(cloud.txs, cloud.recorrentes, id);
    if (nTxs > 0) {
      cloud.setTxs((atual) => moverLancamentos(atual, ehGastoNoCartao, id, destinoId));
    }
    if (nRec > 0) {
      cloud.setRecorrentes((atual) =>
        moverLancamentos(atual, ehRecorrenteNoCartao, id, destinoId),
      );
    }
  };

  // Desfazer parceria — quem clica leva as caixinhas (combinado na Etapa 1).
  const desfazerParceria = async () => {
    if (!cloud.partnershipId) return;
    await desfazerParceriaFn({
      uid,
      meuNome: cloud.preferences?.nome || usuario?.displayName || "",
      partnershipId: cloud.partnershipId,
      meuEmail: cloud.email,
    });
  };

  // Dispensar uma notificação de parceria já vista.
  const dispensarNotifParceria = (id) => {
    cloud.setNotificacoesParceria((atual) =>
      (atual || []).filter((n) => n.id !== id),
    );
  };

  // Estados de carga e gateamento — o splash e o palpite de sessão estão
  // explicados lá em cima, no `precisaSplash`.
  const telaDeLogin = (
    <I18nProvider lang={idioma}>
      <LoginScreen />
    </I18nProvider>
  );
  if (mostrarSplash) return <SplashLogo />;
  // Sem splash, `undefined` só chega aqui quando não havia palpite de sessão —
  // e aí a aposta é a mesma do `null`: a tela de login. Um usuário verificado
  // também só passa daqui com `cloud.ready`, senão o splash teria segurado.
  if (!usuario) return telaDeLogin;
  if (!usuario.emailVerified)
    return (
      <I18nProvider lang={idioma}>
        <VerifyEmailScreen email={usuario.email} onAtualizar={forcarRender} />
      </I18nProvider>
    );

  if (onboarding)
    return (
      <I18nProvider lang={idioma}>
        <React.Suspense fallback={<LoaderTela />}>
          <Onboarding onFim={finalizarOnboarding} />
        </React.Suspense>
      </I18nProvider>
    );

  const ctx = {
    txs: cloud.txs,
    mes,
    setMes,
    todosMeses,
    mesAnterior,
    irPara,
    voltar,
    salvarTx,
    excluirTx,
    orcamentos: cloud.orcamentos,
    setOrcamentos: cloud.setOrcamentos,
    caixinhas: caixinhasAtivas,
    caixinhasCompartilhadas: ehCompartilhado,
    salvarCaixinha,
    excluirCaixinha,
    depositarCaixinha,
    resgatarCaixinha,
    recorrentes: cloud.recorrentes,
    cancelarRecorrente,
    editarRecorrente,
    cartoes: cloud.cartoes || [],
    salvarCartao,
    excluirCartao,
    marcarTxPago,
    categoriasCustom: cloud.categoriasCustom,
    adicionarCategoria,
    excluirCategoria,
    preferences: cloud.preferences,
    setPreferences: cloud.setPreferences,
    pronto: cloud.ready,
    // ─── Conta compartilhada ───
    email: cloud.email,
    partnerUid: cloud.partnerUid,
    partnerNome: cloud.partnerNome || partner.nome || '',
    partnerEmail: partner.email,
    partnerFotoUrl: partner.fotoUrl,
    partnershipId: cloud.partnershipId,
    partnerTxs,
    partnerOrcamentos: partner.orcamentos,
    partnerOrcamentoMensal: partner.orcamentoMensal,
    partnerRecorrentes: partner.recorrentes,
    partnerReady: partner.ready,
    convitesRecebidos,
    convitesEnviados,
    desfazerParceria,
    notificacoesParceria: cloud.notificacoesParceria || [],
    dispensarNotifParceria,
    usuario,
    sair: sairFirebase,
    ehDesktop,
    leve,
    fechar: () => setAddModal(null),
    setOnboarding: (v) => {
      if (!v) localStorage.setItem(ONBOARDING_KEY, "1");
      setOnboarding(v);
    },
  };

  // Sem conexão o app é somente leitura: a trava de verdade está no patchKey do
  // storage, que não deixa o state local divergir do servidor. Aqui só
  // interceptamos as ações do usuário pra que a recusa apareça como um aviso e
  // não como um botão que não faz nada.
  //
  // Quem avisa é a BarraOffline, que já está na tela: em vez de abrir um modal,
  // a tentativa só incrementa o contador e a faixa do topo se abre explicando.
  // Note o estaOffline() e não o `offline` do hook — o que decide é a conexão no
  // instante do clique, não a do último render.
  for (const acao of ACOES_QUE_ESCREVEM) {
    const original = ctx[acao];
    if (typeof original !== "function") continue;
    ctx[acao] = (...args) => {
      if (estaOffline()) return setTentativaOffline((n) => n + 1);
      return original(...args);
    };
  }

  // As 4 abas principais são montadas pelo AreaDeTelas, que as mantém vivas.
  // Aqui ficam só as telas secundárias.
  let conteudo;
  if (tela === "categoria")
    conteudo = <CategoriaScreen ctx={ctx} params={params} />;
  else if (tela === "orcamentos") conteudo = <OrcamentosScreen ctx={ctx} />;
  else if (tela === "historico") conteudo = <HistoricoScreen ctx={ctx} />;
  else if (tela === "caixinhas") conteudo = <CaixinhasScreen ctx={ctx} />;
  else if (tela === "caixinha") conteudo = <CaixinhaScreen ctx={ctx} params={params} />;
  else if (tela === "recorrentes") conteudo = <RecorrentesScreen ctx={ctx} />;
  else if (tela === "cartoes") conteudo = <CartoesScreen ctx={ctx} />;
  else if (tela === "notificacoes") conteudo = <NotificacoesScreen ctx={ctx} />;

  // No desktop, um detalhe com dono ganha a lista ao lado em vez de escondê-la.
  // As duas telas vêm do mesmo chunk lazy, então o par não custa rede extra.
  const mestre = ehDesktop ? MESTRE_DE[tela] : null;
  if (mestre) {
    conteudo = (
      <div className="mestre-detalhe">
        <mestre.Tela ctx={ctx} params={params} />
        {conteudo}
      </div>
    );
  }

  if (ehDesktop) {
    return (
      <I18nProvider lang={idioma}>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "var(--bg)",
          color: "var(--ink)",
        }}
      >
        <Sidebar
          // Com a lista ao lado, quem está aberto é o dono do detalhe: a
          // sidebar deve marcar "Caixinhas", não perder o destaque.
          tela={mestre?.id || tela}
          irPara={irPara}
          abrirAdd={() => { vibrar(); setAddModal({}); }}
          usuario={usuario}
          fotoPerfil={cloud.preferences.fotoUrl}
        />
        <main
          className="desktop-shell"
          role="main"
          style={{ flex: 1, minWidth: 0, overflowY: "auto", height: "100vh" }}
        >
          <EspacoBarraOffline offline={offline} />
          <div
            style={{
              maxWidth: LARGURA_DESKTOP[tela] || LARGURA_DESKTOP_PADRAO,
              margin: "0 auto",
              padding: "0 24px",
              minHeight: "100vh",
            }}
          >
            <AreaDeTelas
              tela={tela}
              params={params}
              ctx={ctx}
              secundaria={conteudo}
              chaveTransicao={mestre ? tela : undefined}
            />
          </div>
        </main>
        {addModal && (
          <React.Suspense fallback={null}>
            <AddExpenseModal ctx={ctx} params={addModal} />
          </React.Suspense>
        )}
        <BarraOffline offline={offline} tentativa={tentativaOffline} />
      </div>
      </I18nProvider>
    );
  }

  return (
    <I18nProvider lang={idioma}>
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--ink)",
      }}
    >
      <EspacoBarraOffline offline={offline} />
      <main
        role="main"
        // Sem a tab bar embaixo (tela secundária), o espaço reservado pra ela no
        // fim das telas vira um vão vazio — a classe encolhe o --pad-bottom.
        className={ABAS.includes(tela) ? undefined : "sem-tab-bar"}
        style={{
          maxWidth: 480,
          margin: "0 auto",
          minHeight: "100vh",
        }}
      >
        <AreaDeTelas
          tela={tela}
          params={params}
          ctx={ctx}
          secundaria={conteudo}
        />
      </main>
      <TabBar tela={tela} irPara={irPara} abrirAdd={() => { vibrar(); setAddModal({}); }} />
      {addModal && (
        <React.Suspense fallback={null}>
          <AddExpenseModal ctx={ctx} params={addModal} />
        </React.Suspense>
      )}
      {install.mostrar && !addModal && (
        <InstallPromptModal
          temAtalho={install.temAtalho}
          plataformaIOS={install.plataformaIOS}
          onInstalar={install.instalar}
          onDispensar={install.dispensar}
        />
      )}
      <BarraOffline offline={offline} tentativa={tentativaOffline} />
    </div>
    </I18nProvider>
  );
}
