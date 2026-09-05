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
import { Expansivel, useUltimoNaoNulo } from "../ui/expansivel.jsx";
import { ConfirmModal } from "../ui/confirm-modal.jsx";
import { COR_NEG, COR_NEG_FUNDO, COR_POS } from "../lib/colors.js";
import { guardadoPorTx, ajustarGuardado } from "../lib/guardado-entradas.js";
import { depositosDoMes } from "../lib/caixinhas.js";
import { PAG_CARTAO } from "../lib/fatura.js";
import { corDoCartao, corTextoSobre } from "../lib/cartoes.js";
import { useT } from "../lib/i18n.jsx";

export function GastosScreen({ ctx }) {
  const { txs, mes, setMes, todosMeses, irPara, excluirTx, caixinhas, cartoes = [], ehDesktop, usuario } = ctx;
  const t = useT();
  const [filtro, setFiltro] = React.useState("todas");
  const [filtroPag, setFiltroPag] = React.useState("todos");
  const [filtroCartao, setFiltroCartao] = React.useState("todos");
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

  // Cartões que aparecem no mês. Serve pra saber se existe compra órfã (crédito
  // sem cartão, sobra de cartão apagado) — os chips em si saem da lista de
  // cartões CADASTRADOS, não desta: um cartão sem gasto no mês continua
  // filtrável, e a lista vazia é a resposta certa pra ele.
  const cartoesComTx = React.useMemo(() => {
    const set = new Set();
    for (const t of txMesBruto) {
      if (t.tipo === "entrada" || t.pagamento !== PAG_CARTAO) continue;
      set.add(t.cartaoId || "sem");
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

  // Dinheiro que foi pra dentro de uma caixinha neste mês. Vira linha na lista
  // como qualquer movimento — só não entra no "Total", que o orçamento do mês
  // já abateu esse valor (ver lib/caixinhas.js).
  const depositosMes = React.useMemo(
    () => depositosDoMes(caixinhas, mes, usuario?.uid),
    [caixinhas, mes, usuario],
  );
  const temGuardados = depositosMes.length > 0;
  const ehFiltroGuardados = filtro === "guardados";

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
    } else if (ehFiltroGuardados) {
      if (!temGuardados) setFiltro("todas");
    } else if (filtro !== "todas" && !catsComTx.has(filtro)) {
      setFiltro("todas");
    }
  }, [filtro, ehFiltroEntradas, ehFiltroGuardados, catsComTx, temEntradas, temGuardados]);
  React.useEffect(() => {
    if (filtroPag !== "todos" && !pagsComTx.has(filtroPag)) setFiltroPag("todos");
  }, [filtroPag, pagsComTx]);
  // Volta pra "todos" só quando o cartão selecionado deixa de ser uma opção —
  // apagado, ou "sem cartão" sem nenhuma órfã no mês. Cartão cadastrado que não
  // teve gasto no mês continua selecionável: a lista vazia é a resposta.
  React.useEffect(() => {
    if (filtroCartao === "todos") return;
    const existe =
      filtroCartao === "sem"
        ? cartoesComTx.has("sem")
        : cartoes.some((c) => c.id === filtroCartao);
    if (!existe) setFiltroCartao("todos");
  }, [filtroCartao, cartoesComTx, cartoes]);

  let txMes = txMesBruto;
  // Os depósitos só acompanham "Todas" e o filtro deles: categoria e pagamento
  // não existem numa linha de caixinha, e em "Entradas" ela seria o oposto do
  // que o chip promete.
  let depMes = ehFiltroEntradas || (!ehFiltroGuardados && filtro !== "todas")
    ? []
    : depositosMes;
  if (ehFiltroEntradas) {
    // Só entradas — categoria/pagamento não se aplicam a elas.
    txMes = txMes.filter((t) => t.tipo === "entrada");
  } else if (ehFiltroGuardados) {
    txMes = [];
  } else {
    if (filtro !== "todas") txMes = txMes.filter((t) => t.categoria === filtro);
    if (filtroPag !== "todos") {
      txMes = txMes.filter((t) => t.pagamento === filtroPag);
      depMes = [];
    }
    if (filtroPag === PAG_CARTAO && filtroCartao !== "todos")
      txMes = txMes.filter((t) => (t.cartaoId || "sem") === filtroCartao);
  }
  if (busca) {
    const alvo = busca.toLowerCase();
    txMes = txMes.filter((t) => t.descricao.toLowerCase().includes(alvo));
    depMes = depMes.filter((d) => d.descricao.toLowerCase().includes(alvo));
  }

  // Quanto das linhas visíveis foi pra dentro de uma caixinha.
  const depositadoNoFiltro = depMes.reduce((s, d) => s + d.valor, 0);
  // O "Total" muda de assunto conforme o chip: em Entradas soma o que entrou
  // (totalGeral ignora entradas e daria zero) e em Guardado soma os depósitos.
  // Em "Todas" ele continua sendo só a soma dos GASTOS: o dinheiro guardado já
  // foi descontado do orçamento do mês, e somá-lo aqui contaria duas vezes —
  // por isso ele aparece numa linha separada, logo abaixo.
  const total = ehFiltroEntradas
    ? totalEntradas(txMes)
    : ehFiltroGuardados
      ? depositadoNoFiltro
      : totalGeral(txMes);
  // No filtro de entradas, quanto do total já está preso numa caixinha.
  const guardadoNoFiltro = ehFiltroEntradas
    ? txMes.reduce((s, t) => s + (guardadoTx[t.id] || 0), 0)
    : 0;

  // Lista única do mês, ordenada da mais recente para a mais antiga.
  // O dia/mês continua visível por transação no próprio ItemTransacao.
  //
  // Sem useMemo: `txMes` e `depMes` são recalculados a cada render (a filtragem
  // acima devolve arrays novos), então nenhuma dependência se repetiria e o
  // memo nunca acertaria — só cobraria a comparação.
  const txOrdenadas = [...txMes, ...depMes].sort((a, b) => b.data.localeCompare(a.data));

  const cats = [
    "todas",
    ...(temEntradas ? ["entradas"] : []),
    ...(temGuardados ? ["guardados"] : []),
    ...catsMinhas().filter((c) => catsComTx.has(c)),
  ];
  const pags = ["todos", ...PAGAMENTOS.filter((p) => pagsComTx.has(p))];

  const rotuloPag = (p) =>
    p === "todos" ? t("Todas") : t(p.replace("Cartão de ", ""));

  // Segunda linha de chips: aparece dentro do filtro de crédito quando há mais
  // de um cartão cadastrado — ou quando um cartão só convive com compras órfãs,
  // que também são dois grupos pra separar.
  const temOrfa = cartoesComTx.has("sem");
  const valeFiltrarCartao =
    cartoes.length > 1 || (cartoes.length >= 1 && temOrfa) || cartoesComTx.size > 1;
  const filtrosCartao =
    filtroPag === PAG_CARTAO && valeFiltrarCartao
      ? ["todos", ...cartoes.map((c) => c.id), ...(temOrfa ? ["sem"] : [])]
      : [];

  const rotuloCartao = (id) => {
    if (id === "todos") return t("Todos");
    if (id === "sem") return t("Sem cartão");
    return cartoes.find((c) => c.id === id)?.nome || t("Sem cartão");
  };

  // As duas linhas de baixo abrem e fecham em altura (ui/expansivel.jsx). Como
  // o bloco continua renderizando enquanto fecha, a lista de cartões segura o
  // último valor — ela esvazia no mesmo instante em que sai de cena.
  const filtrosCartaoVis = useUltimoNaoNulo(filtrosCartao.length ? filtrosCartao : null) || [];

  // A lista remonta quando os filtros mudam, e o fade curto entra junto. A
  // busca fica de fora de propósito: reanimar a cada tecla digitada faria a
  // lista piscar enquanto o usuário escreve.
  const chaveFiltro = `${filtro}|${filtroPag}|${filtroCartao}`;

  // As quatro peças da tela. No mobile elas se empilham na ordem de sempre:
  // resumo, busca, filtros, lista. No desktop as três primeiras viram uma
  // coluna de controles à esquerda e a lista fica com a largura toda — que é o
  // que a tela realmente tem pra mostrar.
  const resumoMes = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
        {t("{n} transações ·", { n: txOrdenadas.length })}<br/> {t("Total:")}{" "}
        <span style={{ color: "var(--ink)", fontWeight: 700 }}>
          {fmtBRL(total)}
        </span>
        {guardadoNoFiltro > 0.005 && (
          <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>
            {t("{x} já em caixinhas", { x: fmtBRL(guardadoNoFiltro) })}
          </div>
        )}
        {depositadoNoFiltro > 0.005 && !ehFiltroGuardados && (
          <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>
            {t("+ {x} guardado em caixinhas", { x: fmtBRL(depositadoNoFiltro) })}
          </div>
        )}
      </div>
      <SeletorMes mes={mes} setMes={setMes} todosMeses={todosMeses} />
    </div>
  );

  const caixaBusca = (
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
  );

  const filtros = (
    <>
      {/* Filtros de categoria */}
      <div style={{ padding: "10px 0 0" }}>
        <div
          className="carrossel"
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            padding: "2px var(--pad-x) 4px",
            scrollbarWidth: "none",
          }}
        >
          {cats.map((c) => {
            const sel = filtro === c;
            const ehEntradas = c === "entradas";
            const ehGuardados = c === "guardados";
            const cat = c === "todas" || ehEntradas || ehGuardados ? null : CATEGORIAS[c];
            // Chip "Entradas" ganha destaque verde (selecionado) pra sinalizar
            // que é dinheiro que entrou, não gasto.
            const bgSel = ehEntradas ? COR_POS : "var(--ink)";
            const pontoCor = ehEntradas ? COR_POS : cat?.cor;
            return (
              <button
                key={c}
                className="opcao-suave"
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
                    className="opcao-suave"
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
                    : ehGuardados
                      ? t("Guardado")
                      : t(cat.nome)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtros de tipo de pagamento — não se aplicam a entradas */}
      <Expansivel aberto={pags.length > 1 && !ehFiltroEntradas && !ehFiltroGuardados}>
        <div style={{ padding: "6px 0 0" }}>
          <div
            className="carrossel"
            style={{
              display: "flex",
              gap: 6,
              overflowX: "auto",
              padding: "2px var(--pad-x) 4px",
              scrollbarWidth: "none",
            }}
          >
            {pags.map((p) => {
              const sel = filtroPag === p;
              return (
                <button
                  key={p}
                  className="opcao-suave"
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
                      color="currentColor"
                      strokeWidth={2}
                    />
                  )}
                  {rotuloPag(p)}
                </button>
              );
            })}
          </div>
        </div>
      </Expansivel>

      {/* Filtro por cartão — segunda linha, dentro do crédito */}
      <Expansivel aberto={filtrosCartao.length > 0 && !ehFiltroEntradas && !ehFiltroGuardados}>
        <div style={{ padding: "6px 0 0" }}>
          <div
            className="carrossel"
            style={{
              display: "flex",
              gap: 6,
              overflowX: "auto",
              padding: "2px var(--pad-x) 4px",
              scrollbarWidth: "none",
            }}
          >
            {filtrosCartaoVis.map((id) => {
              const sel = filtroCartao === id;
              const cartao = cartoes.find((c) => c.id === id);
              return (
                <button
                  key={id}
                  className="opcao-suave"
                  onClick={() => setFiltroCartao(id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: "none",
                    background: sel
                      ? cartao ? corDoCartao(cartao) : "var(--ink)"
                      : "var(--card)",
                    color: sel
                      ? cartao ? corTextoSobre(corDoCartao(cartao)) : "var(--bg)"
                      : "var(--ink)",
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
                  {/* Bolinha da cor: sem ela, os chips não selecionados são
                      todos iguais e o cartão só se distingue pelo nome. */}
                  {cartao && !sel && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        background: corDoCartao(cartao),
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {rotuloCartao(id)}
                </button>
              );
            })}
          </div>
        </div>
      </Expansivel>
    </>
  );

  const lista = (
    // A chave remonta o bloco a cada troca de filtro — é o que dispara o
    // lista-fade. No desktop o recuo lateral já vem do painel.
    <div
      key={chaveFiltro}
      className="lista-fade"
      style={ehDesktop ? { paddingTop: 0 } : { padding: "16px var(--pad-x) 0" }}
    >
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
            {ehFiltroEntradas
              ? t("Nenhuma entrada")
              : ehFiltroGuardados
                ? t("Nada guardado")
                : t("Nenhum gasto")}
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
                guardado={guardadoTx[tx.id]}
                // Depósito não é tx: não há o que editar nem excluir aqui — o
                // toque leva pra caixinha, que é onde ele se desfaz.
                onClick={() =>
                  tx.tipo === "guardado"
                    ? irPara("caixinha", { id: tx.caixinhaId })
                    : setAcaoAberta(tx.id)
                }
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
  );

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

      {ehDesktop ? (
        <div style={{ padding: "0 var(--pad-x)" }}>
          <div className="painel-lateral">
            <div className="painel-filtros">
              {resumoMes}
              <div style={{ marginTop: 14 }}>{caixaBusca}</div>
              {filtros}
            </div>
            {lista}
          </div>
        </div>
      ) : (
        <>
          <div style={{ padding: "0 var(--pad-x)" }}>
            {resumoMes}
          </div>

          {/* Busca */}
          <div style={{ padding: "14px var(--pad-x) 0" }}>
            {caixaBusca}
          </div>

          {filtros}

          {lista}
        </>
      )}

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
