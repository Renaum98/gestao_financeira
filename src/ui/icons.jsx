// icons.jsx — ícones e chips de categoria

import { CATEGORIAS } from '../data.js';

export function CatChip({ catId, size = 40, style = {}, raised = false }) {
  const cat = CATEGORIAS[catId];
  if (!cat) return null;
  const fz = Math.round(size * 0.42);
  // Sombras do "logo" 3D — combinam highlight no topo (luz) com sombra
  // interna no fundo + drop-shadow externa pra parecer extrudado da plaquinha.
  const sombraLogo = raised
    ? [
        // Drop-shadow colorida (a própria cor da categoria, escura) → "ancora" no fundo
        `0 ${Math.max(2, size * 0.06)}px ${Math.max(4, size * 0.12)}px rgba(20,16,24,0.22)`,
        // Brilho no topo (luz cenital)
        `inset 0 ${Math.max(1, size * 0.04)}px 0 rgba(255,255,255,0.55)`,
        // Sombra interna no fundo (volume)
        `inset 0 -${Math.max(1, size * 0.06)}px ${Math.max(2, size * 0.10)}px rgba(0,0,0,0.30)`,
      ].join(', ')
    : undefined;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.32,
      background: cat.corFundo,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      ...style,
    }}>
      <div style={{
        width: size * 0.5, height: size * 0.5, borderRadius: '50%',
        background: raised
          ? `radial-gradient(circle at 35% 28%, color-mix(in oklab, ${cat.cor} 60%, white) 0%, ${cat.cor} 55%, color-mix(in oklab, ${cat.cor} 75%, black) 100%)`
          : cat.cor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 800, fontSize: fz, lineHeight: 1,
        letterSpacing: '-0.02em',
        boxShadow: sombraLogo,
        textShadow: raised ? '0 1px 1px rgba(0,0,0,0.25)' : undefined,
      }}>{(cat.nome[0] || '?').toUpperCase()}</div>
    </div>
  );
}

// Ícones lineares simples (geométricos)
export function Icon({ name, size = 22, color = 'currentColor', strokeWidth = 2 }) {
  const s = { width: size, height: size, display: 'block' };
  const props = { fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><path d="M3 11l9-8 9 8"/><path d="M5 9.5V21h14V9.5"/></svg>);
    case 'list':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><path d="M4 6h16M4 12h16M4 18h16"/></svg>);
    case 'file-text':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></svg>);
    case 'chart':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>);
    case 'user':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>);
    case 'plus':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><path d="M12 5v14M5 12h14"/></svg>);
    case 'minus':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><path d="M5 12h14"/></svg>);
    case 'arrow-left':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><path d="M15 5l-7 7 7 7"/></svg>);
    case 'arrow-right':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><path d="M9 5l7 7-7 7"/></svg>);
    case 'chevron-down':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><path d="M6 9l6 6 6-6"/></svg>);
    case 'chevron-right':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><path d="M9 6l6 6-6 6"/></svg>);
    case 'check':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><path d="M5 12l5 5 9-11"/></svg>);
    case 'close':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><path d="M6 6l12 12M18 6L6 18"/></svg>);
    case 'eye':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>);
    case 'eye-off':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><path d="M3 3l18 18"/><path d="M10.5 6.2A10.3 10.3 0 0112 6c7 0 10 6 10 6a16 16 0 01-3.4 4"/><path d="M6.6 6.6C3.6 8.4 2 12 2 12s3 6 10 6c1.6 0 3-.3 4.2-.7"/></svg>);
    case 'trash':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>);
    case 'edit':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>);
    case 'bell':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><path d="M6 9a6 6 0 0112 0v5l2 3H4l2-3V9z"/><path d="M10 20a2 2 0 004 0"/></svg>);
    case 'target':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill={color}/></svg>);
    case 'history':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><path d="M3 12a9 9 0 109-9 9 9 0 00-7 3"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>);
    case 'card':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><rect x="2.5" y="6" width="19" height="13" rx="2.5"/><path d="M2.5 10.5h19"/></svg>);
    case 'wallet':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><path d="M3 7a2 2 0 012-2h14v14a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/><path d="M3 7l16-2v2"/><circle cx="17" cy="13" r="1.2" fill={color}/></svg>);
    case 'pix':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><path d="M12 3l4 4-4 4-4-4 4-4z"/><path d="M12 21l-4-4 4-4 4 4-4 4z"/><path d="M3 12l4-4 4 4-4 4-4-4z"/><path d="M21 12l-4-4-4 4 4 4 4-4z"/></svg>);
    case 'cash':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><rect x="2.5" y="6" width="19" height="13" rx="2"/><circle cx="12" cy="12.5" r="2.5"/></svg>);
    case 'calendar':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>);
    case 'sparkle':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z"/></svg>);
    case 'mail':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 7l9 7 9-7"/></svg>);
    case 'lock':
      return (<svg style={s} viewBox="0 0 24 24" {...props}><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>);
    case 'piggy':
      // Cofrinho — caixa com fenda para moeda
      return (<svg style={s} viewBox="0 0 24 24" {...props}><rect x="3" y="8" width="18" height="12" rx="3"/><path d="M9 8V6a3 3 0 016 0v2"/><path d="M10 13h4"/></svg>);
    default:
      return null;
  }
}

export function iconePagamento(pag) {
  if (!pag) return 'cash';
  if (pag.startsWith('Cartão de cr')) return 'card';
  if (pag.startsWith('Cartão de d')) return 'wallet';
  if (pag === 'Pix') return 'pix';
  return 'cash';
}
