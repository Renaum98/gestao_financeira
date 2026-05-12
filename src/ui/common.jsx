// common.jsx — componentes visuais compartilhados (TopBar, SeletorMes, Card, ItemTransacao)

import { CATEGORIAS, MESES_CURTO, fmtBRL, fmtBRLCompacto, rotuloMes } from '../data.js';
import { Icon, CatChip, iconePagamento } from './icons.jsx';

export function TopBar({ titulo, voltar, acao, subtitulo }) {
  return (
    <div style={{
      paddingTop: 60, padding: '60px 20px 12px', display: 'flex',
      flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 }}>
        {voltar ? (
          <button onClick={voltar} style={{
            width: 36, height: 36, borderRadius: 18,
            background: 'var(--card)', border: 'none', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}>
            <Icon name="arrow-left" size={18} color="var(--ink)" strokeWidth={2.2} />
          </button>
        ) : <div style={{ width: 36 }} />}
        {subtitulo && <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)' }}>{subtitulo}</div>}
        {acao || <div style={{ width: 36 }} />}
      </div>
      {titulo && (
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', marginTop: 6 }}>
          {titulo}
        </div>
      )}
    </div>
  );
}

export function SeletorMes({ mes, setMes, todosMeses }) {
  const idx = todosMeses.indexOf(mes);
  const podeProx = idx > 0;
  const podeAnt = idx < todosMeses.length - 1;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: 'var(--card)', borderRadius: 999, padding: 4,
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    }}>
      <button onClick={() => podeAnt && setMes(todosMeses[idx + 1])} disabled={!podeAnt} style={{
        width: 30, height: 30, borderRadius: 999, border: 'none',
        background: 'transparent', cursor: podeAnt ? 'pointer' : 'default',
        opacity: podeAnt ? 1 : 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="arrow-left" size={14} color="var(--ink)" strokeWidth={2.4} />
      </button>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', minWidth: 110, textAlign: 'center', letterSpacing: '-0.01em' }}>
        {rotuloMes(mes)}
      </div>
      <button onClick={() => podeProx && setMes(todosMeses[idx - 1])} disabled={!podeProx} style={{
        width: 30, height: 30, borderRadius: 999, border: 'none',
        background: 'transparent', cursor: podeProx ? 'pointer' : 'default',
        opacity: podeProx ? 1 : 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="arrow-right" size={14} color="var(--ink)" strokeWidth={2.4} />
      </button>
    </div>
  );
}

export function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--card)', borderRadius: 22, padding: 18,
      boxShadow: '0 1px 2px rgba(20,16,24,0.04), 0 4px 12px rgba(20,16,24,0.03)',
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>
      {children}
    </div>
  );
}

export function ItemTransacao({ tx, ocultar, onClick }) {
  const cat = CATEGORIAS[tx.categoria];
  const d = new Date(tx.data + 'T12:00:00');
  const dia = d.getDate(), mesC = MESES_CURTO[d.getMonth()];
  const parc = tx.parcelas;
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px',
      cursor: onClick ? 'pointer' : 'default',
    }}>
      <CatChip catId={tx.categoria} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
            {tx.descricao}
          </div>
          {parc && (
            <div style={{
              fontSize: 10, fontWeight: 800, color: 'var(--primary)',
              background: 'color-mix(in oklab, var(--primary) 12%, transparent)',
              padding: '2px 6px', borderRadius: 6, letterSpacing: '-0.01em',
              flexShrink: 0,
            }}>
              {parc.atual}/{parc.total}
            </div>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{cat.nome}</span>
          <span style={{ width: 3, height: 3, borderRadius: 3, background: 'var(--muted)', opacity: 0.5 }} />
          <Icon name={iconePagamento(tx.pagamento)} size={12} color="var(--muted)" strokeWidth={2} />
          {parc && <span style={{ fontWeight: 600 }}>· {parc.total}× {fmtBRLCompacto(parc.valorTotal, ocultar)}</span>}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
          {fmtBRL(tx.valor, ocultar)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
          {dia} {mesC}
        </div>
      </div>
    </div>
  );
}
