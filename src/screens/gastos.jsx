// gastos.jsx — Tela Gastos (lista de transações do mês com filtros)

import React from 'react';
import { CATEGORIAS, MESES_CURTO, ORDEM_CATS, fmtBRL, totalGeral, txDoMes } from '../data.js';
import { Icon } from '../ui/icons.jsx';
import { Card, ItemTransacao, SeletorMes, TopBar } from '../ui/common.jsx';
import { ConfirmModal } from '../ui/confirm-modal.jsx';

export function GastosScreen({ ctx }) {
  const { txs, mes, setMes, todosMeses, ocultar, irPara, excluirTx } = ctx;
  const [filtro, setFiltro] = React.useState('todas');
  const [busca, setBusca] = React.useState('');
  const [acaoAberta, setAcaoAberta] = React.useState(null);
  const [confirmarExclusao, setConfirmarExclusao] = React.useState(null); // tx pendente de confirmação

  let txMes = txDoMes(txs, mes);
  if (filtro !== 'todas') txMes = txMes.filter(t => t.categoria === filtro);
  if (busca) txMes = txMes.filter(t => t.descricao.toLowerCase().includes(busca.toLowerCase()));

  const total = totalGeral(txMes);

  // agrupar por dia
  const porDia = {};
  for (const t of txMes) {
    porDia[t.data] = porDia[t.data] || [];
    porDia[t.data].push(t);
  }
  const dias = Object.keys(porDia).sort((a, b) => b.localeCompare(a));

  const formatarDia = (yyyymmdd) => {
    const d = new Date(yyyymmdd + 'T12:00:00');
    const hoje = new Date(); hoje.setHours(12, 0, 0, 0);
    const diff = Math.round((hoje - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Ontem';
    const dn = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getDay()];
    return `${dn}, ${d.getDate()} ${MESES_CURTO[d.getMonth()]}`;
  };

  const cats = ['todas', ...ORDEM_CATS];

  return (
    <div style={{ paddingBottom: 110 }}>
      <TopBar
        titulo="Gastos"
        acao={
          <button onClick={() => irPara('historico')} style={{
            width: 36, height: 36, borderRadius: 18, background: 'var(--card)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}>
            <Icon name="calendar" size={18} color="var(--ink)" strokeWidth={2} />
          </button>
        }
      />

      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
            {txMes.length} transações · Total: <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{fmtBRL(total, ocultar)}</span>
          </div>
          <SeletorMes mes={mes} setMes={setMes} todosMeses={todosMeses} />
        </div>
      </div>

      {/* Busca */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
          background: 'var(--card)', borderRadius: 14, boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
          </svg>
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar gasto..."
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontSize: 14, color: 'var(--ink)', fontFamily: 'inherit', fontWeight: 500,
            }}
          />
          {busca && (
            <button onClick={() => setBusca('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <Icon name="close" size={14} color="var(--muted)" strokeWidth={2.4} />
            </button>
          )}
        </div>
      </div>

      {/* Filtros de categoria */}
      <div style={{ padding: '12px 0 0' }}>
        <div className="carrossel" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 20px 6px', scrollbarWidth: 'none' }}>
          {cats.map(c => {
            const sel = filtro === c;
            const cat = c === 'todas' ? null : CATEGORIAS[c];
            return (
              <button key={c} onClick={() => setFiltro(c)} style={{
                padding: '8px 14px', borderRadius: 999, border: 'none',
                background: sel ? 'var(--ink)' : 'var(--card)',
                color: sel ? 'var(--bg)' : 'var(--ink)',
                fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
                boxShadow: sel ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
              }}>
                {cat && <div style={{ width: 8, height: 8, borderRadius: 4, background: cat.cor }} />}
                {c === 'todas' ? 'Todas' : cat.nome}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista por dia */}
      <div style={{ padding: '16px 20px 0' }}>
        {dias.length === 0 ? (
          <Card style={{ padding: 32, textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 28, background: 'var(--bg)',
              margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="list" size={26} color="var(--muted)" strokeWidth={2} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Nenhum gasto</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Tente outro filtro ou adicione um novo.</div>
          </Card>
        ) : dias.map(dia => {
          const tot = porDia[dia].reduce((s, t) => s + t.valor, 0);
          return (
            <div key={dia} style={{ marginBottom: 14 }}>
              <div style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                padding: '0 4px 6px',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {formatarDia(dia)}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
                  {fmtBRL(tot, ocultar)}
                </div>
              </div>
              <Card style={{ padding: '6px 16px' }}>
                {porDia[dia].map((tx, i) => (
                  <div key={tx.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--linha)', position: 'relative' }}>
                    <ItemTransacao tx={tx} ocultar={ocultar} onClick={() => setAcaoAberta(tx.id)} />
                    {acaoAberta === tx.id && (
                      <div style={{
                        display: 'flex', gap: 8, padding: '0 0 12px',
                      }}>
                        <button onClick={() => { setAcaoAberta(null); irPara('add', { editar: tx }); }} style={{
                          flex: 1, padding: '8px 12px', borderRadius: 12, border: 'none',
                          background: 'var(--bg)', color: 'var(--ink)', fontWeight: 700, fontSize: 13,
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                          <Icon name="edit" size={14} strokeWidth={2.2} /> Editar
                        </button>
                        <button onClick={() => { setConfirmarExclusao(tx); setAcaoAberta(null); }} style={{
                          flex: 1, padding: '8px 12px', borderRadius: 12, border: 'none',
                          background: '#FFE5EA', color: '#D63A55', fontWeight: 700, fontSize: 13,
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                          <Icon name="trash" size={14} strokeWidth={2.2} /> Excluir
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </Card>
            </div>
          );
        })}
      </div>

      {confirmarExclusao && (
        <ConfirmModal
          titulo={confirmarExclusao.parcelas ? 'Excluir parcelamento?' : 'Excluir este gasto?'}
          mensagem={
            confirmarExclusao.parcelas
              ? `"${confirmarExclusao.descricao}" foi parcelado em ${confirmarExclusao.parcelas.total}×. Todas as parcelas serão removidas.`
              : `"${confirmarExclusao.descricao}" (${fmtBRL(confirmarExclusao.valor)}) será removido permanentemente.`
          }
          onCancelar={() => setConfirmarExclusao(null)}
          onConfirmar={() => { excluirTx(confirmarExclusao.id); setConfirmarExclusao(null); }}
        />
      )}
    </div>
  );
}
