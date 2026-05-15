// add-expense.jsx — modal de Adicionar / Editar gasto

import React from "react";
import {
  CATEGORIAS,
  ORDEM_CATS,
  PAGAMENTOS,
  MESES,
  fmtBRL,
  fmtBRLCompacto,
} from "../data.js";
import { CatChip, Icon, iconePagamento } from "../ui/icons.jsx";
import { ModalOverlay } from "../ui/modal-base.jsx";
import { vibrar } from "../lib/haptics.js";
import { ConfirmModal } from "../ui/confirm-modal.jsx";
import { COR_POS } from "../lib/colors.js";

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const CORES_CAT = [
  "#6E4FF6", "#FF9B6E", "#5DA8FF", "#9B7BFF", "#FF7AA8",
  "#3FCB9A", "#F0C13B", "#6FB8D9", "#C58BFF", "#EF6B5C",
];

export function AddExpenseModal({ ctx, params }) {
  const { fechar, salvarTx, adicionarCategoria, excluirCategoria, ehDesktop } = ctx;
  const editar = params && params.editar;
  // Estado da confirmação de exclusão de categoria personalizada.
  // null = fechado; objeto = abre o modal pra essa categoria.
  const [excluirCat, setExcluirCat] = React.useState(null);
  const [tipo, setTipo] = React.useState(
    editar?.tipo === "entrada" ? "entrada" : "saida",
  );
  const [valor, setValor] = React.useState(
    editar
      ? String(
          (editar.parcelas ? editar.parcelas.valorTotal : editar.valor).toFixed(
            2,
          ),
        ).replace(".", ",")
      : "0,00",
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
  const [data, setData] = React.useState(editar ? editar.data : hojeISO());
  const [parcelas, setParcelas] = React.useState(
    editar && editar.parcelas ? editar.parcelas.total : 1,
  );
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

  const ehEntrada = tipo === "entrada";
  const [criandoCat, setCriandoCat] = React.useState(false);
  const [novoNomeCat, setNovoNomeCat] = React.useState("");
  const [novaCorCat, setNovaCorCat] = React.useState(CORES_CAT[0]);
  const [parcelasAberto, setParcelasAberto] = React.useState(false);

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

  // Mantém o estilo "calculadora" (cada dígito vira centavo, vai empurrando para reais)
  // mas usando o teclado numérico nativo do sistema via input invisível.
  const aoDigitar = (texto) => {
    let v = texto.replace(/\D/g, ""); // só dígitos
    if (v.length > 10) v = v.slice(0, 10);
    if (!v) {
      setValor("0,00");
      return;
    }
    v = v.padStart(3, "0");
    const reais = v.slice(0, -2);
    const cent = v.slice(-2);
    setValor(`${parseInt(reais, 10)},${cent}`);
  };

  const valorNum = parseFloat(valor.replace(",", ".")) || 0;
  const ehCredito = !ehEntrada && pagamento === "Cartão de crédito";
  const numParcelas = ehCredito ? parcelas : 1;
  const valorParcela = numParcelas > 0 ? valorNum / numParcelas : valorNum;

  const salvar = () => {
    if (valorNum <= 0) return;
    const descFinal = descricao.trim()
      || (ehEntrada ? "Entrada" : CATEGORIAS[categoria].nome);
    const vaiCriarRec = ehRecorrente && numParcelas === 1 && !editar;
    // Data efetiva: quando recorrente, usa mês atual + dia de vencimento informado.
    let dataFinal = data;
    if (vaiCriarRec) {
      const y = _hoje.getFullYear();
      const m = _hoje.getMonth() + 1;
      const ultDia = new Date(y, m, 0).getDate();
      const diaReal = Math.min(diaVenc, ultDia);
      dataFinal = `${y}-${String(m).padStart(2, "0")}-${String(diaReal).padStart(2, "0")}`;
    }
    const tx = {
      id: editar ? editar.id : `tx-${Date.now()}`,
      tipo,
      valor: valorNum,
      categoria: ehEntrada ? null : categoria,
      descricao: descFinal,
      pagamento: ehEntrada ? null : pagamento,
      data: dataFinal,
      parcelas:
        !ehEntrada && numParcelas > 1
          ? { total: numParcelas, valorTotal: valorNum }
          : null,
      // Marca para o app.jsx criar a recorrência (só faz sentido quando não é parcelado e não está editando)
      ehRecorrente: vaiCriarRec,
      // Dia de vencimento e mês/ano final (yyyy-mm) — só usados se recorrente.
      recDia: vaiCriarRec ? diaVenc : null,
      recFim: vaiCriarRec ? `${fimAno}-${String(fimMes).padStart(2, "0")}` : null,
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

  return (
    <>
    <ModalOverlay
      onClose={fechar}
      maxWidth={440}
      padding="16px 20px 24px"
      dialogStyle={{ overflowX: "hidden", transformOrigin: "center" }}
    >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <button
            onClick={fechar}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "var(--ink)",
              letterSpacing: "-0.01em",
            }}
          >
            {editar ? "Editar transação" : "Nova transação"}
          </div>
          <button
            onClick={salvar}
            disabled={valorNum <= 0}
            style={{
              background: valorNum > 0
                ? (ehEntrada ? COR_POS : "var(--primary)")
                : "var(--linha)",
              color: valorNum > 0 ? "#fff" : "var(--muted)",
              border: "none",
              padding: "6px 14px",
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 13,
              cursor: valorNum > 0 ? "pointer" : "default",
              fontFamily: "inherit",
            }}
          >
            Salvar
          </button>
        </div>

        {/* Valor grande (clique para abrir o teclado nativo) */}
        <label
          style={{
            display: "block",
            textAlign: "center",
            padding: "8px 0 4px",
            cursor: "text",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            Valor
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: ehEntrada ? COR_POS : "var(--ink)",
              letterSpacing: "-0.04em",
              marginTop: 4,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span
              style={{
                fontSize: 24,
                color: ehEntrada ? COR_POS : "var(--muted)",
                marginRight: 6,
                verticalAlign: "top",
                opacity: ehEntrada ? 0.9 : 1,
              }}
            >
              {ehEntrada ? "+R$" : "R$"}
            </span>
            {valor}
          </div>
          {/* input invisível que dispara o teclado numérico nativo */}
          <input
            autoFocus
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={valor.replace(",", "")}
            onChange={(e) => aoDigitar(e.target.value)}
            aria-label="Valor"
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 16 /* >=16 evita zoom no iOS */,
              cursor: "text",
            }}
          />
          {numParcelas > 1 && valorNum > 0 && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--primary)",
                marginTop: 2,
              }}
            >
              {numParcelas}× de {fmtBRL(valorParcela)}
            </div>
          )}
        </label>

        {/* Tipo: Saída / Entrada */}
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              display: "flex",
              gap: 6,
              padding: 4,
              borderRadius: 14,
              background: "var(--card-2)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            }}
          >
            {[
              { id: "saida", label: "Saída", icon: "arrow-right", bgSel: "var(--card)", textoSel: "var(--ink)" },
              { id: "entrada", label: "Entrada", icon: "arrow-left", bgSel: COR_POS, textoSel: "#fff" },
            ].map((opt) => {
              const sel = tipo === opt.id;
              const txtColor = sel ? opt.textoSel : "var(--muted)";
              return (
                <button
                  key={opt.id}
                  onClick={() => { vibrar(); setTipo(opt.id); }}
                  style={{
                    flex: 1,
                    padding: "10px 8px",
                    borderRadius: 10,
                    border: "none",
                    background: sel ? opt.bgSel : "transparent",
                    color: txtColor,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    boxShadow: sel && opt.id === "saida" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                    transition: "background .15s",
                  }}
                >
                  <Icon
                    name={opt.icon}
                    size={14}
                    color={txtColor}
                    strokeWidth={2.6}
                  />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categoria (só saída) */}
        {!ehEntrada && (
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: 0.4,
              padding: "0 4px 8px",
            }}
          >
            Categoria
          </div>
          <div
            className="carrossel"
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              padding: "6px 4px 10px",
              scrollbarWidth: "none",
            }}
          >
            {ORDEM_CATS.map((c) => {
              const cat = CATEGORIAS[c];
              const sel = categoria === c;
              return (
                <CategoriaBtn
                  key={c}
                  catId={c}
                  cat={cat}
                  selecionado={sel}
                  ehDesktop={ehDesktop}
                  podeExcluir={!!cat.custom && !!excluirCategoria}
                  onSelecionar={() => { vibrar(); setCategoria(c); }}
                  onPedirExcluir={() => setExcluirCat({ id: c, nome: cat.nome })}
                />
              );
            })}

            {/* + Nova categoria */}
            <button
              onClick={() => setCriandoCat((v) => !v)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "8px 10px 6px",
                borderRadius: 14,
                border: "none",
                background: criandoCat ? "var(--card-2)" : "transparent",
                cursor: "pointer",
                minWidth: 72,
                flexShrink: 0,
                WebkitTouchCallout: "none",
                WebkitUserSelect: "none",
                userSelect: "none",
                touchAction: "manipulation",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  border: "2px dashed var(--linha)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--card)",
                  boxShadow:
                    "0 2px 5px rgba(20,16,24,0.10), inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -2px 3px rgba(0,0,0,0.08)",
                }}
              >
                <Icon name="plus" size={16} color="var(--muted)" strokeWidth={2.4} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}>
                Nova
              </span>
            </button>
          </div>

          {/* Formulário de nova categoria */}
          {criandoCat && (
            <div
              style={{
                margin: "2px 4px 4px",
                padding: "12px 14px",
                borderRadius: 14,
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
                    width: 36,
                    height: 36,
                    borderRadius: 11,
                    background: novaCorCat + "22",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: novaCorCat,
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: 10,
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
                  placeholder="Nome da categoria"
                  maxLength={20}
                  autoFocus
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "10px 12px",
                    borderRadius: 10,
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
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CORES_CAT.map((cor) => (
                  <button
                    key={cor}
                    onClick={() => { vibrar(); setNovaCorCat(cor); }}
                    aria-label={`Cor ${cor}`}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: cor,
                      border:
                        novaCorCat === cor
                          ? "3px solid var(--ink)"
                          : "3px solid transparent",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  />
                ))}
                <label
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    border: "2px dashed var(--linha)",
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
                  Cancelar
                </button>
                <button
                  onClick={confirmarNovaCat}
                  disabled={!novoNomeCat.trim()}
                  style={{
                    background: novoNomeCat.trim() ? "var(--primary)" : "var(--linha)",
                    color: novoNomeCat.trim() ? "#fff" : "var(--muted)",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: 999,
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: novoNomeCat.trim() ? "pointer" : "default",
                    fontFamily: "inherit",
                  }}
                >
                  Criar categoria
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Descrição */}
        <div style={{ marginTop: 12 }}>
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição (ex: Mercado, Uber...)"
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 14,
              border: "none",
              background: "var(--card-2)",
              outline: "none",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--ink)",
              fontFamily: "inherit",
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Data — escondida quando vai criar recorrência (usa dia + fim abaixo) */}
        {!(ehRecorrente && numParcelas === 1 && !editar) && (
        <div style={{ marginTop: 10 }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderRadius: 14,
              background: "var(--card-2)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            }}
          >
            <Icon
              name="calendar"
              size={18}
              color="var(--muted)"
              strokeWidth={2}
            />
            <span
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: 700,
                color: "var(--muted)",
              }}
            >
              Data
            </span>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: 14,
                fontWeight: 700,
                color: "var(--ink)",
                fontFamily: "inherit",
              }}
            />
          </label>
        </div>
        )}

        {/* Pagamento (só saída) */}
        {!ehEntrada && (
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          {PAGAMENTOS.map((p) => {
            const sel = pagamento === p;
            return (
              <button
                key={p}
                onClick={() => { vibrar(); setPagamento(p); }}
                style={{
                  flex: 1,
                  padding: "10px 4px",
                  borderRadius: 12,
                  border: "none",
                  background: sel ? "var(--ink)" : "var(--card-2)",
                  color: sel ? "var(--bg)" : "var(--ink)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  boxShadow: sel ? "none" : "0 1px 2px rgba(0,0,0,0.06)",
                }}
              >
                <Icon
                  name={iconePagamento(p)}
                  size={18}
                  color={sel ? "var(--bg)" : "var(--ink)"}
                  strokeWidth={2}
                />
                {p.replace("Cartão de ", "")}
              </button>
            );
          })}
        </div>
        )}

        {/* Parcelas (só crédito) — dropdown 1 a 24x */}
        {ehCredito && (
          <div style={{ marginTop: 10, position: "relative" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 4px 6px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                }}
              >
                Parcelar em
              </div>
              {parcelas > 1 && (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--primary)",
                  }}
                >
                  Total: {fmtBRL(valorNum)}
                </div>
              )}
            </div>

            <button
              onClick={() => { vibrar(); setParcelasAberto((v) => !v); }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: 12,
                border: "none",
                background: "var(--card-2)",
                color: "var(--ink)",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                  {parcelas}×
                </span>
                <span style={{ color: "var(--muted)", fontWeight: 600, fontSize: 13 }}>
                  {parcelas === 1
                    ? "à vista"
                    : valorNum > 0
                      ? `de ${fmtBRL(valorNum / parcelas)}`
                      : ""}
                </span>
              </span>
              <Icon
                name="chevron-down"
                size={16}
                color="var(--muted)"
                strokeWidth={2.4}
              />
            </button>

            {parcelasAberto && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: 4,
                  zIndex: 10,
                  maxHeight: 260,
                  overflowY: "auto",
                  background: "var(--card)",
                  borderRadius: 12,
                  boxShadow:
                    "0 12px 32px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)",
                  padding: 4,
                }}
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => {
                  const sel = parcelas === n;
                  return (
                    <button
                      key={n}
                      onClick={() => {
                        vibrar();
                        setParcelas(n);
                        setParcelasAberto(false);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "none",
                        background: sel
                          ? "color-mix(in oklab, var(--primary) 12%, transparent)"
                          : "transparent",
                        color: sel ? "var(--primary)" : "var(--ink)",
                        fontSize: 14,
                        fontWeight: sel ? 800 : 600,
                        fontFamily: "inherit",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ letterSpacing: "-0.02em" }}>{n}×</span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: sel ? "var(--primary)" : "var(--muted)",
                        }}
                      >
                        {n === 1
                          ? valorNum > 0
                            ? `${fmtBRL(valorNum)} à vista`
                            : "à vista"
                          : valorNum > 0
                            ? fmtBRL(valorNum / n)
                            : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Recorrente (só faz sentido em compra à vista) */}
        {numParcelas === 1 && !editar && (
          <label
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 14,
              background: "var(--card-2)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: ehRecorrente
                  ? "color-mix(in oklab, var(--primary) 14%, transparent)"
                  : "var(--surface-sunken)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background .15s",
              }}
            >
              <Icon
                name="history"
                size={18}
                color={ehRecorrente ? "var(--primary)" : "var(--muted)"}
                strokeWidth={2.2}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}
              >
                Repetir todo mês
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  fontWeight: 500,
                  marginTop: 1,
                  lineHeight: 1.35,
                }}
              >
                Útil para assinaturas, aluguel e mensalidades.
              </div>
            </div>
            <ToggleSimples ativo={ehRecorrente} onChange={setEhRecorrente} />
          </label>
        )}

        {/* Campos extras de recorrência: dia de vencimento + mês/ano final */}
        {ehRecorrente && numParcelas === 1 && !editar && (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Vence todo dia */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 14,
                background: "var(--card-2)",
                boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
              }}
            >
              <Icon name="calendar" size={18} color="var(--muted)" strokeWidth={2} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>
                Vence todo dia
              </span>
              <select
                value={diaVenc}
                onChange={(e) => setDiaVenc(parseInt(e.target.value, 10))}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--ink)",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>

            {/* Até mês/ano */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 14,
                background: "var(--card-2)",
                boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
              }}
            >
              <Icon name="history" size={18} color="var(--muted)" strokeWidth={2} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>
                Até
              </span>
              <select
                value={fimMes}
                onChange={(e) => setFimMes(parseInt(e.target.value, 10))}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--ink)",
                  fontFamily: "inherit",
                  cursor: "pointer",
                  marginRight: 6,
                }}
              >
                {MESES.map((nome, idx) => (
                  <option key={idx} value={idx + 1}>{nome}</option>
                ))}
              </select>
              <select
                value={fimAno}
                onChange={(e) => setFimAno(parseInt(e.target.value, 10))}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--ink)",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                {Array.from({ length: 11 }, (_, i) => _hoje.getFullYear() + i).map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </label>
          </div>
        )}
    </ModalOverlay>
    {excluirCat && (
      <ConfirmModal
        titulo={`Excluir "${excluirCat.nome}"?`}
        mensagem={
          'A categoria será removida e as transações antigas que a usavam ' +
          'passam a aparecer em "Outros". O orçamento associado, se houver, também é apagado.'
        }
        onCancelar={() => setExcluirCat(null)}
        onConfirmar={confirmarExclusaoCategoria}
      />
    )}
    </>
  );
}

