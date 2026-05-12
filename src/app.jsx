// app.jsx — Componente raiz: gateamento (PIN/auth), estado central, navegação.

import React from 'react';
import { PALETAS, chaveMes, listarMeses } from './data.js';
import { Icon } from './ui/icons.jsx';
import { ensureAuth } from './lib/firebase.js';
import { useCloudState } from './lib/storage.js';

import { PinScreen } from './screens/pin.jsx';
import { Onboarding } from './screens/onboarding.jsx';
import { DashboardScreen } from './screens/dashboard.jsx';
import { GastosScreen } from './screens/gastos.jsx';
import { AnaliseScreen } from './screens/analise.jsx';
import { CategoriaScreen } from './screens/categoria.jsx';
import { OrcamentosScreen } from './screens/orcamentos.jsx';
import { HistoricoScreen } from './screens/historico.jsx';
import { PerfilScreen } from './screens/perfil.jsx';
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

function aplicarTema(paleta, modo) {
  const root = document.documentElement;
  const pal = PALETAS.find(p => p.primary === paleta) || PALETAS[0];
  root.style.setProperty('--primary', pal.primary);
  root.style.setProperty('--primary-2', pal.primary2);
  if (modo === 'escuro') {
    root.style.setProperty('--bg', '#1A161D');
    root.style.setProperty('--card', '#26212C');
    root.style.setProperty('--ink', '#F5F0F2');
    root.style.setProperty('--muted', '#9B919A');
    root.style.setProperty('--linha', 'rgba(255,255,255,0.06)');
  } else {
    root.style.setProperty('--bg', '#FBF7F2');
    root.style.setProperty('--card', '#FFFFFF');
    root.style.setProperty('--ink', '#1A1416');
    root.style.setProperty('--muted', '#8A7F84');
    root.style.setProperty('--linha', 'rgba(20,16,24,0.06)');
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', pal.primary);
}

export function App() {
  // Auth anônima → uid
  const [uid, setUid] = React.useState(null);
  React.useEffect(() => { ensureAuth().then(setUid).catch(console.error); }, []);

  // PIN gate
  const [travado, setTravado] = React.useState(true);
  const [modoTrocaPin, setModoTrocaPin] = React.useState(false);

  // Storage Firestore
  const cloud = useCloudState(uid);

  // Tema reativo às preferências
  React.useEffect(() => {
    aplicarTema(cloud.preferences.paleta, cloud.preferences.modo);
  }, [cloud.preferences.paleta, cloud.preferences.modo]);

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

  const excluirTx = (id) => {
    cloud.setTxs((atual) => {
      const t = atual.find(x => x.id === id);
      if (t && t.parcelas) return atual.filter(x => !x.parcelas || x.parcelas.grupoId !== t.parcelas.grupoId);
      return atual.filter(x => x.id !== id);
    });
  };

  if (!uid || !cloud.ready) return <Splash />;

  if (travado) {
    return (
      <PinScreen
        modoTroca={modoTrocaPin}
        onCancelarTroca={modoTrocaPin ? () => { setModoTrocaPin(false); setTravado(false); } : undefined}
        onUnlock={() => { setTravado(false); setModoTrocaPin(false); }}
      />
    );
  }

  if (onboarding) return <Onboarding onFim={finalizarOnboarding} />;

  const ctx = {
    txs: cloud.txs, mes, setMes, todosMeses, mesAnterior, ocultar, setOcultar,
    irPara, voltar, salvarTx, excluirTx,
    orcamentos: cloud.orcamentos, setOrcamentos: cloud.setOrcamentos,
    preferences: cloud.preferences, setPreferences: cloud.setPreferences,
    fechar: () => setAddModal(null),
    setOnboarding: (v) => { if (!v) localStorage.setItem(ONBOARDING_KEY, '1'); setOnboarding(v); },
    trocarPin: () => { setModoTrocaPin(true); setTravado(true); },
  };

  let conteudo;
  if (tela === 'inicio')         conteudo = <DashboardScreen ctx={ctx} />;
  else if (tela === 'gastos')    conteudo = <GastosScreen ctx={ctx} />;
  else if (tela === 'analise')   conteudo = <AnaliseScreen ctx={ctx} />;
  else if (tela === 'perfil')    conteudo = <PerfilScreen ctx={ctx} />;
  else if (tela === 'categoria') conteudo = <CategoriaScreen ctx={ctx} params={params} />;
  else if (tela === 'orcamentos')conteudo = <OrcamentosScreen ctx={ctx} />;
  else if (tela === 'historico') conteudo = <HistoricoScreen ctx={ctx} />;

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
