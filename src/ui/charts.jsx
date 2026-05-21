// charts.jsx — gráficos SVG (pizza, linha, barras de progresso)

import { fmtBRL } from '../data.js';

export function PieChart({ dados, total, tamanho = 200, ativo, onHover, ocultar }) {
  // dados: [{ id, valor, cor, nome }]
  const cx = tamanho / 2, cy = tamanho / 2;
  const rOut = tamanho * 0.46;
  const rIn = tamanho * 0.30;
  if (total <= 0 || dados.length === 0) {
    return (
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`}>
        <circle cx={cx} cy={cy} r={(rOut + rIn) / 2} fill="none" style={{ stroke: 'var(--surface-sunken)' }} strokeWidth={rOut - rIn} />
        <text x={cx} y={cy} textAnchor="middle" fontFamily="Plus Jakarta Sans" fontSize="14" style={{ fill: 'var(--muted)' }} dy="5">sem dados</text>
      </svg>
    );
  }
  let acc = 0;
  const gapAng = 0.02; // gap entre slices
  const fatias = dados.filter(d => d.valor > 0).map(d => {
    const a0 = (acc / total) * Math.PI * 2 - Math.PI / 2 + gapAng / 2;
    acc += d.valor;
    const a1 = (acc / total) * Math.PI * 2 - Math.PI / 2 - gapAng / 2;
    return { ...d, a0, a1 };
  });

  const arcPath = (a0, a1, ro, ri) => {
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const x0o = cx + ro * Math.cos(a0), y0o = cy + ro * Math.sin(a0);
    const x1o = cx + ro * Math.cos(a1), y1o = cy + ro * Math.sin(a1);
    const x0i = cx + ri * Math.cos(a1), y0i = cy + ri * Math.sin(a1);
    const x1i = cx + ri * Math.cos(a0), y1i = cy + ri * Math.sin(a0);
    return `M ${x0o} ${y0o} A ${ro} ${ro} 0 ${large} 1 ${x1o} ${y1o} L ${x0i} ${y0i} A ${ri} ${ri} 0 ${large} 0 ${x1i} ${y1i} Z`;
  };

  const ativoData = ativo ? fatias.find(f => f.id === ativo) : null;
  const exibirValor = ativoData ? ativoData.valor : total;
  const exibirRotulo = ativoData ? ativoData.nome : 'Total do mês';

  // Espaço útil dentro do furo da rosca; a fonte do valor encolhe pra nunca encostar nas fatias.
  const larguraInterna = rIn * 2 * 0.94;
  const valorStr = fmtBRL(exibirValor, ocultar);
  const fonteValor = Math.max(11, Math.min(22, Math.floor(larguraInterna / (valorStr.length * 0.62))));

  return (
    <div style={{ position: 'relative', width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`}>
        {fatias.map(f => {
          const isAtivo = ativo === f.id;
          const ro = isAtivo ? rOut + 6 : rOut;
          return (
            <path
              key={f.id}
              d={arcPath(f.a0, f.a1, ro, rIn)}
              fill={f.cor}
              style={{ cursor: 'pointer', transition: 'all .18s ease', opacity: ativo && !isAtivo ? 0.45 : 1 }}
              onMouseEnter={() => onHover && onHover(f.id)}
              onMouseLeave={() => onHover && onHover(null)}
              onClick={() => onHover && onHover(ativo === f.id ? null : f.id)}
            />
          );
        })}
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', textAlign: 'center',
      }}>
        <div style={{
          fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase',
          maxWidth: larguraInterna, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {exibirRotulo}
        </div>
        <div style={{
          fontSize: fonteValor, color: 'var(--ink)', fontWeight: 800, marginTop: 4, letterSpacing: '-0.02em',
          maxWidth: larguraInterna, whiteSpace: 'nowrap',
        }}>
          {valorStr}
        </div>
        {ativoData && (
          <div style={{ fontSize: 12, color: ativoData.cor, fontWeight: 700, marginTop: 2 }}>
            {((ativoData.valor / total) * 100).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}

// Mini gráfico de barras horizontais para "top categorias"
export function BarraProgresso({ valor, max, cor, altura = 8, fundo = 'var(--surface-sunken)' }) {
  const pct = max > 0 ? Math.min(100, (valor / max) * 100) : 0;
  return (
    <div style={{ width: '100%', height: altura, background: fundo, borderRadius: altura, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: cor, borderRadius: altura, transition: 'width .3s ease' }} />
    </div>
  );
}
