// CaixinhaScreen.jsx — detalhe de uma caixinha. Orquestra cabeçalho, lembrança,
// CTAs (depositar/resgatar), histórico e os modais.

import React from "react";
import { chaveMes } from "../../lib/datas.js";
import { Icon } from "../../ui/icons.jsx";
import { COR_NEG } from "../../lib/colors.js";
import { TopBar } from "../../ui/common.jsx";
import { ConfirmModal } from "../../ui/confirm-modal.jsx";
import { useSelic, calcularRendimento, rendimentoDesdeSempre } from "../../lib/selic.js";
import { alocadoPorDescricao } from "../../lib/guardado-entradas.js";
import { calcularLembranca } from "./utils.js";
import { valorAtual, caixinhaVisivel } from "../../lib/caixinhas.js";
import { fmtBRL } from "../../data.js";
import { CabecalhoCaixinha } from "./CabecalhoCaixinha.jsx";
import { CardLembranca } from "./CardLembranca.jsx";
import { HistoricoDepositos } from "./HistoricoDepositos.jsx";
import { ModalCaixinha } from "./ModalCaixinha.jsx";
import { ModalDeposito } from "./ModalDeposito.jsx";
import { ModalResgate } from "./ModalResgate.jsx";
import { useT } from "../../lib/i18n.jsx";

