// recorrentes.jsx — Tela para visualizar, editar e cancelar gastos recorrentes.

import React from 'react';
import { CATEGORIAS, catsMinhas, fmtBRL, rotuloMesCurtoT } from '../data.js';
import { CatChip, Icon } from '../ui/icons.jsx';
import { Card, TopBar } from '../ui/common.jsx';
import { ConfirmModal } from '../ui/confirm-modal.jsx';
import { ModalOverlay } from '../ui/modal-base.jsx';
import { COR_NEG } from '../lib/colors.js';
import { formatarValorInicial, parseValorBR } from '../lib/money-input.js';
import { PAG_CARTAO } from '../lib/fatura.js';
import { useT } from '../lib/i18n.jsx';
import { hojeISO } from '../lib/datas.js';
import { resumoRecorrente } from '../lib/recorrentes.js';
import {
  BotoesDialogo,
  CabecalhoForm,
  FileiraPilulas,
  Linha,
  LinhaPagamento,
  ListaAgrupada,
  SelectLinha,
  NotaLinha,
  PilulaCategoria,
  RodapeLista,
  TituloDialogo,
  ValorGrande,
  estiloInputLinha,
  estiloValorLinha,
} from '../ui/form-lista.jsx';

export function RecorrentesScreen({ ctx }) {
  const { recorrentes, txs = [], cancelarRecorrente, editarRecorrente, voltar, ehDesktop, cartoes = [] } = ctx;
  const t = useT();
  const [confirmar, setConfirmar] = React.useState(null);
  const [editando, setEditando] = React.useState(null);
  const [vendo, setVendo] = React.useState(null);

  // Pagas, faltantes e totais de cada recorrência, tirados dos lançamentos de
  // cada mês: mês alterado conta pelo valor novo, mês excluído não conta.
  const resumos = React.useMemo(() => {
    const hoje = hojeISO();
    const m = new Map();
    for (const r of recorrentes) m.set(r.id, resumoRecorrente(r, txs, hoje));
    return m;
  }, [recorrentes, txs]);

  // A explicação e a lista são as duas únicas peças da tela. No mobile elas se
  // sucedem — o texto no caminho da leitura, logo abaixo do título. No desktop
  // o texto vira a coluna estreita da esquerda e a lista fica com o resto.
  const explicacao = t("Esses gastos são adicionados automaticamente todo mês. Edite para atualizar do mês atual em diante ou cancele se a cobrança parar.");

  // Total do mês: o que cada recorrência lançou neste mês (fora da vigência ou
  // excluída no mês, zero). Entradas recorrentes (salário etc.) somam à
  // parte, pra não abater dos gastos.
  const totais = React.useMemo(() => {
    let gastos = 0;
    let entradas = 0;
    for (const r of recorrentes) {
      const v = resumos.get(r.id)?.valorMes || 0;
      if (r.tipo === 'entrada') entradas += v;
      else gastos += v;
    }
    return { gastos, entradas };
  }, [recorrentes, resumos]);

  const resumo = (
    <Card style={{ padding: '14px 16px', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
          {t("Total por mês")}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)' }}>
          {fmtBRL(totais.gastos)}
        </div>
      </div>
      {totais.entradas > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 6, fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
          <span>{t("Entradas recorrentes")}</span>
          <span>{fmtBRL(totais.entradas)}</span>
        </div>
      )}
    </Card>
  );

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
    <div>
      {resumo}
      <Card style={{ padding: '4px 16px' }}>
        {recorrentes.map((r, i) => {
          const cat = CATEGORIAS[r.categoria] || CATEGORIAS.outros;
          const res = resumos.get(r.id);
          return (
            <div
              key={r.id}
              role="button"
              tabIndex={0}
              onClick={() => setVendo(r)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setVendo(r); }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0',
                borderTop: i === 0 ? 'none' : '1px solid var(--linha)',
                cursor: 'pointer',
              }}
            >
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
                {res && (
                  <div style={{ fontSize: 11, color: 'var(--ink)', fontWeight: 700, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                    {res.valorTotal != null
                      ? t("Total {total} · {pagas} de {n} pagas", { total: fmtBRL(res.valorTotal), pagas: res.pagas.length, n: res.totalParcelas })
                      : t("Pago até agora {total}", { total: fmtBRL(res.totalPago) })}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>
                  {fmtBRL(r.valor)}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                  <button onClick={(e) => { e.stopPropagation(); setEditando(r); }} style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    padding: 0, color: 'var(--primary)', fontSize: 11, fontWeight: 700,
                    fontFamily: 'inherit',
                  }}>{t("Editar")}</button>
                  <button onClick={(e) => { e.stopPropagation(); setConfirmar(r); }} style={{
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
    </div>
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

      {vendo && resumos.get(vendo.id) && (
        <HistoricoRecorrenteModal
          rec={vendo}
          resumo={resumos.get(vendo.id)}
          onFechar={() => setVendo(null)}
          onEditar={() => { setEditando(vendo); setVendo(null); }}
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

// dd/mm/aa de uma data "yyyy-mm-dd".
function rotuloData(iso) {
  const [yy, mm, dd] = iso.split('-');
  return `${dd}/${mm}/${yy.slice(2)}`;
}

// Tocar numa recorrente: o que já foi pago (data e valor de cada lançamento),
// quantas faltam e quanto dá no total. Sem fim definido não existe "faltam"
// nem total final — mostra só o que já saiu.
function HistoricoRecorrenteModal({ rec, resumo, onFechar, onEditar }) {
  const t = useT();
  const { pagas, totalPago, faltam, totalFalta, valorTotal, totalParcelas } = resumo;
  const temFim = valorTotal != null;
  const num = { ...estiloValorLinha, fontVariantNumeric: 'tabular-nums' };

  const subtitulo = rec.pagamento === PAG_CARTAO
    ? t("{valor} por mês · na fatura do cartão", { valor: fmtBRL(rec.valor) })
    : t("{valor} por mês · todo dia {dia}", { valor: fmtBRL(rec.valor), dia: rec.dia });

  const tituloSecao = (txt) => (
    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', margin: '16px 6px 0' }}>{txt}</div>
  );

  return (
    <ModalOverlay onClose={onFechar} maxWidth={420} padding="22px 20px 18px">
      <TituloDialogo titulo={rec.descricao} mensagem={subtitulo} />

      <ListaAgrupada style={{ marginTop: 14 }}>
        {temFim && (
          <Linha icone="wallet" rotulo={t("Valor total")}>
            <span style={{ ...num, fontSize: 16, fontWeight: 800 }}>{fmtBRL(valorTotal)}</span>
          </Linha>
        )}
        <Linha icone="check" rotulo={t("Pago")} divisoria={temFim}>
          <span style={num}>
            {temFim
              ? t("{n} de {total} · {valor}", { n: pagas.length, total: totalParcelas, valor: fmtBRL(totalPago) })
              : t("{n}× · {valor}", { n: pagas.length, valor: fmtBRL(totalPago) })}
          </span>
        </Linha>
        <Linha icone="calendar" rotulo={t("Faltam")} divisoria>
          <span style={num}>
            {!temFim
              ? t("Sem data de fim")
              : faltam.length === 0
                ? t("Nenhuma")
                : t("{n} · {valor}", { n: faltam.length, valor: fmtBRL(totalFalta) })}
          </span>
        </Linha>
      </ListaAgrupada>

      {tituloSecao(t("Pagamentos"))}
      {pagas.length === 0 ? (
        <RodapeLista>{t("Nenhum pagamento ainda.")}</RodapeLista>
      ) : (
        <ListaAgrupada style={{ marginTop: 6 }}>
          {pagas.map((tx, i) => (
            <Linha key={tx.id} rotulo={rotuloData(tx.data)} divisoria={i > 0}>
              <span style={num}>{fmtBRL(tx.valor)}</span>
            </Linha>
          ))}
        </ListaAgrupada>
      )}

      {temFim && faltam.length > 0 && (
        <>
          {tituloSecao(t("Próximas"))}
          <ListaAgrupada style={{ marginTop: 6 }}>
            {faltam.map((f, i) => (
              <Linha key={f.chave} rotulo={f.data ? rotuloData(f.data) : rotuloMesCurtoT(t, f.mes)} divisoria={i > 0}>
                <span style={{ ...num, color: 'var(--muted)' }}>{fmtBRL(f.valor)}</span>
              </Linha>
            ))}
          </ListaAgrupada>
        </>
      )}

      <BotoesDialogo
        cancelar={{ texto: t("Fechar"), onClick: onFechar }}
        confirmar={{ texto: t("Editar"), onClick: onEditar, icone: 'edit' }}
      />
    </ModalOverlay>
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
                onSelecionar={() => setCategoria(c)}
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
            <SelectLinha
              value={dia}
              onChange={setDia}
              ariaLabel={t("Vence todo dia")}
              options={Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: i + 1 }))}
            />
          </Linha>
        )}
      </ListaAgrupada>

      <RodapeLista>{t("As mudanças valem do mês atual em diante.")}</RodapeLista>
    </ModalOverlay>
  );
}
