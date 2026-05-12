// orcamentos.jsx — Tela Orçamentos (limites por categoria)

import React from 'react';
import { CATEGORIAS, ORDEM_CATS, fmtBRL, fmtBRLCompacto, totalGeral, totalPorCategoria, txDoMes } from '../data.js';
import { CatChip, Icon } from '../ui/icons.jsx';
import { Card, TopBar } from '../ui/common.jsx';
import { BarraProgresso } from '../ui/charts.jsx';

export function OrcamentosScreen({ ctx }) {
  const { txs, mes, ocultar, voltar, orcamentos, setOrcamentos, irPara } = ctx;
  const txMes = txDoMes(txs, mes);
  const porCat = totalPorCategoria(txMes);
  const totalOrc = Object.values(orcamentos).reduce((s, v) => s + v, 0);
  const totalGasto = totalGeral(txMes);
  const pctGeral = totalOrc > 0 ? (totalGasto / totalOrc) * 100 : 0;

  const [editando, setEditando] = React.useState(null);
  const [tempVal, setTempVal] = React.useState('');

  const salvar = (catId) => {
    const v = parseFloat(tempVal.replace(',', '.')) || 0;
    setOrcamentos({ ...orcamentos, [catId]: Math.max(0, v) });
    setEditando(null);
  };

  return (
    <div style={{ paddingBottom: 110 }}>
      <TopBar voltar={voltar} titulo="Orçamentos" />

      <div style={{ padding: '4px 20px 0' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
          color: '#fff', borderRadius: 24, padding: 20, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85, position: 'relative' }}>Orçamento total do mês</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, letterSpacing: '-0.02em', position: 'relative' }}>
            {fmtBRL(totalOrc, ocultar)}
          </div>
          <div style={{ marginTop: 14, position: 'relative' }}>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${Math.min(100, pctGeral)}%`,
                background: pctGeral > 100 ? '#FFB1BD' : '#fff', borderRadius: 8,
                transition: 'width .3s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, fontWeight: 600 }}>
              <span>Gasto: {fmtBRLCompacto(totalGasto, ocultar)}</span>
              <span style={{ opacity: 0.85 }}>{pctGeral.toFixed(0)}% utilizado</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, padding: '0 4px 10px' }}>
          Por categoria
        </div>
        <Card style={{ padding: '4px 16px' }}>
          {ORDEM_CATS.map((c, i) => {
            const cat = CATEGORIAS[c];
            const gasto = porCat[c] || 0;
            const orc = orcamentos[c] || 0;
            const pct = orc > 0 ? (gasto / orc) * 100 : 0;
            const cor = pct > 100 ? '#D63A55' : pct > 80 ? '#E08A00' : '#1B9E6A';
            return (
              <div key={c} style={{
                padding: '14px 0',
                borderTop: i === 0 ? 'none' : '1px solid var(--linha)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CatChip catId={c} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{cat.nome}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginTop: 1 }}>
                      {fmtBRLCompacto(gasto, ocultar)} de {fmtBRLCompacto(orc, ocultar)}
                    </div>
                  </div>
                  {editando === c ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        autoFocus
                        type="text"
                        inputMode="decimal"
                        value={tempVal}
                        onChange={e => setTempVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') salvar(c); if (e.key === 'Escape') setEditando(null); }}
                        style={{
                          width: 80, padding: '6px 10px', borderRadius: 10,
                          border: '1.5px solid var(--primary)', background: '#fff',
                          fontSize: 13, fontWeight: 700, color: 'var(--ink)', outline: 'none',
                          fontFamily: 'inherit', textAlign: 'right',
                        }}
                      />
                      <button onClick={() => salvar(c)} style={{
                        width: 30, height: 30, borderRadius: 15, border: 'none',
                        background: 'var(--primary)', color: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon name="check" size={14} strokeWidth={2.6} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditando(c); setTempVal(String(orc)); }} style={{
                      background: 'transparent', border: 'none', cursor: 'pointer', padding: 4,
                      color: 'var(--muted)',
                    }}>
                      <Icon name="edit" size={16} strokeWidth={2} />
                    </button>
                  )}
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <BarraProgresso valor={Math.min(gasto, orc)} max={orc || 1} cor={pct > 100 ? '#D63A55' : cat.cor} altura={8} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: cor, minWidth: 38, textAlign: 'right' }}>
                    {pct.toFixed(0)}%
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
