// recorrentes.jsx — Tela para visualizar, editar e cancelar gastos recorrentes.

import React from 'react';
import { CATEGORIAS, catsMinhas, fmtBRL, rotuloMesCurtoT } from '../data.js';
import { CatChip, Icon } from '../ui/icons.jsx';
import { Card, TopBar } from '../ui/common.jsx';
import { ConfirmModal } from '../ui/confirm-modal.jsx';
import { ModalOverlay } from '../ui/modal-base.jsx';
import { COR_NEG } from '../lib/colors.js';
import { vibrar } from '../lib/haptics.js';
import { formatarValorInicial, parseValorBR } from '../lib/money-input.js';
import { PAG_CARTAO } from '../lib/fatura.js';
import { useT } from '../lib/i18n.jsx';
import {
  CabecalhoForm,
  FileiraPilulas,
  Linha,
  LinhaPagamento,
  ListaAgrupada,
  NotaLinha,
  PilulaCategoria,
  RodapeLista,
  ValorGrande,
  estiloInputLinha,
  estiloValorLinha,
} from '../ui/form-lista.jsx';

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
        width: 56, height: 56, borderRadius: 'var(--raio-pilula)',
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
                {r.pagamento === PAG_CARTAO
                  ? t("{cat} · na fatura do cartão · desde {inicio}", { cat: t(cat.nome), inicio: rotuloMesCurtoT(t, r.inicio) })
                  : t("{cat} · todo dia {dia} · desde {inicio}", { cat: t(cat.nome), dia: r.dia, inicio: rotuloMesCurtoT(t, r.inicio) })}
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
    <ModalOverlay onClose={onFechar} maxWidth={440} padding="14px 18px 20px" dialogStyle={{ overflowX: 'hidden' }}>
      <CabecalhoForm
        titulo={t("Editar recorrente")}
        onCancelar={onFechar}
        onSalvar={salvar}
        salvarAtivo={podeSalvar}
      />

      <ValorGrande valor={valor} onChange={setValor} />

      {/* Categoria (só saída): as mesmas pílulas do gasto. */}
      {!ehEntrada && (
        <div style={{ marginTop: 12 }}>
          <FileiraPilulas>
            {catsMinhas().map((c) => (
              <PilulaCategoria
                key={c}
                catId={c}
                selecionado={categoria === c}
                onSelecionar={() => { vibrar(); setCategoria(c); }}
              />
            ))}
          </FileiraPilulas>
        </div>
      )}

      <ListaAgrupada>
        <Linha icone="edit" as="label">
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder={t("Descrição")}
            aria-label={t("Descrição")}
            style={estiloInputLinha}
          />
        </Linha>

        {!ehEntrada && (
          <LinhaPagamento
            pagamento={pagamento}
            onPagamento={setPagamento}
            cartoes={cartoes}
            cartaoId={cartaoId}
            onCartao={setCartaoId}
          />
        )}

        {/* Dia de vencimento. No crédito não existe: a conta entra na fatura, e
            quem vence é ela (dia de vencimento do cartão). O `dia` guardado
            continua valendo pra data do lançamento. */}
        {!ehEntrada && pagamento === PAG_CARTAO ? (
          <NotaLinha>
            {t("Entra na fatura do cartão todo mês — o vencimento é o da fatura.")}
          </NotaLinha>
        ) : (
          <Linha icone="calendar" rotulo={t("Vence todo dia")} divisoria as="label">
            <select
              value={dia}
              onChange={(e) => setDia(parseInt(e.target.value, 10))}
              style={{ ...estiloValorLinha, cursor: 'pointer' }}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Linha>
        )}
      </ListaAgrupada>

      <RodapeLista>{t("As mudanças valem do mês atual em diante.")}</RodapeLista>
    </ModalOverlay>
  );
}
