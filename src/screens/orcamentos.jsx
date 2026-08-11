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
  valorZero,
} from '../lib/money-input.js';
import { simboloMoeda } from '../lib/moeda.js';
import { mesCorrente } from '../lib/orcamento.js';
import { useT } from '../lib/i18n.jsx';

export function OrcamentosScreen({ ctx }) {
  const { txs, voltar, orcamentos, setOrcamentos, preferences, setPreferences, ehDesktop, caixinhas, usuario } = ctx;
  const t = useT();

  // Orçamento é sempre do mês corrente — não do mês navegável do dashboard.
  // Assim, na virada do mês os gastos (geral, por categoria e por forma de
  // pagamento) zeram automaticamente, refletindo só o que foi gasto no mês atual.
  const mes = mesCorrente();
  const txMes = txDoMes(txs, mes);
  const porCat = totalPorCategoria(txMes);
  const entradas = totalEntradas(txMes);
  // Orçamento mensal é o teto OPCIONAL definido pelo usuário. Limites por
  // categoria são sub-limites OPCIONAIS dentro do mensal — não compõem o
  // mensal nem precisam somar igual a ele. Sem mensal definido = sem teto.
  const orcBase = preferences.orcamentoMensal > 0 ? preferences.orcamentoMensal : 0;
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
        // Saldo inicial não abate o orçamento: já existia antes de cadastrar.
        if (d.tipo === "inicial") return s2;
        const dono = d.feitoPor || meuUid;
        if (meuUid && dono !== meuUid) return s2;
        return s2 + d.valor;
      }, 0),
    0,
  );
  // Entradas do mês somam ao orçamento; caixinhas guardadas abatem.
  // Só faz sentido mostrar "orcMensal" quando há um teto definido.
  const temOrcamento = orcBase > 0;
  const orcMensal = temOrcamento ? orcBase + entradas - guardadoEmCaixinhas : 0;
  const totalGasto = totalGeral(txMes);
  const pctGeral = orcMensal > 0 ? (totalGasto / orcMensal) * 100 : 0;

  const [editandoTotal, setEditandoTotal] = React.useState(false);
  const [tempTotal, setTempTotal] = React.useState(valorZero());

  const [editandoCat, setEditandoCat] = React.useState(null);
  const [tempCat, setTempCat] = React.useState(valorZero());

  const [editandoCartao, setEditandoCartao] = React.useState(false);
  const [tempCartao, setTempCartao] = React.useState(valorZero());

  const [editandoFech, setEditandoFech] = React.useState(false);
  const [tempFech, setTempFech] = React.useState('');

  // Limite só para o cartão de crédito — não faz sentido limitar Pix/dinheiro.
  const gastoCartao = txMes.reduce(
    (s, t) => (t.tipo !== 'entrada' && t.pagamento === 'Cartão de crédito' ? s + t.valor : s),
    0,
  );
  const orcCartao = preferences.orcamentoCartaoCredito > 0 ? preferences.orcamentoCartaoCredito : 0;
  const temCartao = orcCartao > 0;
  const pctCartao = orcCartao > 0 ? (gastoCartao / orcCartao) * 100 : 0;
  const corCartao = pctCartao > 100 ? COR_NEG : pctCartao > 80 ? COR_AVISO : COR_POS;

  const salvarTotal = () => {
    setPreferences({ orcamentoMensal: Math.max(0, parseValorBR(tempTotal)) });
    setEditandoTotal(false);
  };

  const salvarCartao = () => {
    setPreferences({ orcamentoCartaoCredito: Math.max(0, parseValorBR(tempCartao)) });
    setEditandoCartao(false);
  };

  // Dia em que a fatura fecha. 0 = último dia do mês (padrão), o caso "fatura
  // de agosto = compras de agosto". Só muda o que o app MOSTRA sobre o ciclo
  // da fatura — o saldo do mês continua abatendo pela data da compra.
  const diaFech = preferences.diaFechamentoCartao > 0 ? preferences.diaFechamentoCartao : 0;

  const salvarFech = () => {
    const n = Math.trunc(Number(String(tempFech).replace(/[^0-9]/g, '')) || 0);
    setPreferences({ diaFechamentoCartao: n >= 1 && n <= 31 ? n : 0 });
    setEditandoFech(false);
  };

  const salvarCat = (catId) => {
    setOrcamentos({ ...orcamentos, [catId]: Math.max(0, parseValorBR(tempCat)) });
    setEditandoCat(null);
  };

  return (
    <div style={{ paddingBottom: "var(--pad-bottom)" }}>
      <TopBar voltar={ehDesktop ? undefined : voltar} titulo={t("Orçamentos")} />

      {/* Card principal — total mensal editável */}
      <div style={{ padding: '4px 20px 0' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
          color: '#fff', borderRadius: 24, padding: 20, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85 }}>{t("Orçamento mensal")}</div>
            {!editandoTotal && (
              <button onClick={() => { setTempTotal(formatarValorInicial(orcBase)); setEditandoTotal(true); }} style={{
                background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer',
                color: '#fff', padding: '6px 10px', borderRadius: 999,
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
              }}>
                <Icon name="edit" size={12} color="#fff" strokeWidth={2.4} /> {t("Editar")}
              </button>
            )}
          </div>

          {editandoTotal ? (
            <>
            <div style={{ position: 'relative', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700, opacity: 0.85 }}>{simboloMoeda()}</span>
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
            <div style={{
              marginTop: 10, fontSize: 11, fontWeight: 600, lineHeight: 1.4,
              opacity: 0.85, position: 'relative',
            }}>
              {t("Use um valor fixo que você recebe todo mês, como salário ou mesada. Recebimentos extras devem ser lançados como Entrada em Transações.")}
            </div>
            </>
          ) : (
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, letterSpacing: '-0.02em', position: 'relative' }}>
              {temOrcamento ? fmtBRL(orcMensal) : (
                <button onClick={() => { setTempTotal(formatarValorInicial(0)); setEditandoTotal(true); }} style={{
                  background: 'transparent', border: '1.5px dashed rgba(255,255,255,0.6)',
                  color: '#fff', padding: '8px 14px', borderRadius: 12,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}>{t("Definir orçamento")}</button>
              )}
            </div>
          )}

          {temOrcamento && (
            <div style={{ marginTop: 14, position: 'relative' }}>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${Math.min(100, pctGeral)}%`,
                  background: pctGeral > 100 ? '#FFB1BD' : '#fff', borderRadius: 8,
                  transition: 'width .3s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, fontWeight: 600 }}>
                <span>{t("Gasto: {x}", { x: fmtBRLCompacto(totalGasto) })}</span>
                <span style={{ opacity: 0.85 }}>{t("{pct}% utilizado", { pct: pctGeral.toFixed(0) })}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Limite do cartão de crédito */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, padding: '0 4px 10px' }}>
          {t("Por forma de pagamento")}
        </div>
        <Card style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12, background: 'var(--surface-sunken)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon name="card" size={18} color="var(--ink)" strokeWidth={2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{t("Cartão de crédito")}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginTop: 1 }}>
                {temCartao
                  ? t("{gasto} de {orc}", { gasto: fmtBRLCompacto(gastoCartao), orc: fmtBRLCompacto(orcCartao) })
                  : t('Sem limite definido')}
              </div>
            </div>
            {editandoCartao ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={tempCartao}
                  onChange={(e) => setTempCartao(formatarValorDigitado(e.target.value))}
                  onKeyDown={(e) => { if (e.key === 'Enter') salvarCartao(); if (e.key === 'Escape') setEditandoCartao(false); }}
                  style={{
                    width: 90, padding: '6px 10px', borderRadius: 10,
                    border: '1.5px solid var(--primary)', background: 'var(--card)',
                    fontSize: 13, fontWeight: 700, color: 'var(--ink)', outline: 'none',
                    fontFamily: 'inherit', textAlign: 'right',
                  }}
                />
                <button onClick={salvarCartao} style={{
                  width: 30, height: 30, borderRadius: 15, border: 'none',
                  background: 'var(--primary)', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="check" size={14} strokeWidth={2.6} />
                </button>
              </div>
            ) : (
              <button onClick={() => { setEditandoCartao(true); setTempCartao(formatarValorInicial(orcCartao)); }} style={{
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--muted)',
              }}>
                <Icon name="edit" size={16} strokeWidth={2} />
              </button>
            )}
          </div>
          {temCartao && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <BarraProgresso valor={Math.min(gastoCartao, orcCartao)} max={orcCartao || 1} cor={pctCartao > 100 ? COR_NEG : 'var(--primary)'} altura={8} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: corCartao, minWidth: 38, textAlign: 'right' }}>
                {pctCartao.toFixed(0)}%
              </div>
            </div>
          )}

          {/* Fechamento da fatura — define em qual fatura cada compra cai.
              Não altera o saldo do mês, só o ciclo mostrado (lib/fatura.js). */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--linha)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12, background: 'var(--surface-sunken)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon name="calendar" size={18} color="var(--muted)" strokeWidth={2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{t("Fechamento da fatura")}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginTop: 1 }}>
                {diaFech > 0
                  ? t("Fecha dia {dia} · vence no mês seguinte", { dia: diaFech })
                  : t("Fecha no último dia do mês · vence no mês seguinte")}
              </div>
            </div>
            {editandoFech ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={tempFech}
                  placeholder={t("Último")}
                  aria-label={t("Dia de fechamento da fatura")}
                  onChange={(e) => setTempFech(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                  onKeyDown={(e) => { if (e.key === 'Enter') salvarFech(); if (e.key === 'Escape') setEditandoFech(false); }}
                  style={{
                    width: 62, padding: '6px 10px', borderRadius: 10,
                    border: '1.5px solid var(--primary)', background: 'var(--card)',
                    fontSize: 13, fontWeight: 700, color: 'var(--ink)', outline: 'none',
                    fontFamily: 'inherit', textAlign: 'right',
                  }}
                />
                <button onClick={salvarFech} style={{
                  width: 30, height: 30, borderRadius: 15, border: 'none',
                  background: 'var(--primary)', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="check" size={14} strokeWidth={2.6} />
                </button>
              </div>
            ) : (
              <button onClick={() => { setEditandoFech(true); setTempFech(diaFech > 0 ? String(diaFech) : ''); }} style={{
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--muted)',
              }}>
                <Icon name="edit" size={16} strokeWidth={2} />
              </button>
            )}
          </div>
        </Card>
      </div>

      {/* Categorias */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, padding: '0 4px 10px' }}>
          {t("Por categoria")}
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
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{t(cat.nome)}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginTop: 1 }}>
                      {t("{gasto} de {orc}", { gasto: fmtBRLCompacto(gasto), orc: fmtBRLCompacto(orc) })}
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
