// add-expense.jsx — modal de Adicionar / Editar gasto

import React from 'react';
import { CATEGORIAS, ORDEM_CATS, PAGAMENTOS, fmtBRL, fmtBRLCompacto } from '../data.js';
import { CatChip, Icon, iconePagamento } from '../ui/icons.jsx';

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function NumPadButton({ children, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, height: 56, borderRadius: 16, border: 'none',
      background: '#fff', fontSize: 24, fontWeight: 700, color: 'var(--ink)',
      cursor: 'pointer', fontFamily: 'inherit',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      ...style,
    }}>{children}</button>
  );
}

export function AddExpenseModal({ ctx, params }) {
  const { fechar, salvarTx, mes } = ctx;
  const editar = params && params.editar;
  const [valor, setValor] = React.useState(editar ? String((editar.parcelas ? editar.parcelas.valorTotal : editar.valor).toFixed(2)).replace('.', ',') : '0,00');
  const [categoria, setCategoria] = React.useState(editar ? editar.categoria : 'alimentacao');
  const [descricao, setDescricao] = React.useState(editar ? editar.descricao : '');
  const [pagamento, setPagamento] = React.useState(editar ? editar.pagamento : 'Cartão de crédito');
  const [data, setData] = React.useState(editar ? editar.data : hojeISO());
  const [parcelas, setParcelas] = React.useState(editar && editar.parcelas ? editar.parcelas.total : 1);

  const digitar = (d) => {
    let v = valor.replace(',', '').replace(/^0+/, '');
    if (d === 'back') v = v.slice(0, -1);
    else if (d === '.') return;
    else v = v + d;
    if (v.length > 8) return;
    v = v.padStart(3, '0');
    const reais = v.slice(0, -2);
    const cent = v.slice(-2);
    setValor(`${parseInt(reais, 10)},${cent}`);
  };

  const valorNum = parseFloat(valor.replace(',', '.')) || 0;
  const ehCredito = pagamento === 'Cartão de crédito';
  const numParcelas = ehCredito ? parcelas : 1;
  const valorParcela = numParcelas > 0 ? valorNum / numParcelas : valorNum;

  const salvar = () => {
    if (valorNum <= 0) return;
    const tx = {
      id: editar ? editar.id : `tx-${Date.now()}`,
      valor: valorNum,
      categoria,
      descricao: descricao || CATEGORIAS[categoria].nome,
      pagamento,
      data,
      parcelas: numParcelas > 1 ? { total: numParcelas, valorTotal: valorNum } : null,
    };
    salvarTx(tx, !!editar);
    fechar();
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      display: 'flex', flexDirection: 'column',
      background: 'rgba(20, 16, 24, 0.32)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      animation: 'fadeIn .2s ease',
    }}>
      <div onClick={fechar} style={{ flex: 1 }} />
      <div style={{
        background: 'var(--bg)', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: '12px 20px 28px', boxShadow: '0 -10px 30px rgba(0,0,0,0.12)',
        animation: 'slideUp .3s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        <div style={{
          width: 40, height: 4, background: '#D9D2DE', borderRadius: 2,
          margin: '0 auto 12px',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={fechar} style={{
            background: 'transparent', border: 'none', color: 'var(--muted)',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>Cancelar</button>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            {editar ? 'Editar gasto' : 'Novo gasto'}
          </div>
          <button onClick={salvar} disabled={valorNum <= 0} style={{
            background: valorNum > 0 ? 'var(--primary)' : '#E5DFE6',
            color: valorNum > 0 ? '#fff' : 'var(--muted)',
            border: 'none', padding: '6px 14px', borderRadius: 999,
            fontWeight: 800, fontSize: 13, cursor: valorNum > 0 ? 'pointer' : 'default',
            fontFamily: 'inherit',
          }}>Salvar</button>
        </div>

        {/* Valor grande */}
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Valor
          </div>
          <div style={{
            fontSize: 48, fontWeight: 800, color: 'var(--ink)',
            letterSpacing: '-0.04em', marginTop: 4, fontVariantNumeric: 'tabular-nums',
          }}>
            <span style={{ fontSize: 24, color: 'var(--muted)', marginRight: 6, verticalAlign: 'top' }}>R$</span>
            {valor}
          </div>
          {numParcelas > 1 && valorNum > 0 && (
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginTop: 2 }}>
              {numParcelas}× de {fmtBRL(valorParcela)}
            </div>
          )}
        </div>

        {/* Categoria */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, padding: '0 4px 8px' }}>
            Categoria
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 0 4px', scrollbarWidth: 'none' }}>
            {ORDEM_CATS.map(c => {
              const cat = CATEGORIAS[c];
              const sel = categoria === c;
              return (
                <button key={c} onClick={() => setCategoria(c)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '8px 10px 6px', borderRadius: 14, border: 'none',
                  background: sel ? '#fff' : 'transparent',
                  boxShadow: sel ? '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1.5px ' + cat.cor : 'none',
                  cursor: 'pointer', minWidth: 72, flexShrink: 0,
                }}>
                  <CatChip catId={c} size={32} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink)' }}>{cat.nome}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Descrição */}
        <div style={{ marginTop: 12 }}>
          <input
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Descrição (ex: Mercado, Uber...)"
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 14,
              border: 'none', background: '#fff', outline: 'none',
              fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontFamily: 'inherit',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Data */}
        <div style={{ marginTop: 10 }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
            borderRadius: 14, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}>
            <Icon name="calendar" size={18} color="var(--muted)" strokeWidth={2} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>Data</span>
            <input
              type="date"
              value={data}
              max={hojeISO()}
              onChange={e => setData(e.target.value)}
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                fontSize: 14, fontWeight: 700, color: 'var(--ink)', fontFamily: 'inherit',
              }}
            />
          </label>
        </div>

        {/* Pagamento */}
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          {PAGAMENTOS.map(p => {
            const sel = pagamento === p;
            return (
              <button key={p} onClick={() => setPagamento(p)} style={{
                flex: 1, padding: '10px 4px', borderRadius: 12, border: 'none',
                background: sel ? 'var(--ink)' : '#fff',
                color: sel ? '#fff' : 'var(--ink)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                boxShadow: sel ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
              }}>
                <Icon name={iconePagamento(p)} size={18} color={sel ? '#fff' : 'var(--ink)'} strokeWidth={2} />
                {p.replace('Cartão de ', '')}
              </button>
            );
          })}
        </div>

        {/* Parcelas (só crédito) */}
        {ehCredito && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 6px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                Parcelar em
              </div>
              {parcelas > 1 && (
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>
                  Total: {fmtBRL(valorNum)}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
              {[1, 2, 3, 4, 6, 10, 12].map(n => {
                const sel = parcelas === n;
                return (
                  <button key={n} onClick={() => setParcelas(n)} style={{
                    flex: '1 0 auto', minWidth: 56, padding: '10px 6px', borderRadius: 12,
                    border: 'none',
                    background: sel ? 'var(--primary)' : '#fff',
                    color: sel ? '#fff' : 'var(--ink)',
                    fontSize: 13, fontWeight: 800, cursor: 'pointer',
                    fontFamily: 'inherit', letterSpacing: '-0.02em',
                    boxShadow: sel ? '0 2px 8px rgba(110,79,246,0.25)' : '0 1px 2px rgba(0,0,0,0.04)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, lineHeight: 1.15,
                  }}>
                    <span>{n}×</span>
                    {n > 1 && valorNum > 0 && (
                      <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.75, marginTop: 1 }}>
                        {fmtBRLCompacto(valorNum / n)}
                      </span>
                    )}
                    {n === 1 && (
                      <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.65, marginTop: 1 }}>à vista</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Teclado numérico */}
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[['1','2','3'], ['4','5','6'], ['7','8','9'], ['.','0','back']].map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 8 }}>
              {row.map(d => (
                <NumPadButton key={d} onClick={() => digitar(d)}>
                  {d === 'back'
                    ? <svg width="22" height="16" viewBox="0 0 22 16" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 1l-6 7 6 7h13a1.5 1.5 0 001.5-1.5v-11A1.5 1.5 0 0020 1H7z"/><path d="M10 5l6 6M16 5l-6 6"/></svg>
                    : d === '.' ? <span style={{ opacity: 0.3 }}>·</span> : d}
                </NumPadButton>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
