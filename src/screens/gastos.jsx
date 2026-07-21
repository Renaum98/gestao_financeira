// gastos.jsx — Tela Gastos (lista de transações do mês com filtros)

import React from "react";
import {
  CATEGORIAS,
  catsMinhas,
  PAGAMENTOS,
  fmtBRL,
  totalGeral,
  totalEntradas,
  txDoMes,
} from "../data.js";
import { Icon, iconePagamento } from "../ui/icons.jsx";
import { Card, ItemTransacao, SeletorMes, TopBar } from "../ui/common.jsx";
import { ConfirmModal } from "../ui/confirm-modal.jsx";
import { COR_NEG, COR_NEG_FUNDO, COR_POS } from "../lib/colors.js";
import { guardadoPorTx, ajustarGuardado } from "../lib/guardado-entradas.js";
import { useT } from "../lib/i18n.jsx";

export function GastosScreen({ ctx }) {
  const { txs, mes, setMes, todosMeses, ocultar, irPara, excluirTx, caixinhas } = ctx;
  const t = useT();
  const [filtro, setFiltro] = React.useState("todas");
  const [filtroPag, setFiltroPag] = React.useState("todos");
  const [busca, setBusca] = React.useState("");
  const [acaoAberta, setAcaoAberta] = React.useState(null);
  const [confirmarExclusao, setConfirmarExclusao] = React.useState(null); // tx pendente de confirmação

  const txMesBruto = txDoMes(txs, mes);
  // Só listamos chips de categorias que aparecem no mês (apenas saídas — entradas
  // não têm categoria de gasto). "todas" fica sempre disponível.
  const catsComTx = React.useMemo(() => {
    const set = new Set();
    for (const t of txMesBruto) {
      if (t.tipo !== "entrada" && t.categoria) set.add(t.categoria);
    }
    return set;
  }, [txMesBruto]);

  // Pagamentos que aparecem no mês (apenas saídas têm pagamento).
  const pagsComTx = React.useMemo(() => {
    const set = new Set();
    for (const t of txMesBruto) {
      if (t.tipo !== "entrada" && t.pagamento) set.add(t.pagamento);
    }
    return set;
  }, [txMesBruto]);

  // Há entradas no mês? Habilita o chip de filtro "Entradas" (inclui resgates
  // de caixinha, que também são valores que entraram na conta).
  const temEntradas = React.useMemo(
    () => txMesBruto.some((t) => t.tipo === "entrada"),
    [txMesBruto],
  );

  const ehFiltroEntradas = filtro === "entradas";

  // Quanto de cada entrada do mês já foi pra uma caixinha — o item da lista
  // sinaliza esse valor como indisponível.
  const guardadoTx = React.useMemo(
    () => guardadoPorTx(txs, caixinhas, mes),
    [txs, caixinhas, mes],
  );

  // Prévia do efeito colateral da exclusão: excluir uma entrada que virou
  // depósito desfaz o depósito junto (senão o orçamento do mês encolheria).
  const guardadoAExcluir = React.useMemo(() => {
    if (!confirmarExclusao) return null;
    const depois = (txs || []).filter((t) => t.id !== confirmarExclusao.id);
    const { removido, detalhes } = ajustarGuardado(caixinhas, depois, confirmarExclusao, null);
    return removido > 0.005 ? { removido, detalhes } : null;
  }, [confirmarExclusao, caixinhas, txs]);

  // Se o filtro atual não existe mais (mudou de mês), volta pra "todas".
  React.useEffect(() => {
    if (ehFiltroEntradas) {
      if (!temEntradas) setFiltro("todas");
    } else if (filtro !== "todas" && !catsComTx.has(filtro)) {
      setFiltro("todas");
    }
  }, [filtro, ehFiltroEntradas, catsComTx, temEntradas]);
  React.useEffect(() => {
    if (filtroPag !== "todos" && !pagsComTx.has(filtroPag)) setFiltroPag("todos");
  }, [filtroPag, pagsComTx]);

  let txMes = txMesBruto;
  if (ehFiltroEntradas) {
    // Só entradas — categoria/pagamento não se aplicam a elas.
    txMes = txMes.filter((t) => t.tipo === "entrada");
  } else {
    if (filtro !== "todas") txMes = txMes.filter((t) => t.categoria === filtro);
    if (filtroPag !== "todos")
      txMes = txMes.filter((t) => t.pagamento === filtroPag);
  }
  if (busca)
    txMes = txMes.filter((t) =>
      t.descricao.toLowerCase().includes(busca.toLowerCase()),
    );

  // No filtro de entradas, o "Total" soma o que entrou (totalGeral ignora
  // entradas e daria zero).
  const total = ehFiltroEntradas ? totalEntradas(txMes) : totalGeral(txMes);
  // No filtro de entradas, quanto do total já está preso numa caixinha.
  const guardadoNoFiltro = ehFiltroEntradas
    ? txMes.reduce((s, t) => s + (guardadoTx[t.id] || 0), 0)
    : 0;

  // Lista única do mês, ordenada da mais recente para a mais antiga.
  // O dia/mês continua visível por transação no próprio ItemTransacao.
  const txOrdenadas = React.useMemo(
    () => [...txMes].sort((a, b) => b.data.localeCompare(a.data)),
    [txMes],
  );

  const cats = [
    "todas",
    ...(temEntradas ? ["entradas"] : []),
    ...catsMinhas().filter((c) => catsComTx.has(c)),
  ];
  const pags = ["todos", ...PAGAMENTOS.filter((p) => pagsComTx.has(p))];

  const rotuloPag = (p) =>
    p === "todos" ? t("Todas") : t(p.replace("Cartão de ", ""));

  return (
    <div style={{ paddingBottom: "var(--pad-bottom)" }}>
      <TopBar
        titulo={t("Transações")}
        acao={
          <button
            onClick={() => irPara("historico")}
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
            <Icon
              name="calendar"
              size={18}
              color="var(--ink)"
              strokeWidth={2}
            />
          </button>
        }
      />

      <div style={{ padding: "0 20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
            {t("{n} transações ·", { n: txMes.length })}<br/> {t("Total:")}{" "}
            <span style={{ color: "var(--ink)", fontWeight: 700 }}>
              {fmtBRL(total, ocultar)}
            </span>
            {guardadoNoFiltro > 0.005 && (
              <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>
                {t("{x} já em caixinhas", { x: fmtBRL(guardadoNoFiltro, ocultar) })}
              </div>
            )}
          </div>
          <SeletorMes mes={mes} setMes={setMes} todosMeses={todosMeses} />
        </div>
      </div>

      {/* Busca */}
      <div style={{ padding: "14px 20px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            background: "var(--card)",
            borderRadius: 14,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--muted)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" />
          </svg>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={t("Buscar gasto...")}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 14,
              color: "var(--ink)",
              fontFamily: "inherit",
              fontWeight: 500,
            }}
          />
          {busca && (
            <button
              onClick={() => setBusca("")}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
              }}
            >
              <Icon
                name="close"
                size={14}
                color="var(--muted)"
                strokeWidth={2.4}
              />
            </button>
          )}
        </div>
      </div>

      {/* Filtros de categoria */}
      <div style={{ padding: "10px 0 0" }}>
        <div
          className="carrossel"
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            padding: "2px 20px 4px",
            scrollbarWidth: "none",
          }}
        >
          {cats.map((c) => {
            const sel = filtro === c;
            const ehEntradas = c === "entradas";
            const cat = c === "todas" || ehEntradas ? null : CATEGORIAS[c];
            // Chip "Entradas" ganha destaque verde (selecionado) pra sinalizar
            // que é dinheiro que entrou, não gasto.
            const bgSel = ehEntradas ? COR_POS : "var(--ink)";
            const pontoCor = ehEntradas ? COR_POS : cat?.cor;
            return (
              <button
                key={c}
                onClick={() => setFiltro(c)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "none",
                  background: sel ? bgSel : "var(--card)",
                  color: sel ? (ehEntradas ? "#fff" : "var(--bg)") : "var(--ink)",
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  flexShrink: 0,
                  boxShadow: sel ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                {pontoCor && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      background: sel && ehEntradas ? "#fff" : pontoCor,
                    }}
                  />
                )}
                {c === "todas"
                  ? t("Todas")
                  : ehEntradas
                    ? t("Entradas")
                    : t(cat.nome)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtros de tipo de pagamento — não se aplicam a entradas */}
      {pags.length > 1 && !ehFiltroEntradas && (
        <div style={{ padding: "6px 0 0" }}>
          <div
            className="carrossel"
            style={{
              display: "flex",
              gap: 6,
              overflowX: "auto",
              padding: "2px 20px 4px",
              scrollbarWidth: "none",
            }}
          >
            {pags.map((p) => {
              const sel = filtroPag === p;
              return (
                <button
                  key={p}
                  onClick={() => setFiltroPag(p)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: "none",
                    background: sel ? "var(--ink)" : "var(--card)",
                    color: sel ? "var(--bg)" : "var(--ink)",
                    fontSize: 12,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                    boxShadow: sel ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  {p !== "todos" && (
                    <Icon
                      name={iconePagamento(p)}
                      size={13}
                      color={sel ? "var(--bg)" : "var(--ink)"}
                      strokeWidth={2}
                    />
                  )}
                  {rotuloPag(p)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista única do mês — sem agrupamento por dia. A data de cada
          transação aparece no próprio ItemTransacao (canto direito). */}
      <div style={{ padding: "16px 20px 0" }}>
        {txOrdenadas.length === 0 ? (
          <Card style={{ padding: 32, textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                background: "var(--bg)",
                margin: "0 auto 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon
                name="list"
                size={26}
                color="var(--muted)"
                strokeWidth={2}
              />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
              {ehFiltroEntradas ? t("Nenhuma entrada") : t("Nenhum gasto")}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
              {t("Tente outro filtro ou adicione um novo.")}
            </div>
          </Card>
        ) : (
          <Card style={{ padding: "6px 16px" }}>
            {txOrdenadas.map((tx, i) => (
              <div
                key={tx.id}
                style={{
                  borderTop: i === 0 ? "none" : "1px solid var(--linha)",
                  position: "relative",
                }}
              >
                <ItemTransacao
                  tx={tx}
                  ocultar={ocultar}
                  guardado={guardadoTx[tx.id]}
                  onClick={() => setAcaoAberta(tx.id)}
                />
                {acaoAberta === tx.id && (
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      padding: "0 0 12px",
                    }}
                  >
                    <button
                      onClick={() => {
                        setAcaoAberta(null);
                        irPara("add", { editar: tx });
                      }}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: 12,
                        border: "none",
                        background: "var(--bg)",
                        color: "var(--ink)",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <Icon name="edit" size={14} strokeWidth={2.2} /> {t("Editar")}
                    </button>
                    <button
                      onClick={() => {
                        setConfirmarExclusao(tx);
                        setAcaoAberta(null);
                      }}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: 12,
                        border: "none",
                        background: COR_NEG_FUNDO,
                        color: COR_NEG,
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <Icon name="trash" size={14} strokeWidth={2.2} /> {t("Excluir")}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </Card>
        )}
      </div>

      {confirmarExclusao && (
        <ConfirmModal
          titulo={
            confirmarExclusao.parcelas
              ? t("Excluir parcelamento?")
              : confirmarExclusao.tipo === "entrada"
                ? t("Excluir esta entrada?")
                : t("Excluir este gasto?")
          }
          mensagem={
            (confirmarExclusao.parcelas
              ? t("\"{desc}\" foi parcelado em {n}×. Todas as parcelas serão removidas.", { desc: confirmarExclusao.descricao, n: confirmarExclusao.parcelas.total })
              : t("\"{desc}\" ({valor}) será removido permanentemente.", { desc: confirmarExclusao.descricao, valor: fmtBRL(confirmarExclusao.valor) })) +
            (guardadoAExcluir
              ? " " + t("Os {valor} guardados em {caixinhas} saem da caixinha junto — tudo volta a como estava antes desta entrada.", {
                  valor: fmtBRL(guardadoAExcluir.removido),
                  caixinhas: guardadoAExcluir.detalhes.map((d) => `"${d.nome}"`).join(", "),
                })
              : "")
          }
          onCancelar={() => setConfirmarExclusao(null)}
          onConfirmar={() => {
            excluirTx(confirmarExclusao.id);
            setConfirmarExclusao(null);
          }}
        />
      )}
    </div>
  );
}
