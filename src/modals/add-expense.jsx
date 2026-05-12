// add-expense.jsx — modal de Adicionar / Editar gasto

import React from "react";
import {
  CATEGORIAS,
  ORDEM_CATS,
  PAGAMENTOS,
  fmtBRL,
  fmtBRLCompacto,
} from "../data.js";
import { CatChip, Icon, iconePagamento } from "../ui/icons.jsx";

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AddExpenseModal({ ctx, params }) {
  const { fechar, salvarTx, mes } = ctx;
  const editar = params && params.editar;
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
    editar ? editar.pagamento : "Cartão de crédito",
  );
  const [data, setData] = React.useState(editar ? editar.data : hojeISO());
  const [parcelas, setParcelas] = React.useState(
    editar && editar.parcelas ? editar.parcelas.total : 1,
  );
  const [ehRecorrente, setEhRecorrente] = React.useState(false);

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
  const ehCredito = pagamento === "Cartão de crédito";
  const numParcelas = ehCredito ? parcelas : 1;
  const valorParcela = numParcelas > 0 ? valorNum / numParcelas : valorNum;

  const salvar = () => {
    if (valorNum <= 0) return;
    const tx = {
      id: editar ? editar.id : `tx-${Date.now()}`,
      valor: valorNum,
      categoria,
      descricao: descricao || CATEGORIAS[categoria].nome,
      pagamento,
      data,
      parcelas:
        numParcelas > 1 ? { total: numParcelas, valorTotal: valorNum } : null,
      // Marca para o app.jsx criar a recorrência (só faz sentido quando não é parcelado e não está editando)
      ehRecorrente: ehRecorrente && numParcelas === 1 && !editar,
    };
    salvarTx(tx, !!editar);
    fechar();
  };

  return (
    <div
      onClick={fechar}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "rgba(20, 16, 24, 0.45)",
        backdropFilter: "blur(12px) saturate(140%)",
        WebkitBackdropFilter: "blur(12px) saturate(140%)",
        animation: "fadeIn .28s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          overflowX: "hidden",
          background: "var(--bg)",
          borderRadius: 28,
          padding: "16px 20px 24px",
          boxShadow:
            "0 24px 60px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.08)",
          animation: "scaleIn .34s cubic-bezier(0.22, 1, 0.36, 1)",
          transformOrigin: "center",
        }}
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
            {editar ? "Editar gasto" : "Novo gasto"}
          </div>
          <button
            onClick={salvar}
            disabled={valorNum <= 0}
            style={{
              background: valorNum > 0 ? "var(--primary)" : "var(--linha)",
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
              color: "var(--ink)",
              letterSpacing: "-0.04em",
              marginTop: 4,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span
              style={{
                fontSize: 24,
                color: "var(--muted)",
                marginRight: 6,
                verticalAlign: "top",
              }}
            >
              R$
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

        {/* Categoria */}
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
                <button
                  key={c}
                  onClick={() => setCategoria(c)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: "8px 10px 6px",
                    borderRadius: 14,
                    border: "none",
                    background: sel ? "var(--card-2)" : "transparent",
                    boxShadow: sel
                      ? "0 2px 8px rgba(0,0,0,0.18), 0 0 0 1.5px " + cat.cor
                      : "none",
                    cursor: "pointer",
                    minWidth: 72,
                    flexShrink: 0,
                  }}
                >
                  <CatChip catId={c} size={32} />
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
            })}
          </div>
        </div>

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

        {/* Data */}
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
              max={hojeISO()}
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

        {/* Pagamento */}
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          {PAGAMENTOS.map((p) => {
            const sel = pagamento === p;
            return (
              <button
                key={p}
                onClick={() => setPagamento(p)}
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

        {/* Parcelas (só crédito) */}
        {ehCredito && (
          <div style={{ marginTop: 10 }}>
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
            <div
              className="carrossel"
              style={{
                display: "flex",
                gap: 6,
                overflowX: "auto",
                scrollbarWidth: "none",
                paddingBottom: 2,
              }}
            >
              {[1, 2, 3, 4, 6, 10, 12].map((n) => {
                const sel = parcelas === n;
                return (
                  <button
                    key={n}
                    onClick={() => setParcelas(n)}
                    style={{
                      flex: "1 0 auto",
                      minWidth: 56,
                      padding: "10px 6px",
                      borderRadius: 12,
                      border: "none",
                      background: sel ? "var(--primary)" : "var(--card-2)",
                      color: sel ? "#fff" : "var(--ink)",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      letterSpacing: "-0.02em",
                      boxShadow: sel
                        ? "0 2px 8px rgba(110,79,246,0.25)"
                        : "0 1px 2px rgba(0,0,0,0.06)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 0,
                      lineHeight: 1.15,
                    }}
                  >
                    <span>{n}×</span>
                    {n > 1 && valorNum > 0 && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          opacity: 0.75,
                          marginTop: 1,
                        }}
                      >
                        {fmtBRLCompacto(valorNum / n)}
                      </span>
                    )}
                    {n === 1 && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          opacity: 0.65,
                          marginTop: 1,
                        }}
                      >
                        à vista
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
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
                Útil para assinaturas, aluguel, mensalidades. Você pode cancelar
                depois em Perfil → Recorrentes.
              </div>
            </div>
            <ToggleSimples ativo={ehRecorrente} onChange={setEhRecorrente} />
          </label>
        )}
      </div>
    </div>
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
