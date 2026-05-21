// ModalCaixinha.jsx — criar / editar caixinha (nome, cor, meta e investimento).

import React from "react";
import { Icon } from "../../ui/icons.jsx";
import { formatarValorDigitado, formatarValorInicial, parseValorBR } from "../../lib/money-input.js";
import { useSelic, taxaAnualEfetiva } from "../../lib/selic.js";
import { CORES_CAIXINHA, hojeISO } from "./utils.js";
import { ModalShell, Campo, Toggle, inputStyle } from "./ModalShell.jsx";

export function ModalCaixinha({ editando, onFechar, onSalvar }) {
  const selic = useSelic();
  const [nome, setNome] = React.useState(editando?.nome ?? "");
  const [cor, setCor] = React.useState(editando?.cor ?? CORES_CAIXINHA[0]);
  const [temMeta, setTemMeta] = React.useState(editando ? !!editando.meta : false);
  const [meta, setMeta] = React.useState(formatarValorInicial(editando?.meta || 0));
  const [dataMeta, setDataMeta] = React.useState(editando?.dataMeta ?? "");

  // ─── Avançado / investimento ───
  const [avancadoAberto, setAvancadoAberto] = React.useState(!!editando?.rendimentoAtivo);
  const [rendimentoAtivo, setRendimentoAtivo] = React.useState(!!editando?.rendimentoAtivo);
  const [rendimentoCDI, setRendimentoCDI] = React.useState(String(editando?.rendimentoCDI ?? 100));
  const cdiNum = parseFloat(String(rendimentoCDI).replace(",", ".")) || 0;
  const taxaEfetiva = taxaAnualEfetiva(cdiNum, selic);

  const metaNum = parseValorBR(meta);
  const valido = nome.trim().length > 0;

  const salvar = () => {
    if (!valido) return;
    onSalvar({
      nome: nome.trim(),
      cor,
      meta: temMeta && metaNum > 0 ? metaNum : 0,
      dataMeta: temMeta && metaNum > 0 && dataMeta ? dataMeta : "",
      rendimentoAtivo: rendimentoAtivo && cdiNum > 0,
      rendimentoCDI: rendimentoAtivo && cdiNum > 0 ? cdiNum : 0,
    });
  };

  return (
    <ModalShell
      titulo={editando ? "Editar caixinha" : "Nova caixinha"}
      onFechar={onFechar}
      onSalvar={salvar}
      salvarAtivo={valido}
    >
      <Campo label="Nome">
        <input
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Viagem para a praia"
          style={inputStyle}
        />
      </Campo>

      <Campo label="Cor">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {CORES_CAIXINHA.map((c) => {
            const sel = cor === c;
            return (
              <button
                key={c}
                onClick={() => setCor(c)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: c,
                  border: sel ? "3px solid var(--ink)" : "3px solid transparent",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            );
          })}
        </div>
      </Campo>

      <Campo label="Meta (opcional)">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: temMeta ? 10 : 0,
          }}
        >
          <Toggle ativo={temMeta} onChange={setTemMeta} />
          <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
            {temMeta ? "Definir um valor-alvo" : "Sem meta — só vou juntando"}
          </span>
        </div>
        {temMeta && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 700 }}>R$</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={meta}
                onChange={(e) => setMeta(formatarValorDigitado(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div style={{ marginTop: 10 }}>
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
                <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>
                  Até quando? <span style={{ opacity: 0.7 }}>(opcional)</span>
                </span>
                <input
                  type="date"
                  value={dataMeta}
                  min={hojeISO()}
                  onChange={(e) => setDataMeta(e.target.value)}
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
            </div>
          </>
        )}
      </Campo>

      {/* ─── Avançado (investimento) ─── */}
      <div style={{ marginTop: 18 }}>
        <button
          onClick={() => setAvancadoAberto((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: "12px 14px",
            borderRadius: 12,
            border: "none",
            background: "var(--card-2)",
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="chart" size={16} color="var(--muted)" strokeWidth={2.2} />
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>Avançado</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>Investimento</span>
          </div>
          <span
            style={{
              display: "inline-flex",
              transform: avancadoAberto ? "rotate(180deg)" : "none",
              transition: "transform .15s",
            }}
          >
            <Icon name="chevron-down" size={16} color="var(--muted)" strokeWidth={2} />
          </span>
        </button>

        {avancadoAberto && (
          <div
            style={{
              marginTop: 10,
              padding: "12px 14px",
              borderRadius: 12,
              background: "var(--card-2)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: rendimentoAtivo ? 12 : 0,
              }}
            >
              <Toggle ativo={rendimentoAtivo} onChange={setRendimentoAtivo} />
              <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
                {rendimentoAtivo ? "Render como investimento" : "Sem rendimento — caixinha comum"}
              </span>
            </div>

            {rendimentoAtivo && (
              <>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                    marginBottom: 6,
                  }}
                >
                  Taxa de rendimento (% do CDI)
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={rendimentoCDI}
                    onChange={(e) => {
                      // aceita só dígitos, vírgula e ponto
                      const v = e.target.value.replace(/[^\d.,]/g, "");
                      setRendimentoCDI(v);
                    }}
                    placeholder="100"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 700 }}>% CDI</span>
                </div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: "var(--muted)",
                    fontWeight: 500,
                    lineHeight: 1.45,
                  }}
                >
                  Selic atual:{" "}
                  <strong style={{ color: "var(--ink)" }}>
                    {selic.toFixed(2).replace(".", ",")}% a.a.
                  </strong>
                  {cdiNum > 0 && (
                    <>
                      {" · "}rende ~
                      <strong style={{ color: "var(--ink)" }}>
                        {taxaEfetiva.toFixed(2).replace(".", ",")}% a.a.
                      </strong>
                    </>
                  )}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    color: "var(--muted)",
                    fontWeight: 500,
                    lineHeight: 1.45,
                    opacity: 0.85,
                  }}
                >
                  100% CDI = renda igual ao CDI · Estimativa diária com base na Meta Selic do BCB.
                  Não considera IR.
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
