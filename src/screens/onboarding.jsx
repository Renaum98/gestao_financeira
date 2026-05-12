// onboarding.jsx — Tour inicial (3 slides com ilustração)

import React from 'react';
import { Icon } from '../ui/icons.jsx';

export function Onboarding({ onFim }) {
  const [slide, setSlide] = React.useState(0);
  const slides = [
    {
      cor1: '#FFD7B5', cor2: '#FFAD7A',
      titulo: 'Veja para onde\nseu dinheiro vai',
      subtitulo: 'Gráficos simples que mostram quanto você gasta em cada categoria, semana a semana.',
      icone: 'chart',
    },
    {
      cor1: '#D6C5FF', cor2: '#9B7BFF',
      titulo: 'Adicione gastos\nem 5 segundos',
      subtitulo: 'Registre tudo na hora, em qualquer lugar. Sem planilhas, sem complicação.',
      icone: 'plus',
    },
    {
      cor1: '#C8F0DC', cor2: '#3FCB9A',
      titulo: 'Defina metas\nque fazem sentido',
      subtitulo: 'Crie orçamentos por categoria e receba avisos antes de estourar.',
      icone: 'target',
    },
  ];
  const s = slides[slide];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', paddingTop: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 20px' }}>
        <button onClick={onFim} style={{
          background: 'transparent', border: 'none', color: 'var(--muted)',
          fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>Pular</button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 30px', textAlign: 'center' }}>
        <div style={{
          width: 220, height: 220, borderRadius: 60,
          background: `linear-gradient(135deg, ${s.cor1}, ${s.cor2})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
          boxShadow: `0 20px 40px ${s.cor2}44`,
        }}>
          <div style={{ position: 'absolute', top: -30, left: -30, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }} />
          <div style={{ position: 'absolute', bottom: -20, right: -20, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.18)' }} />
          <div style={{
            width: 96, height: 96, borderRadius: 28, background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
          }}>
            <Icon name={s.icone} size={44} color={s.cor2} strokeWidth={2.4} />
          </div>
        </div>

        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.03em', marginTop: 36, whiteSpace: 'pre-line', lineHeight: 1.15 }}>
          {s.titulo}
        </div>
        <div style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 500, marginTop: 12, lineHeight: 1.45, textWrap: 'pretty' }}>
          {s.subtitulo}
        </div>
      </div>

      <div style={{ padding: '0 20px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
          {slides.map((_, i) => (
            <div key={i} style={{
              width: i === slide ? 22 : 6, height: 6, borderRadius: 3,
              background: i === slide ? 'var(--primary)' : '#E5DFE6',
              transition: 'all .2s',
            }} />
          ))}
        </div>
        <button onClick={() => slide < slides.length - 1 ? setSlide(slide + 1) : onFim()} style={{
          width: '100%', padding: '16px', borderRadius: 16,
          background: 'var(--ink)', color: '#fff', border: 'none',
          fontSize: 15, fontWeight: 800, cursor: 'pointer', letterSpacing: '-0.01em',
          fontFamily: 'inherit',
        }}>
          {slide < slides.length - 1 ? 'Continuar' : 'Começar'}
        </button>
      </div>
    </div>
  );
}
