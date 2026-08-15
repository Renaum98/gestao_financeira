// common.jsx — componentes visuais compartilhados (TopBar, SeletorMes, Card, ItemTransacao)

import React from 'react';
import { createPortal } from 'react-dom';
import { CATEGORIAS, MESES_CURTO, fmtBRL, fmtBRLCompacto, rotuloMesT } from '../data.js';
import { Icon, CatChip, iconePagamento } from './icons.jsx';
import { COR_POS, COR_POS_FUNDO } from '../lib/colors.js';
import { useT } from '../lib/i18n.jsx';

// Quanto a página precisa descer pra o botão de voltar encolher. Baixo de
// propósito: o gesto de descer já começou, o botão sai da frente junto.
const LIMIAR_SCROLL = 24;

// `true` depois que a página desceu do limiar. O estado só troca ao CRUZAR o
// limiar, não a cada pixel — quem redesenha por scroll aqui é o CSS, via
// transform, e não o React.
function useRolou(ativo) {
  const [rolou, setRolou] = React.useState(false);
  React.useEffect(() => {
    if (!ativo) return;
    let agendado = false;
    const aoRolar = () => {
      if (agendado) return;
      agendado = true;
      requestAnimationFrame(() => {
        agendado = false;
        setRolou(window.scrollY > LIMIAR_SCROLL);
      });
    };
    aoRolar(); // a tela pode abrir já rolada (voltar pra uma lista longa)
    window.addEventListener('scroll', aoRolar, { passive: true });
    return () => window.removeEventListener('scroll', aoRolar);
  }, [ativo]);
  // Sem botão não há o que encolher — e o listener nem chega a existir.
  return ativo && rolou;
}

export function TopBar({ titulo, voltar, acao, subtitulo }) {
  const t = useT();
  const rolou = useRolou(!!voltar);
  return (
    <div style={{
      padding: 'var(--pad-top) 20px 12px', display: 'flex',
      flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 }}>
        {/* O botão sai do fluxo (é fixo na viewport); este vão guarda o lugar
            dele pra o título e a ação não escorregarem pra esquerda. */}
        <div style={{ width: 36 }} />
        {subtitulo && <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)' }}>{subtitulo}</div>}
        {acao || <div style={{ width: 36 }} />}
      </div>
      {titulo && (
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', marginTop: 6 }}>
          {titulo}
        </div>
      )}

      {voltar && <BotaoVoltarFixo voltar={voltar} rolou={rolou} t={t} />}
    </div>
  );
}

