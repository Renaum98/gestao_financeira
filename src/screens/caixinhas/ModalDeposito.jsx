// ModalDeposito.jsx — adicionar valor à caixinha. Origem pode ser o orçamento
// do mês ou o saldo disponível de uma entrada específica.

import React from "react";
import { fmtBRLCompacto } from "../../data.js";
import { Icon } from "../../ui/icons.jsx";
import { COR_POS, COR_NEG, COR_POS_FUNDO } from "../../lib/colors.js";
import { formatarValorDigitado, parseValorBR, valorZero } from "../../lib/money-input.js";
import { simboloMoeda } from "../../lib/moeda.js";
import { hojeISO } from "./utils.js";
import { ModalShell, Campo } from "./ModalShell.jsx";
import { Expansivel } from "../../ui/expansivel.jsx";
import { useT } from "../../lib/i18n.jsx";

export function ModalDeposito({ cor, gruposEntrada = [], alocadoPorDescricao = {}, onFechar, onSalvar }) {
  const t = useT();
  const [valor, setValor] = React.useState(valorZero());
  const [data, setData] = React.useState(hojeISO());
  const [origemTipo, setOrigemTipo] = React.useState("orcamento"); // 'orcamento' | 'entrada'
  const [entradaDesc, setEntradaDesc] = React.useState("");

  // Grupos com saldo (uma linha por descrição, somando todas as txs com o mesmo nome)
  const gruposComSaldo = React.useMemo(() => {
    return [...gruposEntrada]
      .map((g) => {
        const alocado = alocadoPorDescricao[g.descricao] || 0;
        return { ...g, alocado, disponivel: Math.max(0, g.total - alocado) };
      })
      .sort((a, b) => b.ultimaData.localeCompare(a.ultimaData));
  }, [gruposEntrada, alocadoPorDescricao]);

  const temEntradas = gruposComSaldo.length > 0;

  const aoDigitar = (texto) => setValor(formatarValorDigitado(texto));
  const valorNum = parseValorBR(valor);
  const grupoEscolhido = gruposComSaldo.find((g) => g.descricao === entradaDesc);
  const excedeEntrada =
    origemTipo === "entrada" && grupoEscolhido && valorNum > grupoEscolhido.disponivel + 0.001;
  const origemValida = origemTipo === "orcamento" || (grupoEscolhido && !excedeEntrada);
  const podeSalvar = valorNum > 0 && origemValida;

  const salvar = () => {
    if (!podeSalvar) return;
    const origem =
      origemTipo === "entrada"
        ? { tipo: "entrada", descricao: entradaDesc }
        : { tipo: "orcamento" };
    onSalvar({ id: `dp-${Date.now()}`, valor: valorNum, data, origem });
  };

  return (
    <ModalShell titulo={t("Adicionar valor")} onFechar={onFechar} onSalvar={salvar} salvarAtivo={podeSalvar} corAcento={cor}>
      <label
        style={{
          display: "block",
          textAlign: "center",
          padding: "14px 0 6px",
          position: "relative",
          cursor: "text",
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
          {t("Valor")}
        </div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 800,
            color: "var(--ink)",
            letterSpacing: "-0.03em",
            marginTop: 4,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span style={{ fontSize: 20, color: "var(--muted)", marginRight: 6, verticalAlign: "top" }}>
            {simboloMoeda()}
          </span>
          {valor}
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={valor.replace(",", "")}
          onChange={(e) => aoDigitar(e.target.value)}
          aria-label={t("Valor do depósito")}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            border: "none",
            background: "transparent",
            outline: "none",
            fontSize: 16,
            cursor: "text",
          }}
        />
      </label>

      <Campo label={t("Data")}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            borderRadius: 12,
            background: "var(--card-2)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          <Icon name="calendar" size={16} color="var(--muted)" strokeWidth={2} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>{t("Quando")}</span>
          <input
            type="date"
            value={data}
            max={hojeISO()}
            onChange={(e) => setData(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--ink)",
              fontFamily: "inherit",
            }}
          />
        </label>
      </Campo>

      <Campo label={t("Origem do valor")}>
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: 4,
            borderRadius: 12,
            background: "var(--card-2)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          {[
            { id: "orcamento", label: t("Orçamento") },
            { id: "entrada", label: t("Entrada"), disabled: !temEntradas },
          ].map((opt) => {
            const sel = origemTipo === opt.id;
            return (
              <button
                key={opt.id}
                className="opcao-suave"
                onClick={() => {
                  if (opt.disabled) return;
                  setOrigemTipo(opt.id);
                  if (opt.id === "entrada" && !entradaDesc && temEntradas) {
                    setEntradaDesc(gruposComSaldo[0].descricao);
                  }
                }}
                disabled={opt.disabled}
                style={{
                  flex: 1,
                  padding: "9px 8px",
                  borderRadius: 10,
                  border: "none",
                  background: sel ? "var(--card)" : "transparent",
                  color: opt.disabled ? "var(--linha)" : sel ? "var(--ink)" : "var(--muted)",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: opt.disabled ? "default" : "pointer",
                  fontFamily: "inherit",
                  boxShadow: sel ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <Expansivel aberto={origemTipo === "orcamento"}>
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "var(--muted)",
              fontWeight: 500,
              padding: "0 4px",
              lineHeight: 1.4,
            }}
          >
            {t("Será debitado do orçamento do mês.")}
          </div>
        </Expansivel>

        <Expansivel aberto={origemTipo === "entrada" && temEntradas}>
          <div
            style={{
              marginTop: 10,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            {gruposComSaldo.map((g) => {
              const sel = entradaDesc === g.descricao;
              const semSaldo = g.disponivel <= 0;
              return (
                <button
                  key={g.descricao}
                  className="opcao-suave"
                  onClick={() => !semSaldo && setEntradaDesc(g.descricao)}
                  disabled={semSaldo}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: sel ? `2px solid ${COR_POS}` : "2px solid transparent",
                    background: "var(--card-2)",
                    cursor: semSaldo ? "default" : "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                    opacity: semSaldo ? 0.5 : 1,
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 10,
                      background: COR_POS_FUNDO,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="plus" size={14} color={COR_POS} strokeWidth={2.6} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--ink)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {g.descricao}
                      {g.count > 1 && (
                        <span style={{ color: "var(--muted)", fontWeight: 600 }}>
                          {" "}· {t("{n} lançamentos", { n: g.count })}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, marginTop: 1 }}>
                      {t("disponível {x}", { x: fmtBRLCompacto(g.disponivel) })}
                      {g.alocado > 0 && t(" · alocado {x}", { x: fmtBRLCompacto(g.alocado) })}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Expansivel>

        <Expansivel aberto={origemTipo === "entrada" && !!excedeEntrada}>
          <div style={{ marginTop: 8, fontSize: 12, color: COR_NEG, fontWeight: 700, padding: "0 4px" }}>
            {t("Valor excede o disponível desta entrada.")}
          </div>
        </Expansivel>
      </Campo>
    </ModalShell>
  );
}
