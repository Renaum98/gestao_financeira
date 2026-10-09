// add-expense.jsx — modal de Adicionar / Editar gasto

import React from "react";
import {
  CATEGORIAS,
  catsMinhas,
  MESES,
  CAT_FINANCIAMENTO,
  fmtBRL,
  txDoMes,
  totalPorCategoria,
} from "../data.js";
import { Icon } from "../ui/icons.jsx";
import { Expansivel, useUltimoNaoNulo } from "../ui/expansivel.jsx";
import { ModalOverlay } from "../ui/modal-base.jsx";
import { Toggle } from "../ui/common.jsx";
import { vibrar } from "../lib/haptics.js";
import { ConfirmModal } from "../ui/confirm-modal.jsx";
import { COR_POS, COR_AVISO, COR_NEG } from "../lib/colors.js";
import { formatarValorInicial, parseValorBR, valorZero } from "../lib/money-input.js";
import { ajustarGuardado } from "../lib/guardado-entradas.js";
import { faturaDaCompra, faturasEmAberto, mesPagamentoDaFatura, PAG_CARTAO } from "../lib/fatura.js";
import { fechamentoDe, usoDoCartao } from "../lib/cartoes.js";
import {
  Aviso,
  CabecalhoForm,
  FileiraPilulas,
  Linha,
  LinhaPagamento,
  ListaAgrupada,
  NotaLinha,
  PilulaCategoria,
  SeletorCores,
  SeletorPilula,
  ValorGrande,
  estiloInputLinha,
  estiloValorLinha,
} from "../ui/form-lista.jsx";
import { useT } from "../lib/i18n.jsx";
import { chaveMes, dataNoMes, hojeISO } from "../lib/datas.js";

const CORES_CAT = [
  "#6E4FF6", "#FF9B6E", "#5DA8FF", "#9B7BFF", "#FF7AA8",
  "#3FCB9A", "#F0C13B", "#6FB8D9", "#C58BFF", "#EF6B5C",
];