export function CaixinhaScreen({ ctx, params }) {
  const {
    caixinhas,
    txs,
    voltar,
    ehDesktop,
    depositarCaixinha,
    resgatarCaixinha,
    excluirCaixinha,
    salvarCaixinha,
    usuario,
    partnerNome,
    caixinhasCompartilhadas,
  } = ctx;
  const tr = useT();
  const entradas = React.useMemo(() => (txs || []).filter((t) => t.tipo === "entrada"), [txs]);
  // Só o mês atual pode financiar um depósito: não dá pra guardar uma entrada
  // que ainda não caiu (mês futuro) nem reaproveitar entradas de meses passados
  // (essas já viram carryover). O depósito é sempre uma ação de "agora".
  const mesAtual = chaveMes(new Date());
  const entradasDoMes = React.useMemo(
    () => entradas.filter((t) => (t.data || "").startsWith(mesAtual)),
    [entradas, mesAtual],
  );
  // Agrupa entradas pela descrição (ex: várias txs "Shopee" viram uma única origem)
  const gruposEntrada = React.useMemo(() => {
    const m = {};
    for (const t of entradasDoMes) {
      const k = t.descricao;
      if (!m[k]) m[k] = { descricao: k, total: 0, ultimaData: t.data, count: 0 };
      m[k].total += t.valor;
      m[k].count += 1;
      if (t.data > m[k].ultimaData) m[k].ultimaData = t.data;
    }
    return Object.values(m);
  }, [entradasDoMes]);
  // Soma o que já foi alocado de cada grupo de entradas em todas as caixinhas.
  // Só conta depósitos do mês atual, pra ficar simétrico com `entradasDoMes`:
  // o disponível é (entrada do mês) − (o que já foi guardado dela neste mês).
  const alocado = React.useMemo(
    () => alocadoPorDescricao(caixinhas, entradas, mesAtual),
    [caixinhas, entradas, mesAtual],
  );
  // `caixinhas` inclui as excluídas (pra `alocado` acima continuar certo); a
  // tela em si trata uma excluída como inexistente.
  const cx = caixinhas.find((c) => c.id === params.id && caixinhaVisivel(c));
  const [modalDeposito, setModalDeposito] = React.useState(false);
  const [modalResgate, setModalResgate] = React.useState(false);
  const [modalEditar, setModalEditar] = React.useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = React.useState(false);
  // Na exclusão: false = só apagar (meses intactos), true = devolver o dinheiro.
  const [devolver, setDevolver] = React.useState(false);
  const selic = useSelic();

  if (!cx) {
    return (
      <div>
        <TopBar voltar={ehDesktop ? undefined : voltar} titulo={tr("Caixinha")} />
        <div style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>
          {tr("Caixinha não encontrada.")}
        </div>
      </div>
    );
  }

  const atual = valorAtual(cx); // principal — base p/ resgate e contabilidade
  const rendimento = calcularRendimento(cx, selic);
  // Informativo: soma o que já rendeu desde sempre, incluindo o rendimento que
  // saiu junto em resgates anteriores.
  const rendimentoTotal = rendimentoDesdeSempre(cx, selic);
  const comRendimento = atual + rendimento;
  const lembranca = calcularLembranca(cx);
  const pct = cx.meta > 0 ? Math.min(100, (comRendimento / cx.meta) * 100) : 0;
  const depositos = [...(cx.depositos || [])].sort((a, b) => b.data.localeCompare(a.data));

  // O que "devolver" desfaz — só os lançamentos de quem está excluindo (ver
  // excluirCaixinha no app). Saldo inicial não saiu de mês nenhum.
  const meuUid = usuario?.uid;
  const meus = (cx.depositos || []).filter(
    (d) => d.tipo !== "inicial" && (!d.feitoPor || d.feitoPor === meuUid),
  );
  const guardadoMeu = meus.reduce((s, d) => s + (d.valor > 0 ? d.valor : 0), 0);
  const resgatadoMeu = meus.reduce((s, d) => s + (d.valor < 0 ? -d.valor : 0), 0);
  const temOQueDevolver = meus.length > 0;

  const onConfirmarExclusao = () => {
    excluirCaixinha(cx.id, { devolver: temOQueDevolver && devolver });
    setConfirmarExclusao(false);
    voltar();
  };

  return (
    <div style={{ paddingBottom: "var(--pad-bottom)" }}>
      <TopBar
        // No desktop a lista fica montada ao lado, então não há de onde voltar:
        // o botão (que é fixo na viewport) só pairaria sobre ela.
        voltar={ehDesktop ? undefined : voltar}
        acao={
          <button
            onClick={() => setModalEditar(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--raio-pilula)",
              background: "var(--card)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <Icon name="edit" size={16} color="var(--ink)" strokeWidth={2} />
          </button>
        }
      />

      <div style={{ padding: "4px var(--pad-x) 0" }}>
        <CabecalhoCaixinha
          cx={cx}
          atual={atual}
          rendimento={rendimento}
          rendimentoTotal={rendimentoTotal}
          comRendimento={comRendimento}
          pct={pct}
        />

        <CardLembranca lembranca={lembranca} />

        {/* CTA depositar / resgatar */}
        <div style={{ display: "flex", gap: 10, marginTop: "var(--esp-secao)" }}>
          <button
            onClick={() => setModalDeposito(true)}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "var(--raio-bloco)",
              border: "none",
              cursor: "pointer",
              background: `linear-gradient(135deg, ${cx.cor}, ${cx.cor}CC)`,
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              fontFamily: "inherit",
              boxShadow: `0 6px 16px ${cx.cor}55`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Icon name="plus" size={18} color="#fff" strokeWidth={2.6} />
            {tr("Adicionar")}
          </button>
          <button
            onClick={() => atual > 0 && setModalResgate(true)}
            disabled={atual <= 0}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "var(--raio-bloco)",
              border: `1.5px solid ${atual > 0 ? cx.cor : "var(--linha)"}`,
              cursor: atual > 0 ? "pointer" : "default",
              background: "var(--card)",
              color: atual > 0 ? cx.cor : "var(--muted)",
              fontSize: 14,
              fontWeight: 800,
              fontFamily: "inherit",
              opacity: atual > 0 ? 1 : 0.6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Icon name="minus" size={18} color={atual > 0 ? cx.cor : "var(--muted)"} strokeWidth={2.6} />
            {tr("Resgatar")}
          </button>
        </div>

        <HistoricoDepositos
          depositos={depositos}
          cx={cx}
          entradas={entradas}
          caixinhasCompartilhadas={caixinhasCompartilhadas}
          usuario={usuario}
          partnerNome={partnerNome}
        />

        {/* Excluir */}
        <button
          onClick={() => setConfirmarExclusao(true)}
          style={{
            width: "100%",
            marginTop: 22,
            padding: "12px",
            borderRadius: "var(--raio-bloco)",
            border: "none",
            cursor: "pointer",
            background: "transparent",
            color: COR_NEG,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Icon name="trash" size={14} color={COR_NEG} strokeWidth={2.2} />
          {tr("Excluir caixinha")}
        </button>
      </div>

      {modalDeposito && (
        <ModalDeposito
          cor={cx.cor}
          gruposEntrada={gruposEntrada}
          alocadoPorDescricao={alocado}
          onFechar={() => setModalDeposito(false)}
          onSalvar={(dep) => {
            depositarCaixinha(cx.id, dep);
            setModalDeposito(false);
          }}
        />
      )}
      {modalResgate && (
        <ModalResgate
          cor={cx.cor}
          nome={cx.nome}
          disponivel={atual}
          rendimento={rendimento}
          onFechar={() => setModalResgate(false)}
          onSalvar={(valor) => {
            resgatarCaixinha(cx.id, valor, rendimento);
            setModalResgate(false);
          }}
        />
      )}
      {modalEditar && (
        <ModalCaixinha
          editando={cx}
          onFechar={() => setModalEditar(false)}
          onSalvar={(dados) => {
            salvarCaixinha({ ...cx, ...dados });
            setModalEditar(false);
          }}
        />
      )}
      {confirmarExclusao && (
        <ConfirmModal
          titulo={tr("Excluir \"{nome}\"?", { nome: cx.nome })}
          mensagem={
            temOQueDevolver
              ? tr("O que fazer com o dinheiro que passou por ela?")
              : tr("Essa caixinha será removida permanentemente.")
          }
          onCancelar={() => {
            setConfirmarExclusao(false);
            setDevolver(false);
          }}
          onConfirmar={onConfirmarExclusao}
        >
          {temOQueDevolver && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14, textAlign: "left" }}>
              <OpcaoExclusao
                selecionada={!devolver}
                onClick={() => setDevolver(false)}
                titulo={tr("Só apagar a caixinha")}
                descricao={tr("Nada muda nos meses: o que foi guardado continua descontado onde saiu.")}
              />
              <OpcaoExclusao
                selecionada={devolver}
                onClick={() => setDevolver(true)}
                titulo={tr("Apagar e devolver")}
                descricao={
                  resgatadoMeu > 0
                    ? tr("{x} voltam pros meses e entradas de onde saíram, e os resgates ({y}) saem de Transações. Como se ela nunca tivesse existido.", { x: fmtBRL(guardadoMeu), y: fmtBRL(resgatadoMeu) })
                    : tr("{x} voltam pros meses e entradas de onde saíram. Como se ela nunca tivesse existido.", { x: fmtBRL(guardadoMeu) })
                }
              />
              {caixinhasCompartilhadas && (
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, lineHeight: 1.4 }}>
                  {tr("Só os seus lançamentos voltam. Os de {nome} continuam como estão.", { nome: partnerNome || tr("seu parceiro") })}
                </div>
              )}
            </div>
          )}
        </ConfirmModal>
      )}
    </div>
  );
}

// Uma das duas saídas da exclusão, no formato de opção marcável.
function OpcaoExclusao({ selecionada, onClick, titulo, descricao }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selecionada}
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        width: "100%",
        padding: "10px 12px",
        borderRadius: "var(--raio-bloco)",
        border: selecionada ? "2px solid var(--primary)" : "2px solid var(--linha)",
        background: selecionada ? "color-mix(in oklab, var(--primary) 8%, transparent)" : "var(--card)",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          marginTop: 2,
          flexShrink: 0,
          borderRadius: "var(--raio-pilula)",
          border: selecionada ? "5px solid var(--primary)" : "2px solid var(--muted)",
          boxSizing: "border-box",
        }}
      />
      <span>
        <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>{titulo}</span>
        <span style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: "var(--muted)", lineHeight: 1.4, marginTop: 2 }}>
          {descricao}
        </span>
      </span>
    </button>
  );
}
