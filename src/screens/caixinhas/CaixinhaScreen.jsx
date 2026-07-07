// CaixinhaScreen.jsx — detalhe de uma caixinha. Orquestra cabeçalho, lembrança,
// CTAs (depositar/resgatar), histórico e os modais.

import React from "react";
import { fmtBRL, chaveMes } from "../../data.js";
import { Icon } from "../../ui/icons.jsx";
import { COR_NEG } from "../../lib/colors.js";
import { TopBar } from "../../ui/common.jsx";
import { ConfirmModal } from "../../ui/confirm-modal.jsx";
import { useSelic, calcularRendimento } from "../../lib/selic.js";
import { valorAtual, calcularLembranca } from "./utils.js";
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
    depositarCaixinha,
    resgatarCaixinha,
    excluirCaixinha,
    salvarCaixinha,
    ocultar,
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
  // Aceita depósitos antigos (origem.entradaId) resolvendo pela descrição da tx.
  // Só conta depósitos do mês atual, pra ficar simétrico com `entradasDoMes`:
  // o disponível é (entrada do mês) − (o que já foi guardado dela neste mês).
  const alocadoPorDescricao = React.useMemo(() => {
    const m = {};
    for (const c of caixinhas) {
      for (const dep of c.depositos || []) {
        if (dep.origem?.tipo !== "entrada") continue;
        if (!(dep.data || "").startsWith(mesAtual)) continue;
        let desc = dep.origem.descricao;
        if (!desc && dep.origem.entradaId) {
          const tx = entradas.find((e) => e.id === dep.origem.entradaId);
          desc = tx?.descricao;
        }
        if (desc) m[desc] = (m[desc] || 0) + dep.valor;
      }
    }
    return m;
  }, [caixinhas, entradas, mesAtual]);
  const cx = caixinhas.find((c) => c.id === params.id);
  const [modalDeposito, setModalDeposito] = React.useState(false);
  const [modalResgate, setModalResgate] = React.useState(false);
  const [modalEditar, setModalEditar] = React.useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = React.useState(false);
  const selic = useSelic();

  if (!cx) {
    return (
      <div>
        <TopBar voltar={voltar} titulo={tr("Caixinha")} />
        <div style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>
          {tr("Caixinha não encontrada.")}
        </div>
      </div>
    );
  }

  const atual = valorAtual(cx); // principal — base p/ resgate e contabilidade
  const rendimento = calcularRendimento(cx, selic);
  const comRendimento = atual + rendimento;
  const lembranca = calcularLembranca(cx);
  const pct = cx.meta > 0 ? Math.min(100, (comRendimento / cx.meta) * 100) : 0;
  const depositos = [...(cx.depositos || [])].sort((a, b) => b.data.localeCompare(a.data));

  const onConfirmarExclusao = () => {
    excluirCaixinha(cx.id);
    setConfirmarExclusao(false);
    voltar();
  };

  return (
    <div style={{ paddingBottom: "var(--pad-bottom)" }}>
      <TopBar
        voltar={voltar}
        acao={
          <button
            onClick={() => setModalEditar(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
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

      <div style={{ padding: "4px 20px 0" }}>
        <CabecalhoCaixinha
          cx={cx}
          ocultar={ocultar}
          atual={atual}
          rendimento={rendimento}
          comRendimento={comRendimento}
          pct={pct}
        />

        <CardLembranca lembranca={lembranca} ocultar={ocultar} />

        {/* CTA depositar / resgatar */}
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button
            onClick={() => setModalDeposito(true)}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: 16,
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
              borderRadius: 16,
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
          ocultar={ocultar}
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
            borderRadius: 14,
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
          alocadoPorDescricao={alocadoPorDescricao}
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
          onFechar={() => setModalResgate(false)}
          onSalvar={(valor) => {
            resgatarCaixinha(cx.id, valor);
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
            (cx.depositos || []).length > 0
              ? (cx.depositos.length === 1
                  ? tr("Os {n} depósito guardado ({x}) serão perdidos.", { n: cx.depositos.length, x: fmtBRL(valorAtual(cx), ocultar) })
                  : tr("Os {n} depósitos guardados ({x}) serão perdidos.", { n: cx.depositos.length, x: fmtBRL(valorAtual(cx), ocultar) }))
              : tr("Essa caixinha será removida permanentemente.")
          }
          onCancelar={() => setConfirmarExclusao(false)}
          onConfirmar={onConfirmarExclusao}
        />
      )}
    </div>
  );
}
