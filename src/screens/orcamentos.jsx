// orcamentos.jsx — Tela Orçamentos (total mensal + limites por categoria).

import React from 'react';
import { CATEGORIAS, catsMinhas, fmtBRL, fmtBRLCompacto, totalEntradas, totalGeral, totalPorCategoria, txDoMes } from '../data.js';
import { CatChip, Icon } from '../ui/icons.jsx';
import { Card, TopBar } from '../ui/common.jsx';
import { BarraProgresso } from '../ui/charts.jsx';
import { COR_POS, COR_NEG, COR_AVISO } from '../lib/colors.js';
import {
  formatarValorDigitado,
  formatarValorInicial,
  parseValorBR,
} from '../lib/money-input.js';

export function OrcamentosScreen({ ctx }) {
  const { txs, mes, ocultar, voltar, orcamentos, setOrcamentos, preferences, setPreferences, ehDesktop, caixinhas, usuario } = ctx;

  const txMes = txDoMes(txs, mes);
  const porCat = totalPorCategoria(txMes);
  const entradas = totalEntradas(txMes);
  const somaCats = Object.values(orcamentos).reduce((s, v) => s + v, 0);
  const orcBase = preferences.orcamentoMensal > 0 ? preferences.orcamentoMensal : somaCats;
  // Depósitos em caixinhas no mês — dinheiro guardado, não disponível.
  // Saques (valor < 0) ficam de fora: o resgate já volta como entrada do mês.
  // Em conta compartilhada, conto só os depósitos QUE EU FIZ — depósito do
  // parceiro abate o saldo dele, não o meu.
  const meuUid = usuario?.uid;
  const guardadoEmCaixinhas = (caixinhas || []).reduce(
    (s, c) =>
      s +
      (c.depositos || []).reduce((s2, d) => {
        if (!d.data || !d.data.startsWith(mes)) return s2;
        if (!(d.valor > 0)) return s2;
        const dono = d.feitoPor || meuUid;
        if (meuUid && dono !== meuUid) return s2;
        return s2 + d.valor;
      }, 0),
    0,
  );
  // Entradas do mês somam ao orçamento; caixinhas guardadas abatem.
  const orcMensal = orcBase + entradas - guardadoEmCaixinhas;
  const totalGasto = totalGeral(txMes);
  const pctGeral = orcMensal > 0 ? (totalGasto / orcMensal) * 100 : 0;

  const [editandoTotal, setEditandoTotal] = React.useState(false);
  const [tempTotal, setTempTotal] = React.useState('0,00');

  const [editandoCat, setEditandoCat] = React.useState(null);
  const [tempCat, setTempCat] = React.useState('0,00');

  const salvarTotal = () => {
    setPreferences({ orcamentoMensal: Math.max(0, parseValorBR(tempTotal)) });
    setEditandoTotal(false);
  };

  const salvarCat = (catId) => {
    setOrcamentos({ ...orcamentos, [catId]: Math.max(0, parseValorBR(tempCat)) });
    setEditandoCat(null);
  };

  return (
    <div style={{ paddingBottom: "var(--pad-bottom)" }}>
      <TopBar voltar={ehDesktop ? undefined : voltar} titulo="Orçamentos" />

      {/* Card principal — total mensal editável */}
      <div style={{ padding: '4px 20px 0' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
          color: '#fff', borderRadius: 24, padding: 20, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85 }}>Orçamento mensal</div>
            {!editandoTotal && (
              <button onClick={() => { setTempTotal(formatarValorInicial(orcBase)); setEditandoTotal(true); }} style={{
                background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer',
                color: '#fff', padding: '6px 10px', borderRadius: 999,
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
              }}>
                <Icon name="edit" size={12} color="#fff" strokeWidth={2.4} /> Editar
              </button>
            )}
          </div>

          {editandoTotal ? (
            <div style={{ position: 'relative', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700, opacity: 0.85 }}>R$</span>
              <input
                autoFocus
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={tempTotal}
                onChange={(e) => setTempTotal(formatarValorDigitado(e.target.value))}
                onKeyDown={(e) => { if (e.key === 'Enter') salvarTotal(); if (e.key === 'Escape') setEditandoTotal(false); }}
                style={{
                  flex: 1, padding: '6px 10px', borderRadius: 10,
                  border: 'none', background: 'rgba(255,255,255,0.18)',
                  fontSize: 26, fontWeight: 800, color: '#fff',
                  outline: 'none', fontFamily: 'inherit', letterSpacing: '-0.02em',
                  minWidth: 0,
                }}
              />
              <button onClick={salvarTotal} style={{
                width: 36, height: 36, borderRadius: 18, border: 'none', cursor: 'pointer',
                background: '#fff', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon name="check" size={16} color="var(--primary)" strokeWidth={2.6} />
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, letterSpacing: '-0.02em', position: 'relative' }}>
              {orcMensal > 0 ? fmtBRL(orcMensal, ocultar) : (
                <button onClick={() => { setTempTotal(formatarValorInicial(orcMensal)); setEditandoTotal(true); }} style={{
                  background: 'transparent', border: '1.5px dashed rgba(255,255,255,0.6)',
                  color: '#fff', padding: '8px 14px', borderRadius: 12,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}>Definir orçamento</button>
              )}
            </div>
          )}

          {orcMensal > 0 && (
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
          )}

          {preferences.orcamentoMensal > 0 && somaCats > 0 && Math.abs(preferences.orcamentoMensal - somaCats) > 1 && (
            <div style={{
              marginTop: 10, padding: '8px 10px', borderRadius: 10,
              background: 'rgba(255,255,255,0.14)',
              fontSize: 11, fontWeight: 600, opacity: 0.92,
              position: 'relative',
            }}>
              Soma das categorias: {fmtBRLCompacto(somaCats)} (difere do total mensal).
            </div>
          )}
        </div>
      </div>

      {/* Categorias */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, padding: '0 4px 10px' }}>
          Por categoria
        </div>
        <Card style={{ padding: '4px 16px' }}>
          {catsMinhas().map((c, i) => {
            const cat = CATEGORIAS[c];
            const gasto = porCat[c] || 0;
            const orc = orcamentos[c] || 0;
            const pct = orc > 0 ? (gasto / orc) * 100 : 0;
            const cor = pct > 100 ? COR_NEG : pct > 80 ? COR_AVISO : COR_POS;
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
                  {editandoCat === c ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        autoFocus
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={tempCat}
                        onChange={(e) => setTempCat(formatarValorDigitado(e.target.value))}
                        onKeyDown={(e) => { if (e.key === 'Enter') salvarCat(c); if (e.key === 'Escape') setEditandoCat(null); }}
                        style={{
                          width: 90, padding: '6px 10px', borderRadius: 10,
                          border: '1.5px solid var(--primary)', background: 'var(--card)',
                          fontSize: 13, fontWeight: 700, color: 'var(--ink)', outline: 'none',
                          fontFamily: 'inherit', textAlign: 'right',
                        }}
                      />
                      <button onClick={() => salvarCat(c)} style={{
                        width: 30, height: 30, borderRadius: 15, border: 'none',
                        background: 'var(--primary)', color: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon name="check" size={14} strokeWidth={2.6} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditandoCat(c); setTempCat(formatarValorInicial(orc)); }} style={{
                      background: 'transparent', border: 'none', cursor: 'pointer', padding: 4,
                      color: 'var(--muted)',
                    }}>
                      <Icon name="edit" size={16} strokeWidth={2} />
                    </button>
                  )}
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <BarraProgresso valor={Math.min(gasto, orc)} max={orc || 1} cor={pct > 100 ? COR_NEG : cat.cor} altura={8} />
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
