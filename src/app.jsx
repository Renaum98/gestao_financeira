// app.jsx — Componente raiz: gateamento (PIN/auth), estado central, navegação.

import React from 'react';
import { PALETAS, chaveMes, listarMeses } from './data.js';
import { Icon } from './ui/icons.jsx';
import { escutarAuth, processarRedirect, sair as sairFirebase } from './lib/firebase.js';
import { useCloudState } from './lib/storage.js';

import { LoginScreen } from './screens/login.jsx';
import { Onboarding } from './screens/onboarding.jsx';
import { DashboardScreen } from './screens/dashboard.jsx';
import { GastosScreen } from './screens/gastos.jsx';
import { AnaliseScreen } from './screens/analise.jsx';
import { CategoriaScreen } from './screens/categoria.jsx';
import { OrcamentosScreen } from './screens/orcamentos.jsx';
import { HistoricoScreen } from './screens/historico.jsx';
import { PerfilScreen } from './screens/perfil.jsx';
import { CaixinhasScreen, CaixinhaScreen } from './screens/caixinhas.jsx';
import { RecorrentesScreen } from './screens/recorrentes.jsx';
import { AddExpenseModal } from './modals/add-expense.jsx';

const ONBOARDING_KEY = 'finca.onboarded';

function TabBar({ tela, irPara, abrirAdd }) {
  const itens = [
    { id: 'inicio', icon: 'home', label: 'Início' },
    { id: 'gastos', icon: 'list', label: 'Gastos' },
    { id: 'add',    icon: 'plus', label: '', destaque: true },
    { id: 'analise',icon: 'chart',label: 'Análise' },
    { id: 'perfil', icon: 'user', label: 'Perfil' },
  ];
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
      padding: `8px 14px max(28px, env(safe-area-inset-bottom))`,
      background: 'linear-gradient(180deg, rgba(251,247,242,0) 0%, var(--bg) 50%)',
      pointerEvents: 'none',
    }}>
      <div style={{
        maxWidth: 480, margin: '0 auto',
        background: 'var(--card)', borderRadius: 26,
        boxShadow: '0 8px 24px rgba(20,16,24,0.10), 0 1px 0 rgba(0,0,0,0.02)',
        padding: '8px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pointerEvents: 'auto',
      }}>
        {itens.map(it => {
          const ativo = tela === it.id;
          if (it.destaque) {
            return (
              <button key={it.id} onClick={abrirAdd} style={{
                width: 52, height: 52, borderRadius: 26, border: 'none',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
                color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 16px rgba(110,79,246,0.35)',
                transform: 'translateY(-8px)',
              }}>
                <Icon name="plus" size={26} color="#fff" strokeWidth={2.6} />
              </button>
            );
          }
          return (
            <button key={it.id} onClick={() => irPara(it.id)} style={{
              flex: 1, background: 'transparent', border: 'none',
              padding: '8px 4px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              <Icon name={it.icon} size={22} color={ativo ? 'var(--primary)' : 'var(--muted)'} strokeWidth={ativo ? 2.4 : 2} />
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: ativo ? 'var(--primary)' : 'var(--muted)',
                letterSpacing: '-0.01em',
              }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sidebar (layout desktop) ───
const NAV_DESKTOP = [
  { id: 'inicio',      icon: 'home',     label: 'Início' },
  { id: 'gastos',      icon: 'list',     label: 'Gastos' },
  { id: 'analise',     icon: 'chart',    label: 'Análise' },
  { id: 'orcamentos',  icon: 'target',   label: 'Orçamentos' },
  { id: 'caixinhas',   icon: 'piggy',    label: 'Caixinhas' },
  { id: 'recorrentes', icon: 'history',  label: 'Recorrentes' },
  { id: 'historico',   icon: 'calendar', label: 'Histórico' },
  { id: 'perfil',      icon: 'user',     label: 'Perfil' },
];

function Sidebar({ tela, irPara, abrirAdd, usuario }) {
  return (
    <aside style={{
      width: 248, flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
      borderRight: '1px solid var(--linha)', background: 'var(--card)',
      display: 'flex', flexDirection: 'column', padding: '20px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 10px 20px' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 11,
          background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
        }} />
        <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Finça</span>
      </div>

      <button onClick={abrirAdd} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        margin: '0 6px 14px', padding: '11px 12px', borderRadius: 14, border: 'none',
        background: 'linear-gradient(135deg, var(--primary), var(--primary-2))', color: '#fff',
        fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
        boxShadow: '0 6px 16px rgba(110,79,246,0.30)',
      }}>
        <Icon name="plus" size={18} color="#fff" strokeWidth={2.6} />
        Novo gasto
      </button>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_DESKTOP.map(it => {
          const ativo = tela === it.id;
          return (
            <button key={it.id} onClick={() => irPara(it.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: ativo ? 'color-mix(in oklab, var(--primary) 12%, transparent)' : 'transparent',
              color: ativo ? 'var(--primary)' : 'var(--ink)',
              fontSize: 14, fontWeight: ativo ? 800 : 600, fontFamily: 'inherit',
              textAlign: 'left',
            }}>
              <Icon name={it.icon} size={20} color={ativo ? 'var(--primary)' : 'var(--muted)'} strokeWidth={ativo ? 2.4 : 2} />
              {it.label}
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {usuario && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', borderRadius: 12, background: 'var(--surface-sunken)' }}>
          {usuario.photoURL
            ? <img src={usuario.photoURL} alt="" style={{ width: 30, height: 30, borderRadius: 15 }} />
            : <div style={{ width: 30, height: 30, borderRadius: 15, background: 'var(--primary)' }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {usuario.displayName || usuario.email}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function useEhDesktop() {
  const consulta = '(min-width: 900px)';
  const [ehDesktop, setEhDesktop] = React.useState(() =>
    typeof window !== 'undefined' && window.matchMedia(consulta).matches);
  React.useEffect(() => {
    const mq = window.matchMedia(consulta);
    const handler = (e) => setEhDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return ehDesktop;
}

function aplicarTema(paleta, modo) {
  const root = document.documentElement;
  const pal = PALETAS.find(p => p.primary === paleta) || PALETAS[0];
  root.style.setProperty('--primary', pal.primary);
  root.style.setProperty('--primary-2', pal.primary2);
  if (modo === 'escuro') {
    // Paleta dark calibrada para contraste WCAG AA:
    // - bg → card → card-2 formam uma escada clara de elevação
    // - ink quase branco; muted bem mais claro que antes (era 9B919A, contraste insuficiente)
    root.style.setProperty('--bg', '#13101A');
    root.style.setProperty('--card', '#1F1B26');
    root.style.setProperty('--card-2', '#2B2533');
    root.style.setProperty('--surface-sunken', '#0D0B12');
    root.style.setProperty('--ink', '#F4F0F2');
    root.style.setProperty('--muted', '#B8AEB6');
    root.style.setProperty('--linha', 'rgba(255,255,255,0.08)');
    root.style.setProperty('color-scheme', 'dark');
  } else {
    root.style.setProperty('--bg', '#FBF7F2');
    root.style.setProperty('--card', '#FFFFFF');
    root.style.setProperty('--card-2', '#FFFFFF');
    root.style.setProperty('--surface-sunken', '#F3EEE8');
    root.style.setProperty('--ink', '#1A1416');
    root.style.setProperty('--muted', '#8A7F84');
    root.style.setProperty('--linha', 'rgba(20,16,24,0.06)');
    root.style.setProperty('color-scheme', 'light');
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', pal.primary);
}

export function App() {
  // Auth: undefined = carregando, null = deslogado, objeto = usuário Google
  const [usuario, setUsuario] = React.useState(undefined);
  React.useEffect(() => {
    processarRedirect(); // resolve qualquer signInWithRedirect pendente
    return escutarAuth(setUsuario);
  }, []);
  const uid = usuario?.uid;

  // Storage Firestore (só conecta quando há uid)
  const cloud = useCloudState(uid);

  // Tema reativo às preferências
  React.useEffect(() => {
    aplicarTema(cloud.preferences.paleta, cloud.preferences.modo);
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
    const yyyymmHoje = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}`;
    const novosTxs = [];
    let mutou = false;

    const recsAtualizadas = recs.map(r => {
      if (!r.ultimoMesGerado || r.ultimoMesGerado >= yyyymmHoje) return r;
      let cur = r.ultimoMesGerado;
      while (cur < yyyymmHoje) {
        const [y, m] = cur.split('-').map(Number);
        const proxData = new Date(y, m, 1); // primeiro dia do mês seguinte (m é 1-indexed, JS aceita)
        const ny = proxData.getFullYear();
        const nm0 = proxData.getMonth(); // 0-indexed
        const yyyymm = `${ny}-${String(nm0+1).padStart(2,'0')}`;
        const ultDia = new Date(ny, nm0 + 1, 0).getDate();
        const dia = Math.min(r.dia, ultDia);
        const data = `${yyyymm}-${String(dia).padStart(2,'0')}`;
        novosTxs.push({
          id: `${r.id}-${yyyymm}`,
          descricao: r.descricao,
          categoria: r.categoria,
          pagamento: r.pagamento,
          valor: r.valor,
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
        const existentes = new Set(atual.map(t => t.id));
        const aAdicionar = novosTxs.filter(t => !existentes.has(t.id));
        if (aAdicionar.length === 0) return atual;
        return [...aAdicionar, ...atual].sort((a, b) => b.data.localeCompare(a.data));
      });
      cloud.setRecorrentes(recsAtualizadas);
    }
  }, [cloud.ready]);

  const ehDesktop = useEhDesktop();

  // Navegação local
  const [mes, setMes] = React.useState(chaveMes(new Date()));
  const [tela, setTela] = React.useState('inicio');
  const [params, setParams] = React.useState({});
  const [stack, setStack] = React.useState([]);
  const [ocultar, setOcultar] = React.useState(false);
  const [addModal, setAddModal] = React.useState(null);
  const [onboarding, setOnboarding] = React.useState(() => !localStorage.getItem(ONBOARDING_KEY));

  const finalizarOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setOnboarding(false);
  };

  const todosMeses = React.useMemo(() => listarMeses(cloud.txs), [cloud.txs]);
  const mesAnterior = React.useMemo(() => {
    const i = todosMeses.indexOf(mes);
    return i >= 0 && i < todosMeses.length - 1 ? todosMeses[i + 1] : null;
  }, [todosMeses, mes]);

  const TABS = ['inicio', 'gastos', 'analise', 'perfil'];
  const irPara = (t, p = {}) => {
    if (TABS.includes(t)) { setStack([]); setTela(t); setParams({}); }
    else if (t === 'add') { setAddModal(p); }
    else { setStack([...stack, { tela, params }]); setTela(t); setParams(p); }
  };
  const voltar = () => {
    if (stack.length === 0) { setTela('inicio'); setParams({}); return; }
    const last = stack[stack.length - 1];
    setStack(stack.slice(0, -1));
    setTela(last.tela); setParams(last.params);
  };

  const salvarTx = (tx, editando) => {
    const ehRec = tx.ehRecorrente;
    delete tx.ehRecorrente; // flag de UI, não persistir

    const expandir = (base) => {
      if (!base.parcelas) { const { parcelas, ...rest } = base; return [rest]; }
      const { total, valorTotal } = base.parcelas;
      const grupoId = base.parcelas.grupoId || `gr-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
      const valorPP = Math.round((valorTotal / total) * 100) / 100;
      const [ano, mesN, dia] = base.data.split('-').map(Number);
      const out = [];
      for (let i = 0; i < total; i++) {
        const dt = new Date(ano, mesN - 1 + i, dia);
        const yyyymmdd = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
        out.push({
          id: `${grupoId}-${i+1}`,
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

    // Se for recorrente, cria a recorrência E marca a tx atual com recorrenteId.
    if (ehRec) {
      const recId = `rec-${Date.now()}`;
      const [yy, mm, dd] = tx.data.split('-').map(Number);
      const yyyymm = `${yy}-${String(mm).padStart(2,'0')}`;
      tx = { ...tx, recorrenteId: recId };
      cloud.setRecorrentes((atual) => [
        ...atual,
        {
          id: recId,
          descricao: tx.descricao,
          categoria: tx.categoria,
          pagamento: tx.pagamento,
          valor: tx.valor,
          dia: dd,
          inicio: yyyymm,
          ultimoMesGerado: yyyymm,
        },
      ]);
    }

    cloud.setTxs((atual) => {
      if (editando) {
        const original = atual.find(t => t.id === tx.id);
        const grupoAntigo = original && original.parcelas ? original.parcelas.grupoId : null;
        const semGrupo = atual.filter(t => t.id !== tx.id && (!grupoAntigo || !t.parcelas || t.parcelas.grupoId !== grupoAntigo));
        return [...semGrupo, ...expandir(tx)].sort((a, b) => b.data.localeCompare(a.data));
      }
      const novos = expandir(tx);
      const yyyymm = novos[0].data.slice(0, 7);
      if (yyyymm !== mes) setMes(yyyymm);
      return [...novos, ...atual].sort((a, b) => b.data.localeCompare(a.data));
    });
    if (!editando) setTela('gastos');
  };

  const cancelarRecorrente = (recId) => {
    cloud.setRecorrentes((atual) => atual.filter(r => r.id !== recId));
  };

  const excluirTx = (id) => {
    cloud.setTxs((atual) => {
      const t = atual.find(x => x.id === id);
      if (t && t.parcelas) return atual.filter(x => !x.parcelas || x.parcelas.grupoId !== t.parcelas.grupoId);
      return atual.filter(x => x.id !== id);
    });
  };

  // ─── Caixinhas ───
  const salvarCaixinha = (dados) => {
    cloud.setCaixinhas((atual) => {
      if (dados.id) {
        // Editando existente
        return atual.map(c => c.id === dados.id ? { ...c, ...dados } : c);
      }
      // Nova
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
    cloud.setCaixinhas((atual) => atual.filter(c => c.id !== id));
  };
  const depositarCaixinha = (id, deposito) => {
    cloud.setCaixinhas((atual) => atual.map(c =>
      c.id === id ? { ...c, depositos: [...(c.depositos || []), deposito] } : c
    ));
  };

  // Estados de carga e gateamento
  if (usuario === undefined) return <Splash />;     // ainda decidindo se há sessão
  if (usuario === null)      return <LoginScreen />; // deslogado
  if (!cloud.ready)          return <Splash />;     // logado, carregando dados

  if (onboarding) return <Onboarding onFim={finalizarOnboarding} />;

  const ctx = {
    txs: cloud.txs, mes, setMes, todosMeses, mesAnterior, ocultar, setOcultar,
    irPara, voltar, salvarTx, excluirTx,
    orcamentos: cloud.orcamentos, setOrcamentos: cloud.setOrcamentos,
    caixinhas: cloud.caixinhas, salvarCaixinha, excluirCaixinha, depositarCaixinha,
    recorrentes: cloud.recorrentes, cancelarRecorrente,
    preferences: cloud.preferences, setPreferences: cloud.setPreferences,
    usuario, sair: sairFirebase,
    fechar: () => setAddModal(null),
    setOnboarding: (v) => { if (!v) localStorage.setItem(ONBOARDING_KEY, '1'); setOnboarding(v); },
  };

  let conteudo;
  if (tela === 'inicio')         conteudo = <DashboardScreen ctx={ctx} />;
  else if (tela === 'gastos')    conteudo = <GastosScreen ctx={ctx} />;
  else if (tela === 'analise')   conteudo = <AnaliseScreen ctx={ctx} />;
  else if (tela === 'perfil')    conteudo = <PerfilScreen ctx={ctx} />;
  else if (tela === 'categoria') conteudo = <CategoriaScreen ctx={ctx} params={params} />;
  else if (tela === 'orcamentos')conteudo = <OrcamentosScreen ctx={ctx} />;
  else if (tela === 'historico') conteudo = <HistoricoScreen ctx={ctx} />;
  else if (tela === 'caixinhas') conteudo = <CaixinhasScreen ctx={ctx} />;
  else if (tela === 'caixinha')  conteudo = <CaixinhaScreen ctx={ctx} params={params} />;
  else if (tela === 'recorrentes') conteudo = <RecorrentesScreen ctx={ctx} />;

  if (ehDesktop) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
        <Sidebar tela={tela} irPara={irPara} abrirAdd={() => setAddModal({})} usuario={usuario} />
        <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', height: '100vh' }}>
          <div data-screen-label={tela} style={{ maxWidth: 620, margin: '0 auto', minHeight: '100vh' }}>
            {conteudo}
          </div>
        </main>
        {addModal && <AddExpenseModal ctx={ctx} params={addModal} />}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <div data-screen-label={tela} style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh' }}>
        {conteudo}
      </div>
      <TabBar tela={tela} irPara={irPara} abrirAdd={() => setAddModal({})} />
      {addModal && <AddExpenseModal ctx={ctx} params={addModal} />}
    </div>
  );
}

function Splash() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 28,
        background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
        animation: 'pulse 1.4s ease-in-out infinite',
      }} />
      <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.92); opacity: 0.7; } }`}</style>
    </div>
  );
}
