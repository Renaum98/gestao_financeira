// dashboard.jsx — Tela Início (visão geral do mês)

import React from 'react';
import { CATEGORIAS, ORDEM_CATS, fmtBRL, rotuloMes, totalGeral, totalPorCategoria, txDoMes } from '../data.js';
import { Icon } from '../ui/icons.jsx';
import { Card, ItemTransacao, SeletorMes } from '../ui/common.jsx';
import { PieChart, LineChart } from '../ui/charts.jsx';
import { CardCaixinha } from './caixinhas.jsx';

export function DashboardScreen({ ctx }) {
  const { txs, mes, setMes, todosMeses, mesAnterior, ocultar, setOcultar, irPara, orcamentos, preferences, caixinhas, usuario } = ctx;
  const [fatiaAtiva, setFatiaAtiva] = React.useState(null);
  const primeiroNome = (preferences.nome?.trim() || usuario?.displayName || '').trim().split(' ')[0];

  const txMes = txDoMes(txs, mes);
  const txMesAnt = mesAnterior ? txDoMes(txs, mesAnterior) : [];
  const total = totalGeral(txMes);
  const totalAnt = totalGeral(txMesAnt);
  const delta = totalAnt > 0 ? ((total - totalAnt) / totalAnt) * 100 : 0;
  const somaOrcCats = Object.values(orcamentos).reduce((s, v) => s + v, 0);
  const orcTotal = preferences.orcamentoMensal > 0 ? preferences.orcamentoMensal : somaOrcCats;
  const restante = orcTotal - total;

  const porCat = totalPorCategoria(txMes);
  const dadosPizza = ORDEM_CATS
    .filter(c => (porCat[c] || 0) > 0)
    .map(c => ({ id: c, valor: porCat[c], cor: CATEGORIAS[c].cor, nome: CATEGORIAS[c].nome }));

  // pontos do gráfico de linha — acumulado
  const acumPorDia = (txArr) => {
    if (!txArr.length) return [{ dia: 1, valor: 0 }];
    const map = {};
    for (const t of txArr) {
      const d = parseInt(t.data.split('-')[2], 10);
      map[d] = (map[d] || 0) + t.valor;
    }
    const dias = Object.keys(map).map(Number).sort((a, b) => a - b);
    const arr = [{ dia: 1, valor: 0 }];
    let acc = 0;
    for (const d of dias) {
      acc += map[d];
      arr.push({ dia: d, valor: acc });
    }
    return arr;
  };
  const pontos = acumPorDia(txMes);
  const pontosAnt = mesAnterior ? acumPorDia(txMesAnt) : null;

  const recentes = txMes.slice(0, 4);
  const hojeHora = new Date().getHours();
  const saudacao = hojeHora < 12 ? 'Bom dia' : hojeHora < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div style={{ paddingBottom: 110 }}>
      {/* Cabeçalho */}
      <div style={{ padding: '60px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{saudacao}{primeiroNome && ','}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              {primeiroNome ? `${primeiroNome} ✦` : 'Bem-vindo ✦'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setOcultar(!ocultar)} style={{
              width: 40, height: 40, borderRadius: 20, background: 'var(--card)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}>
              <Icon name={ocultar ? 'eye-off' : 'eye'} size={18} color="var(--ink)" strokeWidth={2} />
            </button>
            <button onClick={() => irPara('perfil')} style={{
              width: 40, height: 40, borderRadius: 20, background: 'var(--card)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)', overflow: 'hidden',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 16,
                background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '-0.02em',
              }}>{primeiroNome ? primeiroNome[0].toUpperCase() : '+'}</div>
            </button>
          </div>
        </div>
      </div>

      {/* Card principal — saldo do mês */}
      <div style={{ padding: '18px 20px 0' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
          color: '#fff', borderRadius: 28, padding: 22, position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(110, 79, 246, 0.22)',
        }}>
          {/* círculos decorativos */}
          <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', right: 30, bottom: -60, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.85 }}>Gasto em {rotuloMes(mes)}</div>
            <SeletorMes mes={mes} setMes={setMes} todosMeses={todosMeses} />
          </div>

          <div style={{ marginTop: 10, fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', position: 'relative' }}>
            {fmtBRL(total, ocultar)}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, position: 'relative' }}>
            {totalAnt > 0 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 999,
                background: 'rgba(255,255,255,0.18)',
                fontSize: 12, fontWeight: 700,
              }}>
                <span>{delta >= 0 ? '▲' : '▼'}</span>
                <span>{Math.abs(delta).toFixed(1)}%</span>
                <span style={{ opacity: 0.8, fontWeight: 600 }}>vs. mês anterior</span>
              </div>
            )}
          </div>

          <div style={{
            marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.18)',
            display: 'flex', justifyContent: 'space-between', position: 'relative',
          }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 600 }}>Orçamento</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{fmtBRL(orcTotal, ocultar)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 600 }}>{restante >= 0 ? 'Restante' : 'Acima do orçamento'}</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, color: restante >= 0 ? '#D9F5C8' : '#FFD0D9' }}>
                {fmtBRL(Math.abs(restante), ocultar)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pizza por categoria */}
      <div style={{ padding: '16px 20px 0' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Por categoria</div>
            <button onClick={() => irPara('analise')} style={{
              background: 'transparent', border: 'none', color: 'var(--primary)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0,
            }}>Ver tudo →</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <PieChart dados={dadosPizza} total={total} tamanho={170} ativo={fatiaAtiva} onHover={setFatiaAtiva} ocultar={ocultar} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
              {dadosPizza.slice(0, 5).map(d => (
                <div key={d.id}
                  onClick={() => setFatiaAtiva(fatiaAtiva === d.id ? null : d.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                    opacity: fatiaAtiva && fatiaAtiva !== d.id ? 0.4 : 1, transition: 'opacity .15s',
                  }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: d.cor, flexShrink: 0 }} />
                  <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 600, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d.nome}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>
                    {((d.valor / total) * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Linha — tendência */}
      <div style={{ padding: '12px 20px 0' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Tendência do mês</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, fontWeight: 600 }}>Acumulado ao longo dos dias</div>
            </div>
            {pontosAnt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10, fontWeight: 600, color: 'var(--muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 12, height: 2, background: 'var(--primary)', borderRadius: 2 }} />
                  Atual
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 12, height: 2, background: '#C9C2D8', borderRadius: 2, borderTop: '1px dashed' }} />
                  Anterior
                </div>
              </div>
            )}
          </div>
          <LineChart pontos={pontos} pontosComp={pontosAnt} largura={310} altura={130} ocultar={ocultar} />
        </Card>
      </div>

      {/* Transações recentes */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 6px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Últimos gastos</div>
          <button onClick={() => irPara('gastos')} style={{
            background: 'transparent', border: 'none', color: 'var(--primary)',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0,
          }}>Ver todos →</button>
        </div>
        <Card style={{ padding: '6px 16px' }}>
          {recentes.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Sem gastos neste mês.
            </div>
          )}
          {recentes.map((tx, i) => (
            <div key={tx.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--linha)' }}>
              <ItemTransacao tx={tx} ocultar={ocultar} onClick={() => irPara('gastos')} />
            </div>
          ))}
        </Card>
      </div>

      {/* Caixinhas (só aparece se houver pelo menos uma) */}
      {caixinhas && caixinhas.length > 0 && (
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Caixinhas</div>
            <button onClick={() => irPara('caixinhas')} style={{
              background: 'transparent', border: 'none', color: 'var(--primary)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0,
            }}>Ver todas →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {caixinhas.slice(0, 3).map(cx => (
              <CardCaixinha key={cx.id} cx={cx} ocultar={ocultar} onClick={() => irPara('caixinha', { id: cx.id })} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
