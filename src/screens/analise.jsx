// analise.jsx — Tela Análise (pizza grande, ranking de categorias, atalho de orçamentos)

import React from 'react';
import { CATEGORIAS, ORDEM_CATS, fmtBRLCompacto, totalGeral, totalPorCategoria, txDoMes } from '../data.js';
import { CatChip, Icon } from '../ui/icons.jsx';
import { Card, SeletorMes, TopBar } from '../ui/common.jsx';
import { BarraProgresso, PieChart } from '../ui/charts.jsx';

export function AnaliseScreen({ ctx }) {
  const { txs, mes, setMes, todosMeses, mesAnterior, ocultar, irPara } = ctx;
  const [ativa, setAtiva] = React.useState(null);
  const txMes = txDoMes(txs, mes);
  const txMesAnt = mesAnterior ? txDoMes(txs, mesAnterior) : [];
  const porCat = totalPorCategoria(txMes);
  const porCatAnt = totalPorCategoria(txMesAnt);
  const total = totalGeral(txMes);

  const dados = ORDEM_CATS
    .filter(c => (porCat[c] || 0) > 0)
    .map(c => ({ id: c, valor: porCat[c], cor: CATEGORIAS[c].cor, nome: CATEGORIAS[c].nome }))
    .sort((a, b) => b.valor - a.valor);

  return (
    <div style={{ paddingBottom: 110 }}>
      <TopBar titulo="Análise" />
      <div style={{ padding: '0 20px 12px', display: 'flex', justifyContent: 'flex-end' }}>
        <SeletorMes mes={mes} setMes={setMes} todosMeses={todosMeses} />
      </div>

      {/* Pizza grande */}
      <div style={{ padding: '0 20px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
            <PieChart dados={dados} total={total} tamanho={230} ativo={ativa} onHover={setAtiva} ocultar={ocultar} />
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
            marginTop: 6, paddingTop: 14, borderTop: '1px solid var(--linha)',
          }}>
            {dados.map(d => (
              <div key={d.id}
                onClick={() => setAtiva(ativa === d.id ? null : d.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  opacity: ativa && ativa !== d.id ? 0.4 : 1, padding: '4px 0',
                }}>
                <div style={{ width: 10, height: 10, borderRadius: 5, background: d.cor }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                    {fmtBRLCompacto(d.valor, ocultar)} · {((d.valor / total) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Ranking de categorias */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', padding: '0 4px 8px' }}>
          Top categorias
        </div>
        <Card style={{ padding: '4px 16px' }}>
          {dados.map((d, i) => {
            const ant = porCatAnt[d.id] || 0;
            const diff = ant > 0 ? ((d.valor - ant) / ant) * 100 : null;
            return (
              <div key={d.id} onClick={() => irPara('categoria', { catId: d.id })} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                borderTop: i === 0 ? 'none' : '1px solid var(--linha)', cursor: 'pointer',
              }}>
                <CatChip catId={d.id} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{d.nome}</div>
                  <div style={{ marginTop: 6 }}>
                    <BarraProgresso valor={d.valor} max={dados[0].valor} cor={d.cor} altura={6} />
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>{fmtBRLCompacto(d.valor, ocultar)}</div>
                  {diff !== null && (
                    <div style={{
                      fontSize: 10, fontWeight: 700, marginTop: 2,
                      color: diff >= 0 ? '#D63A55' : '#1B9E6A',
                    }}>
                      {diff >= 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      </div>

      {/* Atalho para orçamentos */}
      <div style={{ padding: '16px 20px 0' }}>
        <Card onClick={() => irPara('orcamentos')} style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'linear-gradient(135deg, #FFF3E2, #FFE0EC)',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 22, background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="target" size={22} color="var(--primary)" strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>Acompanhar orçamentos</div>
            <div style={{ fontSize: 12, color: '#6B5560', fontWeight: 600, marginTop: 2 }}>Veja onde está perto do limite</div>
          </div>
          <Icon name="chevron-right" size={18} color="var(--ink)" strokeWidth={2.4} />
        </Card>
      </div>
    </div>
  );
}
