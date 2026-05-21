// app.jsx — Componente raiz: gateamento (PIN/auth), estado central, navegação.

import React from "react";
import {
  CATEGORIAS,
  ORDEM_CATS,
  PALETAS,
  chaveMes,
  listarMeses,
  aplicarCategoriasCustom,
  novaCategoriaCustom,
  valorRecNoMes,
} from "./data.js";
import { Icon } from "./ui/icons.jsx";
import { escutarAuth, sair as sairFirebase } from "./lib/firebase.js";
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
import { vibrar } from "./lib/haptics.js";
import { useInstallPrompt, InstallPromptModal } from "./ui/install-prompt.jsx";
import { LoaderTela } from "./ui/loader.jsx";
import { calcOrcBaseAtual, mesCorrente } from "./lib/orcamento.js";

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
const NotificacoesScreen= lazyNamed(() => import("./screens/notificacoes.jsx"), "NotificacoesScreen");
const AddExpenseModal   = lazyNamed(() => import("./modals/add-expense.jsx"), "AddExpenseModal");

const ONBOARDING_KEY = "finca.onboarded";

function TabBar({ tela, irPara, abrirAdd }) {
  const itens = [
    { id: "inicio", icon: "home", label: "Início" },
    { id: "gastos", icon: "list", label: "Transações" },
    { id: "add", icon: "plus", label: "", destaque: true },
    { id: "analise", icon: "chart", label: "Análise" },
    { id: "perfil", icon: "user", label: "Perfil" },
  ];
  return (
    <div
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
        className="glass-surface"
        style={{
          maxWidth: 480,
          margin: "0 auto",
          borderRadius: 26,
          boxShadow:
            "0 10px 30px rgba(20,16,24,0.12), inset 0 1px 0 rgba(255,255,255,0.25)",
          padding: "8px 6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pointerEvents: "auto",
        }}
      >
        {itens.map((it) => {
          const ativo = tela === it.id;
          if (it.destaque) {
            return (
              <button
                key={it.id}
                onClick={abrirAdd}
                aria-label="Nova transação"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  border: "none",
                  background:
                    "linear-gradient(135deg, var(--primary), var(--primary-2))",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "0 6px 16px color-mix(in oklab, var(--primary) 35%, transparent)",
                  transform: "translateY(-8px)",
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
                if (it.id !== tela) vibrar();
                irPara(it.id);
              }}
              aria-label={it.label}
              aria-current={ativo ? "page" : undefined}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                padding: "8px 4px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Icon
                name={it.icon}
                size={22}
                color={ativo ? "var(--primary)" : "var(--muted)"}
                strokeWidth={ativo ? 2.4 : 2}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: ativo ? "var(--primary)" : "var(--muted)",
                  letterSpacing: "-0.01em",
                }}
              >
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
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
  { id: "recorrentes", icon: "history", label: "Recorrentes" },
  { id: "historico", icon: "calendar", label: "Histórico" },
  { id: "perfil", icon: "user", label: "Perfil" },
];

function Sidebar({ tela, irPara, abrirAdd, usuario, fotoPerfil }) {
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
            "linear-gradient(135deg, var(--primary), var(--primary-2))",
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
        Nova Transação
      </button>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_DESKTOP.map((it) => {
          const ativo = tela === it.id;
          return (
            <button
              key={it.id}
              onClick={() => {
                if (it.id !== tela) vibrar();
                irPara(it.id);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: ativo
                  ? "color-mix(in oklab, var(--primary) 12%, transparent)"
                  : "transparent",
                color: ativo ? "var(--primary)" : "var(--ink)",
                fontSize: 14,
                fontWeight: ativo ? 800 : 600,
                fontFamily: "inherit",
                textAlign: "left",
              }}
            >
              <Icon
                name={it.icon}
                size={20}
                color={ativo ? "var(--primary)" : "var(--muted)"}
                strokeWidth={ativo ? 2.4 : 2}
              />
              {it.label}
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

function useEhDesktop() {
  const consulta = "(min-width: 900px)";
  const [ehDesktop, setEhDesktop] = React.useState(
    () => typeof window !== "undefined" && window.matchMedia(consulta).matches,
  );
  React.useEffect(() => {
    const mq = window.matchMedia(consulta);
    const handler = (e) => setEhDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return ehDesktop;
}

function sistemaPrefereDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function aplicarTema(paleta, modo) {
  const root = document.documentElement;
  const pal = PALETAS.find((p) => p.primary === paleta) || PALETAS[0];
  const ehEscuro =
    modo === "escuro" || (modo === "sistema" && sistemaPrefereDark());
  // Paletas podem ter variantes dark (ex: "Preto" usa grafite claro pra
  // continuar visível contra o --bg escuro). Se não houver, usa a clara.
  const primary = ehEscuro && pal.primaryDark ? pal.primaryDark : pal.primary;
  const primary2 =
    ehEscuro && pal.primary2Dark ? pal.primary2Dark : pal.primary2;
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--primary-2", primary2);
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
  React.useEffect(() => escutarAuth(setUsuario), []);

  // Só conecta ao Firestore quando o usuário existe E confirmou o e-mail
  // (não criamos os dados de quem ainda não verificou a conta).
  const verificado = !!usuario?.emailVerified;
  const uid = verificado ? usuario.uid : null;
  const cloud = useCloudState(uid);

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

  // Tema reativo às preferências. Quando modo === 'sistema', também escuta
  // mudanças do prefers-color-scheme do SO pra trocar light/dark on the fly.
  React.useEffect(() => {
    aplicarTema(cloud.preferences.paleta, cloud.preferences.modo);
    if (cloud.preferences.modo !== "sistema") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () =>
      aplicarTema(cloud.preferences.paleta, cloud.preferences.modo);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [cloud.preferences.paleta, cloud.preferences.modo]);

  // Gerador de recorrentes: roda 1× quando o storage está pronto.
  // Para cada recorrência, gera as txs dos meses pulados entre ultimoMesGerado e hoje.
  const geradorRodou = React.useRef(false);
  React.useEffect(() => {
    if (!cloud.ready || geradorRodou.current) return;
    geradorRodou.current = true;
    const recs = cloud.recorrentes;
    if (!recs || recs.length === 0) return;

    const hoje = new Date();
    const yyyymmHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
    const novosTxs = [];
    let mutou = false;

    const recsAtualizadas = recs.map((r) => {
      if (!r.ultimoMesGerado || r.ultimoMesGerado >= yyyymmHoje) return r;
      // Se a recorrência tem fim definido e já passamos dele, não gera mais.
      if (r.fim && r.ultimoMesGerado >= r.fim) return r;
      let cur = r.ultimoMesGerado;
      const limite = r.fim && r.fim < yyyymmHoje ? r.fim : yyyymmHoje;
      while (cur < limite) {
        const [y, m] = cur.split("-").map(Number);
        const proxData = new Date(y, m, 1); // primeiro dia do mês seguinte (m é 1-indexed, JS aceita)
        const ny = proxData.getFullYear();
        const nm0 = proxData.getMonth(); // 0-indexed
        const yyyymm = `${ny}-${String(nm0 + 1).padStart(2, "0")}`;
        const ultDia = new Date(ny, nm0 + 1, 0).getDate();
        const dia = Math.min(r.dia, ultDia);
        const data = `${yyyymm}-${String(dia).padStart(2, "0")}`;
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
  const install = useInstallPrompt();

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
  const [ocultar, setOcultar] = React.useState(false);
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

  // ─── Snapshot do orçamento por mês ───
  // Pra que o "Sobrou" / "Restante" de meses passados não mude quando o
  // usuário altera o orçamento no futuro, guardamos o orçamento base de
  // cada mês passado em preferences.orcBaseAt. Aqui fazemos o backfill:
  // a cada abertura do app, qualquer mês passado com txs que ainda não
  // tem snapshot recebe o valor do orçamento atual (best-effort — é o
  // melhor que dá pra fazer pra meses antigos sem histórico de orçamento).
  React.useEffect(() => {
    if (!cloud.ready) return;
    if (!cloud.preferences) return;
    if (!todosMeses?.length) return;
    const orcAtual = calcOrcBaseAtual(cloud.preferences);
    if (orcAtual <= 0) return; // sem orçamento ainda — tenta de novo quando definir
    const mesAtual = mesCorrente();
    const snaps = cloud.preferences.orcBaseAt || {};
    const faltam = todosMeses.filter((m) => m < mesAtual && !(m in snaps));
    if (faltam.length === 0) return;
    const novosSnaps = { ...snaps };
    for (const m of faltam) novosSnaps[m] = orcAtual;
    cloud.setPreferences({ orcBaseAt: novosSnaps });
  }, [cloud.ready, cloud.preferences, cloud.orcamentos, todosMeses]);

  const TABS = ["inicio", "gastos", "analise", "perfil"];
  const irPara = (t, p = {}) => {
    vibrar();
    if (TABS.includes(t)) {
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
        const yyyymmdd = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
        out.push({
          id: `${grupoId}-${i + 1}`,
          descricao: base.descricao,
          categoria: base.categoria,
          pagamento: base.pagamento,
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
        const d = new Date(yy, mm - 1 + i, 1);
        const ny = d.getFullYear();
        const nm0 = d.getMonth();
        const yyyymm = `${ny}-${String(nm0 + 1).padStart(2, "0")}`;
        const ultDia = new Date(ny, nm0 + 1, 0).getDate();
        const diaReal = Math.min(diaCfg, ultDia);
        const data = `${yyyymm}-${String(diaReal).padStart(2, "0")}`;
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
    const hoje = new Date();
    const yyyymmHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
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
      atual.map((r) => (r.id === recId ? { ...r, ...dadosFinais } : r)),
    );
    cloud.setTxs((atual) => {
      const novos = atual.map((t) => {
        if (t.recorrenteId !== recId) return t;
        if (t.data.slice(0, 7) < yyyymmHoje) return t; // passado: não mexe
        const nova = { ...t };
        if (dados.descricao !== undefined) nova.descricao = dados.descricao;
        if (dados.categoria !== undefined) nova.categoria = dados.categoria;
        if (dados.pagamento !== undefined) nova.pagamento = dados.pagamento;
        if (dados.valor !== undefined) {
          nova.valor =
            recNova && recNova.crescimento
              ? valorRecNoMes(recNova, t.data.slice(0, 7))
              : dados.valor;
        }
        if (dados.dia !== undefined) {
          const [y, m] = t.data.split("-").map(Number);
          const ultDia = new Date(y, m, 0).getDate();
          const diaReal = Math.min(dados.dia, ultDia);
          nova.data = `${t.data.slice(0, 7)}-${String(diaReal).padStart(2, "0")}`;
        }
        return nova;
      });
      return novos.sort((a, b) => b.data.localeCompare(a.data));
    });
  };

  // Marca uma tx como paga (some das "Próximas a vencer", continua no histórico).
  const marcarTxPago = (id) => {
    vibrar(14);
    const hoje = new Date();
    const yyyymmdd = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
    cloud.setTxs((atual) =>
      atual.map((t) => (t.id === id ? { ...t, pago: true, pagoEm: yyyymmdd } : t)),
    );
  };

  // Cancela a recorrência: remove apenas as txs futuras (do mês atual em diante).
  // Os lançamentos de meses passados ficam preservados no histórico.
  const cancelarRecorrente = (recId) => {
    const hoje = new Date();
    const yyyymmHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
    cloud.setRecorrentes((atual) => atual.filter((r) => r.id !== recId));
    cloud.setTxs((atual) =>
      atual.filter((t) => {
        if (t.recorrenteId !== recId) return true;
        return t.data.slice(0, 7) < yyyymmHoje; // mantém passados
      }),
    );
  };

  const excluirTx = (id) => {
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
        return atual.map((c) => (c.id === dados.id ? { ...c, ...dados } : c));
      }
      const nova = {
        id: `cx-${Date.now()}`,
        criadoEm: new Date().toISOString().slice(0, 10),
        depositos: [],
        ...dados,
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
  const resgatarCaixinha = (id, valor) => {
    const v = Number(valor);
    if (!v || v <= 0) return;
    const lista = caixinhasAtivas || [];
    const cx = lista.find((c) => c.id === id);
    if (!cx) return;
    const hoje = new Date();
    const yyyymmdd = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
    const txId = `tx-${Date.now()}`;
    const saque = {
      id: `dp-${Date.now()}`,
      valor: -v,
      data: yyyymmdd,
      tipo: "saque",
      txEntradaId: txId,
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

  // Estados de carga e gateamento
  if (usuario === undefined) return <Splash />; // ainda decidindo se há sessão
  if (usuario === null) return <LoginScreen />; // deslogado
  if (!usuario.emailVerified)
    return (
      <VerifyEmailScreen email={usuario.email} onAtualizar={forcarRender} />
    );
  if (!cloud.ready) return <Splash />; // logado e verificado, carregando dados

  if (onboarding)
    return (
      <React.Suspense fallback={<Splash />}>
        <Onboarding onFim={finalizarOnboarding} />
      </React.Suspense>
    );

  const ctx = {
    txs: cloud.txs,
    mes,
    setMes,
    todosMeses,
    mesAnterior,
    ocultar,
    setOcultar,
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
    marcarTxPago,
    categoriasCustom: cloud.categoriasCustom,
    adicionarCategoria,
    excluirCategoria,
    preferences: cloud.preferences,
    setPreferences: cloud.setPreferences,
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
    fechar: () => setAddModal(null),
    setOnboarding: (v) => {
      if (!v) localStorage.setItem(ONBOARDING_KEY, "1");
      setOnboarding(v);
    },
  };

  let conteudo;
  if (tela === "inicio") conteudo = <DashboardScreen ctx={ctx} />;
  else if (tela === "gastos") conteudo = <GastosScreen ctx={ctx} />;
  else if (tela === "analise") conteudo = <AnaliseScreen ctx={ctx} />;
  else if (tela === "perfil") conteudo = <PerfilScreen ctx={ctx} />;
  else if (tela === "categoria")
    conteudo = <CategoriaScreen ctx={ctx} params={params} />;
  else if (tela === "orcamentos") conteudo = <OrcamentosScreen ctx={ctx} />;
  else if (tela === "historico") conteudo = <HistoricoScreen ctx={ctx} />;
  else if (tela === "caixinhas") conteudo = <CaixinhasScreen ctx={ctx} />;
  else if (tela === "caixinha")
    conteudo = <CaixinhaScreen ctx={ctx} params={params} />;
  else if (tela === "recorrentes") conteudo = <RecorrentesScreen ctx={ctx} />;
  else if (tela === "notificacoes") conteudo = <NotificacoesScreen ctx={ctx} />;

  if (ehDesktop) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "var(--bg)",
          color: "var(--ink)",
        }}
      >
        <Sidebar
          tela={tela}
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
          <div
            style={{
              maxWidth: tela === "inicio" || tela === "analise" ? 1080 : 640,
              margin: "0 auto",
              padding: "0 24px",
              minHeight: "100vh",
            }}
          >
            <div
              key={tela + JSON.stringify(params || {})}
              className="page-transition"
            >
              <React.Suspense fallback={<Splash />}>{conteudo}</React.Suspense>
            </div>
          </div>
        </main>
        {addModal && (
          <React.Suspense fallback={null}>
            <AddExpenseModal ctx={ctx} params={addModal} />
          </React.Suspense>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--ink)",
      }}
    >
      <main
        role="main"
        style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh" }}
      >
        <div
          key={tela + JSON.stringify(params || {})}
          className="page-transition"
        >
          <React.Suspense fallback={<Splash />}>{conteudo}</React.Suspense>
        </div>
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
    </div>
  );
}

// Splash agora é um alias do LoaderTela oficial — mantido pelos calls existentes.
function Splash() {
  return <LoaderTela />;
}
