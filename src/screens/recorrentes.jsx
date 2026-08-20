// recorrentes.jsx — Tela para visualizar, editar e cancelar gastos recorrentes.

import React from 'react';
import { CATEGORIAS, catsMinhas, PAGAMENTOS, fmtBRL, rotuloMesCurtoT } from '../data.js';
import { CatChip, Icon, iconePagamento } from '../ui/icons.jsx';
import { Card, TopBar } from '../ui/common.jsx';
import { ConfirmModal } from '../ui/confirm-modal.jsx';
import { ModalOverlay } from '../ui/modal-base.jsx';
import { COR_NEG } from '../lib/colors.js';
import { vibrar } from '../lib/haptics.js';
import { formatarValorDigitado, formatarValorInicial, parseValorBR } from '../lib/money-input.js';
import { simboloMoeda } from '../lib/moeda.js';
import { PAG_CARTAO } from '../lib/fatura.js';
import { corDoCartao, corTextoSobre } from '../lib/cartoes.js';
import { useT } from '../lib/i18n.jsx';

export function RecorrentesScreen({ ctx }) {
  const { recorrentes, cancelarRecorrente, editarRecorrente, voltar, ehDesktop, cartoes = [] } = ctx;
  const t = useT();
  const [confirmar, setConfirmar] = React.useState(null);
  const [editando, setEditando] = React.useState(null);

  // A explicação e a lista são as duas únicas peças da tela. No mobile elas se
  // sucedem — o texto no caminho da leitura, logo abaixo do título. No desktop
  // o texto vira a coluna estreita da esquerda e a lista fica com o resto.
  const explicacao = t("Esses gastos são adicionados automaticamente todo mês. Edite para atualizar do mês atual em diante ou cancele se a cobrança parar.");

  const conteudo = recorrentes.length === 0 ? (
    <Card style={{ padding: 28, textAlign: 'center' }}>
      <div style={{
        width: 56, height: 56, borderRadius: 28,
        background: 'color-mix(in oklab, var(--primary) 14%, transparent)',
        margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="history" size={26} color="var(--primary)" strokeWidth={2.2} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>
        {t("Nenhum gasto recorrente")}
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, marginTop: 6, lineHeight: 1.4 }}>
        {t("Ao adicionar um gasto, marque \"Repetir todo mês\" para ele aparecer aqui e ser lançado automaticamente nos próximos meses.")}
      </div>
    </Card>
  ) : (
    <Card style={{ padding: '4px 16px' }}>
      {recorrentes.map((r, i) => {
        const cat = CATEGORIAS[r.categoria] || CATEGORIAS.outros;
        return (
          <div key={r.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0',
            borderTop: i === 0 ? 'none' : '1px solid var(--linha)',
          }}>
            <CatChip catId={r.categoria} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.descricao}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginTop: 2 }}>
                {t("{cat} · todo dia {dia} · desde {inicio}", { cat: t(cat.nome), dia: r.dia, inicio: rotuloMesCurtoT(t, r.inicio) })}
                {r.fim ? t(" · até {fim}", { fim: rotuloMesCurtoT(t, r.fim) }) : ''}
                {r.crescimento ? t(" · reajuste {pct}% por parcela", { pct: (r.crescimento * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) }) : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>
                {fmtBRL(r.valor)}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={() => { vibrar(); setEditando(r); }} style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: 0, color: 'var(--primary)', fontSize: 11, fontWeight: 700,
                  fontFamily: 'inherit',
                }}>{t("Editar")}</button>
                <button onClick={() => setConfirmar(r)} style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: 0, color: COR_NEG, fontSize: 11, fontWeight: 700,
                  fontFamily: 'inherit',
                }}>{t("Cancelar")}</button>
              </div>
            </div>
          </div>
        );
      })}
    </Card>
  );

  return (
    <div style={{ paddingBottom: "var(--pad-bottom)" }}>
      <TopBar voltar={ehDesktop ? undefined : voltar} titulo={t("Recorrentes")} />

      {ehDesktop ? (
        <div style={{ padding: '4px var(--pad-x) 0' }}>
          <div className="painel-lateral">
            <Card style={{ padding: 16, fontSize: 13, color: 'var(--muted)', fontWeight: 500, lineHeight: 1.45 }}>
              {explicacao}
            </Card>
            {conteudo}
          </div>
        </div>
      ) : (
        <>
          <div style={{ padding: '0 var(--pad-x) 12px', fontSize: 13, color: 'var(--muted)', fontWeight: 500, lineHeight: 1.45 }}>
            {explicacao}
          </div>

          <div style={{ padding: '4px var(--pad-x) 0' }}>
            {conteudo}
          </div>
        </>
      )}

      {confirmar && (
        <ConfirmModal
          titulo={t("Cancelar \"{desc}\"?", { desc: confirmar.descricao })}
          mensagem={t("Os lançamentos de meses passados continuam no histórico. Os do mês atual em diante serão removidos.")}
          textoConfirmar={t("Cancelar recorrência")}
          icone="close"
          onCancelar={() => setConfirmar(null)}
          onConfirmar={() => { cancelarRecorrente(confirmar.id); setConfirmar(null); }}
        />
      )}

      {editando && (
        <EditarRecorrenteModal
          rec={editando}
          cartoes={cartoes}
          onFechar={() => setEditando(null)}
          onSalvar={(dados) => {
            editarRecorrente(editando.id, dados);
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}

function EditarRecorrenteModal({ rec, cartoes = [], onFechar, onSalvar }) {
  const t = useT();
  const ehEntrada = rec.tipo === 'entrada';
  const [descricao, setDescricao] = React.useState(rec.descricao || '');
  const [valor, setValor] = React.useState(formatarValorInicial(rec.valor));
  const [categoria, setCategoria] = React.useState(rec.categoria || 'outros');
  const [pagamento, setPagamento] = React.useState(rec.pagamento || 'Pix');
  const [cartaoId, setCartaoId] = React.useState(rec.cartaoId || null);
  const [dia, setDia] = React.useState(rec.dia || 1);

  // Virou crédito agora? Cai no primeiro cartão. Uma recorrência que já era do
  // crédito sem cartão é órfã de verdade (sobra de cartão apagado) e fica como
  // está até o usuário escolher.
  React.useEffect(() => {
    if (ehEntrada || pagamento !== PAG_CARTAO || cartaoId) return;
    if (rec.pagamento === PAG_CARTAO) return;
    setCartaoId(cartoes[0]?.id || null);
  }, [pagamento]); // eslint-disable-line react-hooks/exhaustive-deps

  const valorNum = parseValorBR(valor);
  const aoDigitar = (texto) => setValor(formatarValorDigitado(texto));

  const podeSalvar = valorNum > 0 && descricao.trim().length > 0;

  const salvar = () => {
    if (!podeSalvar) return;
    const dados = {
      descricao: descricao.trim(),
      valor: valorNum,
      dia: Number(dia),
    };
    if (!ehEntrada) {
      dados.categoria = categoria;
      dados.pagamento = pagamento;
      // `null` limpa o cartão nas txs futuras — é o que precisa acontecer
      // quando a conta deixa de ser no crédito.
      dados.cartaoId = pagamento === PAG_CARTAO ? cartaoId : null;
    }
    onSalvar(dados);
  };

  return (
    <ModalOverlay onClose={onFechar} maxWidth={440} padding="16px 20px 24px">
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <button onClick={onFechar} style={{
          background: 'transparent', border: 'none', color: 'var(--muted)',
          fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>{t("Cancelar")}</button>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
          {t("Editar recorrente")}
        </div>
        <button onClick={salvar} disabled={!podeSalvar} style={{
          background: podeSalvar ? 'var(--primary-fundo)' : 'var(--linha)',
          color: podeSalvar ? '#fff' : 'var(--muted)',
          border: 'none', padding: '6px 14px', borderRadius: 999,
          fontWeight: 800, fontSize: 13, cursor: podeSalvar ? 'pointer' : 'default',
          fontFamily: 'inherit',
        }}>{t("Salvar")}</button>
      </div>

      <div style={{
        fontSize: 11, color: 'var(--muted)', fontWeight: 600, lineHeight: 1.45,
        background: 'var(--card-2)', padding: '10px 12px', borderRadius: 10,
        marginBottom: 14,
      }}>
        {t("As mudanças valem do mês atual em diante.")}
      </div>

      {/* Valor */}
      <label style={{
        display: 'block', textAlign: 'center', padding: '8px 0 4px',
        cursor: 'text', position: 'relative',
      }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: 'var(--muted)',
          textTransform: 'uppercase', letterSpacing: 0.6,
        }}>
          {t("Valor")}
        </div>
        <div style={{
          fontSize: 44, fontWeight: 800, color: 'var(--ink)',
          letterSpacing: '-0.04em', marginTop: 4, fontVariantNumeric: 'tabular-nums',
        }}>
          <span style={{
            fontSize: 22, color: 'var(--muted)', marginRight: 6, verticalAlign: 'top',
          }}>{simboloMoeda()}</span>
          {valor}
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={valor.replace(',', '')}
          onChange={(e) => aoDigitar(e.target.value)}
          aria-label={t("Valor")}
          style={{
            position: 'absolute', inset: 0, opacity: 0, border: 'none',
            background: 'transparent', outline: 'none', fontSize: 16, cursor: 'text',
          }}
        />
      </label>

      {/* Descrição */}
      <div style={{ marginTop: 12 }}>
        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder={t("Descrição")}
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 14, border: 'none',
            background: 'var(--card-2)', outline: 'none', fontSize: 14, fontWeight: 600,
            color: 'var(--ink)', fontFamily: 'inherit',
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Categoria */}
      {!ehEntrada && (
        <div style={{ marginTop: 14 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'var(--muted)',
            textTransform: 'uppercase', letterSpacing: 0.4, padding: '0 4px 8px',
          }}>
            {t("Categoria")}
          </div>
          <div
            className="carrossel"
            style={{
              display: 'flex', gap: 8, overflowX: 'auto',
              padding: '6px 4px 10px', scrollbarWidth: 'none',
            }}
          >
            {catsMinhas().map((c) => {
              const cat = CATEGORIAS[c];
              const sel = categoria === c;
              return (
                <button
                  key={c}
                  onClick={() => { vibrar(); setCategoria(c); }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 6, padding: '8px 10px 6px', borderRadius: 14, border: 'none',
                    background: sel ? 'var(--card-2)' : 'transparent',
                    boxShadow: sel ? '0 2px 8px rgba(0,0,0,0.18), 0 0 0 1.5px ' + cat.cor : 'none',
                    cursor: 'pointer', minWidth: 72, flexShrink: 0,
                    WebkitUserSelect: 'none', userSelect: 'none',
                  }}
                >
                  <CatChip catId={c} size={32} raised />
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink)' }}>
                    {t(cat.nome)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagamento */}
      {!ehEntrada && (
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          {PAGAMENTOS.map((p) => {
            const sel = pagamento === p;
            return (
              <button
                key={p}
                onClick={() => { vibrar(); setPagamento(p); }}
                style={{
                  flex: 1, padding: '10px 4px', borderRadius: 12, border: 'none',
                  background: sel ? 'var(--ink)' : 'var(--card-2)',
                  color: sel ? 'var(--bg)' : 'var(--ink)',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  boxShadow: sel ? 'none' : '0 1px 2px rgba(0,0,0,0.06)',
                }}
              >
                <Icon
                  name={iconePagamento(p)}
                  size={18}
                  color={sel ? 'var(--bg)' : 'var(--ink)'}
                  strokeWidth={2}
                />
                {t(p.replace('Cartão de ', ''))}
              </button>
            );
          })}
        </div>
      )}

      {/* Em qual cartão. Só com cartão cadastrado (ver lib/cartoes.js). */}
      {!ehEntrada && pagamento === PAG_CARTAO && cartoes.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {cartoes.map((c) => {
            const sel = cartaoId === c.id;
            const cor = corDoCartao(c);
            const tinta = sel ? corTextoSobre(cor) : 'var(--ink)';
            return (
              <button
                key={c.id}
                onClick={() => { vibrar(); setCartaoId(c.id); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 12px', borderRadius: 999, border: 'none',
                  background: sel ? cor : 'var(--card-2)',
                  color: tinta,
                  fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: sel ? 'none' : '0 1px 2px rgba(0,0,0,0.06)',
                }}
              >
                <Icon name="card" size={14} color={tinta} strokeWidth={2.2} />
                {c.nome}
              </button>
            );
          })}
        </div>
      )}

      {/* Dia de vencimento */}
      <label style={{
        marginTop: 10, display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', borderRadius: 14, background: 'var(--card-2)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
      }}>
        <Icon name="calendar" size={18} color="var(--muted)" strokeWidth={2} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>
          {t("Vence todo dia")}
        </span>
        <select
          value={dia}
          onChange={(e) => setDia(parseInt(e.target.value, 10))}
          style={{
            border: 'none', background: 'transparent', outline: 'none',
            fontSize: 14, fontWeight: 700, color: 'var(--ink)', fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </label>
    </ModalOverlay>
  );
}