function ToggleSimples({ ativo, onChange }) {
  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        onChange(!ativo);
      }}
      style={{
        width: 42,
        height: 26,
        borderRadius: 14,
        background: ativo ? "var(--primary)" : "var(--surface-sunken)",
        position: "relative",
        cursor: "pointer",
        transition: "background .15s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: ativo ? 18 : 2,
          width: 22,
          height: 22,
          borderRadius: 11,
          background: "#fff",
          transition: "left .15s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }}
      />
    </div>
  );
}

// ─────────── Botão de categoria com long-press / double-click ───────────
// Comportamento:
//   • Mobile (PWA): segurar 2s na categoria personalizada → modal de exclusão.
//   • Desktop: duplo-clique → modal de exclusão.
//   • Categorias built-in (sem flag custom) ignoram esses gestos.
//   • Em ambos os casos, um clique normal continua selecionando a categoria.
const LONG_PRESS_MS = 2000;
const MOVE_TOLERANCE = 10; // px — se o dedo arrasta mais que isso, cancela.

function CategoriaBtn({
  catId,
  cat,
  selecionado,
  ehDesktop,
  podeExcluir,
  onSelecionar,
  onPedirExcluir,
}) {
  const timerRef = React.useRef(null);
  const longPressFiredRef = React.useRef(false);
  const inicioRef = React.useRef({ x: 0, y: 0 });

  const limpar = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const iniciarLongPress = (e) => {
    if (!podeExcluir || ehDesktop) return;
    longPressFiredRef.current = false;
    inicioRef.current = { x: e.clientX || 0, y: e.clientY || 0 };
    limpar();
    timerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      vibrar(28);
      onPedirExcluir();
    }, LONG_PRESS_MS);
  };

  const moverPossivelCancelar = (e) => {
    if (!timerRef.current) return;
    const dx = (e.clientX || 0) - inicioRef.current.x;
    const dy = (e.clientY || 0) - inicioRef.current.y;
    if (dx * dx + dy * dy > MOVE_TOLERANCE * MOVE_TOLERANCE) limpar();
  };

  const aoClicar = (e) => {
    // Se o long-press já disparou, não seleciona a categoria.
    if (longPressFiredRef.current) {
      e.preventDefault();
      e.stopPropagation();
      longPressFiredRef.current = false;
      return;
    }
    onSelecionar();
  };

  const aoDuploClicar = () => {
    if (!podeExcluir || !ehDesktop) return;
    onPedirExcluir();
  };

  // Cleanup ao desmontar.
  React.useEffect(() => () => limpar(), []);

  return (
    <button
      onClick={aoClicar}
      onDoubleClick={aoDuploClicar}
      onPointerDown={iniciarLongPress}
      onPointerMove={moverPossivelCancelar}
      onPointerUp={limpar}
      onPointerCancel={limpar}
      onPointerLeave={limpar}
      onContextMenu={(e) => podeExcluir && e.preventDefault()}
      title={podeExcluir ? (ehDesktop ? 'Duplo-clique para excluir' : 'Segure 2s para excluir') : undefined}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "8px 10px 6px",
        borderRadius: 14,
        border: "none",
        background: selecionado ? "var(--card-2)" : "transparent",
        boxShadow: selecionado
          ? "0 2px 8px rgba(0,0,0,0.18), 0 0 0 1.5px " + cat.cor
          : "none",
        cursor: "pointer",
        minWidth: 72,
        flexShrink: 0,
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        touchAction: "manipulation",
      }}
    >
      <CatChip catId={catId} size={32} raised />
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "var(--ink)",
        }}
      >
        {cat.nome}
      </span>
    </button>
  );
}