export function AddExpenseModal({ ctx, params }) {
  const { fechar, salvarTx, adicionarCategoria, excluirCategoria, ehDesktop, txs, mes, orcamentos, preferences, caixinhas, cartoes = [] } = ctx;
  const t = useT();
  const editar = params && params.editar;
  // Estado da confirmação de exclusão de categoria personalizada.
  // null = fechado; objeto = abre o modal pra essa categoria.
  const [excluirCat, setExcluirCat] = React.useState(null);
  const [tipo, setTipo] = React.useState(
    editar?.tipo === "entrada" ? "entrada" : "saida",
  );
  const [valor, setValor] = React.useState(
    editar
      ? formatarValorInicial(editar.parcelas ? editar.parcelas.valorTotal : editar.valor)
      : valorZero(),
  );
  const [categoria, setCategoria] = React.useState(
    editar ? editar.categoria : "alimentacao",
  );
  const [descricao, setDescricao] = React.useState(
    editar ? editar.descricao : "",
  );
  const [pagamento, setPagamento] = React.useState(
    editar?.pagamento || "Cartão de crédito",
  );
  // Em qual cartão a compra entra. Gasto novo já nasce no primeiro cartão da
  // lista — com um cartão só, o usuário nunca precisa escolher. Ao editar,
  // mantém o que a tx tem: `null` aqui é uma tx órfã (sobra de cartão apagado),
  // e mexer nela sem o usuário pedir seria reescrever histórico às escondidas.
  const [cartaoId, setCartaoId] = React.useState(
    editar ? editar.cartaoId || null : cartoes[0]?.id || null,
  );
  // Ao trocar a forma de pagamento pra crédito, cai no primeiro cartão. A tx
  // que JÁ era do crédito sem cartão fica como está: ela é órfã de verdade
  // (sobra de cartão apagado) e adotá-la sozinho seria reescrever histórico.
  React.useEffect(() => {
    if (tipo === "entrada" || pagamento !== PAG_CARTAO || cartaoId) return;
    if (editar && editar.pagamento === PAG_CARTAO) return;
    setCartaoId(cartoes[0]?.id || null);
  }, [tipo, pagamento]); // eslint-disable-line react-hooks/exhaustive-deps

  const [data, setData] = React.useState(editar ? editar.data : hojeISO());
  const [ehRecorrente, setEhRecorrente] = React.useState(false);
  // Campos extras quando recorrente: dia de vencimento + até qual mês/ano.
  const _hoje = React.useMemo(() => new Date(), []);
  const _fimDefault = React.useMemo(
    () => new Date(_hoje.getFullYear(), _hoje.getMonth() + 12, 1),
    [_hoje],
  );
  const [diaVenc, setDiaVenc] = React.useState(_hoje.getDate());
  const [fimMes, setFimMes] = React.useState(_fimDefault.getMonth() + 1);
  const [fimAno, setFimAno] = React.useState(_fimDefault.getFullYear());
  // % de reajuste por parcela do financiamento (string digitada, ex.: "1,5").
  const [reajuste, setReajuste] = React.useState("");

  const ehEntrada = tipo === "entrada";
  // Financiamento: habilita o campo de reajuste e força "repetir todo mês".
  const ehFinanciamento = !ehEntrada && categoria === CAT_FINANCIAMENTO && !editar;
  React.useEffect(() => {
    if (ehFinanciamento) setEhRecorrente(true);
  }, [ehFinanciamento]);
  const reajustePct = parseFloat(reajuste.replace(",", ".")) || 0;
  const [criandoCat, setCriandoCat] = React.useState(false);
  const [novoNomeCat, setNovoNomeCat] = React.useState("");
  const [novaCorCat, setNovaCorCat] = React.useState(CORES_CAT[0]);

  const confirmarNovaCat = () => {
    const nome = novoNomeCat.trim();
    if (!nome) return;
    vibrar(14);
    const id = adicionarCategoria(nome, novaCorCat);
    setCategoria(id);
    setNovoNomeCat("");
    setNovaCorCat(CORES_CAT[0]);
    setCriandoCat(false);
  };

  const valorNum = parseValorBR(valor);

  // Aviso de orçamento da categoria: projeta o gasto do mês + o valor digitado
  // contra o limite definido em Orçamentos. Amarelo a partir de 80%, vermelho
  // quando estoura. Só vale para saída com limite configurado na categoria.
  const avisoOrc = React.useMemo(() => {
    if (ehEntrada) return null;
    const limite = orcamentos?.[categoria] || 0;
    if (limite <= 0) return null;
    const porCat = totalPorCategoria(txDoMes(txs || [], mes));
    let jaGasto = porCat[categoria] || 0;
    // Ao editar, o valor original dessa tx já está somado no mês — desconta
    // para não contar em dobro na projeção.
    if (editar && editar.categoria === categoria) {
      jaGasto -= (editar.parcelas ? editar.parcelas.valorTotal : editar.valor) || 0;
    }
    const projetado = jaGasto + valorNum;
    const pct = (projetado / limite) * 100;
    if (pct < 80) return null;
    return { pct, excedeu: projetado > limite, limite, projetado };
  }, [ehEntrada, orcamentos, categoria, txs, mes, valorNum, editar]);

  // Aviso do limite do cartão escolhido — mesma lógica do orçamento por
  // categoria, mas projetando o que já ocupa o limite (a fatura aberta, ver
  // usoDoCartao) + o valor digitado. Cartão sem limite informado não avisa.
  const avisoCartao = React.useMemo(() => {
    if (ehEntrada || pagamento !== PAG_CARTAO || !cartaoId) return null;
    const cartao = cartoes.find((c) => c.id === cartaoId);
    if (!cartao || !(cartao.limite > 0)) return null;
    const faturas = faturasEmAberto(txs || [], cartao.diaFechamento || 0, hojeISO(), cartao.id);
    let { usado, limite } = usoDoCartao(cartao, faturas);
    // Ao editar, desconta o valor original se ele já ocupava este cartão.
    if (
      editar && editar.cartaoId === cartao.id &&
      faturaDaCompra(editar.data, cartao.diaFechamento || 0) === faturas.aberta.mes
    ) {
      usado -= editar.valor || 0;
    }
    const projetado = usado + valorNum;
    const pct = (projetado / limite) * 100;
    if (pct < 80) return null;
    return { pct, excedeu: projetado > limite, limite, projetado, nome: cartao.nome };
  }, [ehEntrada, pagamento, cartaoId, cartoes, txs, valorNum, editar]);

  // Em qual fatura essa compra cai e quando ela vai ser paga. Depende da data
  // digitada: comprar depois do fechamento já joga pra fatura do mês seguinte.
  // Puramente informativo — o saldo do mês continua abatendo pela data da
  // compra, não pela data do pagamento (ver lib/fatura.js).
  // O fechamento é o do cartão escolhido; sem cartão, o global de antes.
  const infoFatura = React.useMemo(() => {
    if (ehEntrada || pagamento !== PAG_CARTAO || !data) return null;
    const fatura = faturaDaCompra(data, fechamentoDe(cartoes, cartaoId, preferences));
    return { fatura, vence: mesPagamentoDaFatura(fatura) };
  }, [ehEntrada, pagamento, data, cartoes, cartaoId, preferences?.diaFechamentoCartao]);

  // Aviso de caixinha: editar uma entrada que já foi guardada pode deixar o
  // depósito sem lastro (valor menor que o guardado, ou descrição/data que tira
  // a tx do grupo que bancava ele). Nesse caso a diferença sai da caixinha ao
  // salvar — avisamos antes. Mesmo cálculo que o app.jsx aplica.
  const avisoGuardado = React.useMemo(() => {
    if (!editar || (editar.tipo !== "entrada" && !ehEntrada)) return null;
    const descFinal = descricao.trim() || (ehEntrada ? "Entrada" : CATEGORIAS[categoria].nome);
    const txNova = { ...editar, tipo, valor: valorNum, descricao: descFinal, data };
    const depois = (txs || []).filter((t) => t.id !== editar.id).concat([txNova]);
    const { removido, detalhes } = ajustarGuardado(caixinhas, depois, editar, txNova);
    return removido > 0.005 ? { removido, detalhes } : null;
  }, [editar, ehEntrada, tipo, valorNum, descricao, categoria, data, txs, caixinhas]);

  // Os blocos condicionais abrem e fecham em altura (ui/expansivel.jsx) em vez
  // de sumir de uma vez: trocar Saída↔Entrada ou a forma de pagamento reorganiza
  // meio modal, e no corte seco a tela dava um salto. Como o bloco continua
  // renderizando enquanto fecha, os avisos seguram o último valor — sem isso o
  // colapso animaria uma caixa vazia.
  const avisoOrcVis = useUltimoNaoNulo(avisoOrc);
  const avisoCartaoVis = useUltimoNaoNulo(avisoCartao);
  const avisoGuardadoVis = useUltimoNaoNulo(avisoGuardado);
  const infoFaturaVis = useUltimoNaoNulo(infoFatura);

  const salvar = () => {
    if (valorNum <= 0) return;
    const descFinal = descricao.trim()
      || (ehEntrada ? "Entrada" : CATEGORIAS[categoria].nome);
    const vaiCriarRec = ehRecorrente && !editar;
    // Data efetiva: quando recorrente, usa mês atual + dia de vencimento informado.
    let dataFinal = data;
    if (vaiCriarRec) {
      dataFinal = dataNoMes(chaveMes(_hoje), diaVenc);
    }
    const tx = {
      id: editar ? editar.id : `tx-${Date.now()}`,
      tipo,
      valor: valorNum,
      categoria: ehEntrada ? null : categoria,
      descricao: descFinal,
      pagamento: ehEntrada ? null : pagamento,
      // Só existe em compra no crédito com cartão escolhido. Ausente = crédito
      // sem cartão definido, que é o app inteiro antes do cadastro.
      ...(!ehEntrada && pagamento === PAG_CARTAO && cartaoId ? { cartaoId } : {}),
      data: dataFinal,
      // Parcelamento não é mais criável; ao editar uma tx parcelada antiga,
      // preservamos o parcelamento existente (atualizando o valor total).
      parcelas:
        editar?.parcelas ? { ...editar.parcelas, valorTotal: valorNum } : null,
      // Marca para o app.jsx criar a recorrência (só faz sentido quando não está editando)
      ehRecorrente: vaiCriarRec,
      // Dia de vencimento e mês/ano final (yyyy-mm) — só usados se recorrente.
      recDia: vaiCriarRec ? diaVenc : null,
      recFim: vaiCriarRec ? `${fimAno}-${String(fimMes).padStart(2, "0")}` : null,
      // Reajuste composto por parcela (decimal) — só financiamento recorrente.
      recCresc: vaiCriarRec && ehFinanciamento && reajustePct > 0
        ? reajustePct / 100
        : null,
    };
    salvarTx(tx, !!editar);
    fechar();
  };

  const confirmarExclusaoCategoria = () => {
    if (!excluirCat) return;
    // Se a categoria selecionada é a que está sendo excluída, volta pra "outros".
    if (categoria === excluirCat.id) setCategoria("outros");
    excluirCategoria(excluirCat.id);
    setExcluirCat(null);
  };

  const criandoRec = ehRecorrente && !editar;

  return (
    <>
    <ModalOverlay
      onClose={fechar}
      maxWidth={440}
      maxWidthDesktop={520}
      padding="14px 18px 20px"
      dialogStyle={{ overflowX: "hidden", transformOrigin: "center" }}
    >
        <CabecalhoForm
          titulo={editar ? t("Editar transação") : t("Nova transação")}
          onCancelar={fechar}
          onSalvar={salvar}
          salvarAtivo={valorNum > 0}
          corSalvar={ehEntrada ? COR_POS : undefined}
        />

        <ValorGrande
          valor={valor}
          onChange={setValor}
          cor={ehEntrada ? COR_POS : undefined}
          sinal={ehEntrada}
        />

        {/* Tipo: Saída / Entrada — logo abaixo do valor, que é o que ele muda
            (cor e sinal). */}
        <SeletorPilula
          valor={tipo}
          onChange={setTipo}
          opcoes={[
            { id: "saida", label: t("Saída"), icon: "arrow-right" },
            { id: "entrada", label: t("Entrada"), icon: "arrow-left", bgSel: COR_POS, textoSel: "#fff" },
          ]}
        />

        {/* Categoria (só saída): pílulas numa linha só, que rola de lado. */}
        <Expansivel aberto={!ehEntrada}>
        <div style={{ marginTop: 12 }}>
          <FileiraPilulas>
            {catsMinhas().map((c) => (
              <PilulaCategoria
                key={c}
                catId={c}
                selecionado={categoria === c}
                ehDesktop={ehDesktop}
                podeExcluir={!!CATEGORIAS[c].custom && !!excluirCategoria}
                onSelecionar={() => { vibrar(); setCategoria(c); }}
                onPedirExcluir={() => setExcluirCat({ id: c, nome: CATEGORIAS[c].nome })}
              />
            ))}

            {/* + Nova categoria */}
            <button
              onClick={() => setCriandoCat((v) => !v)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px 6px 9px",
                borderRadius: "var(--raio-pilula)",
                border: "1.5px dashed var(--linha)",
                background: criandoCat ? "var(--card-2)" : "transparent",
                color: "var(--muted)",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
                flexShrink: 0,
                whiteSpace: "nowrap",
                touchAction: "manipulation",
              }}
            >
              <Icon name="plus" size={14} color="currentColor" strokeWidth={2.4} />
              {t("Nova")}
            </button>
          </FileiraPilulas>

          {/* Formulário de nova categoria */}
          <Expansivel aberto={criandoCat}>
            <div
              style={{
                marginTop: 8,
                padding: 12,
                borderRadius: "var(--raio-bloco)",
                background: "var(--card-2)",
                boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "var(--raio-pilula)",
                    background: novaCorCat + "22",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "var(--raio-pilula)",
                      background: novaCorCat,
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: 9,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {(novoNomeCat.trim()[0] || "?").toUpperCase()}
                  </div>
                </div>
                <input
                  value={novoNomeCat}
                  onChange={(e) => setNovoNomeCat(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmarNovaCat()}
                  placeholder={t("Nome da categoria")}
                  maxLength={20}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "9px 12px",
                    borderRadius: "var(--raio-compacto)",
                    border: "none",
                    background: "var(--bg)",
                    outline: "none",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--ink)",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <SeletorCores cores={CORES_CAT} valor={novaCorCat} onChange={setNovaCorCat} />
                <label
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "var(--raio-pilula)",
                    border: "2px dashed var(--linha)",
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <Icon name="edit" size={12} color="var(--muted)" strokeWidth={2} />
                  <input
                    type="color"
                    value={novaCorCat}
                    onChange={(e) => setNovaCorCat(e.target.value)}
                    aria-label={t("Cor personalizada")}
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0,
                      cursor: "pointer",
                    }}
                  />
                </label>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setCriandoCat(false);
                    setNovoNomeCat("");
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--muted)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {t("Cancelar")}
                </button>
                <button
                  onClick={confirmarNovaCat}
                  disabled={!novoNomeCat.trim()}
                  style={{
                    background: novoNomeCat.trim() ? "var(--primary)" : "var(--linha)",
                    color: novoNomeCat.trim() ? "#fff" : "var(--muted)",
                    border: "none",
                    padding: "7px 14px",
                    borderRadius: "var(--raio-pilula)",
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: novoNomeCat.trim() ? "pointer" : "default",
                    fontFamily: "inherit",
                  }}
                >
                  {t("Criar categoria")}
                </button>
              </div>
            </div>
          </Expansivel>
        </div>
        </Expansivel>

        {/* Aviso de orçamento da categoria */}
        <Expansivel aberto={!!avisoOrc}>
          {avisoOrcVis && (
            <Aviso icone="target" cor={avisoOrcVis.excedeu ? COR_NEG : COR_AVISO}>
              {avisoOrcVis.excedeu
                ? t("Você excedeu o orçamento de {cat}: {proj} de {lim}.", { cat: t(CATEGORIAS[categoria].nome), proj: fmtBRL(avisoOrcVis.projetado), lim: fmtBRL(avisoOrcVis.limite) })
                : t("Atenção: {pct}% do orçamento de {cat} ({proj} de {lim}).", { pct: avisoOrcVis.pct.toFixed(0), cat: t(CATEGORIAS[categoria].nome), proj: fmtBRL(avisoOrcVis.projetado), lim: fmtBRL(avisoOrcVis.limite) })}
            </Aviso>
          )}
        </Expansivel>

        {/* O resto dos campos numa lista agrupada só. O que antes eram blocos
            soltos (pagamento, cartão, fatura) cabe numa linha que abre quando
            tocada. */}
        <ListaAgrupada>
          <Linha icone="edit" as="label">
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder={t("Descrição (ex: Mercado, Uber...)")}
              aria-label={t("Descrição")}
              style={estiloInputLinha}
            />
          </Linha>

          {/* Data — some quando vai criar recorrência (usa o dia de vencimento) */}
          <Expansivel aberto={!criandoRec}>
            <Linha icone="calendar" rotulo={t("Data")} divisoria as="label">
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                style={estiloValorLinha}
              />
            </Linha>
          </Expansivel>

          {/* Pagamento (só saída). A fatura em que a compra cai vem de legenda —
              só leitura, não muda a conta do mês. */}
          <Expansivel aberto={!ehEntrada}>
            <LinhaPagamento
              pagamento={pagamento}
              onPagamento={setPagamento}
              cartoes={cartoes}
              cartaoId={cartaoId}
              onCartao={setCartaoId}
              permitirSemCartao={!!editar && editar.pagamento === PAG_CARTAO && !editar.cartaoId}
              legenda={infoFatura
                ? t("Entra na fatura de {fatura} · você paga em {vence}", {
                    fatura: t(MESES[Number(infoFaturaVis.fatura.slice(5, 7)) - 1]),
                    vence: t(MESES[Number(infoFaturaVis.vence.slice(5, 7)) - 1]),
                  })
                : null}
            />
          </Expansivel>

          {/* Recorrente */}
          {!editar && (
            <Linha icone="history" rotulo={t("Repetir todo mês")} divisoria as="label">
              <Toggle ativo={ehRecorrente} onChange={setEhRecorrente} />
            </Linha>
          )}

          {/* Campos extras de recorrência: reajuste, dia de vencimento, até quando */}
          {!editar && (
            <Expansivel aberto={ehRecorrente}>
              {/* Reajuste por parcela (só financiamento) */}
              <Expansivel aberto={ehFinanciamento}>
                <Linha
                  icone="chart"
                  rotulo={t("Reajuste por parcela")}
                  legenda={reajustePct > 0 && valorNum > 0
                    ? t("1ª parcela {v1} · 2ª {v2} · 3ª {v3}", {
                        v1: fmtBRL(valorNum),
                        v2: fmtBRL(valorNum * (1 + reajustePct / 100)),
                        v3: fmtBRL(valorNum * Math.pow(1 + reajustePct / 100, 2)),
                      })
                    : null}
                  divisoria
                  as="label"
                >
                  <input
                    type="text"
                    inputMode="decimal"
                    value={reajuste}
                    onChange={(e) =>
                      setReajuste(e.target.value.replace(/[^0-9.,]/g, ""))
                    }
                    placeholder="0"
                    aria-label={t("Porcentagem de reajuste por parcela")}
                    style={{ ...estiloValorLinha, width: 56, textAlign: "right", fontSize: 16, fontWeight: 800 }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>%</span>
                </Linha>
              </Expansivel>

              {/* Vence todo dia. No crédito não pergunta: a conta entra na
                  fatura e quem vence é ela. O lançamento fica no dia de hoje
                  (o padrão de `diaVenc`) todo mês. */}
              {!ehEntrada && pagamento === PAG_CARTAO ? (
                <NotaLinha>
                  {t("Entra na fatura do cartão todo mês — o vencimento é o da fatura.")}
                </NotaLinha>
              ) : (
                <Linha icone="calendar" rotulo={t("Vence todo dia")} divisoria as="label">
                  <select
                    value={diaVenc}
                    onChange={(e) => setDiaVenc(parseInt(e.target.value, 10))}
                    style={{ ...estiloValorLinha, cursor: "pointer" }}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </Linha>
              )}

              {/* Até mês/ano — dois selects, então a linha não é label (o toque
                  não saberia em qual cair). */}
              <Linha icone="history" rotulo={t("Até")} divisoria>
                <select
                  value={fimMes}
                  onChange={(e) => setFimMes(parseInt(e.target.value, 10))}
                  style={{ ...estiloValorLinha, cursor: "pointer" }}
                >
                  {MESES.map((nome, idx) => (
                    <option key={idx} value={idx + 1}>{t(nome)}</option>
                  ))}
                </select>
                <select
                  value={fimAno}
                  onChange={(e) => setFimAno(parseInt(e.target.value, 10))}
                  style={{ ...estiloValorLinha, cursor: "pointer" }}
                >
                  {Array.from({ length: 11 }, (_, i) => _hoje.getFullYear() + i).map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </Linha>
            </Expansivel>
          )}
        </ListaAgrupada>

        {/* Aviso de limite do cartão de crédito */}
        <Expansivel aberto={!!avisoCartao}>
          {avisoCartaoVis && (
            <Aviso icone="card" cor={avisoCartaoVis.excedeu ? COR_NEG : COR_AVISO}>
              {avisoCartaoVis.excedeu
                ? t("Você excedeu o limite do {cartao}: {proj} de {lim}.", { cartao: avisoCartaoVis.nome, proj: fmtBRL(avisoCartaoVis.projetado), lim: fmtBRL(avisoCartaoVis.limite) })
                : t("Atenção: {pct}% do limite do {cartao} ({proj} de {lim}).", { pct: avisoCartaoVis.pct.toFixed(0), cartao: avisoCartaoVis.nome, proj: fmtBRL(avisoCartaoVis.projetado), lim: fmtBRL(avisoCartaoVis.limite) })}
            </Aviso>
          )}
        </Expansivel>

        {/* Aviso: parte do que está na caixinha volta ao salvar esta edição */}
        <Expansivel aberto={!!avisoGuardado}>
          {avisoGuardadoVis && (
            <Aviso icone="piggy" cor={COR_AVISO}>
              {t("Esta entrada banca {valor} guardados em {caixinhas}. Ao salvar, esse valor sai da caixinha.", {
                valor: fmtBRL(avisoGuardadoVis.removido),
                caixinhas: avisoGuardadoVis.detalhes.map((d) => `"${d.nome}"`).join(", "),
              })}
            </Aviso>
          )}
        </Expansivel>
    </ModalOverlay>
    {excluirCat && (
      <ConfirmModal
        titulo={t("Excluir \"{nome}\"?", { nome: excluirCat.nome })}
        mensagem={t(
          'A categoria será removida e as transações antigas que a usavam passam a aparecer em "Outros". O orçamento associado, se houver, também é apagado.'
        )}
        onCancelar={() => setExcluirCat(null)}
        onConfirmar={confirmarExclusaoCategoria}
      />
    )}
    </>
  );
}