// Botão de voltar que flutua sobre a tela. Encolhe ao rolar pra ocupar menos
// espaço enquanto paira sobre o conteúdo.
//
// PORTALIZADO em document.body, e não é detalhe: `position: fixed` só é
// relativo à viewport se NENHUM ancestral tiver transform/filter/will-change de
// transform — qualquer um deles vira o bloco de contenção do elemento fixo. O
// wrapper `.page-transition` (app.jsx) tem os dois, então, no lugar onde o
// botão nasce, "fixo" virava "absoluto dentro da página inteira": ele subia
// junto com o conteúdo e sumia ao descer a tela. É o mesmo motivo que
// portaliza o ModalOverlay (ver ui/modal-base.jsx).
function BotaoVoltarFixo({ voltar, rolou, t }) {
  const botao = (
    <div className="voltar-fixo">
      <div className="voltar-fixo-coluna">
        <button
          onClick={voltar}
          aria-label={t("Voltar")}
          style={{
            width: 36, height: 36, borderRadius: 18,
            background: 'var(--card)', border: 'none', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            // Só transform e box-shadow animam: nenhum dos dois faz layout,
            // então rolar não custa reflow.
            transform: rolou ? 'scale(0.8)' : 'none',
            // Rolando, o botão para de ter o fundo da tela atrás e passa a
            // pairar sobre o conteúdo — daí o anel, que recorta a borda dele do
            // que estiver embaixo. É box-shadow e não `border`: borda mudaria o
            // tamanho da caixa (reflow a cada troca) e apertaria o ícone.
            //
            // A cor sai do --ink, então o anel é escuro no tema claro e claro
            // no escuro sem precisar de duas regras. O --linha do app é fraco
            // demais (6-8% de alfa) pra separar de um conteúdo qualquer.
            //
            // Os dois estados têm DUAS sombras, o anel apenas nasce sem raio e
            // transparente: listas do mesmo tamanho interpolam sem salto.
            boxShadow: rolou
              ? '0 0 0 1.5px color-mix(in oklab, var(--ink) 18%, transparent), 0 4px 14px rgba(20,16,24,0.16)'
              : '0 0 0 0 transparent, 0 1px 2px rgba(0,0,0,0.04)',
            transition: 'transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s ease',
          }}
        >
          <Icon name="arrow-left" size={18} color="var(--ink)" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return botao;
  return createPortal(botao, document.body);
}

export function SeletorMes({ mes, setMes, todosMeses }) {
  const t = useT();
  const idx = todosMeses.indexOf(mes);
  const podeProx = idx > 0;
  const podeAnt = idx < todosMeses.length - 1;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: 'var(--card)', borderRadius: 999, padding: 4,
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    }}>
      <button onClick={() => podeAnt && setMes(todosMeses[idx + 1])} disabled={!podeAnt} aria-label={t("Mês anterior")} style={{
        width: 30, height: 30, borderRadius: 999, border: 'none',
        background: 'transparent', cursor: podeAnt ? 'pointer' : 'default',
        opacity: podeAnt ? 1 : 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="arrow-left" size={14} color="var(--ink)" strokeWidth={2.4} />
      </button>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', minWidth: 110, textAlign: 'center', letterSpacing: '-0.01em' }}>
        {rotuloMesT(t, mes)}
      </div>
      <button onClick={() => podeProx && setMes(todosMeses[idx - 1])} disabled={!podeProx} aria-label={t("Próximo mês")} style={{
        width: 30, height: 30, borderRadius: 999, border: 'none',
        background: 'transparent', cursor: podeProx ? 'pointer' : 'default',
        opacity: podeProx ? 1 : 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="arrow-right" size={14} color="var(--ink)" strokeWidth={2.4} />
      </button>
    </div>
  );
}

export function Card({ children, style = {}, onClick, ...rest }) {
  return (
    <div onClick={onClick} {...rest} style={{
      background: 'var(--card)', borderRadius: 22, padding: 18,
      boxShadow: '0 1px 2px rgba(20,16,24,0.04), 0 4px 12px rgba(20,16,24,0.03)',
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>
      {children}
    </div>
  );
}

export function ItemTransacao({ tx, onClick, doParceiro = false, nomeParceiro = '', guardado = 0 }) {
  const t = useT();
  const ehEntrada = tx.tipo === 'entrada';
  // Parte desta entrada que já foi pra uma caixinha (ver lib/guardado-entradas).
  // Esse dinheiro entrou mas não está mais disponível pra gastar — marcamos a
  // transação pra não parecer saldo livre.
  const guardadoNum = ehEntrada ? Number(guardado) || 0 : 0;
  const guardadoTudo = guardadoNum >= tx.valor - 0.005;
  const temGuardado = guardadoNum > 0.005;
  // Resgate de caixinha: é uma "entrada" técnica (o dinheiro volta pro mês),
  // mas não é renda nova — rotulamos como "Resgatado" pra não se confundir
  // com um salário/recebimento de verdade. Marcado por `caixinhaId`.
  const ehResgate = ehEntrada && !!tx.caixinhaId;
  const cat = ehEntrada ? null : CATEGORIAS[tx.categoria];
  const d = new Date(tx.data + 'T12:00:00');
  const dia = d.getDate(), mesC = t(MESES_CURTO[d.getMonth()]);
  const parc = tx.parcelas;
  const valorFmt = fmtBRL(tx.valor);
  const inicialParceiro = (nomeParceiro?.trim()[0] || '?').toUpperCase();
  // No modo "parceiro" deixamos tudo bem mais discreto: cores muted, sem hover.
  const corTitulo = doParceiro ? 'var(--muted)' : 'var(--ink)';
  const corValor = doParceiro || (temGuardado && guardadoTudo)
    ? 'var(--muted)'
    : (ehEntrada ? COR_POS : 'var(--ink)');
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px',
      cursor: onClick ? 'pointer' : 'default',
      opacity: doParceiro ? 0.78 : 1,
    }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {ehEntrada ? (
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: doParceiro ? 'var(--surface-sunken)' : COR_POS_FUNDO,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="plus" size={22} color={doParceiro ? 'var(--muted)' : COR_POS} strokeWidth={2.6} />
          </div>
        ) : (
          <CatChip catId={tx.categoria} size={42} />
        )}
        {doParceiro && (
          <div
            title={nomeParceiro ? t('Do(a) {nome}', { nome: nomeParceiro }) : t('Do parceiro')}
            style={{
              position: 'absolute', right: -3, bottom: -3,
              width: 18, height: 18, borderRadius: 9,
              background: 'var(--card)',
              border: '2px solid var(--bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 800, color: 'var(--primary)',
              letterSpacing: '-0.02em',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            }}
          >{inicialParceiro}</div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: corTitulo, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
            {tx.descricao}
          </div>
          {parc && (
            <div style={{
              fontSize: 10, fontWeight: 800,
              color: doParceiro ? 'var(--muted)' : 'var(--primary)',
              background: doParceiro
                ? 'var(--surface-sunken)'
                : 'color-mix(in oklab, var(--primary) 12%, transparent)',
              padding: '2px 6px', borderRadius: 6, letterSpacing: '-0.01em',
              flexShrink: 0,
            }}>
              {parc.atual}/{parc.total}
            </div>
          )}
          {tx.recorrenteId && !parc && (
            <div title={t("Cobrança recorrente todo mês")} style={{
              fontSize: 10, fontWeight: 800,
              color: doParceiro ? 'var(--muted)' : 'var(--primary)',
              background: doParceiro
                ? 'var(--surface-sunken)'
                : 'color-mix(in oklab, var(--primary) 12%, transparent)',
              padding: '2px 6px', borderRadius: 6, letterSpacing: '-0.01em',
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 3,
            }}>
              <Icon name="history" size={9} color={doParceiro ? 'var(--muted)' : 'var(--primary)'} strokeWidth={2.6} /> {t('Mensal')}
            </div>
          )}
          {temGuardado && (
            <div title={t("Já está numa caixinha — não está disponível pra gastar")} style={{
              fontSize: 10, fontWeight: 800,
              color: 'var(--muted)',
              background: 'var(--surface-sunken)',
              padding: '2px 6px', borderRadius: 6, letterSpacing: '-0.01em',
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 3,
            }}>
              <Icon name="piggy" size={9} color="var(--muted)" strokeWidth={2.6} />
              {guardadoTudo ? t('Guardado') : fmtBRLCompacto(guardadoNum)}
            </div>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
          {ehEntrada ? (
            <span style={{ fontWeight: 700, color: corValor }}>
              {ehResgate ? t('Resgatado') : t('Entrada')}
              {temGuardado && (guardadoTudo ? ` · ${t('na caixinha')}` : ` · ${t('parte na caixinha')}`)}
            </span>
          ) : (
            <>
              <span>{t(cat?.nome || 'Outros')}</span>
              <span style={{ width: 3, height: 3, borderRadius: 3, background: 'var(--muted)', opacity: 0.5 }} />
              <Icon name={iconePagamento(tx.pagamento)} size={12} color="var(--muted)" strokeWidth={2} />
            </>
          )}
          {parc && <span style={{ fontWeight: 600 }}>· {parc.total}× {fmtBRLCompacto(parc.valorTotal)}</span>}
          {doParceiro && nomeParceiro && (
            <>
              <span style={{ width: 3, height: 3, borderRadius: 3, background: 'var(--muted)', opacity: 0.5 }} />
              <span style={{ fontWeight: 700, fontStyle: 'italic' }}>{nomeParceiro}</span>
            </>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontSize: 15, fontWeight: 700,
          color: corValor,
          letterSpacing: '-0.01em',
          // Entrada inteiramente guardada: risca o valor — entrou, mas já saiu.
          textDecoration: guardadoTudo && temGuardado ? 'line-through' : 'none',
        }}>
          {ehEntrada && !doParceiro ? `+${valorFmt}` : valorFmt}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
          {dia} {mesC}
        </div>
      </div>
    </div>
  );
}
